const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: alumnos, error } = await supabase
    .from('alumnos')
    .select('id, nombres, apellidos, grado, seccion, nivel, estado')
    .order('grado', { ascending: true });

  if (error) {
    console.error("Error fetching alumnos:", error);
    process.exit(1);
  }

  console.log("Alumnos count:", alumnos.length);
  console.log(JSON.stringify(alumnos, null, 2));
}

run();
