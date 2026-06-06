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
      .select('grado');
      
    if (error) {
      console.error('Error:', error);
    } else {
      const counts = {};
      alumnos.forEach(a => {
        counts[a.grado] = (counts[a.grado] || 0) + 1;
      });
      console.log('Student count per grade:', counts);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
