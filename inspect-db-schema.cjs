const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qfneoowktsirwpzehgxp',
  password: '5$PgBCWE$aPS2Cm',
  ssl: {
    rejectUnauthorized: false
  }
});

async function inspectSchema() {
  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL database\n');
    console.log('='.repeat(80));
    console.log('DATABASE SCHEMA INSPECTION');
    console.log('='.repeat(80));
    console.log();

    // Get all tables in public schema
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`Found ${tablesResult.rows.length} tables in public schema:\n`);

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      console.log('─'.repeat(80));
      console.log(`TABLE: ${tableName}`);
      console.log('─'.repeat(80));

      // Get columns with detailed info
      const columnsResult = await client.query(`
        SELECT
          c.column_name,
          c.data_type,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          c.is_nullable,
          c.column_default,
          c.udt_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        AND c.table_name = $1
        ORDER BY c.ordinal_position;
      `, [tableName]);

      console.log('\nColumns:');
      for (const col of columnsResult.rows) {
        let type = col.data_type;
        if (col.character_maximum_length) {
          type += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          type += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
        }

        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? `[default: ${col.column_default}]` : '';

        console.log(`  - ${col.column_name}: ${type} (${nullable}) ${defaultVal}`);
      }

      // Get primary keys
      const pkResult = await client.query(`
        SELECT a.attname as column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary;
      `, [tableName]);

      if (pkResult.rows.length > 0) {
        console.log('\nPrimary Key(s):');
        pkResult.rows.forEach(row => {
          console.log(`  - ${row.column_name}`);
        });
      }

      // Get foreign keys
      const fkResult = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1;
      `, [tableName]);

      if (fkResult.rows.length > 0) {
        console.log('\nForeign Keys:');
        fkResult.rows.forEach(row => {
          console.log(`  - ${row.column_name} -> ${row.foreign_table_name}(${row.foreign_column_name}) [${row.constraint_name}]`);
        });
      }

      // Get indexes
      const idxResult = await client.query(`
        SELECT
          i.relname as index_name,
          array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as column_names,
          ix.indisunique as is_unique
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
        AND t.relname = $1
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        GROUP BY i.relname, ix.indisunique
        ORDER BY i.relname;
      `, [tableName]);

      if (idxResult.rows.length > 0) {
        console.log('\nIndexes:');
        idxResult.rows.forEach(row => {
          const uniqueStr = row.is_unique ? ' (UNIQUE)' : '';
          console.log(`  - ${row.index_name} on (${row.column_names.join(', ')})${uniqueStr}`);
        });
      }

      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`\nRow count: ${countResult.rows[0].count}`);

      console.log();
    }

    console.log('='.repeat(80));
    console.log('INSPECTION COMPLETE');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}

inspectSchema();
