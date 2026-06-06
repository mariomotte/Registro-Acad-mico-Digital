const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'ebert@gmail.com',
    password: '940587021'
  });
  if (loginErr) { console.error(loginErr); process.exit(1); }

  // Fetch all distinct roles from public.users
  const { data, error } = await supabase
    .from('users')
    .select('role');

  if (error) { console.error(error); process.exit(1); }

  const roles = new Set(data.map(u => u.role));
  console.log("Distinct roles in public.users:", [...roles]);

  // Try different capitalizations
  const attempts = ['admin', 'Admin', 'Superusuario', 'superusuario'];
  for (const attempt of attempts) {
    console.log(`\nTrying role = '${attempt}'...`);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ role: attempt })
      .eq('email', 'ebert@gmail.com');

    if (updateErr) {
      console.log(`  ❌ Failed: ${updateErr.message}`);
    } else {
      console.log(`  ✅ Success with: '${attempt}'`);
      // Verify
      const { data: check } = await supabase
        .from('users')
        .select('role')
        .eq('email', 'ebert@gmail.com')
        .single();
      console.log(`  Verified role: '${check?.role}'`);
      break;
    }
  }
}

run();
