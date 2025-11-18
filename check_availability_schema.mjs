import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qfneoowktsirwpzehgxp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ'
);

console.log('='.repeat(80));
console.log('CHECKING doctor_availability TABLE');
console.log('='.repeat(80));

// Check if table exists
const { data, error, count } = await supabase
  .from('doctor_availability')
  .select('*', { count: 'exact' })
  .limit(5);

if (error) {
  console.log('\n❌ Error accessing table:', error.message);
  console.log('Code:', error.code);
  console.log('\nTable may not exist yet.');
} else {
  console.log('\n✅ Table EXISTS');
  console.log('📊 Total rows:', count);

  if (data && data.length > 0) {
    console.log('\n📋 Columns found:');
    const columns = Object.keys(data[0]);
    columns.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col}`);
    });

    console.log('\n📊 Sample row:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('\n⚠️  Table is empty (no rows to inspect columns)');
    console.log('   Cannot determine existing columns from data');
  }
}

console.log('\n' + '='.repeat(80));
