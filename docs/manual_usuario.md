# Manual de Usuario - EduControl.A.G.G

Este manual describe el funcionamiento y uso de la plataforma web **EduControl.A.G.G** para los distintos perfiles de usuario de la institución educativa.

---

## 📋 1. Acceso al Sistema y Registro

### Registro de Cuentas Nuevas
1. Al ingresar por primera vez a la dirección del sistema, será redirigido a la pantalla de **Iniciar Sesión**.
2. Si no dispone de una cuenta para fines de prueba o demostración, haga clic en **"¿No tienes una cuenta? Regístrate aquí"**.
3. Complete los campos:
   *   **Nombre** y **Apellido**.
   *   **Correo electrónico** y **Contraseña** (mínimo 6 caracteres).
   *   **Rol del Sistema**: Seleccione el rol de acuerdo con las vistas que desea probar (`Administrador`, `Director`, `Psicólogo`, `Docente`, etc.).
4. Haga clic en **Registrarse**. El sistema creará su usuario en el sistema de autenticación y lo redirigirá a la pantalla de inicio de sesión para que pueda ingresar.

---

## 👤 2. Gestión de Alumnos

Ubicado en el menú lateral: **Alumnos**
*   **Búsqueda y Paginación**: Encontrará un buscador donde podrá ingresar el nombre, apellidos o DNI de un estudiante. El listado se actualizará automáticamente (debounced) a medida que escribe.
*   **Registrar Alumno**: Los administradores y directivos pueden dar de alta a nuevos alumnos rellenando el formulario con los datos personales del estudiante, el nivel académico (Primaria / Secundaria), el grado y sección, y la información del apoderado.
*   **Editar Ficha**: Permite actualizar datos de contacto, teléfono o cambiar el estado del estudiante (`Activo`, `Inactivo`, `Suspendido`).
*   **Ficha del Alumno**: Al hacer clic en un alumno, se abrirá su expediente académico-disciplinario completo. En él se muestra su información de contacto, un **Historial de Incidencias** cronológico y una pestaña con su **Historial de Asistencias** mensualizado.

---

## 📝 3. Registro de Incidencias

Ubicado en el menú lateral: **Incidencias -> Reportar Incidencia**
*   **Selección de Estudiante**: Utilice el buscador interactivo para seleccionar el alumno.
*   **Detalles del Reporte**:
    *   Seleccione el tipo de incidencia (`Inasistencia`, `Tardanza`, `Problema de comportamiento`, `Conflicto entre alumnos`, etc.).
    *   Indique la severidad (`bajo`, `medio`, `alto`).
    *   Establezca la fecha y hora exacta del suceso.
*   **Refinador por IA**: Si escribe una descripción general o borrador, puede hacer clic en **"Refinar con IA"** para que el modelo de Google Gemini optimice la redacción de manera formal y profesional para el informe académico.
*   **Evidencias Multimedia**:
    *   **Subir archivo**: Adjunte fotos o capturas desde su computadora.
    *   **Usar Cámara**: Active la cámara web de su dispositivo directamente desde el navegador, capture la fotografía y agréguela al listado de evidencias.
*   Presione **Guardar Reporte** para registrar el incidente en el sistema.

---

## 🔔 4. Gestión de Alertas

Ubicado en el menú lateral: **Alertas**
*   El sistema genera alertas automáticas de color rojo en dos casos:
    1.  **Por Gravedad**: Cuando se reporta una incidencia de severidad `alto`.
    2.  **Por Recurrencia**: Cuando un alumno acumula **3 o más incidencias** dentro del mismo mes calendario.
*   Las alertas sugieren la acción inmediata a tomar (ej. citar al apoderado, enviar advertencia). Los administradores y directivos pueden marcar las alertas como leídas o atendidas desde el panel.

---

## 📅 5. Control de Asistencias

Ubicado en el menú lateral: **Asistencias**
1. Seleccione el **Grado**, la **Sección** y la **Fecha** de control.
2. Haga clic en **Cargar Alumnos**. Se listarán todos los estudiantes activos en esa aula con su estado actual (si ya fueron registrados previamente, se cargarán sus marcas).
3. Presione el botón correspondiente a cada estudiante:
   *   **Presente** (Verde)
   *   **Falta** (Rojo)
   *   **Tardanza** (Naranja)
   *   **Justificado** (Azul)
4. Agregue una observación en la caja de texto derecha de ser necesario (ej. "Presentó certificado de salud", "Llegó tarde por tráfico").
5. Haga clic en **Guardar Asistencias** en la parte inferior. El sistema sobrescribirá de manera segura las asistencias anteriores para esa fecha sin duplicar filas.

---

## 📊 6. Emisión de Reportes

Ubicado en el menú lateral: **Reportes**
*   Permite filtrar la información general por Nombre del alumno, Grado, Sección, Tipo de Incidencia, Severidad y Rango de Fechas.
*   Muestra los KPIs consolidados de la búsqueda (Total de incidencias, Faltas y Tardanzas).
*   **Exportar CSV**: Descarga inmediata de un documento de Excel con toda la data formateada.
*   **Imprimir PDF**: Genera una vista de impresión limpia y estilizada adaptada a papel físico o almacenamiento de informes institucionales en PDF.
