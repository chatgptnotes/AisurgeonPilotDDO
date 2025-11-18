import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.cqakmqufgcxfrrbeamfj',
  password: '5$PgBCWE$aPS2Cm',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Get patients table columns
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'patients'
      ORDER BY ordinal_position;
    `);

    console.log('PATIENTS TABLE COLUMNS:');
    console.log('======================\n');
    result.rows.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- REQUIRED' : ''}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
