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

    // Fetch the user ID of juan@gmail.com
    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'juan@gmail.com');

    if (fetchErr || !users || users.length === 0) {
      console.error('User juan@gmail.com not found:', fetchErr);
      return;
    }

    const userId = users[0].id;
    console.log(`User ID for juan@gmail.com: ${userId}. Updating to Director...`);

    const { data, error } = await supabase.rpc('update_operator', {
      p_user_id: userId,
      p_email: 'juan@gmail.com',
      p_first_name: 'Juan',
      p_last_name: 'Director',
      p_role: 'Director',
      p_password: 'password123'
    });

    if (error) {
      console.error('Error updating user:', error);
    } else {
      console.log('Successfully configured juan@gmail.com as Director!', data);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
