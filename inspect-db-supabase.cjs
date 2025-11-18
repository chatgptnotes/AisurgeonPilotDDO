const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('='.repeat(80));
  console.log('DATABASE SCHEMA INSPECTION VIA SUPABASE');
  console.log('='.repeat(80));
  console.log();

  // List of known tables from the types file
  const knownTables = [
    'labs',
    'radiology',
    'medications',
    'visit_labs',
    'visit_radiology',
    'visit_medications',
    'patients',
    'visits',
    'doctors',
    'appointments',
    'User',
    'users',
    'tenants'
  ];

  for (const tableName of knownTables) {
    console.log('─'.repeat(80));
    console.log(`TABLE: ${tableName}`);
    console.log('─'.repeat(80));

    try {
      // Try to get schema by querying the table
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        console.log();
        continue;
      }

      console.log(`  ✓ Table exists`);
      console.log(`  Row count: ${count || 0}`);

      if (data && data.length > 0) {
        console.log('\nColumns (detected from sample row):');
        const sampleRow = data[0];
        Object.entries(sampleRow).forEach(([key, value]) => {
          const type = value === null ? 'null' : typeof value;
          console.log(`  - ${key}: ${type} (value: ${JSON.stringify(value)})`);
        });
      } else {
        console.log('\n  No data in table - cannot infer columns from sample');

        // Try to insert a test row to see what columns are required
        console.log('  Attempting to query with empty filter to see column names...');
        const { data: emptyData, error: emptyError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        if (!emptyError && emptyData) {
          console.log('  Columns: (empty result, cannot determine)');
        }
      }

      console.log();

    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      console.log();
    }
  }

  console.log('='.repeat(80));
  console.log('ATTEMPTING DIRECT SQL QUERIES');
  console.log('='.repeat(80));
  console.log();

  // Try to get table list using RPC or SQL
  try {
    const { data, error } = await supabase.rpc('get_table_list');
    if (data) {
      console.log('Tables found via RPC:');
      console.log(data);
    } else if (error) {
      console.log('RPC not available:', error.message);
    }
  } catch (err) {
    console.log('Could not call RPC:', err.message);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('INSPECTION COMPLETE');
  console.log('='.repeat(80));
}

inspectSchema().catch(console.error);
