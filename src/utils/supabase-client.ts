import { createClient } from '@supabase/supabase-js';

// Create a fresh Supabase client for AI Surgeon Pilot
const supabaseUrl = 'https://qfneoowktsirwpzehgxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODEwODcsImV4cCI6MjA3NzA1NzA4N30.4vuTFUVA2Wl9RimYPZKBr-cQrbxmh8ae2S-QWX-OWlQ';

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Export for easy import
export default supabaseClient;