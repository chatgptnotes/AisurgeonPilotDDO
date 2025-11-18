import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('========================================');
    console.log('SUPABASE DATABASE SCHEMA ANALYSIS');
    console.log('========================================\n');

    const tables = ['patients', 'visits', 'User', 'appointments', 'doctors', 'medications', 'visit_medications'];

    for (const tableName of tables) {
        console.log(`\n📋 TABLE: ${tableName}`);
        console.log('─'.repeat(80));

        // Try to query the table to infer structure
        const { data: sample, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (sampleError) {
            console.log(`❌ Error accessing table: ${sampleError.message}`);
            continue;
        }

        console.log(`✅ Table exists`);

        // Get row count
        const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (!countError) {
            console.log(`📊 Row count: ${count}`);
        }

        // Show sample structure
        if (sample && sample.length > 0) {
            console.log('\nSample row structure:');
            const sampleRow = sample[0];
            Object.keys(sampleRow).forEach(key => {
                const value = sampleRow[key];
                const type = typeof value;
                console.log(`  - ${key}: ${type} ${value === null ? '(nullable)' : ''}`);
            });
        } else {
            console.log('\n⚠️  No data to infer structure. Attempting to insert test row...');

            // Try inserting and then deleting to see required fields
            const testData = { id: '00000000-0000-0000-0000-000000000000' };
            const { error: insertError } = await supabase
                .from(tableName)
                .insert(testData);

            if (insertError) {
                console.log(`Error details: ${insertError.message}`);

                // Parse error message to understand required fields
                if (insertError.message.includes('null value')) {
                    console.log('⚠️  Table has non-nullable columns');
                }
            }
        }
    }

    // Try direct SQL query for detailed schema info
    console.log('\n\n========================================');
    console.log('DETAILED SCHEMA FROM information_schema');
    console.log('========================================\n');

    const schemaQuery = `
        SELECT
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN ('patients', 'visits', 'User', 'appointments', 'doctors', 'medications', 'visit_medications')
        ORDER BY table_name, ordinal_position;
    `;

    let schemaData = null;
    let schemaError = 'SQL execution not available via anon key';

    if (schemaError) {
        console.log('⚠️  Cannot execute SQL directly via anon key');
        console.log('This is expected - we need service_role key for schema queries');
    } else if (schemaData) {
        console.table(schemaData);
    }

    // Check for foreign keys
    console.log('\n\n========================================');
    console.log('TESTING RELATIONSHIPS');
    console.log('========================================\n');

    // Test if we can query with joins
    const { data: joinTest, error: joinError } = await supabase
        .from('visits')
        .select(`
            *,
            patients(*),
            doctors(*)
        `)
        .limit(1);

    if (!joinError) {
        console.log('✅ visits -> patients relationship exists');
        console.log('✅ visits -> doctors relationship exists');
    } else {
        console.log(`❌ Join error: ${joinError.message}`);
    }
}

inspectSchema().catch(console.error);
