import { Incidencia, CasoPrioritario } from "@/types";
import { differenceInDays } from "date-fns";

/**
 * Evalúa el riesgo y asigna prioridad a un alumno basado en sus incidencias.
 * 
 * Reglas:
 * 
 * Alta prioridad:
 * - 3 o más incidencias en los últimos 15 días.
 * - Incidencia grave (severidad = 'alto' o 'grave').
 * - Reportado por 2 o más docentes distintos.
 * - Reincidencia del mismo tipo (3 o más incidencias del mismo tipo).
 * 
 * Media prioridad:
 * - 2 incidencias en los últimos 15 días.
 * - Incidencia moderada (severidad = 'medio' o 'moderada').
 * - 2 reportes del mismo tipo.
 * 
 * Baja prioridad:
 * - 1 incidencia leve o aislada (severidad = 'bajo' o 'leve').
 */
export function evaluateStudentRisk(
  alumnoId: string | number,
  alumnoNombre: string,
  grado: string,
  seccion: string,
  studentIncidents: Incidencia[]
): CasoPrioritario {
  const idStr = String(alumnoId);
  const motivos: string[] = [];
  let prioridad: 'alta' | 'media' | 'baja' = 'baja';
  
  if (!studentIncidents || studentIncidents.length === 0) {
    return {
      alumnoId: idStr,
      alumnoNombre,
      grado: grado || "",
      seccion: seccion || "",
      prioridad: 'baja',
      nivel: 'verde',
      motivos: ["Sin incidencias registradas"],
      ultimaFecha: new Date().toISOString(),
      incidenciasRelacionadas: []
    };
  }

  // 1. Ordenar incidencias por fecha desc para obtener la última actividad
  const sortedIncidents = [...studentIncidents].sort((a, b) => {
    const timeA = new Date(a.fecha_suceso || a.fecha).getTime();
    const timeB = new Date(b.fecha_suceso || b.fecha).getTime();
    return timeB - timeA;
  });
  
  const ultimaFecha = sortedIncidents[0].fecha_suceso || sortedIncidents[0].fecha;

  // 2. Conteo de incidencias en los últimos 15 días
  const now = new Date();
  const incidentsLast15Days = studentIncidents.filter(inc => {
    const incDate = new Date(inc.fecha_suceso || inc.fecha);
    const diff = differenceInDays(now, incDate);
    return diff >= 0 && diff <= 15;
  });

  // 3. Conteo de docentes/registradores únicos
  const uniqueTeachers = new Set<string>();
  studentIncidents.forEach(inc => {
    const teacherIdentifier = inc.registradorUserId || inc.registradoPor;
    if (teacherIdentifier) {
      uniqueTeachers.add(String(teacherIdentifier).trim().toLowerCase());
    }
  });

  // 4. Conteo por tipo de incidencia
  const typeCounts: { [key: string]: number } = {};
  studentIncidents.forEach(inc => {
    if (inc.tipo) {
      typeCounts[inc.tipo] = (typeCounts[inc.tipo] || 0) + 1;
    }
  });

  // Buscar la incidencia más repetida
  let maxSameTypeCount = 0;
  let maxType = "";
  Object.keys(typeCounts).forEach(type => {
    if (typeCounts[type] > maxSameTypeCount) {
      maxSameTypeCount = typeCounts[type];
      maxType = type;
    }
  });

  // 5. Verificar niveles de gravedad
  const hasGrave = studentIncidents.some(inc => 
    inc.severidad === 'alto' || inc.severidad === 'grave'
  );
  const hasModerado = studentIncidents.some(inc => 
    inc.severidad === 'medio' || inc.severidad === 'moderada'
  );

  // Aplicar reglas para prioridad ALTA
  let isAlta = false;
  
  if (incidentsLast15Days.length >= 3) {
    isAlta = true;
    motivos.push(`Alumno con ${incidentsLast15Days.length} incidencias en los últimos 15 días`);
  }
  if (hasGrave) {
    isAlta = true;
    motivos.push("Alumno con incidencia grave");
  }
  if (uniqueTeachers.size >= 2) {
    isAlta = true;
    motivos.push("Alumno reportado por diferentes docentes");
  }
  if (maxSameTypeCount >= 3) {
    isAlta = true;
    motivos.push(`Reincidencia del mismo tipo: "${maxType}" (${maxSameTypeCount} reportes)`);
  }

  // Aplicar reglas para prioridad MEDIA
  let isMedia = false;
  if (!isAlta) {
    if (incidentsLast15Days.length === 2) {
      isMedia = true;
      motivos.push("Alumno con 2 incidencias en los últimos 15 días");
    }
    if (hasModerado) {
      isMedia = true;
      motivos.push("Incidencia moderada");
    }
    if (maxSameTypeCount === 2) {
      isMedia = true;
      motivos.push(`2 reportes del mismo tipo: "${maxType}"`);
    }
  }

  // Resolver prioridad final
  if (isAlta) {
    prioridad = 'alta';
  } else if (isMedia) {
    prioridad = 'media';
  } else {
    prioridad = 'baja';
    motivos.push("1 incidencia leve o aislada");
  }

  const nivelMap = {
    alta: 'rojo' as const,
    media: 'amarillo' as const,
    baja: 'verde' as const
  };

  return {
    alumnoId: idStr,
    alumnoNombre,
    grado: grado || "",
    seccion: seccion || "",
    prioridad,
    nivel: nivelMap[prioridad],
    motivos,
    ultimaFecha,
    incidenciasRelacionadas: sortedIncidents
  };
}
