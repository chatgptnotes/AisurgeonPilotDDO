import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qfneoowktsirwpzehgxp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ'
);

async function getTableStructure(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return Object.keys(data[0]);
}

async function inspectSchema() {
  console.log('='.repeat(80));
  console.log('DATABASE SCHEMA INSPECTION - FULL DETAILS');
  console.log('='.repeat(80));

  const tables = ['patients', 'visits', 'User', 'appointments', 'doctors', 'medications', 'visit_medications'];

  for (const tableName of tables) {
    const { error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`\n${tableName.toUpperCase()} TABLE:`);
    console.log('-'.repeat(80));

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      continue;
    }

    console.log(`   ✅ Exists`);
    console.log(`   📊 Row count: ${count || 0}`);

    const columns = await getTableStructure(tableName);
    if (columns) {
      console.log(`   📋 Columns (${columns.length}):`);
      columns.forEach((col, i) => {
        console.log(`      ${i + 1}. ${col}`);
      });
    }
  }

  // Check tenants table separately
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')
    .limit(1);

  console.log(`\nTENANTS TABLE:`);
  console.log('-'.repeat(80));
  if (tenantsError) {
    console.log('   ❌ Does not exist - NEEDS TO BE CREATED');
  } else {
    console.log('   ✅ Exists');
    console.log('   📊 Sample:', tenants);
  }

  console.log('\n' + '='.repeat(80));
  console.log('INSPECTION COMPLETE');
  console.log('='.repeat(80));
}

inspectSchema().catch(console.error);
