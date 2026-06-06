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

    console.log('Logged in as admin successfully.');

    const { error: updateErr } = await supabase
      .from('users')
      .update({
        tutor_grado: '3ro Sec',
        tutor_seccion: 'A',
        tutor_nivel: 'Secundaria',
        tutor_anio_escolar: 2026
      })
      .eq('email', 'tutor@colegio.edu');
      
    if (updateErr) {
      console.error('Error updating user profile:', updateErr);
    } else {
      console.log('Successfully updated tutor@colegio.edu!');
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
