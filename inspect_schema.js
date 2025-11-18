#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qfneoowktsirwpzehgxp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ4MTA4NywiZXhwIjoyMDc3MDU3MDg3fQ.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ'
);

async function inspectSchema() {
  console.log('Inspecting database schema...\n');

  // Check patients table columns
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'patients'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    // Try alternative method
    const { data: patientsData, error: error2 } = await supabase
      .from('patients')
      .select('*')
      .limit(0);

    if (error2) {
      console.log('Error:', error2.message);
    } else {
      console.log('Patients table exists but is empty or RLS is blocking');
    }
  } else {
    console.log('Patients table columns:', data);
  }

  // Check if tenants table exists
  const { data: tenantsCheck } = await supabase
    .from('tenants')
    .select('*')
    .limit(1);

  console.log('\nTenants table exists:', tenantsCheck !== null);
}

inspectSchema().catch(console.error);
