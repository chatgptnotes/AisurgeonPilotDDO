# AI Surgeon Pilot - Testing Guide

**Date:** 2025-10-26
**Version:** 1.0

---

## ✅ Pre-Testing Checklist

Before you start testing, verify:

- ✅ All SQL scripts have been run:
  - `SIMPLE_SETUP_FOR_AUTH.sql` ✅
  - `07_create_admin_user.sql` ✅
  - `AI_FEATURES_SETUP.sql` ✅
  - `MISSING_AI_TABLES.sql` ✅

- ✅ You can login with:
  - Email: admin@aisurgeonpilot.com
  - Password: Admin@123

---

## 🧪 Test 1: Patient Follow-Up Dashboard

### Step 1: Access the Dashboard

1. **Login URL:** https://aisurgeonpilot-lmdae3kms-chatgptnotes-6366s-projects.vercel.app/login
2. **Login with:** admin@aisurgeonpilot.com / Admin@123
3. **Navigate to:** Click "Patient Follow-Up" in sidebar (under "AI Surgeon Pilot Features")

### Step 2: Verify Dashboard Loads

**Expected to see:**
- ✅ Dashboard title: "Patient Follow-Up Dashboard"
- ✅ Stats cards at top (Total Patients, Active Journeys, etc.)
- ✅ Filter/search bar
- ✅ Patient journey cards/table

**If you see an error:**
- Check browser console (F12)
- Look for SQL/database errors
- Verify all tables were created

### Step 3: Check Sample Data

**Expected to see:**
- ✅ At least 2 patient journey records
- ✅ Patient names displayed
- ✅ Current stage (e.g., "Education Phase")
- ✅ Last contact date
- ✅ Engagement score (0-100)
- ✅ "View Details" or action buttons

**Sample Data Should Include:**
- Patient with diagnosis from sample data
- Journey stage: "education_phase"
- Some engagement metrics
- Last contact via "whatsapp"

### Step 4: Test Functionality

**Try these actions:**

1. **Search/Filter:**
   - Use search box to filter patients
   - Use stage dropdown to filter by stage
   - **Expected:** List updates dynamically

2. **View Details:**
   - Click "View Details" on a patient journey
   - **Expected:** Modal/drawer opens with:
     - Patient information
     - Journey timeline
     - Contact history
     - Engagement metrics
     - Action buttons

3. **Quick Actions:**
   - Look for buttons like "Send WhatsApp", "Schedule Call", etc.
   - **Expected:** Buttons are visible (don't click yet, we'll test separately)

### Step 5: Check for Errors

**Open Browser Console (F12 → Console tab)**

**Look for:**
- ❌ Red error messages about missing tables
- ❌ Failed API requests
- ❌ JavaScript errors

**Common Issues & Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| "relation does not exist" | Missing table | Run MISSING_AI_TABLES.sql again |
| "No data found" | No sample data | Check if sample data was inserted |
| "Failed to fetch" | Network issue | Check internet connection |
| "Not authenticated" | Session expired | Logout and login again |

---

## 🧪 Test 2: Patient Education Manager

### Step 1: Access the Manager

1. **Navigate to:** Click "Patient Education" in sidebar
2. **Expected:** Patient Education Manager page loads

### Step 2: Verify Content List

**Expected to see:**
- ✅ Page title: "Patient Education Manager"
- ✅ "Add New Content" button
- ✅ List of 3 sample educational items:
  1. Understanding Appendectomy Surgery (video)
  2. Post-Surgery Recovery Tips (blog)
  3. Laparoscopic Surgery Benefits (article)

**Each content item should show:**
- Title
- Content type (video/blog/article)
- Description
- Status (active/inactive)
- Action buttons (Edit, Delete, View)

### Step 3: Test Content Creation

1. **Click:** "Add New Content" button
2. **Expected:** Form opens with fields:
   - Title
   - Content Type dropdown (video, blog, pdf, infographic, article)
   - Content URL
   - Description
   - Surgery Types (multi-select)
   - Tags
   - Thumbnail URL (optional)
   - Duration (for videos)

