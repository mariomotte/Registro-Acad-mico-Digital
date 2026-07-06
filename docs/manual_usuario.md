# Manual de Usuario - EduControl A.G.G

Este manual describe las funciones reales del sistema segun el codigo actual de la plataforma. Cubre el uso desde el login hasta el cierre de sesion para los roles Directivo, Auxiliar y Tutor/Docente.

---

## 1. Ingreso al sistema

1. Abra la direccion del sistema.
2. En la pantalla de login ingrese:
   - Correo electronico.
   - Contrasena.
3. Presione **Entrar al Sistema**.
4. El sistema valida las credenciales con Supabase.
5. Si la cuenta esta marcada como **Inactivo**, el sistema cierra la sesion inmediatamente y muestra que la cuenta esta bloqueada o desactivada.
6. Si el ingreso es correcto, se carga el **Panel de Control** correspondiente al rol del usuario.

Mensajes posibles:

- Credenciales incorrectas: revisar correo o contrasena.
- Cuenta bloqueada/desactivada: contactar al administrador o directivo encargado.
- Ingreso correcto: el sistema redirige al panel principal.

---

## 2. Roles y accesos visibles

### Directivo

Incluye usuarios con rol **Director**, **Subdirector** y, en la practica del sistema, tambien **Administrador/Superusuario** para el panel directivo.

Menu visible:

- Panel de Control.
- Alumnos.
- Incidencias.
- Seguimiento Prioritario.
- Informes y Estadisticas.
- Accesos y Roles.
- Configuraciones, solo si el usuario es Administrador.

### Auxiliar

Menu visible:

- Panel de Control.
- Alumnos.
- Incidencias.
- Seguimiento Prioritario.

### Tutor/Docente

Menu visible:

- Panel de Control.
- Mis alumnos.
- Incidencias.

El Docente no ve en el menu lateral:

- Seguimiento Prioritario.
- Informes y Estadisticas.
- Accesos y Roles.
- Configuraciones.

---

## 3. Panel de Control

Despues del login, el sistema abre el **Panel de Control**. Esta pantalla cambia segun el rol.

### Panel Directivo

El directivo visualiza informacion institucional:

- Tarjetas de estadisticas generales.
- Grafico de reportes y alertas de los ultimos 7 dias.
- Grafico de categorias o tipos de incidencias.
- Resumen de reincidencia conductual de los ultimos 30 dias.
- Lista de alumnos con 2 o mas reportes recientes.
- Acceso rapido a la ficha del alumno desde los casos recurrentes.

Uso recomendado:

1. Revise los indicadores generales.
2. Observe si hay aumento de reportes o alertas.
3. Revise las categorias mas frecuentes.
4. Abra la ficha de los alumnos reincidentes para ver historial, evidencias y seguimiento.

### Panel Auxiliar

El auxiliar visualiza informacion operativa del dia:

- Acceso rapido para registrar reportes.
- Acceso a alertas pendientes.
- Acceso a busqueda de alumnos.
- Conteo de tardanzas de hoy.
- Conteo de inasistencias de hoy.
- Conteo de otras incidencias del dia.
- Grafico de distribucion diaria.
- Grafico de prioridad de casos.
- Casos de atencion prioritaria.
- Incidencias reportadas hoy.
- Alertas activas y casos prioritarios.

Al ingresar, si existen alertas no leidas, el sistema puede mostrar un modal de **Alertas Pendientes de Revision**. Desde ahi el auxiliar puede:

- Abrir la ficha del alumno.
- Marcar una alerta como visualizada.
- Marcar todas las alertas como visualizadas.
- Cerrar el modal y revisarlas luego.

### Panel Tutor/Docente

El docente visualiza su actividad y su seccion asignada:

- Tarjetas de estadisticas.
- Grafico de **Mis Reportes** de los ultimos 7 dias.
- Lista de las ultimas 5 incidencias registradas por el docente.
- Seguimiento de la seccion asignada, si tiene grado y seccion de tutoria.
- Reportes recientes de los alumnos de su tutoria.
- Acceso a la ficha del alumno desde el seguimiento.

Si el docente no tiene seccion asignada, el sistema indica que aun no tiene tutoria asignada.

---

## 4. Modulo Alumnos / Mis alumnos

Ruta del sistema: **Alumnos** o **Mis alumnos**.

### Funciones generales

En esta pantalla se puede:

- Buscar alumnos por nombres, apellidos o DNI.
- Filtrar por grado, seccion y estado, excepto en el caso del docente, que queda limitado a su seccion asignada.
- Ver resumen de secciones y cantidad de alumnos.
- Abrir la ficha del alumno.
- Editar alumno, solo para roles con permiso directivo.
- Registrar alumno nuevo, solo para roles con permiso directivo.

