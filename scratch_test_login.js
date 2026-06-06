const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'ebert@gmail.com';
  const password = '940587021';

  console.log(`Attempting to sign in user: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Sign in error:', error);
  } else {
    console.log('Sign in success. User:', data.user.id);
    
    // Now query public.users table as this authenticated user
    console.log('Querying public.users table as authenticated user...');
    const { data: profiles, error: profileErr } = await supabase
      .from('users')
      .select('*');
      
    if (profileErr) {
      console.error('Error fetching profiles:', profileErr);
    } else {
      console.log('Profiles found:', profiles);
    }
  }
}

run();