3. **Try adding test content:**
   - Title: "Test Content"
   - Type: "article"
   - Description: "This is a test"
   - Click "Save"

4. **Expected:**
   - Success message appears
   - New content appears in list
   - Can edit or delete it

### Step 4: Test Content Actions

**Try these:**
- Edit an existing content item
- Toggle active/inactive status
- Delete a test item (don't delete sample data!)
- View content details

---

## 🧪 Test 3: Surgery Options Configurator

### Step 1: Access the Configurator

1. **Navigate to:** Click "Surgery Options" in sidebar
2. **Expected:** Surgery Options Configurator page loads

### Step 2: Verify Diagnosis List

**Expected to see:**
- ✅ Page title: "Surgery Options Configurator"
- ✅ List of 4 sample diagnoses:
  1. Appendicitis (D001)
  2. Cholecystitis (D002)
  3. Hernia (D003)
  4. Kidney Stones (D004)

**Each diagnosis should show:**
- Code (e.g., D001)
- Name
- Category
- Severity
- "Configure Options" button

### Step 3: Configure Surgery Options

1. **Click:** "Configure Options" on any diagnosis (e.g., Appendicitis)
2. **Expected:** Form opens to add surgery options

**Form should have fields:**
- Surgery Name
- Procedure Type (laparoscopic, open, robotic, etc.)
- Procedure Details (text area)
- Indications
- Contraindications
- Risks (array)
- Benefits (array)
- Recovery Time (days)
- Hospital Stay (days)
- Cost Range (min/max)
- Success Rate (%)
- Anesthesia Type
- Post-op Care
- Is Recommended (checkbox)

3. **Try adding a surgery option:**
   - Surgery Name: "Laparoscopic Appendectomy"
   - Procedure Type: "laparoscopic"
   - Recovery Time: 7 days
   - Hospital Stay: 2 days
   - Cost Range: ₹25,000 - ₹50,000
   - Success Rate: 95%
   - Click "Save"

4. **Expected:**
   - Surgery option is created
   - Appears in list for that diagnosis
   - Can edit or delete it

### Step 4: Test Option Management

**Try these:**
- Add multiple surgery options for one diagnosis
- Edit an existing option
- Delete a test option
- Mark an option as "recommended"
- View all options for a diagnosis

---

## 🧪 Test 4: WhatsApp Integration (Advanced)

### Prerequisites

- Have DoubleTick API access
- Have a test phone number to send to
- API key is configured: `key_8sc9MP6JpQ`

### Step 1: Test from Patient Follow-Up Dashboard

1. **Navigate to:** Patient Follow-Up Dashboard
2. **Click:** "Send WhatsApp" button on a patient
3. **Expected:** WhatsApp send dialog opens

**Dialog should have:**
- Patient's phone number pre-filled
- Message template options
- Text input for custom message
- Send button

### Step 2: Send Test Message

1. **Select or write:** A test message
2. **Click:** "Send" button
3. **Expected:**
   - Loading indicator appears
   - Success message: "Message sent successfully"
   - Status updates in whatsapp_message_log table

### Step 3: Verify Message Delivery

**Check in Supabase:**

```sql
SELECT
    phone_number,
    message_text,
    status,
    sent_at,
    delivered_at
FROM whatsapp_message_log
ORDER BY sent_at DESC
LIMIT 5;
```

**Expected:**
- Status should progress: pending → sent → delivered → read
- Timestamps should be populated

**If it fails:**
- Check API key is correct
- Check phone number format (should be international: +91...)
- Check DoubleTick API logs

---

## 🧪 Test 5: End-to-End Patient Journey

### Complete Patient Follow-Up Flow

1. **Create a patient journey:**
   - Go to Patient Follow-Up
   - Add new patient journey (if feature exists)
   - Or use existing sample journey

2. **Send educational content:**
   - Select patient journey
   - Click "Send Content"
   - Choose a video/article from Patient Education
   - Send via WhatsApp

3. **Track engagement:**
   - Verify content appears in patient's tracking
   - Check engagement score updates
   - View content sent history

4. **Update journey stage:**
   - Change patient from "Education Phase" to "Decision Making"
   - Verify stage updates
   - Check if automated actions trigger (if implemented)

5. **Schedule follow-up:**
   - Add next contact date
   - Add notes about patient concerns
   - Save changes

---

## 📊 Test Results Template

Use this template to track your testing:

```markdown
# Test Results - 2025-10-26

## Test 1: Patient Follow-Up Dashboard
- [ ] Dashboard loads: ✅ / ❌
- [ ] Sample data visible: ✅ / ❌
- [ ] Filters work: ✅ / ❌
- [ ] View details works: ✅ / ❌
- [ ] No console errors: ✅ / ❌
- **Issues found:** [List any issues]

## Test 2: Patient Education Manager
- [ ] Page loads: ✅ / ❌
- [ ] Sample content visible: ✅ / ❌
- [ ] Add content works: ✅ / ❌
- [ ] Edit/Delete works: ✅ / ❌
- [ ] No console errors: ✅ / ❌
- **Issues found:** [List any issues]

## Test 3: Surgery Options Configurator
- [ ] Page loads: ✅ / ❌
- [ ] Diagnoses visible: ✅ / ❌
- [ ] Add option works: ✅ / ❌
- [ ] Edit/Delete works: ✅ / ❌
- [ ] No console errors: ✅ / ❌
- **Issues found:** [List any issues]

## Test 4: WhatsApp Integration
- [ ] Send dialog opens: ✅ / ❌ / N/A
- [ ] Message sends: ✅ / ❌ / N/A
- [ ] Delivery tracked: ✅ / ❌ / N/A
- **Issues found:** [List any issues]

## Overall Status
- **Features Working:** [X/3]
- **Critical Issues:** [Number]
- **Minor Issues:** [Number]
- **Ready for Demo:** ✅ / ❌
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: "No data found" in Patient Follow-Up

**Possible Causes:**
1. Sample data wasn't inserted
2. Foreign key constraints failed
3. RLS policies blocking access

**Fix:**
```sql
-- Check if data exists
SELECT COUNT(*) FROM patient_decision_journey;

-- If 0, run the INSERT from MISSING_AI_TABLES.sql again
```

### Issue: Console error "relation does not exist"

**Cause:** A table wasn't created

**Fix:**
1. Check which table is missing from error message
2. Run the appropriate SQL script again
3. Refresh the page

### Issue: "Not authenticated" errors

**Cause:** Session expired or RLS policy issue

**Fix:**
1. Logout and login again
2. Check that user ID matches in auth.users and public.users

### Issue: WhatsApp send fails

**Cause:** API configuration or network

**Fix:**
1. Verify API key is correct in .env
2. Check phone number format (+91...)
3. Test API directly using curl or Postman
4. Check DoubleTick dashboard for errors

---

## ✅ Success Criteria

**The system is working correctly if:**

1. ✅ All 3 AI features load without errors
2. ✅ Sample data is visible in all features
3. ✅ Can create, edit, and delete items
4. ✅ No console errors (minor warnings OK)
5. ✅ Patient journeys show engagement metrics
6. ✅ Educational content can be managed
7. ✅ Surgery options can be configured
8. ✅ WhatsApp integration works (or is properly stubbed)

**Ready for demo if:**
- At least 2/3 features fully working
- No critical bugs
- Sample data looks realistic
- UI is responsive and polished

---

## 📝 Next Steps After Testing

### If all tests pass:
1. ✅ Document any minor issues
2. ✅ Add more sample data for demos
3. ✅ Prepare demo script
4. ✅ Deploy to production

### If tests fail:
1. Document errors with screenshots
2. Share error messages from console
3. Check which SQL scripts were run
4. Re-run any failed migrations
5. Contact support with details

---

**Start testing now and report back with results!** 🚀
