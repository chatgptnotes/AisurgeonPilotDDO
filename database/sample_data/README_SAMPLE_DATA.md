# AI Patient Follow-Up System - Sample Data Guide

> Test data to help you explore and test the AI Patient Follow-Up features

**Version:** 1.3
**Date:** 2025-10-26
**File:** `ai_followup_sample_data.sql`

---

## Overview

This sample data file creates realistic test data for the AI Patient Follow-Up System, including:

- 9 Educational content pieces (videos, blogs, PDFs)
- 7 Surgery options across multiple diagnoses
- 5 Test patients with realistic scenarios
- 5 Patient decision journeys at different stages
- Sample education tracking records
- WhatsApp message logs
- Voice call logs

---

## How to Use

### Step 1: Run Master Setup (If Not Already Done)

First, ensure you have the core database set up:

1. Go to your Supabase Dashboard: **qfneoowktsirwpzehgxp.supabase.co**
2. Navigate to **SQL Editor**
3. Open `database/MASTER_CORE_SETUP.sql`
4. Copy the entire file
5. Paste into Supabase SQL Editor
6. Click **Run**
7. Wait for completion

### Step 2: Load Sample Data

1. Stay in Supabase SQL Editor
2. Open `database/sample_data/ai_followup_sample_data.sql`
3. Copy the entire file
4. Paste into a new query
5. Click **Run**
6. Wait for completion (should take ~30 seconds)

---

## What's Included

### 📚 Educational Content (9 items)

**Videos:**
1. Understanding Hernia Surgery - Complete Guide (15 min)
2. Laparoscopic Surgery Explained (12 min)
3. Post-Surgery Recovery: What You Need to Know (10 min)
4. Appendicitis: Symptoms and Treatment (8 min)

**Blog Articles:**
1. 10 Questions to Ask Your Surgeon Before Hernia Surgery
2. Preparing for Surgery: A Complete Checklist
3. Diet After Surgery: Foods to Eat and Avoid

**PDFs:**
1. Post-Operative Care Instructions
2. Exercise Guidelines After Hernia Surgery

### ✂️ Surgery Options (7 options)

**For Inguinal Hernia:**
1. Laparoscopic Hernia Repair (Recommended) - ₹50K-80K, 14 days recovery, 95% success
2. Open Hernia Repair - ₹30K-50K, 28 days recovery, 92% success
3. Robotic Hernia Repair - ₹80K-120K, 10 days recovery, 96.5% success

**For Appendicitis:**
1. Laparoscopic Appendectomy (Recommended) - ₹40K-60K, 7 days recovery, 98% success
2. Open Appendectomy - ₹25K-40K, 14 days recovery, 96% success

**For Gallbladder Disease:**
1. Laparoscopic Cholecystectomy (Recommended) - ₹50K-75K, 14 days recovery, 97% success
2. Open Cholecystectomy - ₹30K-50K, 28 days recovery, 94% success

### 👥 Sample Patients (5 realistic cases)

#### 1. Rajesh Kumar (45, Male) - PT-2025-001
- **Diagnosis:** Inguinal Hernia
- **Consultation:** 10 days ago
- **Current Stage:** Options Review
- **Engagement:** 65% (Medium)
- **Concerns:** Cost, recovery time, recurrence risk
- **Tracking:** 4 content sent, 3 viewed, 1 voice call, 3 WhatsApp messages

#### 2. Priya Sharma (38, Female) - PT-2025-002
- **Diagnosis:** Appendicitis
- **Consultation:** 7 days ago
- **Current Stage:** Education Phase
- **Engagement:** 80% (High)
- **Concerns:** Surgery urgency, complications
- **Tracking:** 2 content sent, 2 viewed, 0 voice calls, 2 WhatsApp messages

#### 3. Amit Patel (52, Male) - PT-2025-003
- **Diagnosis:** Gallbladder Disease
- **Consultation:** 14 days ago
- **Current Stage:** Decision Making
- **Engagement:** 45% (Low) ⚠️ Needs Attention
- **Concerns:** Cost, dietary restrictions, pain
- **Tracking:** 5 content sent, 2 viewed, 2 voice calls, 4 WhatsApp messages

