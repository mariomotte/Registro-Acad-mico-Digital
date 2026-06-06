-- Permite que Superusuario/admin gestione perfiles de operadores,
-- incluyendo tutor_grado, tutor_seccion y estado.

DROP POLICY IF EXISTS "admin_all_users" ON public.users;

CREATE POLICY "admin_all_users" ON public.users
    FOR ALL
    USING (public.has_role(ARRAY['admin']))
    WITH CHECK (public.has_role(ARRAY['admin']));
