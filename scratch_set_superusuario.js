const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // 1. Verify auth login works (proves user exists in auth.users)
  console.log("1. Verifying auth.users: logging in as ebert@gmail.com...");
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'ebert@gmail.com',
    password: '940587021'
  });
  if (loginErr) {
    console.error("Login FAILED — user may not exist in auth.users:", loginErr);
    process.exit(1);
  }
  console.log("   ✅ auth.users: exists. ID =", authData.user.id);

  // 2. Check public.users
  console.log("\n2. Checking public.users for ebert@gmail.com...");
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, estado')
    .eq('email', 'ebert@gmail.com')
    .maybeSingle();

  if (profileErr) {
    console.error("   Error querying public.users:", profileErr);
  } else if (profile) {
    console.log("   ✅ public.users: exists.");
    console.log("   Current profile:", JSON.stringify(profile, null, 2));
  } else {
    console.log("   ❌ public.users: NOT found. Will need to create.");
  }

  // 3. Update role to 'admin' (Superusuario)
  if (profile) {
    console.log("\n3. Updating role to 'admin' and estado to 'Activo'...");
    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ role: 'admin', estado: 'Activo' })
      .eq('id', profile.id)
      .select('id, email, role, estado');

    if (updateErr) {
      console.error("   Update FAILED:", updateErr);
    } else {
      console.log("   ✅ Updated successfully:", JSON.stringify(updated, null, 2));
    }
  } else {
    console.log("\n3. Creating profile in public.users...");
    const { data: created, error: createErr } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'ebert@gmail.com',
        first_name: 'Ebert',
        last_name: '',
        role: 'admin',
        estado: 'Activo'
      })
      .select('id, email, role, estado');

    if (createErr) {
      console.error("   Create FAILED:", createErr);
    } else {
      console.log("   ✅ Created successfully:", JSON.stringify(created, null, 2));
    }
  }

  // 4. Final verification
  console.log("\n4. Final verification...");
  const { data: final } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, estado')
    .eq('email', 'ebert@gmail.com')
    .single();
  console.log("   Final profile:", JSON.stringify(final, null, 2));
}

run();