Estados visibles del alumno:

- Activo.
- Suspendido.
- Inactivo.

### Directivo en Alumnos

El directivo puede:

1. Ver la base de alumnos.
2. Buscar por nombre, apellido o DNI.
3. Filtrar por grado, seccion y estado.
4. Registrar nuevo alumno.
5. Editar datos del alumno.
6. Abrir la ficha oficial del alumno.

Al registrar alumno nuevo, el sistema solicita:

- Nombres.
- Apellidos.
- DNI opcional, validado a 8 digitos si se ingresa.
- Grado.
- Seccion.
- Estado.
- Fecha de nacimiento opcional.
- Apoderado opcional.
- Telefono opcional.

Al editar alumno, el sistema permite modificar:

- Nombres.
- Apellidos.
- DNI.
- Estado.
- Grado.
- Seccion.
- Apoderado.
- Telefono.
- Fortalezas.
- Aspectos por mejorar.

Las acciones de crear y editar quedan registradas en auditoria.

### Auxiliar en Alumnos

El auxiliar puede:

- Buscar alumnos.
- Ver la ficha del alumno.
- Revisar historial y datos de seguimiento.
- Registrar incidencias desde la ficha o desde el modulo Incidencias.
- Actualizar fortalezas y aspectos por mejorar desde la ficha, segun permiso actual de la pantalla.

El auxiliar no tiene boton de editar alumno en la lista principal.

### Tutor/Docente en Mis alumnos

El docente ve solo los alumnos de su grado y seccion asignados como tutoria.

Puede:

- Buscar dentro de su seccion.
- Abrir ficha del alumno.
- Ver reportes segun alcance permitido.
- Registrar nuevas incidencias.
- Registrar observaciones academicas en bitacora.
- Editar fortalezas y aspectos por mejorar desde la ficha.

Si no tiene grado y seccion asignados, la lista aparece sin alumnos y el sistema informa que aun no tiene seccion de tutoria.

---

## 5. Ficha del Alumno

Ruta: desde **Alumnos/Mis alumnos**, boton **Ficha**.

La ficha del alumno muestra:

- Nombres y apellidos.
- Grado y seccion.
- DNI.
- Estado.
- Apoderado.
- Telefono.
- Historial de tardanzas.
- Historial de inasistencias.
- Reportes de conducta.
- Bitacora de observaciones academicas.
- Fortalezas.
- Aspectos por mejorar.
- Evidencias adjuntas a reportes, cuando existen.

Acciones disponibles:

- Volver a la lista de alumnos.
- Generar PDF mediante impresion del navegador.
- Registrar nueva incidencia para ese alumno.
- Editar ficha, solo directivos.
- Guardar nota privada/observacion academica en la bitacora.
- Guardar fortalezas y aspectos por mejorar, para directivo, docente y auxiliar.

### Conducta sugerida

La ficha calcula una conducta sugerida del periodo actual:

- AD - Excelente.
- A - Buena.
- B - En observacion.
- C - Caso critico.

El calculo se basa en reportes del semestre actual, considerando cantidad y gravedad.

### Alcance del docente

Si el docente abre un alumno que pertenece a su tutoria, ve el historial de ese alumno. Si no pertenece a su tutoria, el sistema limita los reportes visibles a los registrados por ese mismo docente.

---

## 6. Modulo Incidencias

Ruta: **Incidencias**.

Esta pantalla muestra el registro operativo de reportes.

Funciones:

- Ver lista de incidencias.
- Buscar por alumno o tipo.
- Filtrar por esta semana.
- Usar filtros avanzados:
  - Grado.
  - Seccion.
  - Tipo de incidencia.
  - Severidad.
  - Fecha desde.
  - Fecha hasta.
- Abrir ficha del alumno desde cada registro.
- Crear nuevo reporte.

Tipos de incidencia disponibles:

- Inasistencia.
- Tardanza.
- Problema de comportamiento.
- Problema de salud.
- Conflicto entre alumnos.
- Observacion academica.

Niveles de gravedad:

- Bajo.
- Medio.
- Alto.

---

## 7. Registrar Nuevo Reporte

Ruta: **Incidencias > Nuevo Reporte**.

Pasos:

1. Seleccione el alumno en el buscador.
2. Seleccione el tipo de incidencia.
3. Seleccione el nivel de gravedad.
4. Indique la fecha y hora del suceso.
5. Escriba la descripcion detallada.
6. Adjunte evidencias si corresponde.
7. Opcionalmente use herramientas de IA.
8. Presione **Guardar Reporte**.

Herramientas de evidencia:

- Capturar foto con camara.
- Subir imagen desde el equipo.
- Quitar evidencia antes de guardar.

Funciones de IA reales en esta pantalla:

