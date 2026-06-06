const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'admin@colegio.edu',
      password: 'password123'
    });
    if (loginErr) throw loginErr;

    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select('id, nombres, apellidos, grado, seccion')
      .eq('grado', '1ro Sec');
      
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      console.log('Students in 1ro Sec:', alumnos);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
