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
      email: 'ebert@gmail.com',
      password: '940587021'
    });
    if (loginErr) throw loginErr;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('User keys:', Object.keys(users[0]));
      console.log('User sample:', users[0]);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
