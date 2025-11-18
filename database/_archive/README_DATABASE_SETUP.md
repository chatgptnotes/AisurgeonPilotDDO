# AI Surgeon Pilot - Database Setup Guide

> Complete guide for setting up the Supabase database for AI Surgeon Pilot application

**Version:** 1.3
**Date:** 2025-10-26
**Database:** Supabase (PostgreSQL)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Database Schema](#database-schema)
5. [Migration Files](#migration-files)
6. [Tables Reference](#tables-reference)
7. [Sample Data](#sample-data)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Overview

This database setup includes **26 core tables** for AI Surgeon Pilot:

- **Authentication**: User management with role-based access
- **Patient Management**: Patient records and visit tracking
- **Medical Reference**: Diagnoses, complications, medications
- **Laboratory**: Lab tests and results
- **Radiology**: Imaging procedures and reports
- **Surgeries**: Surgical procedures tracking
- **AI Patient Follow-Up**: Educational content, voice calls, WhatsApp automation
- **Decision Support**: Surgery options, patient preferences, decision journey tracking
- **Automation**: Automated patient engagement rules and workflows

---

## Prerequisites

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project for AI Surgeon Pilot
3. **Database Credentials**: Get from Supabase Dashboard
   - Project URL
   - Anon Key
   - Project ID

---

## Quick Start

### Option 1: Run Master Setup (Recommended)

**Fastest way to set up everything at once:**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open `database/MASTER_CORE_SETUP.sql`
4. Copy the **entire file** contents
5. Paste into Supabase SQL Editor
6. Click **Run**
7. Wait 2-3 minutes for completion

**Done!** Your database is ready.

### Option 2: Run Individual Migration Files

**Step-by-step approach for better control:**

Run these files **in order** in Supabase SQL Editor:

```bash
1. migrations/01_core_authentication.sql
2. migrations/02_patient_management.sql
3. migrations/03_medical_reference_data.sql
4. migrations/04_visit_junctions.sql
5. migrations/05_patient_followup_ai_agents.sql
```

---

## Database Schema

### Architecture

```
┌─────────────┐
│    User     │ (Authentication)
└─────────────┘

┌─────────────┐     ┌──────────────┐
│  Patients   │────→│   Visits     │
└─────────────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌────▼────┐
              │ Diagnoses │ │ Doctors │
              └───────────┘ └─────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
   │  Labs   │ │ Meds   │ │ Radio  │
   └─────────┘ └────────┘ └────────┘
```

### Entity Relationships

- **One-to-Many**:
  - Patient → Visits
  - Visit → Visit_Labs
  - Visit → Visit_Medications
  - Visit → Visit_Surgeries

- **Many-to-Many** (via junction tables):
  - Visit ↔ Diagnoses (via visit_diagnoses)
  - Visit ↔ Complications (via visit_complications)
  - Visit ↔ Medications (via visit_medications)

---

## Migration Files

### Individual Migration Files

Located in `database/migrations/`:

| File | Description | Tables Created |
|------|-------------|----------------|
| `01_core_authentication.sql` | User authentication | User |
| `02_patient_management.sql` | Patient & visit management | patients, visits |
| `03_medical_reference_data.sql` | Medical master data | diagnoses, complications, medication, medicines, referees |
| `04_visit_junctions.sql` | Visit relationships | visit_diagnoses, visit_complications, visit_medications, visit_labs, visit_radiology, visit_surgeries, lab, radiology |
| `05_patient_followup_ai_agents.sql` | AI patient follow-up & automation | patient_education_content, patient_education_tracking, surgery_options, patient_surgery_preferences, voice_call_logs, whatsapp_automation_log, patient_decision_journey, automation_rules |

### Master Setup File

`database/MASTER_CORE_SETUP.sql` - Runs all migrations in a single transaction.

---

## Tables Reference

### 1. User (Authentication)

**Purpose:** User authentication and authorization

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | User email (unique) |
| password | TEXT | Bcrypt hashed password |
| role | VARCHAR(50) | admin, doctor, nurse, user |
| hospital_type | VARCHAR(100) | Hospital affiliation |

**Sample Login:**
- Email: `admin@aisurgeonpilot.com`
- Password: `admin123`

---

### 2. Patients

**Purpose:** Patient demographic and contact information

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Patient full name |
| patients_id | VARCHAR(50) | Custom patient ID |
| age | INTEGER | Age in years |
| gender | VARCHAR(20) | Male/Female/Other |
| phone | VARCHAR(20) | Contact number |
| email | VARCHAR(255) | Email address |
| address | TEXT | Full address |
| allergies | TEXT | Known allergies |
| blood_group | VARCHAR(10) | A+, B+, etc. |

**Total Fields:** 35+

---

### 3. Visits

**Purpose:** Patient visits, admissions, appointments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| visit_id | VARCHAR(50) | Custom visit ID |
| patient_id | UUID | Foreign key to patients |
| visit_type | VARCHAR(50) | OPD, IPD, Emergency |
| visit_date | DATE | Date of visit |
| appointment_with | VARCHAR(255) | Doctor name |
| admission_date | DATE | Admission date (IPD) |
| discharge_date | DATE | Discharge date |
| billing_status | VARCHAR(50) | Bill status |
| status | VARCHAR(50) | Visit status |

**Total Fields:** 50+

---

### 4. Diagnoses

**Purpose:** Master list of medical diagnoses

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Diagnosis name |
| description | TEXT | Details |

**Sample Data:** Appendicitis, Hypertension, Diabetes, Hernia

---

### 5. Complications

**Purpose:** Possible medical complications

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Complication name |
| description | TEXT | Details |

**Sample Data:** Infection, Bleeding, Pain

---

### 6. Medication

**Purpose:** Medication master list

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Medication name |
| dosage | VARCHAR(100) | Dosage (500mg) |
| frequency | VARCHAR(100) | Frequency |
| duration | VARCHAR(100) | Duration |

---

### 7. Lab (Master)

**Purpose:** Laboratory test catalog

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Test name |
| category | VARCHAR(100) | Test category |
| cost | DECIMAL | Test cost |
| sample_type | VARCHAR(50) | Blood, Urine, etc. |

**Sample Data:** CBC, Blood Sugar, Lipid Profile

---

### 8. Radiology (Master)

**Purpose:** Radiology procedure catalog

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Procedure name |
| category | VARCHAR(100) | X-Ray, CT, MRI |
| cost | DECIMAL | Procedure cost |
| body_part | VARCHAR(100) | Body part |

**Sample Data:** X-Ray Chest, CT Head, MRI Spine

---

### Junction Tables

#### visit_diagnoses
Links visits to multiple diagnoses

#### visit_complications
Links visits to complications

#### visit_medications
Links visits to medications prescribed

#### visit_labs
Links visits to lab tests ordered

#### visit_radiology
Links visits to radiology procedures

#### visit_surgeries
Surgeries performed during visits

---

### AI Patient Follow-Up Tables

#### 9. patient_education_content

**Purpose:** Store educational materials for patients (videos, blogs, PDFs, articles)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(500) | Content title |
| content_type | VARCHAR(50) | video, blog, pdf, article, infographic |
| content_url | TEXT | URL to content |
| content_text | TEXT | Text content for blogs/articles |
| surgery_types | TEXT[] | Array of applicable surgery types |
| tags | TEXT[] | Content tags for search |
| view_count | INTEGER | Number of views |
| is_active | BOOLEAN | Active status |

**Sample Data:** Hernia surgery video, Appendicitis guide, Recovery tips

---

#### 10. patient_education_tracking

**Purpose:** Track educational content sent to patients and engagement

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | Foreign key to patients |
| content_id | UUID | Foreign key to patient_education_content |
| sent_via | VARCHAR(50) | whatsapp, email, sms, voice_call |
| sent_date | TIMESTAMP | When content was sent |
| opened_date | TIMESTAMP | When patient opened content |
| engagement_score | INTEGER | 0-100 engagement score |

**Purpose:** Monitor patient engagement with educational materials

---

#### 11. surgery_options

**Purpose:** Multiple surgery options for each diagnosis with details

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| diagnosis_id | UUID | Foreign key to diagnoses |
| surgery_name | VARCHAR(255) | Surgery name |
| procedure_type | VARCHAR(100) | laparoscopic, open, robotic |
| risks | TEXT[] | Array of risk factors |
| benefits | TEXT[] | Array of benefits |
| recovery_time_days | INTEGER | Recovery time |
| cost_range_min | DECIMAL | Minimum cost |
| cost_range_max | DECIMAL | Maximum cost |
| success_rate | DECIMAL | Success percentage |
| is_recommended | BOOLEAN | Recommended option |

**Sample Data:** Laparoscopic vs Open Hernia Repair

---

#### 12. patient_surgery_preferences

**Purpose:** Track patient's chosen surgery options and decision status

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | Foreign key to patients |
| visit_id | UUID | Foreign key to visits |
| surgery_option_id | UUID | Foreign key to surgery_options |
| preference_rank | INTEGER | 1=first choice, 2=second choice |
| decision_status | VARCHAR(50) | considering, preferred, selected, rejected |
| concerns | TEXT[] | Patient's concerns |
| questions | TEXT[] | Patient's questions |
| decided_date | DATE | Date of decision |

**Purpose:** Help surgeons understand patient preferences and concerns

---

#### 13. voice_call_logs

**Purpose:** Track AI voice agent calls to patients

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | Foreign key to patients |
| call_type | VARCHAR(50) | follow_up, education, reminder, survey |
| phone_number | VARCHAR(20) | Phone number called |
| call_date | TIMESTAMP | Call timestamp |
| call_duration_seconds | INTEGER | Call duration |
| call_status | VARCHAR(50) | completed, no_answer, busy, failed |
| call_transcript | TEXT | Full call transcript |
| sentiment_analysis | VARCHAR(50) | positive, neutral, negative |
| key_topics | TEXT[] | Topics discussed |
| concerns_raised | TEXT[] | Patient concerns |
| follow_up_required | BOOLEAN | Needs follow-up |

**Purpose:** Complete voice call history with AI-powered analysis

---

#### 14. whatsapp_automation_log

**Purpose:** Track all WhatsApp messages sent via automation

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | Foreign key to patients |
| content_id | UUID | Foreign key to patient_education_content |
| message_type | VARCHAR(50) | educational_content, reminder, follow_up |
| phone_number | VARCHAR(20) | WhatsApp number |
| sent_date | TIMESTAMP | When message was sent |
| delivery_status | VARCHAR(50) | pending, sent, delivered, read, failed |
| read_timestamp | TIMESTAMP | When message was read |
| response_received | BOOLEAN | Did patient respond |
| doubletick_message_id | VARCHAR(255) | DoubleTick API message ID |

**Integration:** Uses DoubleTick WhatsApp API (key_8sc9MP6JpQ)

---

#### 15. patient_decision_journey

**Purpose:** Track the complete decision-making timeline for each patient

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | Foreign key to patients |
| visit_id | UUID | Foreign key to visits |
| initial_consultation_date | DATE | First consultation |
| decision_deadline | DATE | Decision deadline |
| current_stage | VARCHAR(50) | initial_consultation, education_phase, options_review, decision_making, surgery_scheduled |
| last_contact_date | TIMESTAMP | Last contact with patient |
| total_education_content_sent | INTEGER | Total content sent |
| total_education_content_viewed | INTEGER | Content viewed by patient |
| total_voice_calls | INTEGER | Number of voice calls |
| total_whatsapp_messages | INTEGER | Number of WhatsApp messages |
| engagement_score | INTEGER | 0-100 overall engagement |
| final_decision | VARCHAR(50) | agreed, declined, deferred |

**Purpose:** Complete patient journey from consultation to surgery decision

---

#### 16. automation_rules

**Purpose:** Define automation rules for patient follow-up

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| rule_name | VARCHAR(255) | Rule name |
| rule_type | VARCHAR(50) | whatsapp, voice_call, email |
| trigger_type | VARCHAR(50) | days_after_consultation, stage_change |
| trigger_value | INTEGER | Number of days |
| target_stage | VARCHAR(50) | Which patient stage to target |
| action_type | VARCHAR(50) | send_content, make_call, send_reminder |
| message_template | TEXT | Message template with variables |
| time_of_day | TIME | Preferred execution time |
| is_active | BOOLEAN | Rule active status |

**Sample Rules:**
- Day 2: Send educational video
- Day 4: Send blog article
- Day 7: Voice call follow-up
- Day 10: Send surgery comparison
- Day 14: Decision reminder call

---

## Sample Data

### Included Sample Data

The setup automatically inserts:

- **1 Admin User** (for testing)
- **8 Diagnoses** (common conditions)
- **7 Complications** (typical complications)
- **5 Medications** (common medicines)
- **2 Lab Tests** (CBC, Blood Sugar)
- **2 Radiology Procedures** (X-Ray, CT Scan)
- **3 Referring Doctors**
- **4 Educational Content** (videos, blogs, PDFs)
- **2 Surgery Options** (for Inguinal Hernia)
- **5 Automation Rules** (patient follow-up workflow)

### Testing Credentials

```
Email: admin@aisurgeonpilot.com
Password: admin123
```

---

## Troubleshooting

### Common Issues

#### 1. "Table already exists" Error

**Solution:** Tables are created with `IF NOT EXISTS`, so this is safe to ignore.

#### 2. Foreign Key Violation

**Cause:** Running migrations out of order.

**Solution:** Run migrations in the correct sequence (01 → 02 → 03 → 04).

#### 3. RLS Policies Blocking Access

**Solution:** Policies allow all operations for now. If blocked, check Supabase authentication status.

#### 4. Can't Login

**Possible Causes:**
- User table not created
- Wrong credentials
- Password not hashed correctly

**Solution:** Re-run `01_core_authentication.sql`

---

## FAQ

### Q: Can I modify the schema after running setup?

**A:** Yes! Use `ALTER TABLE` statements in Supabase SQL Editor. Always backup first.

### Q: How do I add more sample data?

**A:** Use `INSERT` statements in SQL Editor:

```sql
INSERT INTO public.diagnoses (name, description)
VALUES ('New Diagnosis', 'Description here');
```

### Q: Can I run the setup multiple times?

**A:** Yes! All tables use `IF NOT EXISTS` and sample data uses `ON CONFLICT DO NOTHING`.

### Q: How do I backup the database?

**A:** Supabase provides automatic backups. For manual backup:
1. Go to Database Settings
2. Click "Backup"
3. Download SQL dump

### Q: How do I reset the database?

**A:** ⚠️ **Warning: This deletes ALL data!**

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run MASTER_CORE_SETUP.sql
```

### Q: What's the difference between `medication` and `medicines`?

**A:**
- `medication`: Simple prescription records
- `medicines`: Detailed pharmacy inventory with pricing, stock, etc.

Both tables exist for flexibility.

### Q: How do I add custom fields?

**A:** Use `ALTER TABLE`:

```sql
ALTER TABLE public.patients
ADD COLUMN custom_field VARCHAR(255);
```

### Q: Is this production-ready?

**A:** This is a **Core/MVP** setup. For production:
- Review and customize RLS policies
- Add proper indexes for your queries
- Implement audit logging
- Set up regular backups
- Review security settings

---

## Database Credentials

### How to Get Credentials

1. Go to Supabase Dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL
   - Anon (public) key
   - Service Role key (keep secret!)

### Update .env File

```bash
VITE_SUPABASE_URL=https://qfneoowktsirwpzehgxp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Next Steps

After database setup:

1. ✅ Update `.env` with Supabase credentials
2. ✅ Run `npm install` (if not done)
3. ✅ Run `npm run dev`
4. ✅ Test at `http://localhost:8080`
5. ✅ Login with admin credentials
6. ✅ Create test patient and visit

---

## Support

For issues or questions:
- Check [Supabase Documentation](https://supabase.com/docs)
- Review migration files in `database/migrations/`
- Check application logs for errors

---

## Version History

- **v1.3** (2025-10-26): Added AI patient follow-up system (8 new tables for education, voice calls, WhatsApp automation, decision journey tracking)
- **v1.2** (2025-10-26): Database fully integrated with new Supabase project
- **v1.1** (2025-10-26): Initial core setup with 18 tables
- **v1.0** (2025-10-26): Pre-release

---

**Happy Coding! 🚀**

*AI Surgeon Pilot - Empowering Surgeons with AI*
