-- Permite que un docente vea:
-- 1. Los reportes de incidencias que el mismo registro.
-- 2. Todos los reportes de alumnos de su seccion de tutoria asignada.
--
-- Tambien retira la lectura de alertas para docentes, porque las alertas
-- quedan reservadas para el flujo operativo del auxiliar/directivos.

CREATE OR REPLACE FUNCTION public.is_tutor_of_alumno(student_id bigint)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.alumnos a
            ON a.id = student_id
            AND a.grado = u.tutor_grado
            AND a.seccion = u.tutor_seccion
        WHERE u.id = auth.uid()
            AND public.has_role(ARRAY['docente'])
            AND u.tutor_grado IS NOT NULL
            AND u.tutor_seccion IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "docente_read_tutoria_incidencias" ON public.incidencias;

CREATE POLICY "docente_read_tutoria_incidencias" ON public.incidencias
    FOR SELECT USING (public.is_tutor_of_alumno(alumno_id));

DROP POLICY IF EXISTS "docente_read_own_alerts" ON public.alertas;