#### 4. Sneha Reddy (29, Female) - PT-2025-004
- **Diagnosis:** Inguinal Hernia
- **Consultation:** 5 days ago
- **Current Stage:** Initial Consultation
- **Engagement:** 20% (Very Low) ⚠️ Needs Attention
- **Concerns:** First-time surgery anxiety, anesthesia fear
- **Tracking:** 1 content sent, 0 viewed, 0 voice calls, 0 WhatsApp messages

#### 5. Vikram Singh (41, Male) - PT-2025-005
- **Diagnosis:** Inguinal Hernia
- **Consultation:** 20 days ago (OVERDUE DEADLINE!)
- **Current Stage:** Decision Making
- **Engagement:** 55% (Medium)
- **Concerns:** Financial constraints, family responsibilities
- **Tracking:** 6 content sent, 4 viewed, 1 voice call, 5 WhatsApp messages

### 📊 Additional Sample Data

- **Education Tracking:** 5 records showing content delivery and engagement
- **WhatsApp Logs:** 3 message logs with delivery/read status
- **Voice Call Logs:** 2 completed calls with transcripts and sentiment analysis

---

## Testing Scenarios

### Scenario 1: High Engagement Patient (Priya Sharma)
**Goal:** Test with a patient who engages well

1. Go to **Patient Follow-Up** dashboard
2. Find Priya Sharma (80% engagement, Education Phase)
3. Click "View Details" to see her journey
4. Try "Send Content" to send additional material
5. Check engagement metrics update

### Scenario 2: Low Engagement Patient (Sneha Reddy)
**Goal:** Test intervention for disengaged patient

1. Find Sneha Reddy (20% engagement, Initial Consultation)
2. Notice "Needs Attention" badge
3. Click "Schedule Call" to arrange follow-up
4. Send educational content via WhatsApp
5. Track if engagement improves

### Scenario 3: Overdue Patient (Vikram Singh)
**Goal:** Test urgent follow-up

1. Find Vikram Singh (Decision deadline passed)
2. Notice "X days overdue" badge
3. Review his decision journey timeline
4. Check concerns: Financial constraints
5. Take appropriate action (call, send payment options info)

### Scenario 4: Compare Surgery Options (Rajesh Kumar)
**Goal:** Test surgery comparison feature

1. Go to **Surgery Options** page
2. Filter by "Inguinal Hernia"
3. Switch to **Comparison View**
4. Compare Laparoscopic vs Open vs Robotic
5. See side-by-side: costs, recovery time, success rates

### Scenario 5: Manage Educational Content
**Goal:** Test content management

1. Go to **Patient Education** page
2. Browse existing content (9 items)
3. Click on "Understanding Hernia Surgery" video
4. Click "Edit" to modify
5. Try creating new content
6. Filter by content type (Video, Blog, PDF)

### Scenario 6: Track Communication History
**Goal:** Review patient communication

1. In **Patient Follow-Up**, select any patient
2. View "View Details" modal
3. Check engagement summary
4. Review concerns and questions
5. See content sent vs viewed ratio

---

## Data Verification

After loading sample data, verify with these queries:

```sql
-- Check educational content
SELECT COUNT(*) as total_content FROM patient_education_content WHERE created_by = 'Dr. Admin';
-- Expected: 9

-- Check surgery options
SELECT COUNT(*) as total_options FROM surgery_options;
-- Expected: 7 (includes 2 from MASTER_CORE_SETUP.sql)

-- Check sample patients
SELECT COUNT(*) as sample_patients FROM patients WHERE patients_id LIKE 'PT-2025-%';
-- Expected: 5

-- Check decision journeys
SELECT COUNT(*) as active_journeys FROM patient_decision_journey;
-- Expected: 5

-- View patients needing attention (low engagement or overdue)
SELECT
    p.name,
    pdj.current_stage,
    pdj.engagement_score,
    pdj.decision_deadline,
    pdj.last_contact_date
FROM patient_decision_journey pdj
JOIN patients p ON pdj.patient_id = p.id
WHERE pdj.engagement_score < 50 OR pdj.decision_deadline < CURRENT_DATE
ORDER BY pdj.engagement_score ASC;
```

