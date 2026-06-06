-- Carga funcional de mayo de 2026 para 200 alumnos existentes.
-- Es repetible: elimina solo los registros creados por este script.

BEGIN;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.alumnos) < 200 THEN
        RAISE EXCEPTION 'Se requieren al menos 200 alumnos para ejecutar esta carga.';
    END IF;
END $$;

-- Conserva la ficha completa de prueba con textos variados.
WITH test_students_may_2026 AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS test_order
    FROM public.alumnos
    ORDER BY id
    LIMIT 200
)
UPDATE public.alumnos AS alumno
SET
    fortalezas = COALESCE(alumno.fortalezas, CASE MOD(test_student.test_order, 5)
        WHEN 0 THEN 'Participa con iniciativa, trabaja bien en equipo y mantiene una comunicación respetuosa.'
        WHEN 1 THEN 'Demuestra creatividad, responsabilidad con sus materiales y disposición para apoyar a sus compañeros.'
        WHEN 2 THEN 'Tiene buen razonamiento lógico, cumple sus actividades y responde positivamente a la orientación.'
        WHEN 3 THEN 'Destaca por su perseverancia, puntualidad en las entregas y capacidad para escuchar.'
        ELSE 'Muestra empatía, orden en el aula y compromiso progresivo con sus metas académicas.'
    END),
    por_mejorar = COALESCE(alumno.por_mejorar, CASE MOD(test_student.test_order, 5)
        WHEN 0 THEN 'Reforzar la puntualidad y mantener una rutina de organización semanal.'
        WHEN 1 THEN 'Mejorar la concentración durante las explicaciones y anticipar la entrega de tareas.'
        WHEN 2 THEN 'Trabajar la comunicación asertiva ante desacuerdos y solicitar apoyo oportunamente.'
        WHEN 3 THEN 'Fortalecer los hábitos de estudio y la constancia en la participación oral.'
        ELSE 'Regular el uso de materiales, registrar compromisos y revisar las indicaciones antes de entregar.'
    END)
FROM test_students_may_2026 AS test_student
WHERE alumno.id = test_student.id;

-- Retira solo una ejecución anterior de esta misma carga.
DELETE FROM public.alertas
WHERE mensaje LIKE '[PRUEBA MAYO 2026]%';

DELETE FROM public.incidencias
WHERE descripcion LIKE '[PRUEBA MAYO 2026]%';

-- Cada alumno recibe los seis tipos de incidencia disponibles.
-- Se pausan los triggers de usuario solo durante la carga masiva porque la base
-- tiene un trigger legado de alertas que no completa la columna obligatoria tipo.
ALTER TABLE public.incidencias DISABLE TRIGGER USER;

WITH test_students_may_2026 AS (
    SELECT
        id,
        nombres,
        apellidos,
        grado,
        seccion,
        ROW_NUMBER() OVER (ORDER BY id) AS test_order
    FROM public.alumnos
    ORDER BY id
    LIMIT 200
)
INSERT INTO public.incidencias (
    alumno_id,
    alumno_nombre,
    alumno_grado,
    alumno_seccion,
    registrado_por,
    tipo,
    severidad,
    descripcion,
    accion_tomada,
    estado,
    fecha,
    fecha_suceso
)
SELECT
    test_student.id,
    CONCAT(test_student.nombres, ' ', test_student.apellidos),
    test_student.grado,
    test_student.seccion,
    'Carga funcional mayo 2026',
    incident_type.tipo,
    CASE MOD(test_student.test_order + incident_type.type_order, 3)
        WHEN 0 THEN 'bajo'
        WHEN 1 THEN 'medio'
        ELSE 'alto'
    END,
    CONCAT(
        '[PRUEBA MAYO 2026] ',
        incident_type.descripcion,
        ' Registro generado para validar filtros, reportes y ficha del alumno.'
    ),
    incident_type.accion_tomada,
    CASE MOD(test_student.test_order + incident_type.type_order, 3)
        WHEN 0 THEN 'cerrado'
        WHEN 1 THEN 'en_seguimiento'
        ELSE 'pendiente'
    END,
    (
        DATE '2026-05-01'
        + MOD(test_student.test_order + incident_type.type_order * 4 - 1, 30)::INTEGER
    ),
    (
        TIMESTAMPTZ '2026-05-01 08:00:00-05'
        + MOD(test_student.test_order + incident_type.type_order * 4 - 1, 30) * INTERVAL '1 day'
        + MOD(test_student.test_order + incident_type.type_order, 9) * INTERVAL '1 hour'
    )
