export type UserRole = 'Director' | 'Docente' | 'Auxiliar' | 'Administrador' | 'Psicólogo';

export interface Usuario {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: any;
}

export interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  seccion: string;
  fechaNacimiento: string;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  incidentsCount?: number;
  emotionalState?: string;
}

export type IncidentType = 'Inasistencia' | 'Tardanza' | 'Problema de comportamiento' | 'Problema de salud' | 'Conflicto entre alumnos' | 'Observación académica';
export type Severity = 'bajo' | 'medio' | 'alto';
export type AlertLevel = 'verde' | 'amarillo' | 'rojo';

export interface Incidencia {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  tipo: IncidentType;
  descripcion: string;
  severidad: Severity;
  fecha: string;
  registradoPor: string;
  registradorUserId: string;
  evidenceUrls?: string[];
}

export interface Alerta {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  tipo: 'Recurrencia' | 'Gravedad' | 'Tardanzas' | 'Inasistencias';
  nivel: AlertLevel;
  mensaje: string;
  fecha: string;
  leido: boolean;
  accionRequerida?: string;
}

export interface SesionPsicologica {
  id: string;
  alumnoId: string;
  psicologoId: string;
  fecha: string;
  motivo: string;
  observaciones: string;
  acuerdos: string;
  clasificacion: 'Leve' | 'Moderado' | 'Crítico';
}
