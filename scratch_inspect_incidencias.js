const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Logging in to inspect incidencias table...');
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'ebert@gmail.com',
      password: '940587021'
    });
    if (loginErr) throw loginErr;

    console.log('--- INSPECTING INCIDENCIAS COLUMNS ---');
    const { data: incidencias, error: incidenciasErr } = await supabase
      .from('incidencias')
      .select('fecha_suceso')
      .limit(1);
      
    if (incidenciasErr) {
      console.error('Error fetching incidencias:', incidenciasErr);
    } else {
      console.log('Incidencias row keys/data:', incidencias?.[0]);
    }
  } catch (e) {
    console.error('Exception occurred:', e);
  }
}

run();