FROM test_students_may_2026 AS test_student
CROSS JOIN (
    VALUES
        (1, 'Inasistencia', 'Se registró una inasistencia durante la jornada escolar.', 'Se comunicó el registro al apoderado para su justificación.'),
        (2, 'Tardanza', 'El alumno ingresó después del horario establecido.', 'Se registró la hora de llegada y se recordó el horario institucional.'),
        (3, 'Problema de comportamiento', 'Se presentó una dificultad de convivencia durante una actividad escolar.', 'Se conversó con el alumno y se acordaron pautas de mejora.'),
        (4, 'Problema de salud', 'El alumno manifestó una molestia física durante la jornada.', 'Se realizó la atención inicial y se informó al apoderado.'),
        (5, 'Conflicto entre alumnos', 'Se reportó un desacuerdo que requirió mediación del personal responsable.', 'Se aplicó mediación y se dejaron compromisos de convivencia.'),
        (6, 'Observación académica', 'Se registró una observación sobre el desempeño y seguimiento académico.', 'Se definió una recomendación de acompañamiento académico.')
) AS incident_type(type_order, tipo, descripcion, accion_tomada);

ALTER TABLE public.incidencias ENABLE TRIGGER USER;

-- Muestra controlada de 40 alertas para validar seguimiento prioritario.
WITH test_students_may_2026 AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS test_order
    FROM public.alumnos
    ORDER BY id
    LIMIT 200
)
INSERT INTO public.alertas (
    alumno_id,
    alumno_nombre,
    incidencia_id,
    titulo,
    tipo,
    mensaje,
    nivel,
    estado,
    destinatario,
    leido,
    accion_requerida,
    fecha
)
SELECT DISTINCT ON (incident.alumno_id)
    incident.alumno_id,
    incident.alumno_nombre,
    incident.id,
    'Seguimiento prioritario de prueba',
    'Recurrencia',
    CONCAT('[PRUEBA MAYO 2026] Revisar caso recurrente de ', incident.alumno_nombre, '.'),
    'rojo',
    'activa',
    'subdirector',
    FALSE,
    'Revisar la ficha, registrar seguimiento y coordinar una acción preventiva.',
    incident.fecha_suceso
FROM public.incidencias AS incident
INNER JOIN test_students_may_2026 AS test_student
    ON test_student.id = incident.alumno_id
WHERE incident.descripcion LIKE '[PRUEBA MAYO 2026]%'
  AND incident.severidad = 'alto'
  AND MOD(test_student.test_order, 5) = 0
ORDER BY incident.alumno_id, incident.fecha_suceso DESC;

COMMIT;

-- Resumen esperado: 200 fichas, 1200 incidencias y 40 alertas.
SELECT
    (SELECT COUNT(*) FROM public.alumnos WHERE fortalezas IS NOT NULL AND por_mejorar IS NOT NULL) AS alumnos_con_fortalezas,
    (SELECT COUNT(*) FROM public.incidencias WHERE descripcion LIKE '[PRUEBA MAYO 2026]%') AS incidencias_prueba_mayo,
    (SELECT COUNT(*) FROM public.alertas WHERE mensaje LIKE '[PRUEBA MAYO 2026]%') AS alertas_prueba_mayo;
