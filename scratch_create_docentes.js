const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDocente(email, password, firstName, lastName, tutorGrado, tutorSeccion) {
  console.log(`\nCalling RPC create_new_operator for: ${email}...`);
  
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_new_operator', {
    p_email: email,
    p_password: password,
    p_first_name: firstName,
    p_last_name: lastName,
    p_role: 'Docente'
  });

  if (rpcError) {
    console.error('RPC Error:', rpcError);
    return;
  }

  const res = rpcData;
  if (res && !res.success) {
    if (res.error && res.error.includes('already exists')) {
      console.log(`User ${email} already exists.`);
    } else {
      console.error('RPC failed:', res.error);
      return;
    }
  }

  // Fetch the user by email in public.users to get their ID
  const { data: users, error: fetchErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', email);

  if (fetchErr || !users || users.length === 0) {
    console.error('User not found in public.users:', fetchErr);
    return;
  }

  const userId = users[0].id;
  console.log(`User ID in public.users: ${userId}. Updating profile...`);

  // Update role and tutoría fields
  const updateData = {
    role: 'Docente',
    first_name: firstName,
    last_name: lastName,
    tutor_grado: tutorGrado || null,
    tutor_seccion: tutorSeccion || null,
    tutor_nivel: tutorGrado ? 'Secundaria' : null,
    tutor_anio_escolar: tutorGrado ? 2026 : null
  };

  const { error: updateErr } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (updateErr) {
    console.error('Error updating user profile:', updateErr);
  } else {
    console.log(`Successfully configured ${email} as Docente tutor!`);
  }
}

async function run() {
  // 1. Docente con tutoría: 3ro Sec "A"
  await createDocente('tutor@colegio.edu', 'password123', 'Tutor', 'Docente', '3ro Sec', 'A');
  
  // 2. Docente sin tutoría
  await createDocente('docente@colegio.edu', 'password123', 'Simple', 'Docente', null, null);
}

run();