---

## Important Notes

### Patient Phone Numbers
All phone numbers are dummy numbers:
- Format: +91987654321X
- These are for testing only
- WhatsApp messages won't actually be sent to these numbers
- Use real patient data in production

### Realistic Timestamps
All sample data uses **relative timestamps**:
- Consultations: 5-20 days ago
- Last contacts: 1-8 days ago
- Content sent: Throughout patient journey
- This makes data feel current even if loaded weeks later

### Engagement Scores
Calculated realistically based on:
- Content sent vs viewed ratio
- Response to calls
- WhatsApp message read status
- Time since last contact

### Data Isolation
Sample patients have IDs starting with `PT-2025-` so you can easily:
- Identify test data
- Delete test data if needed
- Keep separate from real patients

---

## Cleaning Up Sample Data

If you want to remove all sample data:

```sql
-- Delete sample patients and related data
DELETE FROM patient_decision_journey WHERE patient_id IN (
    SELECT id FROM patients WHERE patients_id LIKE 'PT-2025-%'
);

DELETE FROM whatsapp_automation_log WHERE patient_id IN (
    SELECT id FROM patients WHERE patients_id LIKE 'PT-2025-%'
);

DELETE FROM voice_call_logs WHERE patient_id IN (
    SELECT id FROM patients WHERE patients_id LIKE 'PT-2025-%'
);

DELETE FROM patient_education_tracking WHERE patient_id IN (
    SELECT id FROM patients WHERE patients_id LIKE 'PT-2025-%'
);

DELETE FROM visits WHERE visit_id LIKE 'VST-2025-%';
DELETE FROM patients WHERE patients_id LIKE 'PT-2025-%';

-- Delete sample educational content
DELETE FROM patient_education_content WHERE created_by = 'Dr. Admin';

-- Note: This keeps existing surgery options as they might be useful
```

---

## Troubleshooting

### Issue: "Foreign key violation"
**Cause:** MASTER_CORE_SETUP.sql not run yet
**Solution:** Run MASTER_CORE_SETUP.sql first, then run sample data

### Issue: "Unique violation"
**Cause:** Sample data already loaded
**Solution:** Data is already there! Check the dashboard or clean up first

### Issue: No patients showing in Follow-Up Dashboard
**Cause:** Patients might be in completed/declined stages
**Solution:** Sample data creates patients in active stages (initial_consultation, education_phase, options_review, decision_making)

### Issue: Can't see educational content
**Cause:** Content might be marked as inactive
**Solution:** All sample content is marked `is_active = true`

---

## Next Steps After Loading Sample Data

1. **Explore the dashboards:**
   - Go to http://localhost:8080
   - Navigate to "Patient Follow-Up"
   - Browse through the 5 sample patients

2. **Test surgery comparison:**
   - Go to "Surgery Options"
   - Switch between List and Comparison views
   - See how options are presented to patients

3. **Manage content library:**
   - Go to "Patient Education"
   - Browse, edit, or create new content
   - See how content is categorized

4. **Test WhatsApp integration:**
   - Click "Send Content" on any patient
   - Check the WhatsApp automation log
   - (Note: Actual messages won't be sent with dummy numbers)

5. **Review communication history:**
   - View patient details
   - Check voice call transcripts
   - See WhatsApp message history

---

## Support

If you encounter issues with sample data:
1. Check Supabase SQL Editor for error messages
2. Verify MASTER_CORE_SETUP.sql was run first
3. Ensure you have proper database permissions
4. Check console logs in the application

---

**Happy Testing! 🚀**

*AI Surgeon Pilot - Empowering Surgeons with AI*
