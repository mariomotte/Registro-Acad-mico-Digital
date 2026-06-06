-- Da al subdirector los mismos accesos de lectura que el director
-- para perfiles de usuarios y auditoria.

DROP POLICY IF EXISTS "director_read_all_users" ON public.users;
CREATE POLICY "director_read_all_users" ON public.users
    FOR SELECT USING (public.has_role(ARRAY['director', 'subdirector']));

DROP POLICY IF EXISTS "director_read_audit_logs" ON public.audit_logs;
CREATE POLICY "director_read_audit_logs" ON public.audit_logs
    FOR SELECT USING (public.has_role(ARRAY['director', 'subdirector']));
