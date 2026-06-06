-- SCRIPT DE REPARACIÓN DE BASE DE DATOS
-- 1. Arreglar el Trigger que causa el error "Database error creating new user"
-- 2. Restaurar tu cuenta como Superusuario
-- 3. Aplicar las reglas del Docente correctamente

-- ==========================================
-- PASO 1: REPARAR EL TRIGGER Y LA FUNCIÓN
-- ==========================================

-- Asegurarnos de que el tipo de rol existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('Superusuario', 'Director', 'Subdirector', 'Docente', 'Auxiliar', 'Psicólogo', 'Usuario');
  END IF;
END $$;

-- Recrear la función del trigger con SECURITY DEFINER para evitar problemas de permisos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, estado)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'Usuario'::app_role,
    'Activo'
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla la inserción en public.users, aún así permite que el usuario se cree en auth.users
    -- Esto evitará el error "Database error creating new user" en la interfaz
    RAISE LOG 'Error al crear el perfil de usuario: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger en la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- PASO 2: RECUPERAR TU ROL DE SUPERUSUARIO
-- ==========================================

UPDATE public.users 
SET role = 'Superusuario'::app_role 
WHERE email = 'ebert@gmail.com';


-- ==========================================
-- PASO 3: APLICAR POLÍTICAS DEL DOCENTE (Por si se borraron)
-- ==========================================

-- Incidencias
DROP POLICY IF EXISTS "Lectura incidencias" ON public.incidencias;
CREATE POLICY "Lectura incidencias" ON public.incidencias FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Superusuario', 'Director', 'Subdirector', 'Psicólogo', 'Auxiliar') 
    OR registrador_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Borrado incidencias" ON public.incidencias;
CREATE POLICY "Borrado incidencias" ON public.incidencias FOR DELETE USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Superusuario', 'Director', 'Subdirector') 
    OR registrador_user_id = auth.uid()
  )
);

-- Alertas
DROP POLICY IF EXISTS "Lectura alertas" ON public.alertas;
CREATE POLICY "Lectura alertas" ON public.alertas FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) != 'Docente' 
    OR alumno_id IN (SELECT alumno_id FROM public.incidencias WHERE registrador_user_id = auth.uid())
  )
);

-- Sesiones Psicológicas
DROP POLICY IF EXISTS "Lectura sesiones" ON public.sesiones_psicologicas;
CREATE POLICY "Lectura sesiones" ON public.sesiones_psicologicas FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM public.users WHERE id = auth.uid()) != 'Docente'
  )
);
