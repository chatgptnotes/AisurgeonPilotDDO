#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ4MTA4NywiZXhwIjoyMDc3MDU3MDg3fQ.8-YoGBXbJZPHlE4t1I_Von9TEc4ho-RCoOJB98lKJp4';

const supabase = createClient(
  'https://qfneoowktsirwpzehgxp.supabase.co',
  serviceRoleKey,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

console.log('\n👨‍⚕️  Creating Sample Doctor...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function createDoctor() {
  try {
    // First check if doctors table exists
    const { data: existingDoctors, error: checkError } = await supabase
      .from('doctors')
      .select('email')
      .eq('email', 'dr.sarah@aisurgeonpilot.com')
      .single();

    if (existingDoctors) {
      console.log('✅ Sample doctor already exists!');
      console.log('   Email: dr.sarah@aisurgeonpilot.com\n');
      return;
    }

    // Create sample doctor
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        full_name: 'Dr. Sarah Ahmed',
        email: 'dr.sarah@aisurgeonpilot.com',
        phone: '+971501234567',
        specialties: ['Cardiology', 'Internal Medicine'],
        languages: ['English', 'Arabic', 'Urdu'],
        bio: 'Board-certified cardiologist with 15 years of experience in treating cardiovascular diseases. Specialized in preventive cardiology and heart failure management.',
        consultation_fee_standard: 200.00,
        consultation_fee_followup: 150.00,
        profile_photo_url: 'https://randomuser.me/api/portraits/women/44.jpg',
        is_verified: true,
        is_accepting_patients: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table "doctors" does not exist yet.');
        console.log('\n📋 Please run the migration first:');
        console.log('1. Open: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/sql/new');
        console.log('2. Copy SQL from: migrations/001_booking_system_schema.sql');
        console.log('3. Execute in SQL Editor\n');
        return;
      }
      throw error;
    }

    console.log('✅ Sample doctor created successfully!\n');
    console.log('Doctor Details:');
    console.log('  ID:', data.id);
    console.log('  Name:', data.full_name);
    console.log('  Email:', data.email);
    console.log('  Specialties:', data.specialties.join(', '));
    console.log('  Fee (Standard):', `$${data.consultation_fee_standard}`);
    console.log('  Fee (Follow-up):', `$${data.consultation_fee_followup}`);
    console.log('\n🚀 Ready to build doctor profile pages!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createDoctor();
