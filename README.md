# EduControl.A.G.G - Sistema de Seguimiento Estudiantil e Incidencias

EduControl.A.G.G es una plataforma web para optimizar el seguimiento conductual, la gestion de incidencias y la emision de alertas en instituciones educativas. El sistema ofrece un entorno seguro y colaborativo para administradores, directivos, docentes y auxiliares.

---

## Arquitectura y Tecnologias

* **Frontend**: Next.js, React, TypeScript, Tailwind CSS y Shadcn UI.
* **Visualizacion**: Recharts para analisis grafico interactivo.
* **Backend y Base de Datos**: Supabase con PostgreSQL.
* **Autenticacion**: Supabase Auth con perfiles publicos sincronizados.
* **Almacenamiento**: Supabase Storage, bucket `evidencias`, para fotos y archivos adjuntos.
* **Seguridad**: Politicas Row Level Security de Supabase para controlar acceso por rol.

---

## Instalacion y Configuracion Local

1. Instalar dependencias:

```powershell
npm install
```

2. Configurar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

3. Iniciar servidor de desarrollo:

```powershell
npm run dev
```

4. Abrir `http://localhost:9002`.

---

## Matriz de Roles

El sistema define 5 roles:

1. **Administrador**: Acceso completo a gestion de usuarios, alumnos, incidencias, alertas y reportes.
2. **Director**: Monitoreo global de alertas, reportes institucionales y casos prioritarios.
3. **Subdirector**: Gestion disciplinaria, seguimiento de incidencias y casos de atencion.
4. **Docente**: Registro de incidencias y seguimiento de alumnos asignados por tutoria.
5. **Auxiliar**: Registro operativo de incidencias, tardanzas e inasistencias reportadas como incidencias.

---

## Modulos del Sistema

### 1. Panel de Control (`/dashboard`)

* Paneles diferenciados por rol.
* Indicadores de incidencias, alertas activas y casos prioritarios.
* Graficos de flujo de reportes y distribucion por categorias.

### 2. Gestion de Alumnos (`/students`)

* Busqueda por DNI, nombres o apellidos.
* Registro, edicion y ficha detallada del alumno.
* Historial de incidencias, tardanzas e inasistencias registradas como reportes.

### 3. Reporte de Incidencias (`/incidents/new`)

* Seleccion del estudiante y tipo de reporte.
* Registro de fecha y hora del suceso.
* Refinador con IA para formalizar la descripcion.
* Carga de evidencias desde camara o archivos locales.

### 4. Alertas (`/alerts`)

* Alertas por gravedad cuando una incidencia se registra con severidad alta.
* Alertas por recurrencia cuando un alumno acumula multiples incidencias.
* Notificaciones en tiempo real para el rol Auxiliar.

### 5. Reportes (`/dashboard/reportes`)

* Filtros por alumno, grado, seccion, tipo de incidencia, severidad y rango de fechas.
* KPIs de incidencias, tardanzas e inasistencias.
* Exportacion CSV e impresion/PDF.

### 6. Auditoria

* Registro de acciones criticas mediante `audit_logs`.
* Trazabilidad para operaciones administrativas y disciplinarias.
