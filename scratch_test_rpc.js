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

    console.log('Logged in successfully');

    const { data, error } = await supabase.rpc('inspect_function_definition', {
      function_name: 'create_new_operator'
    });

    console.log('RPC result:', data);
    if (error) console.error('RPC Error:', error);
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
