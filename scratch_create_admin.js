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

  console.log(`Attempting to sign up user: ${email}`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Sign up error:', error);
  } else {
    console.log('Sign up success:', data);
    
    // Let's also check if user was added to public.users table
    console.log('Checking public.users table...');
    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
      
    if (fetchErr) {
      console.error('Error fetching users:', fetchErr);
    } else {
      console.log('User in public.users:', users);
      if (users.length > 0 && users[0].role !== 'admin') {
        console.log('Updating user role to admin...');
        const { error: updateErr } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('email', email);
        if (updateErr) {
          console.error('Update role error:', updateErr);
        } else {
          console.log('Successfully updated role to admin!');
        }
      }
    }
  }
}

run();