- **Refinar con IA**: mejora la redaccion de la descripcion escrita.
- **Describir escena**: analiza la primera imagen adjunta y autocompleta una descripcion.
- **Transcribir Hoja (IA)**: intenta leer una hoja de incidencia fotografiada y autocompletar descripcion, tipo, severidad y alumno si encuentra coincidencia.

Al guardar:

- Se suben las evidencias al bucket `evidencias`.
- Se crea el registro en la tabla de incidencias.
- Se crea una alerta para auxiliar por nuevo reporte.
- Si la gravedad es alta, se crea una alerta roja por gravedad.
- Si el alumno acumula 3 o mas incidencias en el mes, se crea alerta roja por reincidencia.
- Se registra auditoria de creacion de incidencia.
- El sistema redirige a la lista de incidencias.

---

## 8. Seguimiento Prioritario

Ruta: **Seguimiento Prioritario**.

Disponible para:

- Directivo.
- Auxiliar.

En el codigo tambien existe logica para docente, pero el menu lateral actual no muestra esta opcion al docente.

Funciones:

- Ver alertas del sistema.
- Ver cantidad de alertas rojas.
- Ver alertas pendientes.
- Ver alertas atendidas.
- Ver grados priorizados por riesgo.
- Ver ranking de grados en riesgo.
- Revisar bandeja prioritaria.
- Revisar contexto reciente de reportes.
- Marcar una alerta como leida.
- Marcar todas las alertas como leidas.
- Eliminar alerta.
- Abrir ficha del alumno.
- Exportar alertas a Excel.
- Generar resumen para apoderado con IA.
- Descargar el resumen para apoderado en PDF.

### Uso del directivo

1. Revise las tarjetas superiores: riesgo alto, pendientes, atendidas y grados en radar.
2. Revise el ranking de grados.
3. Entre a la bandeja prioritaria.
4. Abra la ficha del alumno.
5. Genere resumen para apoderado si necesita comunicar el caso.
6. Marque la alerta como leida cuando ya fue revisada.
7. Exporte a Excel si requiere respaldo.

### Uso del auxiliar

1. Revise las alertas pendientes.
2. Abra la ficha del alumno.
3. Verifique tardanzas, inasistencias, incidencias y evidencias.
4. Marque la alerta como leida o visualizada.
5. Use exportacion si necesita entregar seguimiento.

---

## 9. Informes y Estadisticas

Ruta: **Informes y Estadisticas**.

Disponible para:

- Administrador.
- Director.
- Subdirector.

Funciones:

- Buscar por alumno, tipo o descripcion.
- Filtrar por periodo rapido:
  - 7 dias.
  - 15 dias.
  - 30 dias.
  - Todo.
- Filtrar por grado.
- Filtrar por seccion.
- Ver grafico de tipos de casos mas frecuentes.
- Ver referencias por tipo.
- Ver tarjetas de informes:
  - Informe por grado.
  - Informe por seccion.
  - Alumnos recurrentes.
  - Casos graves.
  - Tipos frecuentes.
- Abrir detalle de cada informe.
- Exportar resumen de cada informe en CSV.
- Exportar informe estadistico en Excel XLSX con logo, encabezado y detalle.

Uso recomendado:

1. Defina periodo, grado y seccion.
2. Revise el grafico de tipos frecuentes.
3. Abra el detalle del informe necesario.
4. Exporte resumen o Excel institucional.

---

## 10. Accesos y Roles

Ruta: **Accesos y Roles**.

Disponible para:

- Administrador.
- Director.
- Subdirector.

Funciones:

- Buscar usuarios por nombre o correo.
- Ver usuarios operadores, excepto superusuario en la lista filtrada.
- Crear operador.
- Editar operador.
- Cambiar rol.
- Activar o bloquear acceso.
- Eliminar operador.
- Asignar tutoria a docentes.
- Evitar duplicidad de tutor por grado, seccion y anio.

Roles manejables desde la pantalla:

- Director.
- Subdirector.
- Docente.
- Auxiliar.

Al crear operador se solicita:

- Nombres.
- Apellidos.
- Correo.
- Contrasena.
- Rol.
- Si el rol es Docente: grado tutor y seccion tutor opcionales.

Al editar operador se puede modificar:

- Nombres.
- Apellidos.
- Correo.
- Contrasena, si se ingresa una nueva.
- Rol.
- Tutoria, si corresponde.

Restricciones reales:

- El usuario no puede cambiarse su propio rol desde la tabla.
- El usuario no puede bloquearse a si mismo desde el interruptor.
- El usuario no puede editarse o eliminarse a si mismo desde las acciones de la tabla.
- La contrasena nueva debe tener al menos 6 caracteres al crear operador.
- La tutoria no permite asignar la misma seccion del mismo grado y anio a dos docentes.

