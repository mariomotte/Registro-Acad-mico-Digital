const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'ebert@gmail.com',
      password: '940587021'
    });
    if (loginErr) throw loginErr;

    const token = authData.session.access_token;
    
    const url = `${supabaseUrl}/rest/v1/`;
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log('Exposed definitions for authenticated user:', Object.keys(data.definitions || {}));
    if (data.definitions?.users) {
      console.log('Users schema definition:', data.definitions.users.properties);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
