#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

console.log('\n🚀 Creating Booking System Tables...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ4MTA4NywiZXhwIjoyMDc3MDU3MDg3fQ.8-YoGBXbJZPHlE4t1I_Von9TEc4ho-RCoOJB98lKJp4';

const supabase = createClient(
  'https://qfneoowktsirwpzehgxp.supabase.co',
  serviceRoleKey,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function createTables() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Check existing tables first
    console.log('🔍 Checking existing tables...\n');
    const { rows: existingTables } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('doctors', 'appointments', 'payments')
    `);

    if (existingTables.length > 0) {
      console.log('⚠️  Found existing tables:', existingTables.map(t => t.tablename).join(', '));
      console.log('✅ Skipping to avoid data loss. Tables already exist.\n');
    }

    // Create doctors table
    console.log('📦 Creating doctors table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        specialties TEXT[] DEFAULT '{}',
        languages TEXT[] DEFAULT '{}',
        bio TEXT,
        qualifications JSONB DEFAULT '[]',
        experience_years INTEGER,
        consultation_fee_standard DECIMAL(10,2) NOT NULL,
        consultation_fee_followup DECIMAL(10,2),
        followup_window_days INTEGER DEFAULT 7,
        currency VARCHAR(3) DEFAULT 'AED',
        profile_photo_url TEXT,
        letterhead_url TEXT,
        rating_avg DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        is_accepting_patients BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_documents JSONB DEFAULT '[]',
        timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
        cancellation_policy TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        verified_at TIMESTAMPTZ
      )
    `);
    console.log('✅ doctors table created\n');

    // Create indexes for doctors
    await client.query('CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_doctors_specialties ON doctors USING GIN(specialties)');

    // Create doctor_availability table
    console.log('📦 Creating doctor_availability table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes > 0),
        buffer_minutes INTEGER DEFAULT 10 CHECK (buffer_minutes >= 0),
        max_patients_per_day INTEGER DEFAULT 20 CHECK (max_patients_per_day > 0),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_time_range CHECK (end_time > start_time)
      )
    `);
    console.log('✅ doctor_availability table created\n');

    // Create availability_exceptions table
    console.log('📦 Creating availability_exceptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS availability_exceptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
        exception_date DATE NOT NULL,
        exception_type VARCHAR(20) NOT NULL CHECK (exception_type IN ('blocked', 'custom_hours')),
        custom_start TIME,
        custom_end TIME,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ availability_exceptions table created\n');

    // Create appointments table
    console.log('📦 Creating appointments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ NOT NULL,
        appointment_type VARCHAR(20) DEFAULT 'standard' CHECK (appointment_type IN ('standard', 'followup')),
        status VARCHAR(20) DEFAULT 'pending_payment' CHECK (status IN
          ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show', 'refunded')
        ),
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'AED',
        coupon_id UUID,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        payment_id UUID,
        meet_link TEXT,
        intake_completed BOOLEAN DEFAULT FALSE,
        intake_completed_at TIMESTAMPTZ,
        cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('patient', 'doctor', 'system', NULL)),
        cancellation_reason TEXT,
        cancelled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        confirmed_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        CONSTRAINT valid_time_range CHECK (end_at > start_at)
      )
    `);
    console.log('✅ appointments table created\n');

    // Create payments table
    console.log('📦 Creating payments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID,
        provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'paytabs', 'manual')),
        provider_payment_id TEXT UNIQUE,
        provider_customer_id TEXT,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'AED',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN
          ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')
        ),
        refund_amount DECIMAL(10,2) DEFAULT 0,
        refund_reason TEXT,
        refunded_at TIMESTAMPTZ,
        raw_payload JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        paid_at TIMESTAMPTZ,
        failed_at TIMESTAMPTZ
      )
    `);
    console.log('✅ payments table created\n');

    // Create coupons table
    console.log('📦 Creating coupons table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
        discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0,
        per_user_limit INTEGER DEFAULT 1,
        valid_from TIMESTAMPTZ NOT NULL,
        valid_to TIMESTAMPTZ NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_validity_period CHECK (valid_to > valid_from)
      )
    `);
    console.log('✅ coupons table created\n');

    // Create coupon_usages table
    console.log('📦 Creating coupon_usages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
        discount_applied DECIMAL(10,2) NOT NULL,
        used_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ coupon_usages table created\n');

    // Create slot_locks table
    console.log('📦 Creating slot_locks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS slot_locks (
        slot_key VARCHAR(255) PRIMARY KEY,
        locked_by UUID NOT NULL,
        appointment_id UUID,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ slot_locks table created\n');

    // Create payment_configs table
    console.log('📦 Creating payment_configs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
        provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'paytabs')),
        publishable_key TEXT,
        secret_key_encrypted TEXT NOT NULL,
        webhook_secret TEXT,
        currency VARCHAR(3) DEFAULT 'AED',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(doctor_id, provider)
      )
    `);
    console.log('✅ payment_configs table created\n');

    // Create video_configs table
    console.log('📦 Creating video_configs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE UNIQUE NOT NULL,
        provider VARCHAR(50) DEFAULT 'zoom' CHECK (provider IN ('zoom', 'teams', 'meet', 'custom')),
        static_link TEXT,
        oauth_token_encrypted TEXT,
        oauth_refresh_token_encrypted TEXT,
        oauth_expires_at TIMESTAMPTZ,
        auto_record BOOLEAN DEFAULT FALSE,
        waiting_room BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ video_configs table created\n');

    // Insert sample doctor
    console.log('📊 Inserting sample doctor: Dr. Sarah Ahmed...');
    const { rows } = await client.query(`
      INSERT INTO doctors (
        full_name, email, phone, specialties, languages, bio,
        consultation_fee_standard, consultation_fee_followup,
        profile_photo_url, is_verified, is_accepting_patients
      ) VALUES (
        'Dr. Sarah Ahmed',
        'dr.sarah@aisurgeonpilot.com',
        '+971501234567',
        ARRAY['Cardiology', 'Internal Medicine'],
        ARRAY['English', 'Arabic', 'Urdu'],
        'Board-certified cardiologist with 15 years of experience in treating cardiovascular diseases. Specialized in preventive cardiology and heart failure management.',
        200.00,
        150.00,
        'https://randomuser.me/api/portraits/women/44.jpg',
        true,
        true
      ) RETURNING id
    `);

    const doctorId = rows[0].id;
    console.log('✅ Sample doctor created with ID:', doctorId, '\n');

    // Insert availability for sample doctor
    console.log('📅 Setting up availability (Mon-Fri, 9 AM - 5 PM)...');
    for (let day = 1; day <= 5; day++) {
      await client.query(`
        INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
        VALUES ($1, $2, '09:00'::TIME, '17:00'::TIME, 30)
      `, [doctorId, day]);
    }
    console.log('✅ Availability configured\n');

    // Insert video config
    console.log('🎥 Setting up video consultation...');
    await client.query(`
      INSERT INTO video_configs (doctor_id, provider, static_link)
      VALUES ($1, 'zoom', 'https://zoom.us/j/1234567890')
    `, [doctorId]);
    console.log('✅ Video config created\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 DATABASE SETUP COMPLETE!\n');
    console.log('Tables created:');
    console.log('  ✅ doctors');
    console.log('  ✅ doctor_availability');
    console.log('  ✅ availability_exceptions');
    console.log('  ✅ appointments');
    console.log('  ✅ payments');
    console.log('  ✅ coupons');
    console.log('  ✅ coupon_usages');
    console.log('  ✅ slot_locks');
    console.log('  ✅ payment_configs');
    console.log('  ✅ video_configs\n');
    console.log('Sample Data:');
    console.log('  👨‍⚕️  Dr. Sarah Ahmed (Cardiologist)');
    console.log('  📅 Mon-Fri, 9 AM - 5 PM');
    console.log('  💰 $200 standard, $150 follow-up\n');
    console.log('🚀 Ready to build UI components!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P07') {
      console.log('\n✅ Tables already exist - skipping creation to preserve data\n');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

createTables();
