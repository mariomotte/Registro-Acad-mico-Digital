const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const userId = '0a7e5913-b6b3-459f-8193-b9eb9f6963db';
  console.log(`Updating user ${userId} to role Subdirector...`);
  const { data, error } = await supabase.rpc('update_operator', {
    p_user_id: userId,
    p_email: 'ebert@gmail.com',
    p_first_name: 'Prueba 4',
    p_last_name: 'Motte',
    p_role: 'Subdirector'
  });

  if (error) {
    console.error('Error updating role:', error);
  } else {
    console.log('Role updated successfully:', data);
  }
}

run();
