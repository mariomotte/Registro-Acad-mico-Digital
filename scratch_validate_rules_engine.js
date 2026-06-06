const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the engine logic inline (since it's TS, we replicate the logic here)
function differenceInDays(dateA, dateB) {
  const msPerDay = 86400000;
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay);
}

function evaluateStudentRisk(alumnoId, alumnoNombre, grado, seccion, studentIncidents) {
  const idStr = String(alumnoId);
  const motivos = [];
  let prioridad = 'baja';

  if (!studentIncidents || studentIncidents.length === 0) {
    return { alumnoId: idStr, alumnoNombre, grado, seccion, prioridad: 'baja', nivel: 'verde', motivos: ["Sin incidencias"], ultimaFecha: new Date().toISOString(), incidenciasRelacionadas: [] };
  }

  const sortedIncidents = [...studentIncidents].sort((a, b) => {
    return new Date(b.fecha_suceso || b.fecha).getTime() - new Date(a.fecha_suceso || a.fecha).getTime();
  });
  const ultimaFecha = sortedIncidents[0].fecha_suceso || sortedIncidents[0].fecha;

  const now = new Date();
  const incidentsLast15Days = studentIncidents.filter(inc => {
    const incDate = new Date(inc.fecha_suceso || inc.fecha);
    const diff = differenceInDays(now, incDate);
    return diff >= 0 && diff <= 15;
  });

  const uniqueTeachers = new Set();
  studentIncidents.forEach(inc => {
    const teacherIdentifier = inc.registrador_user_id || inc.registrado_por;
    if (teacherIdentifier) uniqueTeachers.add(String(teacherIdentifier).trim().toLowerCase());
  });

  const typeCounts = {};
  studentIncidents.forEach(inc => {
    if (inc.tipo) typeCounts[inc.tipo] = (typeCounts[inc.tipo] || 0) + 1;
  });

  let maxSameTypeCount = 0;
  let maxType = "";
  Object.keys(typeCounts).forEach(type => {
    if (typeCounts[type] > maxSameTypeCount) { maxSameTypeCount = typeCounts[type]; maxType = type; }
  });

  const hasGrave = studentIncidents.some(inc => inc.severidad === 'alto' || inc.severidad === 'grave');
  const hasModerado = studentIncidents.some(inc => inc.severidad === 'medio' || inc.severidad === 'moderada');

  let isAlta = false;
  if (incidentsLast15Days.length >= 3) { isAlta = true; motivos.push(`Alumno con ${incidentsLast15Days.length} incidencias en los últimos 15 días`); }
  if (hasGrave) { isAlta = true; motivos.push("Alumno con incidencia grave"); }
  if (uniqueTeachers.size >= 2) { isAlta = true; motivos.push("Alumno reportado por diferentes docentes"); }
  if (maxSameTypeCount >= 3) { isAlta = true; motivos.push(`Reincidencia del mismo tipo: "${maxType}" (${maxSameTypeCount} reportes)`); }

  let isMedia = false;
  if (!isAlta) {
    if (incidentsLast15Days.length === 2) { isMedia = true; motivos.push("Alumno con 2 incidencias en los últimos 15 días"); }
    if (hasModerado) { isMedia = true; motivos.push("Incidencia moderada"); }
    if (maxSameTypeCount === 2) { isMedia = true; motivos.push(`2 reportes del mismo tipo: "${maxType}"`); }
  }

  if (isAlta) prioridad = 'alta';
  else if (isMedia) prioridad = 'media';
  else { prioridad = 'baja'; motivos.push("1 incidencia leve o aislada"); }

  const nivelMap = { alta: 'rojo', media: 'amarillo', baja: 'verde' };
  return { alumnoId: idStr, alumnoNombre, grado, seccion, prioridad, nivel: nivelMap[prioridad], motivos, ultimaFecha, totalIncidents: studentIncidents.length };
}

async function run() {
  console.log("Logging in...");
  const { error: loginErr } = await supabase.auth.signInWithPassword({ email: 'carlos.mendoza@colegio.edu', password: 'password123' });
  if (loginErr) { console.error("Login failed:", loginErr); process.exit(1); }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: recentIncidents, error } = await supabase
    .from('incidencias')
    .select('id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, fecha, registrado_por, registrador_user_id, fecha_suceso')
    .gte('fecha', thirtyDaysAgoStr)
    .order('fecha', { ascending: false });

  if (error) { console.error("Error fetching incidents:", error); process.exit(1); }

  console.log(`Total incidents in last 30 days: ${recentIncidents.length}`);

  // Group by student
  const incidentsByStudent = {};
  recentIncidents.forEach(i => {
    const key = String(i.alumno_id);
    if (!incidentsByStudent[key]) {
      incidentsByStudent[key] = { alumnoNombre: i.alumno_nombre, grado: i.alumno_grado || "", seccion: i.alumno_seccion || "", incidents: [] };
    }
    incidentsByStudent[key].incidents.push(i);
  });

  const cases = Object.keys(incidentsByStudent).map(studentId => {
    const data = incidentsByStudent[studentId];
    return evaluateStudentRisk(studentId, data.alumnoNombre, data.grado, data.seccion, data.incidents);
  });

  const priorityScore = { alta: 3, media: 2, baja: 1 };
  const sortedCases = cases.sort((a, b) => priorityScore[b.prioridad] - priorityScore[a.prioridad]);

  console.log("\n=== CASOS DE ATENCIÓN PRIORITARIA (Simulación AuxiliarPanel) ===\n");
  sortedCases.forEach((c, idx) => {
    const label = c.prioridad === 'alta' ? '🔴 ALTA' : c.prioridad === 'media' ? '🟡 MEDIA' : '🟢 BAJA';
    console.log(`${idx + 1}. [${label}] ${c.alumnoNombre} (${c.grado} ${c.seccion})`);
    console.log(`   Total incidencias: ${c.totalIncidents}`);
    console.log(`   Motivos: ${c.motivos.join(' | ')}`);
    console.log(`   Última fecha: ${c.ultimaFecha}`);
    console.log('');
  });

  // Reincidence summary for DirectivoPanel
  console.log("\n=== RESUMEN DE REINCIDENCIA CONDUCTUAL (Simulación DirectivoPanel) ===\n");
  const reincidentes = sortedCases.filter(c => c.totalIncidents >= 2).sort((a, b) => b.totalIncidents - a.totalIncidents);
  if (reincidentes.length === 0) {
    console.log("No hay alumnos con 2 o más reportes.");
  } else {
    console.log("Alumno                              | Grado/Sección | Total | Tipo más frecuente");
    console.log("-".repeat(90));
    reincidentes.forEach(r => {
      // Need type counts
      const data = incidentsByStudent[r.alumnoId];
      const tc = {};
      data.incidents.forEach(i => { tc[i.tipo] = (tc[i.tipo] || 0) + 1; });
      let maxT = ""; let maxC = 0;
      Object.keys(tc).forEach(t => { if (tc[t] > maxC) { maxC = tc[t]; maxT = t; } });
      console.log(`${r.alumnoNombre.padEnd(36)}| ${(r.grado + ' ' + r.seccion).padEnd(14)}| ${String(r.totalIncidents).padEnd(6)}| ${maxT}`);
    });
  }
}

run();
