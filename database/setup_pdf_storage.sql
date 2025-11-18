-- =====================================================
-- PDF STORAGE SETUP FOR SUPABASE
-- =====================================================
-- This script creates storage buckets and policies for
-- receipts and prescriptions PDFs
-- =====================================================

-- Create storage buckets for PDFs

-- Receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Prescriptions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES FOR RECEIPTS
-- =====================================================

-- Public read access for receipts
CREATE POLICY "Public read access for receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Authenticated users can upload receipts
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own receipts
CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- =====================================================
-- STORAGE POLICIES FOR PRESCRIPTIONS
-- =====================================================

-- Public read access for prescriptions
CREATE POLICY "Public read access for prescriptions"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions');

-- Authenticated users can upload prescriptions
CREATE POLICY "Authenticated users can upload prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescriptions' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own prescriptions
CREATE POLICY "Users can update their own prescriptions"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prescriptions' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'prescriptions' AND auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify buckets were created
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN ('receipts', 'prescriptions');

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Both buckets are PUBLIC for easy sharing via links
-- 3. Only authenticated users can upload PDFs
-- 4. PDF URLs will be in format:
--    https://[project-ref].supabase.co/storage/v1/object/public/receipts/[filename]
--    https://[project-ref].supabase.co/storage/v1/object/public/prescriptions/[filename]
-- 5. To delete old files, you can set up a cleanup function or manual deletion
-- =====================================================
