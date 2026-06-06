const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'admin@colegio.edu',
      password: 'password123'
    });
    if (loginErr) throw loginErr;

    console.log('Logged in as admin successfully.');

    // 1. Delete old test alerts if any to keep database clean
    await supabase.from('alertas').delete().like('mensaje', '%(tutoría 1ro Sec A)%');
    await supabase.from('alertas').delete().like('mensaje', '%(no pertenece a tu tutoría)%');

    const { data: std } = await supabase.from('alumnos').select('id').eq('nombres', 'Juan Carlos Editado').single();
    console.log('Juan Carlos ID:', std?.id);

    const { data: stdF } = await supabase.from('alumnos').select('id').eq('nombres', 'Fernanda Daniela').single();
    console.log('Fernanda ID:', stdF?.id);

    if (std && stdF) {
      const { data, error } = await supabase
        .from('alertas')
        .insert([
          {
            alumno_id: std.id,
            alumno_nombre: 'Juan Carlos Editado Cruz López',
            tipo: 'Recurrencia',
            mensaje: 'Alerta de prueba (tutoría 1ro Sec A).',
            nivel: 'amarillo',
            estado: 'activa',
            leido: false,
            fecha: new Date().toISOString().split('T')[0]
          },
          {
            alumno_id: stdF.id,
            alumno_nombre: 'Fernanda Daniela Pinto Mendoza',
            tipo: 'Recurrencia',
            mensaje: 'Alerta de prueba (no pertenece a tu tutoría).',
            nivel: 'rojo',
            estado: 'activa',
            leido: false,
            fecha: new Date().toISOString().split('T')[0]
          }
        ]);
        
      if (error) {
        console.error('Error inserting alerts:', error);
      } else {
        console.log('Test alerts inserted successfully!');
      }
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
