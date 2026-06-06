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
      email: 'ebert@gmail.com',
      password: '940587021'
    });
    if (loginErr) throw loginErr;

    console.log('Trying insert with role Docente...');
    const { data: resDocente, error: errDocente } = await supabase
      .from('users')
      .insert([{ id: '00000000-0000-0000-0000-000000000002', email: 'test_docente@test.com', role: 'Docente', estado: 'Activo' }]);
    console.log('Result for Docente (capitalized):', { data: resDocente, error: errDocente });

    console.log('Trying insert with role docente (lowercase)...');
    const { data: resDocenteLower, error: errDocenteLower } = await supabase
      .from('users')
      .insert([{ id: '00000000-0000-0000-0000-000000000003', email: 'test_docente_lower@test.com', role: 'docente', estado: 'Activo' }]);
    console.log('Result for docente (lowercase):', { data: resDocenteLower, error: errDocenteLower });

    // Clean up if any insert succeeded
    await supabase.from('users').delete().in('email', ['test_docente@test.com', 'test_docente_lower@test.com']);
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
