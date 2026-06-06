const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: incidents, error } = await supabase
    .from('incidencias')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching incidents:", error);
    process.exit(1);
  }

  if (incidents && incidents.length > 0) {
    console.log("Incidencia columns:", Object.keys(incidents[0]));
    console.log("Sample:", incidents[0]);
  } else {
    console.log("No incidents found in public.incidencias.");
  }
}

run();
