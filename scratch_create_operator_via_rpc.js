const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'admin@colegio.edu';
  const password = 'password123';

  console.log(`Calling RPC create_new_operator for: ${email}`);
  const { data, error } = await supabase.rpc('create_new_operator', {
    p_email: email,
    p_password: password,
    p_first_name: 'Admin',
    p_last_name: 'Test',
    p_role: 'Superusuario' // This matches the database enum value for admin
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
    
    // Check public.users again
    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
      
    if (fetchErr) {
      console.error('Error fetching users:', fetchErr);
    } else {
      console.log('User in public.users:', users);
    }
  }
}

run();
