import { Alumno, Incidencia, Alerta, Usuario, SesionPsicologica } from '@/types';

export const MOCK_STUDENTS: Alumno[] = [
  { id: 'st_1', nombre: 'Juan', apellido: 'Pérez', grado: '5to', seccion: 'A', fechaNacimiento: '2012-05-15', estado: 'Activo', incidentsCount: 5, emotionalState: 'Estable' },
  { id: 'st_2', nombre: 'María', apellido: 'García', grado: '5to', seccion: 'B', fechaNacimiento: '2012-08-20', estado: 'Activo', incidentsCount: 2, emotionalState: 'Ansiosa' },
  { id: 'st_3', nombre: 'Carlos', apellido: 'Rodríguez', grado: '4to', seccion: 'A', fechaNacimiento: '2013-02-10', estado: 'Activo', incidentsCount: 8, emotionalState: 'Irritable' },
  { id: 'st_4', nombre: 'Ana', apellido: 'Martínez', grado: '3ro', seccion: 'C', fechaNacimiento: '2014-11-30', estado: 'Activo', incidentsCount: 12, emotionalState: 'Triste' },
];

export const MOCK_ALERTS: Alerta[] = [
  {
    id: 'alt_1',
    alumnoId: 'st_4',
    alumnoNombre: 'Ana Martínez',
    tipo: 'Inasisencias',
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
