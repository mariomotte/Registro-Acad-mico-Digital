const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function run() {
  try {
    console.log('Logging in...');
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'ebert@gmail.com',
      password: '940587021'
    });
    if (loginErr) throw loginErr;

    console.log('Logged in. Creating subscription...');
    let eventReceived = false;

    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas'
        },
        (payload) => {
          console.log('REALTIME EVENT RECEIVED:', payload);
          eventReceived = true;
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed! Performing test insert...');
          triggerInsert();
        }
      });

    async function triggerInsert() {
      // Get a student id
      const { data: students, error: studErr } = await supabase.from('alumnos').select('id, nombres, apellidos').limit(1);
      if (studErr) {
        console.error('Error getting student:', studErr.message);
        return;
      }
      if (!students || students.length === 0) {
        console.error('No students found to link test alert');
        return;
      }

      const student = students[0];
      console.log(`Using student: ${student.nombres} ${student.apellidos} (ID: ${student.id})`);

      const { data: inserted, error: insertErr } = await supabase
        .from('alertas')
        .insert({
          alumno_id: student.id,
          alumno_nombre: `${student.nombres} ${student.apellidos}`,
          tipo: 'Test',
          nivel: 'verde',
          mensaje: 'TEST REALTIME INSERTED ALERT',
          leido: false,
          fecha: new Date().toISOString()
        })
        .select();

      if (insertErr) {
        console.error('Insert failed:', insertErr.message);
      } else {
        console.log('Insert successful, alert ID:', inserted[0].id);
        
        // Wait and clean up
        setTimeout(async () => {
          console.log('Cleaning up test alert...');
          const { error: deleteErr } = await supabase.from('alertas').delete().eq('id', inserted[0].id);
          if (deleteErr) {
            console.error('Error deleting test alert:', deleteErr.message);
          } else {
            console.log('Clean up successful.');
          }

          if (eventReceived) {
            console.log('\n--- SUCCESS: SUPABASE REALTIME IS ENABLED AND WORKED PERFECTLY! ---');
          } else {
            console.log('\n--- FAILURE: DID NOT RECEIVE REALTIME INSERT EVENT. REALTIME MAY BE DISABLED FOR THIS TABLE. ---');
          }
          
          supabase.removeChannel(channel);
          process.exit(0);
        }, 3000);
      }
    }
  } catch (e) {
    console.error('Exception occurred:', e);
    process.exit(1);
  }
}

run();
