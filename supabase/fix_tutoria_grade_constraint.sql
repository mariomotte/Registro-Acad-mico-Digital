-- Actualiza la restricción de tutoría para usar el formato normalizado:
-- 1°, 2°, 3°, 4°, 5°.

ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS chk_tutor_grado_secundaria;

ALTER TABLE public.users
ADD CONSTRAINT chk_tutor_grado_secundaria
CHECK (
    (
        tutor_grado IS NULL
        AND tutor_seccion IS NULL
        AND tutor_nivel IS NULL
        AND tutor_anio_escolar IS NULL
    )
    OR
    (
        tutor_nivel = 'Secundaria'
        AND tutor_grado IN ('1°', '2°', '3°', '4°', '5°')
        AND tutor_seccion IN ('A', 'B', 'C', 'D', 'E', 'F')
        AND tutor_anio_escolar IS NOT NULL
    )
);
