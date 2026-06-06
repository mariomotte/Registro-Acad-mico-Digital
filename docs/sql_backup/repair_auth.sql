-- =====================================================================
-- SCRIPT DE REPARACIÓN Y EXTENSIÓN DE AUTENTICACIÓN Y ROLES (EDUCONTROL)
-- =====================================================================

-- 1. CORRECCIÓN DE COLUMNAS NULL EN AUTH.USERS
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

-- 2. CORRECCIÓN DE ROLES DE USUARIOS EXISTENTES
UPDATE public.users SET role = 'Psicólogo'::app_role WHERE email = 'ander@gmail.com';
UPDATE public.users SET role = 'Docente'::app_role WHERE email = 'pedro@gmail.com';

-- 3. RECREACIÓN DEL TRIGGER DE AUTOCREACIÓN DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_text TEXT;
  v_app_role app_role;
BEGIN
  v_role_text := new.raw_user_meta_data->>'role';

  -- Mapear dinámicamente el rol en texto al enum app_role (tolerante a mayúsculas, minúsculas y acentos)
  v_app_role := CASE 
    WHEN LOWER(v_role_text) IN ('superusuario', 'admin', 'administrator') THEN 'Superusuario'::app_role
    WHEN LOWER(v_role_text) IN ('director') THEN 'Director'::app_role
    WHEN LOWER(v_role_text) IN ('subdirector') THEN 'Subdirector'::app_role
    WHEN LOWER(v_role_text) IN ('docente', 'teacher') THEN 'Docente'::app_role
    WHEN LOWER(v_role_text) IN ('auxiliar') THEN 'Auxiliar'::app_role
    WHEN LOWER(v_role_text) IN ('psicólogo', 'psicologo', 'psychologist') THEN 'Psicólogo'::app_role
    ELSE 'Usuario'::app_role
  END;

  INSERT INTO public.users (id, email, first_name, last_name, role, estado)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    v_app_role,
    'Activo'
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error al crear el perfil de usuario: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. RPC PARA CREAR NUEVO OPERADOR (Evita campos NULL en GoTrue)
CREATE OR REPLACE FUNCTION public.create_new_operator(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El correo ya está registrado.');
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf', 10));

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    email_change_token_current,
    reauthentication_token,
    last_sign_in_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_pw,
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name, 'role', p_role),
    false,
    NOW(),
    NOW(),
    '', '', '', '', '', '', NOW()
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_email,
    v_user_id,
    jsonb_build_object('sub', v_user_id, 'email', p_email)::jsonb,
    'email',
    NOW(), NOW(), NOW()
  );

  RETURN jsonb_build_object('success', true, 'userId', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 5. RPC PARA ELIMINAR OPERADOR (Borra de auth.users y cascada)
CREATE OR REPLACE FUNCTION public.delete_operator(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
AS $$
BEGIN
  -- Evitar eliminarse a sí mismo (como medida de seguridad adicional en BD)
  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes eliminar tu propia cuenta.');
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 6. RPC PARA ACTUALIZAR OPERADOR (Modifica perfil y opcionalmente la contraseña)
CREATE OR REPLACE FUNCTION public.update_operator(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_password TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  v_encrypted_pw TEXT;
  v_role_enum app_role;
BEGIN
  -- 1. Actualizar metadatos y email en auth.users
  UPDATE auth.users
  SET 
    email = p_email,
    raw_user_meta_data = jsonb_build_object(
      'first_name', p_first_name,
      'last_name', p_last_name,
      'role', p_role
    ),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 2. Si se ingresa una nueva contraseña, actualizarla encriptada
  IF p_password IS NOT NULL AND p_password <> '' THEN
    v_encrypted_pw := crypt(p_password, gen_salt('bf', 10));
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw
    WHERE id = p_user_id;
  END IF;

  -- 3. Obtener el valor correspondiente del enum app_role
  v_role_enum := CASE 
    WHEN LOWER(p_role) IN ('superusuario', 'admin', 'administrator') THEN 'Superusuario'::app_role
    WHEN LOWER(p_role) IN ('director') THEN 'Director'::app_role
    WHEN LOWER(p_role) IN ('subdirector') THEN 'Subdirector'::app_role
    WHEN LOWER(p_role) IN ('docente', 'teacher') THEN 'Docente'::app_role
    WHEN LOWER(p_role) IN ('auxiliar') THEN 'Auxiliar'::app_role
    WHEN LOWER(p_role) IN ('psicólogo', 'psicologo', 'psychologist') THEN 'Psicólogo'::app_role
    ELSE 'Usuario'::app_role
  END;

  -- 4. Actualizar la tabla de perfiles públicos directamente para sincronizar de inmediato
  UPDATE public.users
  SET 
    email = p_email,
    first_name = p_first_name,
    last_name = p_last_name,
    role = v_role_enum
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
