# Appointment Query Fix - Complete

## Problem Summary

Doctor dashboard was showing **0 appointments** even though appointments existed in the database. The issue was caused by schema mismatches between the application queries and the actual database structure.

## Root Causes Identified

### 1. Column Name Mismatch
- **Application was querying**: `appointment_date` and `appointment_time` (separate columns)
- **Database actually has**: `start_at` and `end_at` (timestamp columns)
- **Result**: Queries were failing with 400 errors

### 2. Foreign Key Syntax Error
- **Application was using**: `patient:patient_id(...)` (incorrect Supabase syntax)
- **Correct syntax**: `patients!patient_id(...)` (using table name with `!` for foreign key)
- **Result**: 400 Bad Request errors from Supabase REST API

### 3. Missing Columns in Patient Query
- **Application was querying**: `profile_photo_url` from patients table
- **Database has**: Only `id`, `first_name`, `last_name`, `phone`
- **Result**: 400 errors for non-existent columns

## Fixes Applied

### 1. Updated Appointment Interface
Changed from:
```typescript
interface Appointment {
  appointment_date: string;
  appointment_time: string;
  // ...
}
```

To:
```typescript
interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;  // ISO timestamp
  end_at: string;    // ISO timestamp
  status: string;
  appointment_type?: string;
  mode?: string;
  symptoms?: string;
  reason?: string;
  notes?: string;
  meeting_link?: string;
  patient?: Patient;
  patients?: Patient; // Supabase foreign key syntax
}
```

### 2. Fixed `fetchTodayAppointments` Query
**Before**:
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    patient:patient_id (
      id,
      first_name,
      last_name,
      profile_photo_url,
      phone
    )
  `)
  .eq('doctor_id', doctorId)
  .eq('appointment_date', today)
  .order('appointment_time', { ascending: true });
```

**After**:
```typescript
const today = format(new Date(), 'yyyy-MM-dd');
const startOfToday = `${today}T00:00:00`;
const endOfToday = `${today}T23:59:59`;

const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    patients!patient_id (
      id,
      first_name,
      last_name,
      phone
    )
  `)
  .eq('doctor_id', doctorId)
  .gte('start_at', startOfToday)
  .lte('start_at', endOfToday)
  .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
  .order('start_at', { ascending: true });
```

### 3. Fixed `fetchUpcomingAppointments` Query
**Before**:
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('appointment_date')
  .eq('doctor_id', doctorId)
  .gte('appointment_date', tomorrow)
  .lte('appointment_date', weekEnd);

// Group by date
grouped.set(apt.appointment_date, ...);
```

**After**:
```typescript
const startOfTomorrow = `${tomorrow}T00:00:00`;
const endOfWeek = `${weekEnd}T23:59:59`;

const { data, error } = await supabase
  .from('appointments')
  .select('start_at')
  .eq('doctor_id', doctorId)
  .gte('start_at', startOfTomorrow)
  .lte('start_at', endOfWeek);

// Group by date
const dateKey = format(new Date(apt.start_at), 'yyyy-MM-dd');
grouped.set(dateKey, ...);
```

### 4. Fixed `fetchStats` Query
**Before**:
```typescript
const { count: todayCount } = await supabase
  .from('appointments')
  .select('*', { count: 'exact', head: true })
  .eq('doctor_id', doctorId)
  .eq('appointment_date', today);

const { count: weekCount } = await supabase
  .from('appointments')
  .select('*', { count: 'exact', head: true })
  .eq('doctor_id', doctorId)
  .gte('appointment_date', today)
  .lte('appointment_date', weekEnd);
```

**After**:
```typescript
const startOfToday = `${today}T00:00:00`;
const endOfToday = `${today}T23:59:59`;

const { count: todayCount } = await supabase
  .from('appointments')
  .select('*', { count: 'exact', head: true })
  .eq('doctor_id', doctorId)
  .gte('start_at', startOfToday)
  .lte('start_at', endOfToday);

const endOfWeek = `${weekEnd}T23:59:59`;

const { count: weekCount } = await supabase
  .from('appointments')
  .select('*', { count: 'exact', head: true })
  .eq('doctor_id', doctorId)
  .gte('start_at', startOfToday)
  .lte('start_at', endOfWeek);
```

