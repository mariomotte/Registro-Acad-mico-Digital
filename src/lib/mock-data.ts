import { Alumno, Incidencia, Alerta, Usuario, SesionPsicologica } from '@/types';

export const MOCK_STUDENTS: Alumno[] = [
  { id: 'st_1', nombre: 'Juan', apellido: 'Pérez', grado: '5to', seccion: 'A', fechaNacimiento: '2012-05-15', estado: 'Activo', incidentsCount: 5, emotionalState: 'Estable' },
  { id: 'st_2', nombre: 'María', apellido: 'García', grado: '5to', seccion: 'B', fechaNacimiento: '2012-08-20', estado: 'Activo', incidentsCount: 2, emotionalState: 'Ansiosa' },
  { id: 'st_3', nombre: 'Carlos', apellido: 'Rodríguez', grado: '4to', seccion: 'A', fechaNacimiento: '2013-02-10', estado: 'Activo', incidentsCount: 8, emotionalState: 'Irritable' },
  { id: 'st_4', nombre: 'Ana', apellido: 'Martínez', grado: '3ro', seccion: 'C', fechaNacimiento: '2014-11-30', estado: 'Activo', incidentsCount: 12, emotionalState: 'Triste' },
];

export const MOCK_INCIDENTS: Incidencia[] = [
  {
    id: 'inc_1',
    alumnoId: 'st_1',
    alumnoNombre: 'Juan Pérez',
    tipo: 'Inasistencia',
    descripcion: 'El alumno no asistió a clases sin justificación previa.',
    severidad: 'bajo',
    fecha: new Date().toISOString(),
    registradoPor: 'Docente García'
  },
  {
    id: 'inc_2',
    alumnoId: 'st_4',
    alumnoNombre: 'Ana Martínez',
    tipo: 'Problema de comportamiento',
    descripcion: 'Interrupción constante durante la clase de matemáticas.',
    severidad: 'medio',
    fecha: new Date(Date.now() - 86400000).toISOString(),
    registradoPor: 'Auxiliar Soto'
  },
  {
    id: 'inc_3',
    alumnoId: 'st_4',
    alumnoNombre: 'Ana Martínez',
    tipo: 'Inasistencia',
    descripcion: 'Tercera inasistencia consecutiva en la semana.',
    severidad: 'alto',
    fecha: new Date(Date.now() - 172800000).toISOString(),
    registradoPor: 'Director Ramos'
  },
  {
    id: 'inc_4',
    alumnoId: 'st_3',
    alumnoNombre: 'Carlos Rodríguez',
    tipo: 'Conflicto entre alumnos',
    descripcion: 'Discusión fuerte con un compañero en el recreo.',
    severidad: 'alto',
    fecha: new Date(Date.now() - 43200000).toISOString(),
    registradoPor: 'Auxiliar Mendoza'
  }
];

export const MOCK_ALERTS: Alerta[] = [
  {
    id: 'alt_1',
    alumnoId: 'st_4',
    alumnoNombre: 'Ana Martínez',
    tipo: 'Inasistencias',
    nivel: 'rojo',
    mensaje: 'Ana Martínez tiene más de 3 inasistencias esta semana.',
    fecha: new Date().toISOString(),
    leido: false,
    accionRequerida: 'Llamar al apoderado para evaluar situación.'
  },
  {
    id: 'alt_2',
    alumnoId: 'st_3',
    alumnoNombre: 'Carlos Rodríguez',
    tipo: 'Tardanzas',
    nivel: 'amarillo',
    mensaje: 'Carlos Rodríguez ha acumulado 3 tardanzas.',
    fecha: new Date(Date.now() - 3600000).toISOString(),
    leido: false
  },
  {
    id: 'alt_3',
    alumnoId: 'st_1',
    alumnoNombre: 'Juan Pérez',
    tipo: 'Recurrencia',
    nivel: 'verde',
    mensaje: 'Juan Pérez tiene 2 incidencias leves registradas.',
    fecha: new Date(Date.now() - 7200000).toISOString(),
    leido: true
  }
];

export const MOCK_SESSIONS: SesionPsicologica[] = [
  {
    id: 'sess_1',
    alumnoId: 'st_4',
    psicologoId: 'psico_1',
    fecha: new Date().toISOString(),
    motivo: 'Derivación por alerta roja de inasistencias',
    observaciones: 'La alumna muestra desmotivación por problemas familiares.',
    acuerdos: 'Seguimiento semanal y entrevista con padres.',
    clasificacion: 'Crítico'
  }
];
