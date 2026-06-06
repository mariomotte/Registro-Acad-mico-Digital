const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Logging in as Auxiliar...');
    const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'pedro@gmail.com',
      password: '940587021'
    });
    if (loginErr) {
      console.error('Login failed:', loginErr.message);
      return;
    }

    console.log('Logged in user profile:', authData.user.email);

    // Get an unread alert
    const { data: alerts, error: fetchErr } = await supabase
      .from('alertas')
      .select('id, leido')
      .eq('leido', false)
      .limit(1);

    if (fetchErr) {
      console.error('Error fetching alerts:', fetchErr.message);
      return;
    }

    if (!alerts || alerts.length === 0) {
      console.log('No unread alerts found to test.');
      return;
    }

    const testAlertId = alerts[0].id;
    console.log(`Found unread alert ID: ${testAlertId}`);

    // Try to update it to true
    const { data: updateData, error: updateErr } = await supabase
      .from('alertas')
      .update({ leido: true })
      .eq('id', testAlertId)
      .select();

    if (updateErr) {
      console.error('UPDATE FAILED! RLS might be blocking it:', updateErr.message);
    } else {
      console.log('UPDATE SUCCESSFUL! RLS allows update:', updateData);
      
      // Restore it back to false
      await supabase
        .from('alertas')
        .update({ leido: false })
        .eq('id', testAlertId);
    }
  } catch (e) {
    console.error('Exception occurred:', e);
  }
}

run();
