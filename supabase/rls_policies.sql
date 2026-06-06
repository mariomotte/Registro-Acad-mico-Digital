-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ELIMINAR FUNCIONES PREVIAS SI EXISTEN
DROP FUNCTION IF EXISTS public.get_current_user_role CASCADE;
DROP FUNCTION IF EXISTS public.has_role CASCADE;

-- FUNCIONES AUXILIARES PARA RLS (SECURITY DEFINER para ejecutar con privilegios elevados)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role FROM public.users WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(required_roles text[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role text;
    normalized_role text;
BEGIN
    user_role := public.get_current_user_role();
    normalized_role := CASE user_role
        WHEN 'Superusuario' THEN 'admin'
        WHEN 'Director' THEN 'director'
        WHEN 'Subdirector' THEN 'subdirector'
        WHEN 'Docente' THEN 'docente'
        WHEN 'Auxiliar' THEN 'auxiliar'
        ELSE lower(user_role)
    END;

    RETURN normalized_role = ANY(required_roles) OR user_role = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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


-- =====================================================================
-- POLÍTICAS PARA LA TABLA: users (perfiles)
-- =====================================================================

CREATE POLICY "admin_all_users" ON public.users 
    FOR ALL USING (public.has_role(ARRAY['admin']));

CREATE POLICY "read_own_profile" ON public.users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "update_own_profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "director_read_all_users" ON public.users 
    FOR SELECT USING (public.has_role(ARRAY['director', 'subdirector']));


-- =====================================================================
-- POLÍTICAS PARA LA TABLA: alumnos
-- =====================================================================

CREATE POLICY "admin_all_alumnos" ON public.alumnos 
    FOR ALL USING (public.has_role(ARRAY['admin']));

CREATE POLICY "read_all_alumnos" ON public.alumnos 
    FOR SELECT USING (public.has_role(ARRAY['admin', 'director', 'subdirector', 'docente', 'auxiliar']));

CREATE POLICY "subdirector_manage_alumnos" ON public.alumnos 
    FOR ALL USING (public.has_role(ARRAY['subdirector']));

CREATE POLICY "auxiliar_docente_insert_alumnos" ON public.alumnos 
    FOR INSERT WITH CHECK (public.has_role(ARRAY['docente', 'auxiliar']));


-- =====================================================================
-- POLÍTICAS PARA LA TABLA: incidencias
-- =====================================================================

CREATE POLICY "admin_all_incidencias" ON public.incidencias 
    FOR ALL USING (public.has_role(ARRAY['admin']));

CREATE POLICY "read_all_incidencias" ON public.incidencias 
    FOR SELECT USING (public.has_role(ARRAY['admin', 'director', 'subdirector']));

CREATE POLICY "registrador_read_incidencias" ON public.incidencias 
    FOR SELECT USING (auth.uid() = registrador_user_id);

CREATE POLICY "docente_read_tutoria_incidencias" ON public.incidencias
    FOR SELECT USING (public.is_tutor_of_alumno(alumno_id));

CREATE POLICY "insert_incidencias" ON public.incidencias 
    FOR INSERT WITH CHECK (public.has_role(ARRAY['subdirector', 'docente', 'auxiliar']));

CREATE POLICY "update_own_incidencias" ON public.incidencias 
    FOR UPDATE USING (auth.uid() = registrador_user_id OR public.has_role(ARRAY['subdirector']))
    WITH CHECK (auth.uid() = registrador_user_id OR public.has_role(ARRAY['subdirector']));

CREATE POLICY "delete_incidencias_subdirector" ON public.incidencias 
    FOR DELETE USING (public.has_role(ARRAY['subdirector']));


-- =====================================================================
-- POLÍTICAS PARA LA TABLA: alertas
-- =====================================================================

CREATE POLICY "admin_all_alertas" ON public.alertas 
    FOR ALL USING (public.has_role(ARRAY['admin']));

CREATE POLICY "read_all_alertas" ON public.alertas 
    FOR SELECT USING (public.has_role(ARRAY['admin', 'director', 'subdirector', 'auxiliar']));

CREATE POLICY "manage_alertas_subdirector" ON public.alertas 
    FOR ALL USING (public.has_role(ARRAY['subdirector']));

CREATE POLICY "system_insert_alertas" ON public.alertas 
    FOR INSERT WITH CHECK (TRUE); -- Permitido para alertas automáticas del sistema/app


-- =====================================================================
-- POLÍTICAS PARA LA TABLA: evidencias
-- =====================================================================

CREATE POLICY "admin_all_evidencias" ON public.evidencias 
    FOR ALL USING (public.has_role(ARRAY['admin']));

CREATE POLICY "read_evidencias" ON public.evidencias 
    FOR SELECT USING (TRUE); -- URL pública accesible si tiene el token / RLS de almacenamiento

CREATE POLICY "insert_evidencias" ON public.evidencias 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- =====================================================================
-- POLÍTICAS PARA LA TABLA: audit_logs
-- =====================================================================

CREATE POLICY "admin_all_audit_logs" ON public.audit_logs 
    FOR ALL USING (public.has_role(ARRAY['admin']));

CREATE POLICY "director_read_audit_logs" ON public.audit_logs 
    FOR SELECT USING (public.has_role(ARRAY['director', 'subdirector']));

CREATE POLICY "insert_audit_logs" ON public.audit_logs 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
