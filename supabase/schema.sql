-- CREACIÓN DE ENUM PARA ROLES
CREATE TYPE app_role AS ENUM ('admin', 'director', 'subdirector', 'docente', 'auxiliar', 'psicologo');

-- TABLA PERFILES DE USUARIOS (Vinculada a auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role app_role NOT NULL DEFAULT 'docente',
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA ALUMNOS
CREATE TABLE public.alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dni TEXT UNIQUE NOT NULL CHECK (length(dni) = 8),
    codigo_estudiante TEXT UNIQUE NOT NULL,
    grado TEXT NOT NULL,
    seccion TEXT NOT NULL,
    nivel TEXT NOT NULL CHECK (nivel IN ('Primaria', 'Secundaria')),
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido')),
    apoderado TEXT NOT NULL,
    telefono TEXT NOT NULL,
    fecha_nacimiento DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA INCIDENCIAS
CREATE TABLE public.incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    alumno_nombre TEXT NOT NULL, -- Cache para búsquedas/reportes rápidos
    alumno_grado TEXT,
    alumno_seccion TEXT,
    registrado_por TEXT NOT NULL,
    registrador_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Inasistencia', 'Tardanza', 'Problema de comportamiento', 'Problema de salud', 'Conflicto entre alumnos', 'Observación académica')),
    severidad TEXT NOT NULL CHECK (severidad IN ('bajo', 'medio', 'alto', 'leve', 'moderada', 'grave')), -- Soporta bajo/medio/alto y leve/moderada/grave -- Map: leve, moderada, grave in UI if preferred
    descripcion TEXT NOT NULL,
    accion_tomada TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_seguimiento', 'cerrado')),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    evidence_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA ASISTENCIAS
CREATE TABLE public.asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    registrado_por TEXT NOT NULL,
    registrador_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado TEXT NOT NULL CHECK (estado IN ('presente', 'falta', 'tardanza', 'justificado')),
    observacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (alumno_id, fecha)
);

-- TABLA ALERTAS
CREATE TABLE public.alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    alumno_nombre TEXT NOT NULL,
    incidencia_id UUID REFERENCES public.incidencias(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    nivel TEXT NOT NULL CHECK (nivel IN ('verde', 'amarillo', 'rojo')),
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'leida', 'atendida')),
    destinatario TEXT, -- Rol o correo de destino
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    accion_requerida TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA SESIONES PSICOLÓGICAS
CREATE TABLE public.sesiones_psicologicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    alumno_nombre TEXT NOT NULL,
    psicologo_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    incidencia_id UUID REFERENCES public.incidencias(id) ON DELETE SET NULL,
    motivo TEXT NOT NULL,
    observaciones TEXT NOT NULL,
    recomendaciones TEXT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado TEXT NOT NULL DEFAULT 'en_seguimiento' CHECK (estado IN ('en_seguimiento', 'completada')),
    clasificacion TEXT NOT NULL CHECK (clasificacion IN ('Leve', 'Moderado', 'Crítico')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA EVIDENCIAS
CREATE TABLE public.evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidencia_id UUID NOT NULL REFERENCES public.incidencias(id) ON DELETE CASCADE,
    subido_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
    nombre_archivo TEXT NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tipo_archivo TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA AUDIT_LOGS
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario TEXT NOT NULL,
    usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    modulo TEXT NOT NULL,
    accion TEXT NOT NULL,
    registro_id TEXT,
    descripcion TEXT NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDICES BÁSICOS DE OPTIMIZACIÓN
CREATE INDEX idx_alumnos_dni ON public.alumnos(dni);
CREATE INDEX idx_alumnos_nombres ON public.alumnos(nombres, apellidos);
CREATE INDEX idx_incidencias_alumno ON public.incidencias(alumno_id);
CREATE INDEX idx_incidencias_fecha ON public.incidencias(fecha);
CREATE INDEX idx_asistencias_alumno_fecha ON public.asistencias(alumno_id, fecha);
CREATE INDEX idx_alertas_alumno ON public.alertas(alumno_id);
CREATE INDEX idx_sesiones_alumno ON public.sesiones_psicologicas(alumno_id);

-- TRIGGER PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_alumnos_modtime BEFORE UPDATE ON public.alumnos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_incidencias_modtime BEFORE UPDATE ON public.incidencias FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_asistencias_modtime BEFORE UPDATE ON public.asistencias FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_alertas_modtime BEFORE UPDATE ON public.alertas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sesiones_modtime BEFORE UPDATE ON public.sesiones_psicologicas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TRIGGER PARA AUTOCREAR PERFIL DE USUARIO AL REGISTRAR EN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, role, estado)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'docente'::app_role),
        'Activo'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error al crear el perfil de usuario: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
