-- Retira únicamente incidencias y alertas creadas por seed_may_2026_load_test.sql.
-- Las fortalezas se conservan porque completan la ficha del alumno y no reemplazan textos existentes.

BEGIN;

DELETE FROM public.alertas
WHERE mensaje LIKE '[PRUEBA MAYO 2026]%';

DELETE FROM public.incidencias
WHERE descripcion LIKE '[PRUEBA MAYO 2026]%';

COMMIT;

SELECT
    (SELECT COUNT(*) FROM public.incidencias WHERE descripcion LIKE '[PRUEBA MAYO 2026]%') AS incidencias_prueba_restantes,
    (SELECT COUNT(*) FROM public.alertas WHERE mensaje LIKE '[PRUEBA MAYO 2026]%') AS alertas_prueba_restantes;
