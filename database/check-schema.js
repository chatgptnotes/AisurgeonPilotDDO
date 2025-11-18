import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemaStructure() {
    console.log('\n========================================');
    console.log('COMPLETE DATABASE SCHEMA INSPECTION');
    console.log('========================================\n');

    // Test all known tables
    const knownTables = [
        'patients',
        'visits',
        'User',
        'appointments',
        'doctors',
        'medications',
        'visit_medications',
        'labs',
        'radiology',
        'visit_labs',
        'visit_radiology',
        'tenants',
        'tenant_users',
        'patient_users',
        'notifications',
        'doctor_availability'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of knownTables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ ${table.padEnd(25)} - NOT FOUND or NO ACCESS`);
            console.log(`   Error: ${error.message}\n`);
            missingTables.push(table);
        } else {
            console.log(`✅ ${table.padEnd(25)} - EXISTS (${count} rows)`);
            existingTables.push({ table, count });
        }
    }

    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Tables found: ${existingTables.length}`);
    console.log(`Tables missing/inaccessible: ${missingTables.length}\n`);

    if (existingTables.length > 0) {
        console.log('EXISTING TABLES:');
        existingTables.forEach(({ table, count }) => {
            console.log(`  - ${table} (${count} rows)`);
        });
    }

    if (missingTables.length > 0) {
        console.log('\nMISSING/INACCESSIBLE TABLES:');
        missingTables.forEach(table => {
            console.log(`  - ${table}`);
        });
    }

    // Now let's try to infer structure from existing tables with data
    console.log('\n========================================');
    console.log('DETAILED STRUCTURE ANALYSIS');
    console.log('========================================\n');

    for (const { table, count } of existingTables) {
        console.log(`\n📊 TABLE: ${table}`);
        console.log('─'.repeat(80));

        // Try to get one row to infer structure
        const { data: sample, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error || !sample || sample.length === 0) {
            console.log('No sample data available to infer structure\n');
            continue;
        }

        const row = sample[0];
        console.log('Columns:');
        Object.entries(row).forEach(([column, value]) => {
            let inferredType = typeof value;
            if (value === null) {
                inferredType = 'unknown (null)';
            } else if (value instanceof Date) {
                inferredType = 'timestamp';
            } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                inferredType = 'date/timestamp';
            } else if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                inferredType = 'uuid';
            }

            console.log(`  - ${column.padEnd(35)} : ${inferredType}`);
        });
    }

    // Check for tenant_id columns
    console.log('\n========================================');
    console.log('MULTI-TENANT READINESS CHECK');
    console.log('========================================\n');

    for (const { table } of existingTables) {
        const { data, error } = await supabase
            .from(table)
            .select('tenant_id')
            .limit(1);

        if (error && error.message.includes('column')) {
            console.log(`❌ ${table.padEnd(25)} - NO tenant_id column`);
        } else if (!error) {
            console.log(`✅ ${table.padEnd(25)} - HAS tenant_id column`);
        }
    }

    console.log('\n========================================');
    console.log('ANALYSIS COMPLETE');
    console.log('========================================\n');
}

checkSchemaStructure().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
