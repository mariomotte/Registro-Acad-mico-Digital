const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ebert@gmail.com',
    password: '940587021'
  });
  if (authError) {
    console.error(authError);
    return;
  }

  // Let's run a query to get function definition
  const { data, error } = await supabase.rpc('inspect_function_definition', {
    function_name: 'create_new_operator'
  });

  if (error) {
    console.error('RPC Error:', error.message);
  } else {
    console.log('Function definition:', data);
  }
}

run();
