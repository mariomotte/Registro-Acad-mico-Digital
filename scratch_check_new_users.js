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

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .in('email', ['tutor@colegio.edu', 'docente@colegio.edu']);
      
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('Users found:', users);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
