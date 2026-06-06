const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Logging in as ebert@gmail.com...");
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'ebert@gmail.com',
    password: '940587021'
  });

  if (loginErr) {
    console.error("Login failed:", loginErr);
    process.exit(1);
  }

  const registradorId = authData.user.id;
  const registradorName = "Ebert Subdirector";

  // Target students
  const students = {
    "1ro Sec": { id: 1, name: "Fernanda Daniela Pinto Mendoza", grado: "1°", seccion: "A" },
    "2do Sec": { id: 121, name: "Álvaro Mateo Rojas Núñez", grado: "2°", seccion: "A" },
    "3ro Sec": { id: 135, name: "Joaquín Aguilar Begazo", grado: "3ro Sec", seccion: "C" },
    "4to Sec": { id: 361, name: "Daniel Álvaro Chávez Begazo", grado: "4°", seccion: "A" },
    "5to Sec": { id: 481, name: "Camila Pinto Mendoza", grado: "5°", seccion: "A" }
  };

  const today = new Date();
  const formatOffsetDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  const formatOffsetDateTime = (offsetDays, hoursStr) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offsetDays);
    const [h, m, s] = hoursStr.split(':');
    d.setHours(parseInt(h), parseInt(m), parseInt(s), 0);
    return d.toISOString();
  };

  const incidentsToInsert = [
    // 1ro Sec: Fernanda Daniela Pinto Mendoza (ID 1) - 3 incidents in 15 days by DIFFERENT teachers -> Alta Priority
    {
      alumno_id: students["1ro Sec"].id,
      alumno_nombre: students["1ro Sec"].name,
      alumno_grado: students["1ro Sec"].grado,
      alumno_seccion: students["1ro Sec"].seccion,
      registrado_por: "Docente Juan Pérez",
      registrador_user_id: registradorId,
      tipo: "Tardanza",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Tardanza del estudiante en hora de ingreso.",
      fecha: formatOffsetDate(0),
      fecha_suceso: formatOffsetDateTime(0, "08:15:00")
    },
    {
      alumno_id: students["1ro Sec"].id,
      alumno_nombre: students["1ro Sec"].name,
      alumno_grado: students["1ro Sec"].grado,
      alumno_seccion: students["1ro Sec"].seccion,
      registrado_por: "Docente María Gómez",
      registrador_user_id: registradorId,
      tipo: "Inasistencia",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Inasistencia sin justificación médica.",
      fecha: formatOffsetDate(1),
      fecha_suceso: formatOffsetDateTime(1, "08:00:00")
    },
    {
      alumno_id: students["1ro Sec"].id,
      alumno_nombre: students["1ro Sec"].name,
      alumno_grado: students["1ro Sec"].grado,
      alumno_seccion: students["1ro Sec"].seccion,
      registrado_por: "Docente Carlos Rojas",
      registrador_user_id: registradorId,
      tipo: "Observación académica",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. No presentó las tareas escolares programadas.",
      fecha: formatOffsetDate(2),
      fecha_suceso: formatOffsetDateTime(2, "10:30:00")
    },

    // 2do Sec: Álvaro Mateo Rojas Núñez (ID 121) - 2 incidents same type (Tardanza) -> Media Priority
    {
      alumno_id: students["2do Sec"].id,
      alumno_nombre: students["2do Sec"].name,
      alumno_grado: students["2do Sec"].grado,
      alumno_seccion: students["2do Sec"].seccion,
      registrado_por: "Auxiliar Carlos Mendoza",
      registrador_user_id: registradorId,
      tipo: "Tardanza",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Llegó tarde por problemas de movilidad.",
      fecha: formatOffsetDate(0),
      fecha_suceso: formatOffsetDateTime(0, "08:10:00")
    },
    {
      alumno_id: students["2do Sec"].id,
      alumno_nombre: students["2do Sec"].name,
      alumno_grado: students["2do Sec"].grado,
      alumno_seccion: students["2do Sec"].seccion,
      registrado_por: "Auxiliar Carlos Mendoza",
      registrador_user_id: registradorId,
      tipo: "Tardanza",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Segunda tardanza en la semana.",
      fecha: formatOffsetDate(1),
      fecha_suceso: formatOffsetDateTime(1, "08:12:00")
    },

    // 3ro Sec: Joaquín Aguilar Begazo (ID 135) - 3 incidents same type (Tardanza) -> Alta Priority
    {
      alumno_id: students["3ro Sec"].id,
      alumno_nombre: students["3ro Sec"].name,
      alumno_grado: students["3ro Sec"].grado,
      alumno_seccion: students["3ro Sec"].seccion,
      registrado_por: "Auxiliar Carlos Mendoza",
      registrador_user_id: registradorId,
      tipo: "Tardanza",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Tardanza recurrente por la mañana.",
      fecha: formatOffsetDate(0),
      fecha_suceso: formatOffsetDateTime(0, "08:14:00")
    },
    {
      alumno_id: students["3ro Sec"].id,
      alumno_nombre: students["3ro Sec"].name,
      alumno_grado: students["3ro Sec"].grado,
      alumno_seccion: students["3ro Sec"].seccion,
      registrado_por: "Auxiliar Carlos Mendoza",
      registrador_user_id: registradorId,
      tipo: "Tardanza",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Segunda tardanza consecutiva.",
      fecha: formatOffsetDate(1),
      fecha_suceso: formatOffsetDateTime(1, "08:16:00")
    },
    {
      alumno_id: students["3ro Sec"].id,
      alumno_nombre: students["3ro Sec"].name,
      alumno_grado: students["3ro Sec"].grado,
      alumno_seccion: students["3ro Sec"].seccion,
      registrado_por: "Auxiliar Carlos Mendoza",
      registrador_user_id: registradorId,
      tipo: "Tardanza",
      severidad: "bajo",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Tercera tardanza acumulada.",
      fecha: formatOffsetDate(2),
      fecha_suceso: formatOffsetDateTime(2, "08:20:00")
    },

    // 4to Sec: Daniel Álvaro Chávez Begazo (ID 361) - 1 severe incident -> Alta Priority
    {
      alumno_id: students["4to Sec"].id,
      alumno_nombre: students["4to Sec"].name,
      alumno_grado: students["4to Sec"].grado,
      alumno_seccion: students["4to Sec"].seccion,
      registrado_por: "Docente Juan Pérez",
      registrador_user_id: registradorId,
      tipo: "Problema de comportamiento",
      severidad: "grave",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Incidente grave de indisciplina en el salón de clase.",
      fecha: formatOffsetDate(0),
      fecha_suceso: formatOffsetDateTime(0, "11:45:00")
    },

    // 5to Sec: Camila Pinto Mendoza (ID 481) - 1 moderate incident -> Media Priority
    {
      alumno_id: students["5to Sec"].id,
      alumno_nombre: students["5to Sec"].name,
      alumno_grado: students["5to Sec"].grado,
      alumno_seccion: students["5to Sec"].seccion,
      registrado_por: "Docente Juan Pérez",
      registrador_user_id: registradorId,
      tipo: "Conflicto entre alumnos",
      severidad: "moderada",
      descripcion: "[PRUEBA DEL SISTEMA] No corresponde a un hecho real. Conflicto moderado de opinión entre compañeros durante trabajo grupal.",
      fecha: formatOffsetDate(0),
      fecha_suceso: formatOffsetDateTime(0, "14:15:00")
    }
  ];

  console.log(`Inserting ${incidentsToInsert.length} test incidents...`);
  
  const { data, error } = await supabase
    .from('incidencias')
    .insert(incidentsToInsert)
    .select('id, alumno_nombre, tipo, severidad, fecha');

  if (error) {
    console.error("Error inserting incidents:", error);
    process.exit(1);
  }

  console.log("Incidents inserted successfully!");
  console.log(JSON.stringify(data, null, 2));
}

run();
