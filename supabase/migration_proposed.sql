-- MIGRACIÓN PROPUESTA PARA ALINEACIÓN DE ESQUEMA EN SUPABASE
-- NO EJECUTAR DIRECTAMENTE HASTA SU CONFIRMACIÓN EN LA INTERFAZ DE SUPABASE.

-- 1. ALUMNOS: Agregar solo campos opcionales dni, apoderado y telefono.
-- Se omiten codigo_estudiante y fecha_nacimiento.
ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS dni VARCHAR(8) UNIQUE;
ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS apoderado VARCHAR(100);
ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS telefono VARCHAR(15);
ALTER TABLE public.alumnos ALTER COLUMN dni DROP NOT NULL;
ALTER TABLE public.alumnos ALTER COLUMN codigo_estudiante DROP NOT NULL;
ALTER TABLE public.alumnos ALTER COLUMN apoderado DROP NOT NULL;
ALTER TABLE public.alumnos ALTER COLUMN telefono DROP NOT NULL;
ALTER TABLE public.alumnos ALTER COLUMN nivel SET DEFAULT 'Secundaria';

-- 2. INCIDENCIAS: Corregir alumno_id a BIGINT y agregar campos del frontend
-- (incidencias y alertas están vacías por lo que DROP COLUMN CASCADE es 100% seguro)
ALTER TABLE public.incidencias DROP COLUMN IF EXISTS alumno_id CASCADE;
ALTER TABLE public.incidencias ADD COLUMN alumno_id BIGINT NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE;

ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS accion_tomada TEXT;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. ALERTAS: Corregir alumno_id a BIGINT y agregar columnas necesarias
ALTER TABLE public.alertas DROP COLUMN IF EXISTS alumno_id CASCADE;
ALTER TABLE public.alertas ADD COLUMN alumno_id BIGINT NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE;

ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS incidencia_id UUID REFERENCES public.incidencias(id) ON DELETE CASCADE;
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS mensaje TEXT;
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS nivel VARCHAR(20) CHECK (nivel IN ('verde', 'amarillo', 'rojo'));
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'leida', 'atendida'));
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS destinatario VARCHAR(255);
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS accion_requerida TEXT;
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS fecha TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
