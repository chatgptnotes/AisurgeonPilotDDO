#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ4MTA4NywiZXhwIjoyMDc3MDU3MDg3fQ.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestPatient() {
  console.log('🚀 Creating test patient user...\n');

  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'patient@test.com',
      password: 'patient123',
      email_confirm: true,
      user_metadata: {
        name: 'Test Patient'
      }
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
        console.log('   ⚠️  Auth user already exists, continuing...\n');
      } else {
        console.error('   ❌ Error creating auth user:', authError.message);
        return;
      }
    } else {
      console.log('   ✅ Auth user created successfully!');
      console.log('   📧 Email:', authData.user.email);
      console.log('   🆔 User ID:', authData.user.id, '\n');
    }

    // Step 2: Create patient profile
    console.log('Step 2: Creating patient profile in database...');
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .upsert({
        name: 'Test Patient',
        email: 'patient@test.com',
        phone_number: '+919876543210',
        date_of_birth: '1990-01-01',
        gender: 'M',
        address: 'Test Address, Mumbai, India',
        is_verified: true
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (patientError) {
      console.error('   ❌ Error creating patient profile:', patientError.message);
      return;
    }

    console.log('   ✅ Patient profile created successfully!');
    console.log('   👤 Name:', patientData.name);
    console.log('   📧 Email:', patientData.email);
    console.log('   📱 Phone:', patientData.phone_number);
    console.log('   🆔 Patient ID:', patientData.id, '\n');

    // Step 3: Summary
    console.log('=' .repeat(60));
    console.log('✨ TEST PATIENT CREATED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('\n📝 Login Credentials:');
    console.log('   Email:    patient@test.com');
    console.log('   Password: patient123');
    console.log('\n🌐 Access URLs:');
    console.log('   Login:     http://localhost:8080/patient-login');
    console.log('   Dashboard: http://localhost:8080/patient-dashboard');
    console.log('\n✅ You can now login and test the patient portal!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestPatient().catch(console.error);
