-- Corrige la compatibilidad entre roles antiguos en BD
-- (Superusuario, Director, Subdirector, Docente, Auxiliar)
-- y roles usados por las políticas/app (admin, director, subdirector, docente, auxiliar).
--
-- Aplicar en Supabase SQL Editor antes de asignar tutorías desde la app.

CREATE OR REPLACE FUNCTION public.has_role(required_roles text[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role text;
    normalized_role text;
BEGIN
    SELECT role::text INTO user_role FROM public.users WHERE id = auth.uid();

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
