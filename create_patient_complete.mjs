#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

// Check if service role key is provided as argument
const serviceRoleKey = process.argv[2];

console.log('\n🏥 AI Surgeon Pilot - Complete Patient Setup\n');

if (!serviceRoleKey) {
  console.log('❌ SERVICE_ROLE key required to bypass RLS and create auth user');
  console.log('\n📌 Please run this script with your SERVICE_ROLE key:');
  console.log('   node create_patient_complete.mjs YOUR_SERVICE_ROLE_KEY');
  console.log('\n🔑 Find your SERVICE_ROLE key at:');
  console.log('   https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/settings/api');
  console.log('   (Settings → API → service_role key - SECRET!)');
  console.log('\n⚠️  Keep this key secret! Do not commit to git.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPatient() {
  try {
    console.log('Step 1: Checking for existing patient profile...');

    // Check if patient already exists
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('email', 'patient@test.com')
      .single();

    let patient;

    if (existingPatient) {
      console.log('⚠️  Patient profile already exists, using existing profile');
      patient = existingPatient;
    } else {
      console.log('Creating new patient profile in database...');

      // Create patient profile using correct schema
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: 'Test Patient',
          email: 'patient@test.com',
          phone: '+919876543210',
          date_of_birth: '1990-01-01',
          gender: 'M',
          address: 'Test Address, Mumbai, India',
          age: 35
        })
        .select()
        .single();

      if (patientError) {
        console.error('❌ Error creating patient profile:', patientError.message);
        return;
      }

      patient = newPatient;
    }

    console.log('✅ Patient profile created:');
    console.log('   ID:', patient.id);
    console.log('   Name:', patient.name);
    console.log('   Email:', patient.email);
    console.log('   Phone:', patient.phone);

    console.log('\nStep 2: Creating authentication user...');

    // Create auth user using Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'patient@test.com',
      password: 'patient123',
      email_confirm: true,
      user_metadata: {
        name: 'Test Patient',
        patient_id: patient.id
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Auth user already exists, updating password...');

        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === 'patient@test.com');

        if (existingUser) {
          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: 'patient123' }
          );

          if (updateError) {
            console.error('❌ Error updating password:', updateError.message);
            return;
          }

          console.log('✅ Password updated for existing user');
          console.log('   User ID:', existingUser.id);
        }
      } else {
        console.error('❌ Error creating auth user:', authError.message);
        return;
      }
    } else {
      console.log('✅ Auth user created:');
      console.log('   User ID:', authUser.user.id);
      console.log('   Email:', authUser.user.email);
    }

    console.log('\n🎉 SETUP COMPLETE!\n');
    console.log('Test credentials:');
    console.log('  Email: patient@test.com');
    console.log('  Password: patient123\n');
    console.log('Test login at: http://localhost:8080/login');
    console.log('  → Click "Patient Login" tab');
    console.log('  → Enter credentials');
    console.log('  → Should redirect to patient dashboard\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

function printInstructions() {
  console.log('\n📝 INSTRUCTIONS TO CREATE AUTH USER:\n');
  console.log('1. Open your browser and go to:');
  console.log('   https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp\n');

  console.log('2. Click on "Authentication" in the left sidebar\n');

  console.log('3. Click on "Users" tab\n');

  console.log('4. Click the "Add user" button (or "Invite" button)\n');

  console.log('5. Choose "Create new user" option\n');

  console.log('6. Fill in the form:');
  console.log('   Email: patient@test.com');
  console.log('   Password: patient123');
  console.log('   ✓ Check "Auto Confirm User" checkbox\n');

  console.log('7. Click "Create user" or "Send invitation"\n');

  console.log('8. After creating, you can login at:');
  console.log('   http://localhost:8080/login\n');

  console.log('   Use Patient Login tab with:');
  console.log('   Email: patient@test.com');
  console.log('   Password: patient123\n');

  console.log('='.repeat(70));
  console.log('\n💡 TIP: The patient profile in database is ready!');
  console.log('   You just need to create the authentication user.\n');
}

// Run the script
createPatient();
