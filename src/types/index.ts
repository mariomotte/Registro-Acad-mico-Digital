export type UserRole = 'admin' | 'director' | 'subdirector' | 'docente' | 'auxiliar' | 'psicologo';

export interface Usuario {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  estado?: 'Activo' | 'Inactivo';
  createdAt?: any;
  sexo?: 'M' | 'F';
  avatar_url?: string;
}

export interface Alumno {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  codigo_estudiante: string;
  grado: string;
  nivel: 'Primaria' | 'Secundaria';
  seccion: string;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  apoderado: string;
  telefono: string;
  fecha_nacimiento?: string;
  fechaNacimiento?: string; // Compatibilidad
  created_at?: string;
  sexo?: string; // Compatibilidad
  avatar_url?: string;
  incidentsCount?: number;
  emotionalState?: string;
}

export type IncidentType = 'Inasistencia' | 'Tardanza' | 'Problema de comportamiento' | 'Problema de salud' | 'Conflicto entre alumnos' | 'Observación académica';
export type Severity = 'bajo' | 'medio' | 'alto' | 'leve' | 'moderada' | 'grave';
export type AlertLevel = 'verde' | 'amarillo' | 'rojo';

export interface Incidencia {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  alumnoGrado?: string;
  alumnoSeccion?: string;
  tipo: IncidentType;
  descripcion: string;
  severidad: Severity;
  gravedad?: Severity; // Compatibilidad
  fecha: string;
  hora?: string;
  registradoPor: string;
  registradorUserId?: string;
  accionTomada?: string;
  estado?: 'pendiente' | 'en_seguimiento' | 'cerrado';
  evidenceUrls?: string[];
  created_at?: string;
}

export interface Alerta {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  incidenciaId?: string;
  tipo: 'Recurrencia' | 'Gravedad' | 'Tardanzas' | 'Inasistencias' | string;
  nivel: AlertLevel;
  mensaje: string;
  fecha: string;
  leido: boolean;
  accionRequerida?: string;
  estado?: 'activa' | 'leida' | 'atendida';
  destinatario?: string;
}

export interface SesionPsicologica {
  id: string;
  alumnoId: string;
  alumnoNombre?: string;
  psicologoId: string;
  incidenciaId?: string;
  fecha: string;
  motivo: string;
  observaciones: string;
  recomendaciones: string;
  acuerdos?: string; // Compatibilidad
  clasificacion: 'Leve' | 'Moderado' | 'Crítico';
  estado?: 'en_seguimiento' | 'completada';
}
