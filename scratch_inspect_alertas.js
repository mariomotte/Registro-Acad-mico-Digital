const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Logging in...');
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'ebert@gmail.com',
      password: '940587021'
    });
    if (loginErr) throw loginErr;

    console.log('--- INSPECTING ALERTAS ---');
    const { data: alerts, error: alertsErr } = await supabase
      .from('alertas')
      .select('*')
      .limit(3);
      
    if (alertsErr) {
      console.error('Error fetching alerts:', alertsErr);
    } else {
      console.log('Alertas rows:', alerts);
    }
  } catch (e) {
    console.error('Exception occurred:', e);
  }
}

run();
