import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTU2NzQ4NywiZXhwIjoyMDQ3MTQzNDg3fQ.vPKW6F8R7hNZ1bvO5j6saNVSYLSOjxAI0SNBk-EeQIw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDoctorAuth() {
  console.log('🔐 Creating Supabase Auth account for Dr. Priya Sharma...\n');

  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'priya.sharma@aisurgeonpilot.com',
      password: 'Doctor@123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Dr. Priya Sharma',
        role: 'doctor'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === 'priya.sharma@aisurgeonpilot.com');

      if (existingUser) {
        console.log('ℹ️  Auth user already exists with ID:', existingUser.id);
        console.log('\nStep 2: Linking to doctor profile...');

        // Link existing user to doctor profile
        const { error: updateError } = await supabase
          .from('doctors')
          .update({ user_id: existingUser.id })
          .eq('email', 'priya.sharma@aisurgeonpilot.com');

        if (updateError) {
          console.error('❌ Error linking doctor profile:', updateError.message);
          return;
        }

        console.log('✅ Successfully linked existing auth user to doctor profile!\n');
        console.log('📧 Email: priya.sharma@aisurgeonpilot.com');
        console.log('🔑 Password: Doctor@123');
        console.log('🆔 User ID:', existingUser.id);
        console.log('\n✨ You can now login at: http://localhost:8086/login');
        return;
      }
      return;
    }

    console.log('✅ Auth user created successfully!');
    console.log('🆔 User ID:', authData.user.id);

    // Step 2: Link auth user to doctor profile
    console.log('\nStep 2: Linking to doctor profile...');
    const { data: doctor, error: updateError } = await supabase
      .from('doctors')
      .update({ user_id: authData.user.id })
      .eq('email', 'priya.sharma@aisurgeonpilot.com')
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error linking doctor profile:', updateError.message);
      return;
    }

    console.log('✅ Successfully linked to doctor profile!\n');

    // Step 3: Verify the setup
    console.log('Step 3: Verifying setup...');
    const { data: verifyDoctor, error: verifyError } = await supabase
      .from('doctors')
      .select('id, full_name, email, user_id, specialization')
      .eq('email', 'priya.sharma@aisurgeonpilot.com')
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      return;
    }

    console.log('✅ Verification successful!\n');
    console.log('👤 Doctor Profile:');
    console.log('   Name:', verifyDoctor.full_name);
    console.log('   Email:', verifyDoctor.email);
    console.log('   Specialization:', verifyDoctor.specialization);
    console.log('   Doctor ID:', verifyDoctor.id);
    console.log('   Auth User ID:', verifyDoctor.user_id);

    console.log('\n🎉 Setup Complete!\n');
    console.log('Login Credentials:');
    console.log('📧 Email: priya.sharma@aisurgeonpilot.com');
    console.log('🔑 Password: Doctor@123');
    console.log('\n✨ Go to: http://localhost:8086/login');
    console.log('   Click the "Doctor" tab');
    console.log('   Click "Click to auto-fill"');
    console.log('   Click "Sign In as Doctor"');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createDoctorAuth();
