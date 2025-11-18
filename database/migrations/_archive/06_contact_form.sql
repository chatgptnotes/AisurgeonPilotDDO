/**
 * Contact Form Submissions Table
 * Version: 1.0
 * Created: 2025-10-26
 *
 * Purpose: Store contact form submissions from landing page
 */

-- Create contact_form_submissions table
CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    practice_name VARCHAR(255) NULL,
    specialty VARCHAR(100) NULL,
    message TEXT NOT NULL,
    interested_in VARCHAR(100) NULL, -- 'starter', 'professional', 'enterprise', 'other'
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'not_interested'
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_contact_form_email ON public.contact_form_submissions(email);
CREATE INDEX idx_contact_form_status ON public.contact_form_submissions(status);
CREATE INDEX idx_contact_form_created_at ON public.contact_form_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert (submit form)
CREATE POLICY "Allow public to submit contact form"
    ON public.contact_form_submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users to view all submissions
CREATE POLICY "Allow authenticated users to view submissions"
    ON public.contact_form_submissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update submissions (for status/notes)
CREATE POLICY "Allow authenticated users to update submissions"
    ON public.contact_form_submissions
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create update trigger
CREATE TRIGGER update_contact_form_submissions_updated_at
    BEFORE UPDATE ON public.contact_form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.contact_form_submissions IS 'Stores contact form submissions from AI Surgeon Pilot landing page';
