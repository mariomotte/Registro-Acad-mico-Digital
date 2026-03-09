export type UserRole = 'Director' | 'Docente' | 'Auxiliar' | 'Administrador';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
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
}

export type IncidentType = 'Inasistencia' | 'Problema de comportamiento' | 'Problema de salud' | 'Conflicto entre alumnos' | 'Observación académica';
export type Severity = 'bajo' | 'medio' | 'alto';

export interface Incidencia {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  tipo: IncidentType;
  descripcion: string;
  severidad: Severity;
  fecha: string;
  registradoPor: string;
  evidenceUrls?: string[];
}

export interface Alerta {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  tipo: 'Recurrencia' | 'Gravedad';
  mensaje: string;
  fecha: string;
  leido: boolean;
}