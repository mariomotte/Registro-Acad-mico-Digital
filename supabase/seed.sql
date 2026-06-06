-- TRUNCATE PREVIO PARA REINICIAR DATOS (solo desarrollo)
-- TRUNCATE TABLE public.audit_logs, public.evidencias, public.alertas, public.incidencias, public.alumnos CASCADE;

-- DATOS DE PRUEBA: ALUMNOS
INSERT INTO public.alumnos (id, nombres, apellidos, dni, codigo_estudiante, grado, seccion, nivel, estado, apoderado, telefono, fecha_nacimiento)
VALUES
(1, 'Mateo Alexander', 'Perez Quispe', '74829102', 'EST-2026-0001', '1°', 'A', 'Secundaria', 'Activo', 'Carlos Perez Silva', '987654321', '2013-05-12'),
(2, 'Sofia Valentina', 'Garcia Mendoza', '75918234', 'EST-2026-0002', '3°', 'B', 'Secundaria', 'Activo', 'Elena Mendoza Ruiz', '955443322', '2011-09-24'),
(3, 'Thiago Benjamin', 'Flores Huaman', '76829103', 'EST-2026-0003', '5to', 'C', 'Primaria', 'Activo', 'Roberto Flores Vega', '911223344', '2015-02-18'),
(4, 'Camila Belen', 'Ramos Condori', '71928374', 'EST-2026-0004', '2°', 'A', 'Secundaria', 'Suspendido', 'Juana Condori Tito', '966554433', '2012-11-05'),
(5, 'Liam Gael', 'Sanchez Castro', '72837491', 'EST-2026-0005', '4to', 'A', 'Primaria', 'Activo', 'Manuel Sanchez Paredes', '999888777', '2016-07-30'),
(6, 'Valentina Paz', 'Torres Villanueva', '73948502', 'EST-2026-0006', '3°', 'C', 'Secundaria', 'Activo', 'Rosa Villanueva Soto', '944332211', '2011-03-14');

-- DATOS DE PRUEBA: INCIDENCIAS
INSERT INTO public.incidencias (id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, registrado_por, tipo, severidad, descripcion, accion_tomada, estado, fecha, fecha_suceso)
VALUES
('11111111-1111-1111-1111-111111111111', 1, 'Mateo Alexander Perez Quispe', '1°', 'A', 'Docente de Prueba', 'Problema de comportamiento', 'medio', 'El alumno interrumpio la clase repetidas veces conversando y haciendo bromas.', 'Se converso con el al terminar la clase y se le asigno una advertencia verbal.', 'en_seguimiento', CURRENT_DATE - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('22222222-2222-2222-2222-222222222222', 4, 'Camila Belen Ramos Condori', '2°', 'A', 'Auxiliar de Prueba', 'Conflicto entre alumnos', 'alto', 'Protagonizo una discusion acalorada que derivo en empujones con una companera en el patio durante el recreo.', 'Se separo a las alumnas, se les llevo a la oficina y se cito al apoderado.', 'pendiente', CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('33333333-3333-3333-3333-333333333333', 2, 'Sofia Valentina Garcia Mendoza', '3°', 'B', 'Docente de Prueba', 'Observacion academica', 'bajo', 'El alumno olvido traer sus materiales y no completo la actividad grupal asignada.', 'Se le dio oportunidad de entregar la tarea en la siguiente sesion con penalidad.', 'cerrado', CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- DATOS DE PRUEBA: ALERTAS
INSERT INTO public.alertas (alumno_id, alumno_nombre, incidencia_id, titulo, mensaje, nivel, estado, destinatario, leido, accion_requerida)
VALUES
(4, 'Camila Belen Ramos Condori', '22222222-2222-2222-2222-222222222222', 'Incidencia Grave Registrada', 'El alumno Camila Belen Ramos Condori registra una incidencia de severidad alta: Conflicto entre alumnos.', 'rojo', 'activa', 'subdirector', false, 'Revisar el caso, registrar la intervencion inicial y coordinar con el apoderado si corresponde.');
