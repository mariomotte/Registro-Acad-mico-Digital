const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Login
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'ebert@gmail.com',
    password: '940587021'
  });
  if (loginErr) { console.error("Login FAILED:", loginErr); process.exit(1); }
  console.log("✅ Login successful. auth.users ID:", authData.user.id);

  // Check profile
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, estado')
    .eq('email', 'ebert@gmail.com')
    .single();

  if (profileErr) { console.error("Profile fetch error:", profileErr); process.exit(1); }

  console.log("\n✅ public.users profile:");
  console.log(`   ID:       ${profile.id}`);
  console.log(`   Email:    ${profile.email}`);
  console.log(`   Nombre:   ${profile.first_name} ${profile.last_name}`);
  console.log(`   Role:     ${profile.role}`);
  console.log(`   Estado:   ${profile.estado}`);

  // Verify role mapping
  const roleMap = { 'Superusuario': 'admin', 'Director': 'director', 'Subdirector': 'subdirector' };
  const frontendRole = roleMap[profile.role] || profile.role.toLowerCase();
  console.log(`\n   Frontend role mapping: '${profile.role}' → '${frontendRole}'`);

  // Check access
  const accessibleRoutes = ['/dashboard', '/students', '/incidents', '/alerts', '/dashboard/reportes', '/users'];
  const adminAccessible = frontendRole === 'admin';
  console.log(`\n✅ Acceso a rutas como Superusuario (admin): ${adminAccessible ? 'SÍ' : 'NO'}`);
  if (adminAccessible) {
    accessibleRoutes.forEach(r => console.log(`   ${r} → ✅`));
  }
}

run();
