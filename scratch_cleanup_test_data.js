const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_INCIDENT_IDS = [
  'a0970cc3-c29a-4ac0-b306-ea219d9d352f',
  'dd0bdad5-5619-48d2-aa2a-f1ca3a5fa4a1',
  'ba2ecbf1-04ec-4347-86cd-38f9131abd46',
  '370b2614-5043-4a44-a08b-f12769cc3911',
  '1ab8ec2b-9a0f-4340-ac5f-139f03d4ec95',
  '40ce8cd4-e2bb-41c5-bd62-f9083f3da0e1',
  '25617237-36b3-4c53-853a-6bc5f3ea5072',
  'a29efe9e-6221-4283-ab37-262cd67aae83',
  'd25ec8ce-e714-4dcd-bc09-a82b31871d00',
  'e3074555-dca4-4c02-a40e-08ed096f621f'
];

async function run() {
  // 1. Authenticate
  console.log("Logging in as ebert@gmail.com...");
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'ebert@gmail.com',
    password: '940587021'
  });
  if (loginErr) { console.error("Login failed:", loginErr); process.exit(1); }

  // 2. Delete any alerts linked to these test incidents
  console.log("\n--- Deleting alerts linked to test incidents ---");
  const { data: deletedAlerts, error: alertErr } = await supabase
    .from('alertas')
    .delete()
    .in('incidencia_id', TEST_INCIDENT_IDS)
    .select('id, alumno_nombre, mensaje');

  if (alertErr) {
    console.error("Error deleting alerts:", alertErr);
  } else {
    console.log(`Deleted ${deletedAlerts?.length || 0} linked alert(s).`);
    if (deletedAlerts && deletedAlerts.length > 0) {
      deletedAlerts.forEach(a => console.log(`  - Alert ${a.id}: ${a.alumno_nombre} — ${a.mensaje?.substring(0, 60)}...`));
    }
  }

  // 3. Delete the 10 test incidents
  console.log("\n--- Deleting 10 test incidents ---");
  const { data: deletedIncidents, error: incErr } = await supabase
    .from('incidencias')
    .delete()
    .in('id', TEST_INCIDENT_IDS)
    .select('id, alumno_nombre, tipo');

  if (incErr) {
    console.error("Error deleting incidents:", incErr);
    process.exit(1);
  }

  console.log(`Deleted ${deletedIncidents?.length || 0} test incident(s):`);
  deletedIncidents?.forEach(i => console.log(`  - ${i.id} | ${i.alumno_nombre} | ${i.tipo}`));

  // 4. Verify: check that none of the 10 IDs still exist
  console.log("\n--- Verification: checking remaining test IDs ---");
  const { data: remaining, error: verifyErr } = await supabase
    .from('incidencias')
    .select('id')
    .in('id', TEST_INCIDENT_IDS);

  if (verifyErr) {
    console.error("Verification query error:", verifyErr);
  } else {
    if (remaining && remaining.length > 0) {
      console.error(`WARNING: ${remaining.length} test incident(s) still exist!`);
      remaining.forEach(r => console.error(`  - ${r.id}`));
    } else {
      console.log("✅ All 10 test incidents have been successfully deleted.");
    }
  }

  // 5. Verify alerts
  const { data: remainingAlerts } = await supabase
    .from('alertas')
    .select('id')
    .in('incidencia_id', TEST_INCIDENT_IDS);

  if (remainingAlerts && remainingAlerts.length > 0) {
    console.error(`WARNING: ${remainingAlerts.length} linked alert(s) still exist.`);
  } else {
    console.log("✅ No linked alerts remain in the system.");
  }

  console.log("\n--- Cleanup complete ---");
}

run();
