-- TRUNCATE PREVIO PARA REINICIAR DATOS (Solo en desarrollo si se desea)
-- TRUNCATE TABLE public.audit_logs, public.evidencias, public.sesiones_psicologicas, public.alertas, public.asistencias, public.incidencias, public.alumnos CASCADE;

-- DATOS DE PRUEBA: ALUMNOS
INSERT INTO public.alumnos (id, nombres, apellidos, dni, codigo_estudiante, grado, seccion, nivel, estado, apoderado, telefono, fecha_nacimiento)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'Mateo Alexander', 'Pérez Quispe', '74829102', 'EST-2026-0001', '1ro Sec', 'A', 'Secundaria', 'Activo', 'Carlos Pérez Silva', '987654321', '2013-05-12'),
('a2222222-2222-2222-2222-222222222222', 'Sofia Valentina', 'García Mendoza', '75918234', 'EST-2026-0002', '3ro Sec', 'B', 'Secundaria', 'Activo', 'Elena Mendoza Ruiz', '955443322', '2011-09-24'),
('a3333333-3333-3333-3333-333333333333', 'Thiago Benjamín', 'Flores Huaman', '76829103', 'EST-2026-0003', '5to', 'C', 'Primaria', 'Activo', 'Roberto Flores Vega', '911223344', '2015-02-18'),
('a4444444-4444-4444-4444-444444444444', 'Camila Belén', 'Ramos Condori', '71928374', 'EST-2026-0004', '2do Sec', 'A', 'Secundaria', 'Suspendido', 'Juana Condori Tito', '966554433', '2012-11-05'),
('a5555555-5555-5555-5555-555555555555', 'Liam Gael', 'Sánchez Castro', '72837491', 'EST-2026-0005', '4to', 'A', 'Primaria', 'Activo', 'Manuel Sánchez Paredes', '999888777', '2016-07-30'),
('a6666666-6666-6666-6666-666666666666', 'Valentina Paz', 'Torres Villanueva', '73948502', 'EST-2026-0006', '3ro Sec', 'C', 'Secundaria', 'Activo', 'Rosa Villanueva Soto', '944332211', '2011-03-14');

-- DATOS DE PRUEBA: ASISTENCIAS (Últimos días)
INSERT INTO public.asistencias (alumno_id, registrado_por, fecha, estado, observacion)
VALUES
('a1111111-1111-1111-1111-111111111111', 'Docente de Prueba', CURRENT_DATE - INTERVAL '1 day', 'presente', NULL),
('a2222222-2222-2222-2222-222222222222', 'Docente de Prueba', CURRENT_DATE - INTERVAL '1 day', 'tardanza', 'Llegó 15 minutos tarde por tráfico'),
('a3333333-3333-3333-3333-333333333333', 'Docente de Prueba', CURRENT_DATE - INTERVAL '1 day', 'presente', NULL),
('a4444444-4444-4444-4444-444444444444', 'Docente de Prueba', CURRENT_DATE - INTERVAL '1 day', 'falta', 'No se presentó ni justificó'),
('a1111111-1111-1111-1111-111111111111', 'Docente de Prueba', CURRENT_DATE, 'presente', NULL),
('a2222222-2222-2222-2222-222222222222', 'Docente de Prueba', CURRENT_DATE, 'presente', NULL),
('a3333333-3333-3333-3333-333333333333', 'Docente de Prueba', CURRENT_DATE, 'tardanza', 'Llegó 5 minutos tarde'),
('a4444444-4444-4444-4444-444444444444', 'Docente de Prueba', CURRENT_DATE, 'falta', 'Suspendido temporalmente');

-- DATOS DE PRUEBA: INCIDENCIAS
INSERT INTO public.incidencias (id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, registrado_por, tipo, severidad, descripcion, accion_tomada, estado, fecha)
VALUES
('i1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Mateo Alexander Pérez Quispe', '1ro Sec', 'A', 'Docente de Prueba', 'Problema de comportamiento', 'medio', 'El alumno interrumpió la clase repetidas veces conversando y haciendo bromas.', 'Se conversó con él al terminar la clase y se le asignó una advertencia verbal.', 'en_seguimiento', CURRENT_DATE - INTERVAL '5 days'),
('i2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'Camila Belén Ramos Condori', '2do Sec', 'A', 'Auxiliar de Prueba', 'Conflicto entre alumnos', 'alto', 'Protagonizó una discusión acalorada que derivó en empujones con una compañera en el patio durante el recreo.', 'Se separó a las alumnas, se les llevó a la oficina y se citó al apoderado.', 'pendiente', CURRENT_DATE - INTERVAL '2 days'),
('i3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Sofia Valentina García Mendoza', '3ro Sec', 'B', 'Docente de Prueba', 'Observación académica', 'bajo', 'El alumno olvidó traer sus materiales y no completó la actividad grupal asignada.', 'Se le dio oportunidad de entregar la tarea en la siguiente sesión con penalidad.', 'cerrado', CURRENT_DATE - INTERVAL '1 day');

-- DATOS DE PRUEBA: ALERTAS
INSERT INTO public.alertas (alumno_id, alumno_nombre, incidencia_id, titulo, mensaje, nivel, estado, destinatario, leido, accion_requerida)
VALUES
('a4444444-4444-4444-4444-444444444444', 'Camila Belén Ramos Condori', 'i2222222-2222-2222-2222-222222222222', 'Incidencia Grave Registrada', 'El alumno Camila Belén Ramos Condori registra una incidencia de severidad alta: Conflicto entre alumnos.', 'rojo', 'activa', 'subdirector', false, 'Llamar al apoderado y coordinar sesión psicológica');
