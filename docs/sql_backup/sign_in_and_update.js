const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Iniciando sesión como ebert@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ebert@gmail.com',
    password: '940587021'
  });

  if (authError) {
    console.error('Error al iniciar sesión:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('Sesión iniciada con éxito. ID de Usuario:', userId);

  console.log('Intentando actualizar el rol a Superusuario...');
  const { data: updateData, error: updateError } = await supabase
    .from('users')
    .update({ role: 'Superusuario' })
    .eq('id', userId)
    .select();

  if (updateError) {
    console.error('Error de base de datos al actualizar el rol:', updateError.message);
  } else if (updateData && updateData.length > 0) {
    console.log('¡Éxito! Rol de ebert@gmail.com actualizado a:', updateData[0].role);
  } else {
    console.log('La base de datos devolvió un resultado vacío. Es posible que las políticas RLS estén bloqueando la actualización directa por el cliente.');
    
    // Intentemos insertar el registro de perfil por si acaso no se creó debido a un trigger fallido
    console.log('Intentando insertar el perfil directamente por si no existía...');
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'ebert@gmail.com',
        first_name: 'Ebert',
        last_name: 'Super',
        role: 'Superusuario',
        estado: 'Activo'
      })
      .select();
      
    if (insertError) {
      console.error('Error al insertar el perfil:', insertError.message);
    } else {
      console.log('¡Perfil insertado con éxito con rol Superusuario!', insertData);
    }
  }
}

run();
