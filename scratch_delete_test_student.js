const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Logging in to delete test student...');
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'ebert@gmail.com',
      password: '940587021'
    });
    if (loginErr) throw loginErr;

    // 1. Find the student
    console.log('Finding student "Carlos Hugo Flores Ruiz"...');
    const { data: students, error: findErr } = await supabase
      .from('alumnos')
      .select('id')
      .eq('nombres', 'Carlos Hugo')
      .eq('apellidos', 'Flores Ruiz');

    if (findErr) throw findErr;
    if (!students || students.length === 0) {
      console.log('No test student found with name "Carlos Hugo Flores Ruiz".');
      return;
    }

    for (const student of students) {
      const studentId = student.id;
      console.log(`Found student ID: ${studentId}`);

      // Delete alerts
      console.log('Deleting alerts...');
      const { error: alertErr } = await supabase
        .from('alertas')
        .delete()
        .eq('alumno_id', studentId);
      if (alertErr) console.error('Error deleting alerts:', alertErr);

      // Delete incidents
      console.log('Deleting incidents...');
      const { error: incidentErr } = await supabase
        .from('incidencias')
        .delete()
        .eq('alumno_id', studentId);
      if (incidentErr) console.error('Error deleting incidents:', incidentErr);

      // Delete student
      console.log('Deleting student...');
      const { error: studentErr } = await supabase
        .from('alumnos')
        .delete()
        .eq('id', studentId);
      if (studentErr) {
        console.error('Error deleting student:', studentErr);
      } else {
        console.log(`Successfully deleted student with ID: ${studentId}`);
      }
    }
  } catch (e) {
    console.error('Exception occurred:', e);
  }
}

run();
