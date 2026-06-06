const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Intentando actualizar rol de ebert@gmail.com a Superusuario...');
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'Superusuario' })
    .eq('email', 'ebert@gmail.com')
    .select();

  if (error) {
    console.error('Error al actualizar el rol:', error);
  } else {
    console.log('¡Actualización Exitosa! Datos actualizados:', data);
  }
}

run();
