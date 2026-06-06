const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: alumnos, error } = await supabase
    .from('alumnos')
    .select('id, nombres, apellidos, grado, seccion, nivel')
    .eq('nivel', 'Secundaria');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const grades = ["1°", "2°", "3°", "4°", "5°", "1ro Sec", "2do Sec", "3ro Sec", "4to Sec", "5to Sec"];
  const selected = {};

  alumnos.forEach(al => {
    // Standardize key
    let gKey = al.grado;
    if (gKey.includes("1")) gKey = "1ro Sec";
    if (gKey.includes("2")) gKey = "2do Sec";
    if (gKey.includes("3")) gKey = "3ro Sec";
    if (gKey.includes("4")) gKey = "4to Sec";
    if (gKey.includes("5")) gKey = "5to Sec";

    if (!selected[gKey]) {
      selected[gKey] = al;
    }
  });

  console.log(JSON.stringify(selected, null, 2));
}

run();
