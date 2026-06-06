-- Actualización de Políticas RLS para el Rol Docente

-- 1. Políticas para INCIDENCIAS
DROP POLICY IF EXISTS "Lectura incidencias" ON public.incidencias;
CREATE POLICY "Lectura incidencias" ON public.incidencias FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Superusuario', 'Director', 'Subdirector', 'Psicólogo', 'Auxiliar') 
    OR registrador_user_id = auth.uid()
  )
);

-- Nota: "Edicion incidencias" ya estaba filtrada a "auth.uid() = registrador_user_id", por lo que no es necesario cambiarla para UPDATE, pero para DELETE:
DROP POLICY IF EXISTS "Borrado incidencias" ON public.incidencias;
CREATE POLICY "Borrado incidencias" ON public.incidencias FOR DELETE USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Superusuario', 'Director', 'Subdirector') 
    OR registrador_user_id = auth.uid()
  )
);

-- 2. Políticas para ALERTAS
DROP POLICY IF EXISTS "Lectura alertas" ON public.alertas;
CREATE POLICY "Lectura alertas" ON public.alertas FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) != 'Docente' 
    OR alumno_id IN (SELECT alumno_id FROM public.incidencias WHERE registrador_user_id = auth.uid())
  )
);

-- 3. Políticas para SESIONES PSICOLÓGICAS
DROP POLICY IF EXISTS "Lectura sesiones" ON public.sesiones_psicologicas;
CREATE POLICY "Lectura sesiones" ON public.sesiones_psicologicas FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) != 'Docente'
  )
);
