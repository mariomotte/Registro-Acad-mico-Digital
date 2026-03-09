import { Alumno, Incidencia, Alerta, Usuario } from '@/types';

export const MOCK_USER: Usuario = {
  id: 'user_1',
  nombre: 'Dra. Elena Rivera',
  correo: 'director@edutrack.edu',
  rol: 'Director',
};

export const MOCK_STUDENTS: Alumno[] = [
  { id: 'st_1', nombre: 'Juan', apellido: 'Pérez', grado: '5to', seccion: 'A', fechaNacimiento: '2012-05-15', estado: 'Activo', incidentsCount: 5 },
  { id: 'st_2', nombre: 'María', apellido: 'García', grado: '5to', seccion: 'B', fechaNacimiento: '2012-08-20', estado: 'Activo', incidentsCount: 2 },
  { id: 'st_3', nombre: 'Carlos', apellido: 'Rodríguez', grado: '4to', seccion: 'A', fechaNacimiento: '2013-02-10', estado: 'Activo', incidentsCount: 8 },
  { id: 'st_4', nombre: 'Ana', apellido: 'Martínez', grado: '3ro', seccion: 'C', fechaNacimiento: '2014-11-30', estado: 'Suspendido', incidentsCount: 12 },
  { id: 'st_5', nombre: 'Luis', apellido: 'Sánchez', grado: '6to', seccion: 'A', fechaNacimiento: '2011-04-05', estado: 'Activo', incidentsCount: 1 },
];

export const MOCK_INCIDENTS: Incidencia[] = [
  {
    id: 'inc_1',
    alumnoId: 'st_4',
    alumnoNombre: 'Ana Martínez',
    tipo: 'Problema de comportamiento',
    descripcion: 'Interrupción constante durante la clase de matemáticas.',
    severidad: 'medio',
    fecha: new Date().toISOString(),
    registradoPor: 'Prof. Pedro Gómez',
  },
  {
    id: 'inc_2',
    alumnoId: 'st_3',
    alumnoNombre: 'Carlos Rodríguez',
    tipo: 'Inasistencia',
    descripcion: 'Faltó tres días consecutivos sin justificación.',
    severidad: 'alto',
    fecha: new Date(Date.now() - 86400000).toISOString(),
    registradoPor: 'Aux. Luisa Valles',
  },
  {
    id: 'inc_3',
    alumnoId: 'st_1',
    alumnoNombre: 'Juan Pérez',
    tipo: 'Conflicto entre alumnos',
    descripcion: 'Discusión fuerte en el patio durante el recreo.',
    severidad: 'bajo',
    fecha: new Date(Date.now() - 172800000).toISOString(),
    registradoPor: 'Prof. Pedro Gómez',
  },
];

export const MOCK_ALERTS: Alerta[] = [
  {
    id: 'alt_1',
    alumnoId: 'st_4',
    alumnoNombre: 'Ana Martínez',
    tipo: 'Recurrencia',
    mensaje: 'Ana Martínez ha acumulado 3 incidencias esta semana.',
    fecha: new Date().toISOString(),
    leido: false,
  },
  {
    id: 'alt_2',
    alumnoId: 'st_3',
    alumnoNombre: 'Carlos Rodríguez',
    tipo: 'Gravedad',
    mensaje: 'Carlos Rodríguez tiene una incidencia de alta severidad reportada.',
    fecha: new Date(Date.now() - 3600000).toISOString(),
    leido: false,
  },
];