### 5. Fixed Display Time Format
**Before**:
```typescript
<div className="flex items-center text-sm text-gray-600 mt-1">
  <Clock className="h-3 w-3 mr-1" />
  {appointment.appointment_time}
</div>
```

**After**:
```typescript
<div className="flex items-center text-sm text-gray-600 mt-1">
  <Clock className="h-3 w-3 mr-1" />
  {format(new Date(appointment.start_at), 'h:mm a')}
</div>
```

### 6. Fixed Realtime Subscription Handler
**Before**:
```typescript
const today = format(new Date(), 'yyyy-MM-dd');
if (newAppointment.appointment_date === today) {
  setTodayAppointments((prev) => [...prev, newAppointment].sort((a, b) =>
    a.appointment_time.localeCompare(b.appointment_time)
  ));
  toast.success(`New appointment booked: ${newAppointment.appointment_time}`);
}
```

**After**:
```typescript
const today = format(new Date(), 'yyyy-MM-dd');
const appointmentDate = format(new Date(newAppointment.start_at), 'yyyy-MM-dd');
if (appointmentDate === today) {
  setTodayAppointments((prev) => [...prev, newAppointment].sort((a, b) =>
    new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  ));
  toast.success(`New appointment booked: ${format(new Date(newAppointment.start_at), 'h:mm a')}`);
}
```

## Database Schema Verification

The actual database schema for appointments table:
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id),
  patient_id UUID REFERENCES patients(id),
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  appointment_date DATE,  -- Also exists for backward compatibility
  status TEXT,
  appointment_type TEXT,
  mode TEXT,
  symptoms TEXT,
  reason TEXT,
  notes TEXT,
  meeting_link TEXT,
  meeting_platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Note**: Both `start_at`/`end_at` AND `appointment_date` exist in the database, but we're using `start_at`/`end_at` as the primary source of truth since they contain full timestamp information.

## Testing Instructions

### 1. Verify Appointments Display
1. Log in as Dr. Priya Sharma (priya.sharma@aisurgeonpilot.com)
2. Navigate to Doctor Dashboard
3. Check if today's appointments show up in the "Today's Appointments" section
4. Verify the time is displayed correctly (e.g., "3:30 PM")
5. Check if patient names and phone numbers are visible

### 2. Verify Stats Cards
1. Check "Total Patients" count (should show unique patient count)
2. Check "Today's Consultations" (completed appointments for today)
3. Check "This Week's Appointments" (upcoming appointments in next 7 days)

### 3. Verify Upcoming Calendar
1. Check "Next 7 Days" section shows appointment counts per day
2. Verify dates are formatted correctly

### 4. Test Realtime Updates
1. Book a new appointment for today
2. Verify it appears immediately in the dashboard
3. Check toast notification shows correct time

## SQL Test Query

To verify appointments exist in the database:
```sql
SELECT
  a.id,
  a.start_at,
  a.end_at,
  a.appointment_date,
  a.status,
  p.first_name,
  p.last_name,
  p.phone
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.doctor_id = '24bef328-5116-443f-8bd2-e9c45f497d3b'
  AND DATE(a.start_at) = CURRENT_DATE
ORDER BY a.start_at ASC;
```

## Files Modified

- `/src/pages/doctor/DoctorDashboard.tsx` - Main dashboard component
  - Updated Appointment interface
  - Fixed `fetchTodayAppointments` query
  - Fixed `fetchUpcomingAppointments` query
  - Fixed `fetchStats` query
  - Fixed display time format
  - Fixed realtime subscription handler
  - Fixed TypeScript errors

## Expected Results

After these fixes:
- ✅ Appointments should display in doctor dashboard
- ✅ Patient names and phone numbers should show correctly
- ✅ Appointment times should be formatted as "3:30 PM", "6:50 AM", etc.
- ✅ Stats cards should show accurate counts
- ✅ Upcoming appointments calendar should populate
- ✅ No more 400 errors in browser console
- ✅ No TypeScript errors in the codebase
- ✅ Realtime updates should work correctly

## Next Steps

1. **Test the dashboard** - Refresh the browser and verify appointments appear
2. **Check browser console** - Ensure no 400 errors remain
3. **Book a test appointment** - Verify realtime updates work
4. **Verify all stats** - Check total patients, consultations, and upcoming counts

## Local Testing URL

🔗 **http://localhost:8081/**

Log in with:
- Email: priya.sharma@aisurgeonpilot.com
- Password: [your password]