Las acciones importantes quedan registradas en auditoria.

---

## 11. Configuraciones

Ruta: **Configuraciones**.

Disponible solo para:

- Administrador.

Estado real de esta pantalla:

- Muestra una interfaz preparada para importar padrones Excel, XLS o CSV.
- Permite seleccionar un archivo.
- Muestra columnas esperadas para importacion de alumnos.
- Muestra pasos previstos de validacion.
- Indica que la importacion real queda pendiente hasta recibir la data final.
- Muestra opciones de exportacion administrativa deshabilitadas.

Columnas esperadas para importacion:

- APELLIDOS Y NOMBRES.
- SEXO.
- DNI.
- F.NAC.
- SEGURO.
- DOC.MAT.
- CELULAR.
- C.CARGO.
- OBS.

Nota: actualmente esta pantalla no sube registros a la base de datos; solo prepara y documenta el formato de trabajo.

---

## 12. Mi Perfil

Ruta: menu del usuario, opcion **Perfil de Usuario**.

Funciones:

- Ver avatar.
- Ver nombre completo.
- Ver correo.
- Ver rol asignado.
- Ver fecha de creacion de la cuenta.
- Editar nombre.
- Editar apellido.
- Guardar cambios.

No se puede cambiar desde esta pantalla:

- Correo.
- Rol.
- Fecha de creacion.

Despues de guardar, el sistema muestra que los cambios fueron guardados y recomienda actualizar la pagina para verlos reflejados.

---

## 13. Cierre de sesion

El usuario puede cerrar sesion de dos formas:

- Desde el boton **Cerrar Sesion** del menu lateral.
- Desde el menu del avatar, opcion **Cerrar Sesion**.

Al cerrar sesion:

1. Supabase elimina la sesion activa.
2. El sistema redirige a `/login`.
3. Para volver a entrar, se deben ingresar nuevamente correo y contrasena.

---

## 14. Flujo completo por rol

### Directivo: desde login hasta cierre

1. Ingresa con correo y contrasena.
2. Revisa el Panel de Control directivo.
3. Observa reportes, alertas y reincidencias.
4. Entra a Alumnos para buscar o revisar fichas.
5. Si corresponde, registra o edita alumnos.
6. Entra a Incidencias para revisar reportes por filtros.
7. Entra a Seguimiento Prioritario para atender alertas.
8. Genera resumen para apoderado o abre ficha del alumno.
9. Entra a Informes y Estadisticas para analizar datos institucionales.
10. Exporta Excel o CSV si necesita respaldo.
11. Entra a Accesos y Roles si debe crear, editar, bloquear o asignar roles.
12. Actualiza su perfil si lo necesita.
13. Cierra sesion.

### Auxiliar: desde login hasta cierre

1. Ingresa con correo y contrasena.
2. Revisa el Panel Auxiliar.
3. Atiende el modal de alertas pendientes, si aparece.
4. Revisa tardanzas, inasistencias y otras incidencias del dia.
5. Registra reportes desde el acceso rapido o desde Incidencias.
6. Adjunta evidencias si corresponde.
7. Usa IA para describir o transcribir evidencia si es necesario.
8. Busca alumnos y abre fichas para revisar historial.
9. En Seguimiento Prioritario marca alertas como leidas o visualizadas.
10. Actualiza fortalezas y aspectos por mejorar si corresponde.
11. Actualiza su perfil si lo necesita.
12. Cierra sesion.

### Tutor/Docente: desde login hasta cierre

1. Ingresa con correo y contrasena.
2. Revisa el Panel Docente.
3. Verifica sus reportes recientes.
4. Revisa el seguimiento de su seccion asignada.
5. Entra a Mis alumnos.
6. Busca un alumno de su tutoria.
7. Abre la ficha del alumno.
8. Revisa tardanzas, inasistencias, incidencias y bitacora.
9. Registra una nueva incidencia o una observacion academica.
10. Usa IA para mejorar descripcion, describir imagen o transcribir hoja si adjunta evidencia.
11. Actualiza fortalezas y aspectos por mejorar si corresponde.
12. Revisa Incidencias para ver el historial disponible.
13. Actualiza su perfil si lo necesita.
14. Cierra sesion.

---

## 15. Recomendaciones de uso

- Registre las incidencias el mismo dia del suceso.
- Use la fecha y hora real del hecho, no solo la fecha de registro.
- Adjunte evidencias cuando ayuden a sustentar el caso.
- Use una descripcion clara, objetiva y sin lenguaje ofensivo.
- Marque las alertas como leidas solo despues de revisarlas.
- Revise la ficha del alumno antes de tomar decisiones.
- Exporte informes cuando necesite sustento para reuniones, citaciones o seguimiento institucional.
- Cierre sesion al terminar, especialmente en equipos compartidos.
