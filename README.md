# EduControl.A.G.G - Sistema de Seguimiento Estudiantil e Incidencias

EduControl.A.G.G es una plataforma web moderna e integrada diseñada para optimizar el seguimiento conductual, el control de asistencias, la gestión psicopedagógica y la emisión de alertas en instituciones educativas. Desarrollado con tecnologías de vanguardia, el sistema garantiza un entorno seguro, ágil y colaborativo para directivos, docentes, auxiliares y psicólogos.

---

## 🚀 Arquitectura y Tecnologías

El sistema utiliza un stack tecnológico robusto y escalable:

*   **Frontend**: Next.js (React), TypeScript, Tailwind CSS, Shadcn UI.
*   **Visualización**: Recharts para el análisis gráfico interactivo en tiempo real.
*   **Backend & Base de Datos**: Supabase (PostgreSQL) para almacenamiento relacional y auditoría.
*   **Autenticación**: Supabase Auth con sincronización automática de perfiles públicos.
*   **Almacenamiento**: Supabase Storage (bucket `evidencias`) para el resguardo de evidencias multimedia (fotos tomadas desde la cámara o archivos cargados).
*   **Seguridad**: Políticas a nivel de fila (Row Level Security - RLS) de Supabase para la protección estricta de la información (ej. confidencialidad de fichas psicológicas).

---

## 🛠️ Instalación y Configuración Local

Siga estos pasos para levantar el entorno de desarrollo localmente:

1.  **Instalar dependencias**:
    ```powershell
    npm install
    ```
2.  **Configurar Variables de Entorno**:
    Cree o modifique el archivo `.env.local` en la raíz del proyecto agregando sus credenciales de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
    ```
3.  **Iniciar Servidor de Desarrollo**:
    ```powershell
    npm run dev
    ```
4.  **Acceso Web**:
    Abra su navegador e ingrese a **`http://localhost:9002`**.

---

## 🔑 Matriz de Roles y Accesos

El sistema define 6 roles con permisos diferenciados que se autoevalúan en tiempo real:

1.  **Administrador**: Acceso completo a todos los módulos y gestión de la plataforma.
2.  **Director / Subdirector**: Monitoreo global de alertas, reportes institucionales, asistencias y derivaciones disciplinarias.
3.  **Psicólogo**: Acceso exclusivo al Gabinete Psicopedagógico, historial clínico y registro de sesiones confidenciales.
4.  **Docente / Auxiliar**: Registro diario de asistencias/tardanzas y reporte de incidencias leves/moderadas de alumnos.

---

## 📦 Módulos del Sistema

### 1. Panel de Control (Dashboard)
*   **Estadísticas Dinámicas**: Tarjetas con contadores en tiempo real de alertas activas, incidencias, inasistencias y tardanzas.
*   **Análisis Visual**: Gráfico de líneas (flujo temporal de reportes de los últimos 7 días) y gráfico de dona (distribución por categorías de incidencias) usando `recharts`.
*   **Alertas Prioritarias**: Listado dinámico de casos graves pendientes de atención.

### 2. Gestión de Alumnos (`/students`)
*   **Buscador Avanzado**: Filtro debounced por DNI o nombres/apellidos y paginación real desde base de datos.
*   **Ficha Detallada**: Visualización de la información de contacto, apoderado, nivel escolar e historial detallado de incidencias y asistencias del alumno.

### 3. Reporte de Incidencias (`/incidents/new`)
*   **Formulario Inteligente**: Selección del estudiante y tipo de reporte.
*   **Refinador con IA (Google Gemini)**: Opción de optimizar y formalizar la redacción de la descripción mediante inteligencia artificial antes de guardar.
*   **Carga de Evidencias**: Captura directa desde la cámara del dispositivo o carga de archivos locales directamente al bucket de Supabase.

### 4. Automatización de Alertas (`/alerts`)
*   **Alertas por Gravedad**: Si una incidencia se registra como "alta", se dispara una alerta roja dirigida a la dirección.
*   **Alertas por Recurrencia**: Si un alumno acumula más de 3 incidencias en el mes actual, el sistema autogenera una alerta preventiva de riesgo.

### 5. Control de Asistencias (`/dashboard/asistencias`)
*   **Filtro por Aula**: Carga dinámica de alumnos por Grado y Sección.
*   **Control Diario**: Registro de estados (Presente, Falta, Tardanza, Justificado) con soporte de notas aclaratorias. Protección de clave única compuesta para evitar duplicidades.

### 6. Reportes y Exportación (`/dashboard/reportes`)
*   **KPIs en Tiempo Real**: Resumen numérico filtrable del rendimiento disciplinario.
*   **Descargas**: Exportación de reportes listos en formato **CSV/Excel** y formato estilizado para **impresión en PDF**.

### 7. Registro de Auditoría (Logs)
*   **Seguridad y Control**: El sistema documenta todas las acciones de modificación crítica (creación/edición de alumnos, registro de asistencia, sesiones clínicas) en la tabla `audit_logs` a través de un helper centralizado para control administrativo.
