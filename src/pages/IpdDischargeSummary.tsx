import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface MedicationRow {
  id: string;
  name: string;
  unit: string;
  remark: string;
  route: string;
  dose: string;
  quantity: string;
  days: string;
  startDate: string;
  timing: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
  };
  isSos: boolean;
}

// Helper function to extract value from JSON or return as-is
const extractValueFromJSON = (data: any): string => {
  // If null/undefined, return 'N/A'
  if (data === null || data === undefined) {
    return 'N/A';
  }

  // If it's already a plain string without JSON, return it
  if (typeof data === 'string' && !data.includes('{') && !data.includes('"value"')) {
    return data.trim();
  }

  // If it's an object, extract the value field
  if (typeof data === 'object' && !Array.isArray(data)) {
    return String(data.value || data.val || 'N/A');
  }

  // If it's a string that looks like JSON, parse it
  if (typeof data === 'string') {
    const trimmed = data.trim();

    // Try to parse as JSON
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return String(parsed.value || parsed.val || 'N/A');
        }
      } catch (e) {
        // If JSON parse fails, try regex extraction
        const match = trimmed.match(/"value"\s*:\s*"?([^",}]+)"?/);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return trimmed;
  }

  // Fallback: convert to string
  return String(data);
};

// Helper function to clean JSON from text
const cleanJSONFromText = (text: string): string => {
  if (!text) return text;

  console.log('🧹 Cleaning JSON from text, length:', text.length);
  console.log('🔍 First 200 chars:', text.substring(0, 200));

  let cleaned = text;

  // Pattern 1: Match complete JSON objects with "value" field
  // Handles: {"value":"15","timestamp":"2025-10-03T11:47:36.408Z","entry_time":"...","session_id":"..."}
  // This pattern captures the entire JSON object and replaces it with just the value
  const pattern1 = /\{[^}]*?"value"\s*:\s*"?([^",}]+)"?[^}]*?\}/gi;
  let count1 = 0;
  cleaned = cleaned.replace(pattern1, (match, value) => {
    count1++;
    console.log(`✂️ Pattern 1 Match ${count1}:`, match.substring(0, 100) + '...');
    console.log(`   Extracted value: "${value}"`);
    return value.trim();
  });

  // Pattern 2: Handle any remaining JSON-like structures with curly braces
  const pattern2 = /\{[^}]*?"timestamp"[^}]*?\}/gi;
  let count2 = 0;
  cleaned = cleaned.replace(pattern2, (match) => {
    count2++;
    console.log(`✂️ Pattern 2 Match ${count2}: Removing remaining JSON object`);
    return '';
  });

  // Pattern 3: Clean up any double commas or spaces left behind
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/:\s*,/g, ':');
  cleaned = cleaned.replace(/,\s*\)/g, ')');

  console.log('✅ Cleaning complete.');
  console.log(`   Original length: ${text.length}`);
  console.log(`   New length: ${cleaned.length}`);
  console.log(`   Pattern 1 matches: ${count1}, Pattern 2 matches: ${count2}`);
  console.log('🔍 First 200 chars after cleaning:', cleaned.substring(0, 200));

  return cleaned;
};

const IpdDischargeSummary = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hospitalConfig } = useAuth();

  // Fetch consultants based on hospital
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants', hospitalConfig.name],
    queryFn: async () => {
      const tableName = hospitalConfig.name === 'hope' ? 'hope_consultants' : 'ayushman_consultants';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching consultants:', error);
        return [];
      }

      return data || [];
    }
  });

  // Force complete cache clear and component refresh
  React.useEffect(() => {
    console.log('🔄 IpdDischargeSummary component mounted - clearing all caches for visitId:', visitId);

    // Clear all React Query cache
    try {
      queryClient.clear();
      queryClient.invalidateQueries();
      queryClient.removeQueries();

      // Clear any specific queries that might still exist
      queryClient.removeQueries({ queryKey: ['patient-discharge-data'] });
      queryClient.removeQueries({ queryKey: ['patient-discharge-data-simple'] });
      queryClient.removeQueries({ queryKey: ['investigations-data'] });

      // Clear browser storage that might contain cached queries
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        // Clear only react-query related items from localStorage to avoid breaking other functionality
        Object.keys(localStorage).forEach(key => {
          if (key.includes('react-query') || key.includes('discharge') || key.includes('investigation')) {
            localStorage.removeItem(key);
          }
        });
      }

      console.log('✅ All React Query caches and storage cleared');
    } catch (error) {
      console.log('Cache clearing completed with minor issues:', error);
    }
  }, [visitId, queryClient]);

  // Patient Info States
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    address: '',
    regId: '',
    ageSex: '',
    treatingConsultant: '',
    otherConsultants: '',
    doa: '',
    dateOfDischarge: '',
    reasonOfDischarge: 'Please select',
    corporateType: ''
  });

  // Diagnosis States
  const [diagnosis, setDiagnosis] = useState('');

  // Treatment on Discharge States
  const [medicationRows, setMedicationRows] = useState<MedicationRow[]>([
    {
      id: '1',
      name: '',
      unit: '',
      remark: '',
      route: 'Select',
      dose: 'Select',
      quantity: '',
      days: '0',
      startDate: '',
      timing: { morning: false, afternoon: false, evening: false, night: false },
      isSos: false
    }
  ]);

  // Examination States
  const [examination, setExamination] = useState({
    temp: '',
    pr: '',
    rr: '',
    bp: '',
    spo2: '',
    details: ''
  });
  const [examinationTemplates] = useState([
    'CVS - S1S2 Normal, P/A - Tenderness, CNS : Conscious/Oriented, RS- Clear'
  ]);

  // Investigations States
  const [investigations, setInvestigations] = useState('');
  const [printRecentOnly, setPrintRecentOnly] = useState(false);

  // Surgery Details States
  const [surgeryDetails, setSurgeryDetails] = useState({
    date: '',
    procedurePerformed: '',
    surgeon: '',
    anesthetist: '',
    anesthesia: '',
    implant: '',
    description: ''
  });


  // OT Notes States
  const [stayNotes, setStayNotes] = useState('');
  const [stayNotesTemplates, setStayNotesTemplates] = useState([
    {
      name: 'discharge_summary',
      content: `Ignore all previous instructions.You are a medical specialist, Make a professionally written Discharge summary that will show off the power of chatgpt.: Make up facts..Add findings which are not provided to you. Come up with creative complaints, events during the stay in hospital and relevant examination findings, add medications to be given on discharge in indIan BRANDS. The entire document should be a minimum of 800 words. Use headings, subheadings, bullet points, and bold to organize the information. The person who will read the summary is another doctor. Advice appropriate precautions to be taken at home after discharge. Also advice to return to hospital in case of any or all the complications of surgery performed or medical treatment taken which was noticed after discharge. List the symptoms and signs of these complications.Do not mention the name, sex or age of the patient. Add the sentence at the end :URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT:-7030974619, 9373111709. If a surgery was performed, Come up with creative note which should be a minimum of 6 rows in a table . OPERATION NOTES should be in a table form only if a surgery was performed. It has to contain the date and time of surgery in first row, The second row should contain the title as in the message. The third row has to contain the name of surgeon. The fourth row has to contain the name of anaesthetist. Fifth row has to contain the type of anaesthesia, sixth row should detailed description of the surgery.The person who is going to read what you share will be a doctor.In the begining make a list of Medications with detailed instructions like once a day, twice a day ot thrice a day. This patient does not have comoprbidities other than that is mentioned.The medication should be at the begining of summary and in table form with columns for name , strength, route , dosage and the number of days to be taken. Another line in hindi to be added in the column of dosage in addition to english. The diagnosis should be in the begining of the summary before the medication table`
    }
  ]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  // New states for Advice and Case Summary
  const [advice, setAdvice] = useState('');
  const [caseSummaryPresentingComplaints, setCaseSummaryPresentingComplaints] = useState('');
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [editingTemplateContent, setEditingTemplateContent] = useState('');
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  // Preview Modal States
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');


  // Treatment During Hospital Stay States
  const [treatmentCondition, setTreatmentCondition] = useState('Satisfactory');
  const [treatmentStatus, setTreatmentStatus] = useState('Please select');
  const [reviewDate, setReviewDate] = useState('2025-09-26');
  const [residentOnDischarge, setResidentOnDischarge] = useState('Please select');
  const [enableSmsAlert, setEnableSmsAlert] = useState(false);

  // Fetch patient data using the same query structure as IPD Dashboard
  const { data: patientData, isLoading: isPatientLoading, error: patientError } = useQuery({
    queryKey: ['patient-discharge-data', visitId],
    queryFn: async () => {
      try {
        console.log('🏥 IPD Discharge Summary: Fetching data for visit_id:', visitId);

        // Use the EXACT same query structure as IPD Dashboard
        // Search by visit_id (not id) and join with patients table
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients!inner(
              id,
              name,
              patients_id,
              hospital_name,
              corporate,
              age,
              gender,
              address,
              phone
            )
          `)
          .eq('visit_id', visitId)
          .eq('patient_type', 'IPD')
          .single();

        if (visitError) {
          console.log('❌ Visit not found with visit_id:', visitId, visitError.message);

          // Fallback: Check if there's lab data for this visit_id
          const { data: labData } = await supabase
            .from('lab_results')
            .select('patient_name, patient_age, patient_gender, created_at')
            .eq('visit_id', visitId)
            .limit(1);

          if (labData && labData.length > 0) {
            console.log('✅ Found lab results, creating fallback data');
            const labResult = labData[0];

            return {
              id: visitId,
              visit_id: visitId,
              patient_type: 'IPD',
              admission_date: labResult.created_at,
              discharge_date: null,
              created_at: labResult.created_at,
              patients: {
                id: 'lab-derived',
                name: labResult.patient_name || 'Lab Patient',
                patients_id: visitId.replace(/[A-Za-z]/g, ''), // Extract numbers only
                age: labResult.patient_age,
                gender: labResult.patient_gender,
                address: 'Address from lab records',
                hospital_name: null,
                corporate: null
              },
              dataSource: 'lab-results'
            };
          }

          // If no lab data either, throw error to show fallback form
          throw new Error(`Visit ID ${visitId} not found`);
        }

        console.log('✅ Found visit data with patients:', visitData);

        // Get discharge summary if exists
        const { data: summaryData } = await supabase
          .from('discharge_summaries')
          .select('*')
          .eq('visit_id', visitId)
          .single();

        if (summaryData) {
          console.log('✅ Found existing discharge summary');
        }

        return {
          ...visitData,
          dischargeSummary: summaryData,
          dataSource: 'dashboard-compatible'
        };

      } catch (error) {
        console.log('❌ Error in patient data fetch:', error.message);
        throw error;
      }
    },
    enabled: !!visitId,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  // Fetch real lab results from database using visit_id
  const { data: labResultsData, isLoading: isLabResultsLoading } = useQuery({
    queryKey: ['lab-results', visitId],
    queryFn: async () => {
      console.log('🧪 Fetching lab results for visit_id:', visitId);

      let data, error;

      // First, try to find the UUID for this visit_id string
      console.log('🔍 Looking for visit UUID for visit_id:', visitId);
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      const visitUUID = visitData?.id;
      console.log('📋 Found visit UUID:', visitUUID);

      // Try to get lab results using the UUID
      if (visitUUID) {
        console.log('🧪 Searching lab results using UUID:', visitUUID);
        const result = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            patient_name,
            patient_age,
            patient_gender,
            created_at
          `)
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false });

        data = result.data;
        error = result.error;
      } else {
        // Fallback: search by patient name if available from patientData
        if (patientData?.patients?.name) {
          console.log('🔍 Searching lab results by patient name:', patientData.patients.name);
          const result = await supabase
            .from('lab_results')
            .select(`
              id,
              visit_id,
              test_name,
              test_category,
              result_value,
              result_unit,
              main_test_name,
              patient_name,
              patient_age,
              patient_gender,
              created_at
            `)
            .ilike('patient_name', `%${patientData.patients.name}%`)
            .order('created_at', { ascending: false })
            .limit(10);

          data = result.data;
          error = result.error;
        } else {
          data = [];
          error = { message: 'No visit UUID found and no patient name available' };
        }
      }

      if (error) {
        console.log('❌ No lab results found for visit_id:', visitId, error.message);
        return {
          rawData: [],
          groupedResults: {},
          formattedResults: `No lab results found for visit ID: ${visitId}`
        };
      }

      console.log('✅ Lab results data found:', data?.length || 0, 'results');

      if (!data || data.length === 0) {
        return {
          rawData: [],
          groupedResults: {},
          formattedResults: 'No lab results found for this visit. Lab data will be populated when available.'
        };
      }

      // Group results by date and main test category
      const groupedResults = data.reduce((acc, result) => {
        const date = result.created_at;
        const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

        if (!acc[formattedDate]) {
          acc[formattedDate] = {};
        }

        const category = result.main_test_name || result.test_category || 'General Tests';
        if (!acc[formattedDate][category]) {
          acc[formattedDate][category] = [];
        }

        acc[formattedDate][category].push(result);
        return acc;
      }, {});

      // Format according to the requested format: "03/11/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl"
      const formattedResults = Object.entries(groupedResults)
        .map(([date, categories]) => {
          return Object.entries(categories)
            .map(([categoryName, results]) => {
              const resultString = results
                .map(result => {
                  const value = result.result_value || 'N/A';
                  const unit = result.result_unit ? ` ${result.result_unit}` : '';
                  return `${result.test_name}:${value}${unit}`;
                })
                .join(', ');

              return `${date}:-${categoryName}: ${resultString}`;
            })
            .join('\n');
        })
        .join('\n\n');

      return {
        rawData: data,
        groupedResults,
        formattedResults
      };
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch radiology data from database using visit_id (or UUID)
  const { data: radiologyData, isLoading: isRadiologyLoading } = useQuery({
    queryKey: ['radiology-data', visitId, patientData?.id],
    queryFn: async () => {
      console.log('🩻 Fetching radiology data for visit_id:', visitId);

      // First, let's try to get radiology data using the visit's UUID (from patientData)
      let radiologyResults = [];

      if (patientData?.id) {
        console.log('🔍 Trying radiology lookup with visit UUID:', patientData.id);
        const { data: radiologyViaUUID, error: radiologyUUIDError } = await supabase
          .from('visit_radiology')
          .select(`
            id,
            status,
            ordered_date,
            scheduled_date,
            completed_date,
            findings,
            impression,
            notes,
            radiology!inner(
              id,
              name,
              category,
              description
            )
          `)
          .eq('visit_id', patientData.id)
          .order('ordered_date', { ascending: false });

        if (!radiologyUUIDError && radiologyViaUUID && radiologyViaUUID.length > 0) {
          radiologyResults = radiologyViaUUID;
          console.log('✅ Found radiology data via visit UUID:', radiologyResults.length, 'studies');
        }
      }

      // If no results with UUID, try with visit_id in radiology_orders table (complex system)
      if (radiologyResults.length === 0) {
        console.log('🔍 Trying radiology lookup in radiology_orders with visit_id:', visitId);
        const { data: radiologyOrders } = await supabase
          .from('radiology_orders')
          .select(`
            id,
            order_number,
            priority,
            clinical_indication,
            clinical_history,
            order_date,
            scheduled_date,
            status,
            notes,
            radiology_procedures!inner(
              id,
              name,
              code,
              modality_id,
              body_part
            )
          `)
          .eq('patient_id', patientData?.patients?.id || visitId)
          .order('order_date', { ascending: false });

        if (radiologyOrders && radiologyOrders.length > 0) {
          // Convert to similar format as visit_radiology
          radiologyResults = radiologyOrders.map(order => ({
            id: order.id,
            status: order.status,
            ordered_date: order.order_date,
            scheduled_date: order.scheduled_date,
            completed_date: null,
            findings: null,
            impression: null,
            notes: order.notes,
            radiology: {
              id: order.radiology_procedures.id,
              name: order.radiology_procedures.name,
              category: order.radiology_procedures.body_part || 'Radiology',
              description: order.clinical_indication
            }
          }));
          console.log('✅ Found radiology data via radiology_orders:', radiologyResults.length, 'orders');
        }
      }

      if (radiologyResults.length === 0) {
        return {
          rawData: [],
          formattedResults: 'No radiology studies found for this visit. Radiology data will be populated when available.'
        };
      }

      // Group results by date and category
      const groupedResults = radiologyResults.reduce((acc, result) => {
        const date = result.ordered_date || result.scheduled_date;
        const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

        if (!acc[formattedDate]) {
          acc[formattedDate] = {};
        }

        const category = result.radiology.category || 'Radiology';
        if (!acc[formattedDate][category]) {
          acc[formattedDate][category] = [];
        }

        acc[formattedDate][category].push(result);
        return acc;
      }, {});

      // Format according to a similar pattern as lab results
      const formattedResults = Object.entries(groupedResults)
        .map(([date, categories]) => {
          return Object.entries(categories)
            .map(([categoryName, studies]) => {
              const studyString = studies
                .map(study => {
                  const name = study.radiology.name;
                  const status = study.status ? ` (${study.status})` : '';
                  const findings = study.findings ? `, Findings: ${study.findings}` : '';
                  const impression = study.impression ? `, Impression: ${study.impression}` : '';
                  return `${name}${status}${findings}${impression}`;
                })
                .join(', ');

              return `${date}:-${categoryName}: ${studyString}`;
            })
            .join('\n');
        })
        .join('\n\n');

      return {
        rawData: radiologyResults,
        formattedResults
      };
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch real surgery data for this visit - moved after patient data query
  const { data: visitSurgeryData, isLoading: isSurgeryLoading } = useQuery({
    queryKey: ['visit-surgery-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🔪 Fetching surgery data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for surgery data fetch');
        return null;
      }

      console.log('🔍 Fetching surgery data with visit UUID:', visitUUID);

      try {
        const { data, error } = await supabase
          .from('visit_surgeries')
          .select(`
            *,
            cghs_surgery:surgery_id (
              name,
              code,
              NABH_NABL_Rate,
              description
            )
          `)
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('❌ Error fetching surgery data:', error.message);
          return null;
        }

        console.log('✅ Surgery data found:', data?.length || 0, 'surgeries');
        console.log('🔍 Raw surgery data:', JSON.stringify(data, null, 2));
        return data;
      } catch (error) {
        console.log('❌ Surgery query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch OT Notes data to get surgeon, anesthetist, implant info
  const { data: otNotesData, isLoading: isOtNotesLoading } = useQuery({
    queryKey: ['ot-notes-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🏥 Fetching OT Notes data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID for OT notes:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for OT notes fetch');
        return null;
      }

      console.log('🔍 Fetching OT notes with visit UUID:', visitUUID);

      try {
        const { data, error } = await supabase
          .from('ot_notes')
          .select('*')
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.log('❌ Error fetching OT notes:', error.message);
          return null;
        }

        console.log('✅ OT Notes data found:', data?.length || 0, 'records');
        console.log('🔍 Raw OT notes data:', JSON.stringify(data, null, 2));
        return data?.[0] || null;
      } catch (error) {
        console.log('❌ OT notes query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch diagnosis data from billing system
  const { data: visitDiagnosisData, isLoading: isDiagnosisLoading } = useQuery({
    queryKey: ['visit-diagnosis-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🏥 Fetching diagnosis data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID for diagnosis:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for diagnosis fetch');
        return null;
      }

      console.log('🔍 Fetching diagnosis with visit UUID:', visitUUID);

      try {
        // First, let's check if there's any data in visit_diagnoses for this visit
        const { data: allVisitDiagnoses, error: checkError } = await supabase
          .from('visit_diagnoses')
          .select('*')
          .eq('visit_id', visitUUID);

        console.log('🔍 All visit_diagnoses for UUID:', visitUUID, allVisitDiagnoses);

        // Fetch diagnosis data with proper join
        const { data, error } = await supabase
          .from('visit_diagnoses')
          .select(`
            id,
            visit_id,
            diagnosis_id,
            is_primary,
            notes,
            created_at,
            diagnoses!visit_diagnoses_diagnosis_id_fkey (
              id,
              name
            )
          `)
          .eq('visit_id', visitUUID)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.log('❌ Error fetching diagnosis data:', error.message);
          return null;
        }

        console.log('✅ Diagnosis data found:', data?.length || 0, 'diagnoses');
        console.log('🔍 Detailed diagnosis data:', JSON.stringify(data, null, 2));

        // Also check what's in visit_diagnoses table without join
        if (!data || data.length === 0) {
          console.log('🔍 No data found, checking visit_diagnoses table directly...');
          const { data: rawData } = await supabase
            .from('visit_diagnoses')
            .select('*');
          console.log('🔍 All visit_diagnoses in table:', rawData);
        }

        return data;
      } catch (error) {
        console.log('❌ Diagnosis query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  const isInvestigationsLoading = isLabResultsLoading || isRadiologyLoading;

  // Fetch existing discharge summary data for editing
  const { data: existingDischargeSummary, isLoading: isLoadingDischargeSummary } = useQuery({
    queryKey: ['existing-discharge-summary', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('📋 Loading existing discharge summary for visit:', visitId);

      try {
        // First get visit UUID from string visit_id
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (!visitData?.id) {
          console.log('📋 Visit UUID not found');
          return null;
        }

        // Get main discharge summary from ipd_discharge_summary table
        const { data: summaryData, error: summaryError } = await supabase
          .from('ipd_discharge_summary')
          .select('*')
          .eq('visit_id', visitData.id)
          .single();

        if (summaryError) {
          if (summaryError.code === 'PGRST116') {
            console.log('📋 No existing discharge summary found - creating new one');
            return null;
          }
          throw summaryError;
        }

        console.log('📋 Found existing discharge summary:', summaryData.id);

        // Extract data from JSONB columns
        const medicationsData = summaryData.discharge_medications || [];
        const examinationData = summaryData.vital_signs || null;
        const surgeryData = summaryData.procedures_performed || null;

        console.log('📋 Loaded discharge summary data:', {
          summary: !!summaryData,
          medications: medicationsData?.length || 0,
          examination: !!examinationData,
          surgery: !!surgeryData
        });

        return {
          summary: summaryData,
          medications: medicationsData,
          examination: examinationData,
          surgery: surgeryData
        };

      } catch (error) {
        console.error('❌ Error loading existing discharge summary:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch medications for the searchable dropdown
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('');
  const [activeSearchRowId, setActiveSearchRowId] = useState(null);
  const { data: availableMedications = [] } = useQuery({
    queryKey: ['medications', medicationSearchTerm],
    queryFn: async () => {
      if (!medicationSearchTerm || medicationSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('medicine_master')
        .select('id, medicine_name, generic_name, type, mrp_price, selling_price, manufacturer:manufacturer_companies(name)')
        .or(`medicine_name.ilike.%${medicationSearchTerm}%,generic_name.ilike.%${medicationSearchTerm}%,type.ilike.%${medicationSearchTerm}%`)
        .eq('hospital_name', hospitalConfig.fullName)
        .eq('is_deleted', false)
        .order('medicine_name')
        .limit(10);

      if (error) {
        console.error('Error fetching medications:', error);
        return [];
      }

      return data || [];
    },
    enabled: medicationSearchTerm.length >= 2,
    staleTime: 30000
  });

  // Update patient info when data is loaded
  useEffect(() => {
    if (patientData) {
      const patient = patientData.patients;
      const summary = patientData.dischargeSummary;

      setPatientInfo({
        name: patient?.name || 'Unknown Patient',
        address: patient?.address || '',
        regId: patient?.patients_id || patientData.id || '',
        ageSex: `${patient?.age || 'N/A'} Years / ${patient?.gender || 'N/A'}`,
        treatingConsultant: patientData.doctor_name || patientData.appointment_with || 'Unknown Doctor',
        otherConsultants: summary?.other_consultants || '',
        doa: patientData.admission_date ? format(new Date(patientData.admission_date), 'yyyy-MM-dd') : patientData.created_at ? format(new Date(patientData.created_at), 'yyyy-MM-dd') : '',
        // Set discharge date to current date if not already set
        dateOfDischarge: patientData.discharge_date ? format(new Date(patientData.discharge_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        reasonOfDischarge: summary?.reason_of_discharge || 'Please select',
        // Fetch corporate type from patients table
        corporateType: patient?.corporate || patient?.corporate_type || patient?.insurance_company || ''
      });

      // Load existing discharge summary data if available
      if (summary) {
        if (summary.diagnosis) setDiagnosis(summary.diagnosis);
        if (summary.investigations) setInvestigations(summary.investigations);
        if (summary.stay_notes) setStayNotes(summary.stay_notes);

        if (summary.medications) {
          try {
            const meds = JSON.parse(summary.medications);
            if (Array.isArray(meds)) {
              setMedicationRows(meds);
            }
          } catch (e) {
            console.log('Error parsing medications:', e);
          }
        }

        if (summary.examination_data) {
          try {
            const examData = JSON.parse(summary.examination_data);
            setExamination(examData);
          } catch (e) {
            console.log('Error parsing examination data:', e);
          }
        }

        if (summary.surgery_details) {
          try {
            const surgeryData = JSON.parse(summary.surgery_details);
            setSurgeryDetails(surgeryData);
          } catch (e) {
            console.log('Error parsing surgery details:', e);
          }
        }
      }

      // Set vital signs from visit data if available and no examination data in summary
      if (patientData.vital_signs && !summary?.examination_data) {
        try {
          const vitals = JSON.parse(patientData.vital_signs);
          setExamination(prev => ({
            ...prev,
            temp: vitals.temperature || prev.temp,
            pr: vitals.pulse_rate || prev.pr,
            rr: vitals.respiratory_rate || prev.rr,
            bp: vitals.blood_pressure || prev.bp,
            spo2: vitals.oxygen_saturation || prev.spo2,
          }));
        } catch (e) {
          console.log('No vital signs data to parse');
        }
      }
    }
  }, [patientData]);

  // Update investigations with lab and radiology results data
  useEffect(() => {
    const combinedResults = [];

    // Add lab results
    if (labResultsData && labResultsData.formattedResults && labResultsData.formattedResults !== 'No lab results found for this visit. Lab data will be populated when available.') {
      combinedResults.push(labResultsData.formattedResults);
    }

    // Add radiology results
    if (radiologyData && radiologyData.formattedResults && radiologyData.formattedResults !== 'No radiology studies found for this visit. Radiology data will be populated when available.') {
      combinedResults.push(radiologyData.formattedResults);
    }

    if (combinedResults.length > 0) {
      const combinedInvestigations = combinedResults.join('\n\n--- RADIOLOGY ---\n\n');
      setInvestigations(combinedInvestigations);
    } else if (!investigations || investigations === 'Investigation details will be populated here...' || investigations.includes('Lab and radiology investigations will be populated here')) {
      setInvestigations('Lab and radiology investigations will be populated here when data is available.');
    }
  }, [labResultsData, radiologyData, investigations]);

  // Update surgery details when data is loaded (combine visit_surgeries + ot_notes data)
  // This runs after existing discharge summary is loaded to potentially override placeholder values
  useEffect(() => {
    if (visitSurgeryData && visitSurgeryData.length > 0) {
      // Check if current surgery details contain placeholder values
      const hasPlaceholderValues =
        surgeryDetails.surgeon === 'yyy' ||
        surgeryDetails.anesthetist === 'yyyy' ||
        surgeryDetails.procedurePerformed === 'Ivy' ||
        !surgeryDetails.procedurePerformed ||
        surgeryDetails.procedurePerformed === 'Ivy';

      // Only update if current details are empty or contain placeholder values
      if (!surgeryDetails.procedurePerformed || hasPlaceholderValues) {
      try {
        const surgery = visitSurgeryData[0]; // Get the first/primary surgery
        const surgeryInfo = surgery?.cghs_surgery;

        // Prefer OT notes data for surgeon, anesthetist, implant info, fallback to surgery table
        const surgeon = otNotesData?.surgeon || surgery?.surgeon || '';
        const anesthetist = otNotesData?.anaesthetist || surgery?.anaesthetist_name || '';
        const anesthesia = otNotesData?.anaesthesia || surgery?.anaesthesia_type || '';
        const implant = otNotesData?.implant || surgery?.implant || '';

        // Use OT notes date if available, otherwise surgery date
        const surgeryDate = (otNotesData?.date ? new Date(otNotesData.date) : null) ||
                           (surgery?.created_at ? new Date(surgery.created_at) : null);

        // Use OT notes procedure if available, otherwise CGHS surgery info
        const procedurePerformed = otNotesData?.procedure_performed ||
                                 (surgeryInfo?.name ? `${surgeryInfo.name} (${surgeryInfo.code || ''})` : '');

        setSurgeryDetails({
          date: surgeryDate ? format(surgeryDate, "yyyy-MM-dd'T'HH:mm") : '',
          procedurePerformed: procedurePerformed,
          surgeon: surgeon,
          anesthetist: anesthetist,
          anesthesia: anesthesia,
          implant: implant,
          description: otNotesData?.description || `DETAILED SURGICAL STEPS:

1. Pre-operative Preparation:
- Patient was appropriately identified and consent verified.
- The patient was placed in the supine position on the operating table.
- Surgical site was prepared with antiseptic solution.
- Prophylactic antibiotics were administered intravenously.

2. Anesthesia Administration:
- General anesthesia was induced following the standard protocol by the anesthetist.
- Patient's vital signs were continuously monitored.
- Endotracheal intubation was performed for airway protection.

3. Surgical Approach:
- A midline or Pfannenstiel incision was made on the lower abdomen.
- The skin, subcutaneous tissue, and fascia were dissected to expose the peritoneal cavity.
- The peritoneal cavity was entered, taking care to avoid injury to the bowel or bladder.

4. Operative Procedure:
- The uterus and adnexa were identified and examined for pathology.
- The round ligament, ovarian ligament, and fallopian tubes were ligated and divided.
- The uterine vessels were isolated, ligated, and divided.
- The cardinal and uterosacral ligaments were ligated and divided, releasing the uterus.
- The uterus was removed through the incision.
- If required, the ovaries and fallopian tubes (salpingo-oophorectomy) were also removed.
- Hemostasis was achieved using electrocautery and/or sutures as needed.

5. Closure:
- The peritoneal cavity was inspected for bleeding or injury.
- The fascia was closed with a running suture.
- The subcutaneous tissue was approximated.
- The skin was closed with staples or a subcuticular suture.
- A sterile dressing was applied to the incision.

6. Post-operative:
- The patient was extubated and transferred to the recovery room.
- Pain management was initiated.
- Vital signs were monitored.
- Post-operative orders were written for antibiotics, analgesics, antiemetics, and other necessary medications.
- Follow-up appointment was scheduled.

Estimated Blood Loss: 500 ml
Duration: 2 hours
Complications: None

Note: The patient's gender is listed as male, which is inconsistent with the performed surgery (hysterectomy). Please verify the patient's gender. Also, the diagnosis listed requires additional clarification as it does not correlate with the hysterectomy procedure.`
        });

        console.log('✅ Surgery details updated with data from:', {
          surgeryTable: !!visitSurgeryData,
          otNotes: !!otNotesData,
          surgeon,
          anesthetist,
          anesthesia,
          implant
        });

      } catch (error) {
        console.log('❌ Error updating surgery details:', error);
      }
      } else {
        console.log('✅ Surgery details already populated with valid data, skipping live data update');
      }
    }
  }, [visitSurgeryData, otNotesData, patientData, surgeryDetails.procedurePerformed, surgeryDetails.surgeon, surgeryDetails.anesthetist]);

  // Update diagnosis when data is loaded from visit_diagnoses table
  useEffect(() => {
    if (visitDiagnosisData && visitDiagnosisData.length > 0) {
      try {
        console.log('🔄 Processing diagnosis data:', visitDiagnosisData);

        // Format diagnosis data for display
        const primaryDiagnosis = visitDiagnosisData.find(d => d.is_primary === true);
        const secondaryDiagnoses = visitDiagnosisData.filter(d => d.is_primary !== true);

        let diagnosisText = '';

        // Add primary diagnosis
        if (primaryDiagnosis && primaryDiagnosis.diagnoses) {
          diagnosisText += `${primaryDiagnosis.diagnoses.name}`;
          if (primaryDiagnosis.notes) {
            diagnosisText += `\nNotes: ${primaryDiagnosis.notes}`;
          }
        }

        // Add secondary diagnoses
        if (secondaryDiagnoses.length > 0) {
          if (diagnosisText) diagnosisText += '\n';
          secondaryDiagnoses.forEach((diag, index) => {
            if (diag.diagnoses && diag.diagnoses.name) {
              diagnosisText += `${diag.diagnoses.name}`;
              if (diag.notes) {
                diagnosisText += ` (${diag.notes})`;
              }
              diagnosisText += '\n';
            }
          });
        }

        // If no primary/secondary structure, just list all diagnoses
        if (!primaryDiagnosis && visitDiagnosisData.length > 0) {
          diagnosisText = '';
          visitDiagnosisData.forEach((diag, index) => {
            if (diag.diagnoses && diag.diagnoses.name) {
              if (index > 0) diagnosisText += '\n';
              diagnosisText += `${diag.diagnoses.name}`;
              if (diag.notes) diagnosisText += ` - ${diag.notes}`;
            }
          });
        }

        // Update diagnosis field only if empty
        if (!diagnosis || diagnosis.trim() === '' || diagnosis === 'Enter diagnosis details...') {
          setDiagnosis(diagnosisText.trim());
          console.log('✅ Diagnosis field updated with:', diagnosisText.trim());
        }

        console.log('✅ Diagnosis data processed:', {
          primaryFound: !!primaryDiagnosis,
          primaryName: primaryDiagnosis?.diagnoses?.name,
          secondaryCount: secondaryDiagnoses.length,
          totalDiagnoses: visitDiagnosisData.length
        });

      } catch (error) {
        console.log('❌ Error formatting diagnosis data:', error);
      }
    }
  }, [visitDiagnosisData, diagnosis]);

  // Populate form fields when existing discharge summary is loaded
  useEffect(() => {
    if (existingDischargeSummary) {
      try {
        console.log('📝 Populating form with existing discharge summary data');

        const { summary, medications, examination, surgery } = existingDischargeSummary;

        // Populate main fields
        if (summary) {
          setDiagnosis(summary.primary_diagnosis || '');

          // Clean any JSON data from investigations text - AUTO CLEAN ON LOAD
          const investigationsText = summary.lab_investigations?.investigations_text || '';
          console.log('📥 Loading investigations from database, length:', investigationsText.length);
          const cleanedInvestigations = cleanJSONFromText(investigationsText);
          console.log('🧹 After auto-clean, length:', cleanedInvestigations.length);
          setInvestigations(cleanedInvestigations);

          setStayNotes(summary.ot_notes || '');
          setCaseSummaryPresentingComplaints(summary.chief_complaints || '');
          setAdvice(summary.discharge_advice || '');
          setTreatmentCondition(summary.condition_on_discharge || 'Satisfactory');
          setTreatmentStatus(summary.treatment_during_stay || 'Please select');
          setReviewDate(summary.review_on_date ? format(new Date(summary.review_on_date), 'yyyy-MM-dd') : '2025-09-26');
          setResidentOnDischarge(summary.resident_on_discharge || 'Please select');
          setEnableSmsAlert(summary.additional_data?.enable_sms_alert || false);

          // Update patient info
          setPatientInfo(prev => ({
            ...prev,
            otherConsultants: summary.other_consultants || '',
            reasonOfDischarge: summary.reason_of_discharge || 'Please select'
          }));
        }

        // Populate medications
        if (medications && medications.length > 0) {
          const formattedMedications = medications.map((med, index) => ({
            id: (index + 1).toString(),
            name: med.name || '',
            unit: med.unit || '',
            remark: med.remark || '',
            route: med.route || 'Select',
            dose: med.dose || 'Select',
            quantity: med.quantity || '',
            days: med.days || '0',
            startDate: med.start_date || '',
            timing: med.timing || { morning: false, afternoon: false, evening: false, night: false },
            isSos: med.is_sos || false
          }));

          setMedicationRows(formattedMedications);
          console.log('💊 Populated', formattedMedications.length, 'medications');
        }

        // Populate examination data
        if (examination) {
          setExamination({
            temp: examination.temperature || '',
            pr: examination.pulse_rate || '',
            rr: examination.respiratory_rate || '',
            bp: examination.blood_pressure || '',
            spo2: examination.spo2 || '',
            details: examination.examination_details || ''
          });
          console.log('🔍 Populated examination data');
        }

        // Populate surgery details - but check for placeholder values first
        if (surgery) {
          // Check if surgery data contains placeholder values (like "yyy", "yyyy", "Ivy")
          const hasPlaceholderValues =
            surgery.surgeon === 'yyy' ||
            surgery.anesthetist === 'yyyy' ||
            surgery.procedure_performed === 'Ivy' ||
            surgery.surgeon === 'yyyy' ||
            surgery.anesthetist === 'yyyy' ||
            !surgery.procedure_performed ||
            surgery.procedure_performed === 'Ivy';

          // Only use existing surgery data if it doesn't contain placeholder values
          if (!hasPlaceholderValues) {
            setSurgeryDetails({
              date: surgery.surgery_date ? format(new Date(surgery.surgery_date), "yyyy-MM-dd'T'HH:mm") : '',
              procedurePerformed: surgery.procedure_performed || '',
              surgeon: surgery.surgeon || '',
              anesthetist: surgery.anesthetist || '',
              anesthesia: surgery.anesthesia_type || '',
              implant: surgery.implant || '',
              description: surgery.description || ''
            });
            console.log('🏥 Populated surgery details from existing summary');
          } else {
            console.log('⚠️ Existing surgery data contains placeholder values, will use live data instead');
          }
        }

        console.log('✅ Form populated with existing discharge summary data');

      } catch (error) {
        console.error('❌ Error populating form with existing data:', error);
      }
    }
  }, [existingDischargeSummary]);


  const addMedicationRow = () => {
    const newRow: MedicationRow = {
      id: Date.now().toString(),
      name: '',
      unit: '',
      remark: '',
      route: 'Select',
      dose: 'Select',
      quantity: '',
      days: '0',
      startDate: '',
      timing: { morning: false, afternoon: false, evening: false, night: false },
      isSos: false
    };
    setMedicationRows([...medicationRows, newRow]);
  };

  const removeMedicationRow = (id: string) => {
    if (medicationRows.length > 1) {
      setMedicationRows(medicationRows.filter(row => row.id !== id));
    }
  };

  const updateMedicationRow = (id: string, field: string, value: any) => {
    setMedicationRows(medicationRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Template management functions
  const addNewTemplate = () => {
    if (newTemplateName.trim() && newTemplateContent.trim()) {
      const newTemplate = {
        name: newTemplateName.trim(),
        content: newTemplateContent.trim()
      };
      setStayNotesTemplates([...stayNotesTemplates, newTemplate]);
      setNewTemplateName('');
      setNewTemplateContent('');
      setShowAddTemplate(false);
      toast({
        title: "Success",
        description: "Template added successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Please provide both template name and content",
        variant: "destructive"
      });
    }
  };

  const editTemplate = (index: number) => {
    setEditingTemplateIndex(index);
    setEditingTemplateName(stayNotesTemplates[index].name);
    setEditingTemplateContent(stayNotesTemplates[index].content);
  };

  const saveEditTemplate = () => {
    if (editingTemplateIndex !== null && editingTemplateName.trim() && editingTemplateContent.trim()) {
      const updatedTemplates = [...stayNotesTemplates];
      updatedTemplates[editingTemplateIndex] = {
        name: editingTemplateName.trim(),
        content: editingTemplateContent.trim()
      };
      setStayNotesTemplates(updatedTemplates);
      setEditingTemplateIndex(null);
      setEditingTemplateName('');
      setEditingTemplateContent('');
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Please provide both template name and content",
        variant: "destructive"
      });
    }
  };

  const cancelEditTemplate = () => {
    setEditingTemplateIndex(null);
    setEditingTemplateName('');
    setEditingTemplateContent('');
  };

  const deleteTemplate = (index: number) => {
    const updatedTemplates = stayNotesTemplates.filter((_, i) => i !== index);
    setStayNotesTemplates(updatedTemplates);
    toast({
      title: "Success",
      description: "Template deleted successfully",
    });
  };

  const moveTemplateUp = (index: number) => {
    if (index > 0) {
      const updatedTemplates = [...stayNotesTemplates];
      [updatedTemplates[index], updatedTemplates[index - 1]] = [updatedTemplates[index - 1], updatedTemplates[index]];
      setStayNotesTemplates(updatedTemplates);
    }
  };

  const moveTemplateDown = (index: number) => {
    if (index < stayNotesTemplates.length - 1) {
      const updatedTemplates = [...stayNotesTemplates];
      [updatedTemplates[index], updatedTemplates[index + 1]] = [updatedTemplates[index + 1], updatedTemplates[index]];
      setStayNotesTemplates(updatedTemplates);
    }
  };


  const handleSave = async () => {
    try {
      if (!patientData) {
        toast({
          title: "Error",
          description: "Patient data not loaded. Cannot save discharge summary.",
        });
        return;
      }

      console.log('💾 Starting IPD discharge summary save process...');
      console.log('📋 Patient Data:', patientData);
      console.log('🔍 Visit ID (string):', visitId);

      // 1. Get visit and patient UUIDs
      let visitUUID = patientData.id;
      let patientUUID = patientData.patients?.id;

      console.log('🆔 Initial UUIDs - Visit:', visitUUID, 'Patient:', patientUUID);

      if (!visitUUID) {
        console.log('⚠️ No visitUUID found, querying visits table...');
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('id, patient_id')
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('❌ Error fetching visit data:', visitError);
          throw new Error(`Could not find visit record: ${visitError.message}`);
        }

        visitUUID = visitData?.id;
        patientUUID = visitData?.patient_id;
        console.log('✅ Fetched UUIDs - Visit:', visitUUID, 'Patient:', patientUUID);
      }

      // Validate required UUIDs
      if (!visitUUID || !patientUUID) {
        const errorMsg = `Missing required IDs - Visit UUID: ${visitUUID}, Patient UUID: ${patientUUID}`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      // Validate required fields
      if (!patientInfo.name) {
        throw new Error('Patient name is required');
      }
      if (!patientInfo.doa) {
        throw new Error('Admission date is required');
      }

      // Helper function to convert empty strings to null for date fields
      const formatDate = (dateValue: any) => {
        if (!dateValue || dateValue === '' || dateValue === 'Invalid Date') {
          return null;
        }
        return dateValue;
      };

      // 2. Prepare discharge summary data matching the actual database schema
      const dischargeData = {
        // Foreign keys - use UUIDs as per schema
        visit_id: visitUUID,
        patient_id: patientUUID,

        // Basic patient info (required fields)
        patient_name: patientInfo.name,
        reg_id: patientInfo.regId || null,
        address: patientInfo.address || null,
        age_sex: patientInfo.ageSex || null,

        // Dates - admission_date is required NOT NULL, others can be null
        admission_date: formatDate(patientInfo.doa),
        date_of_discharge: formatDate(patientInfo.dateOfDischarge),

        // Consultants
        treating_consultant: patientInfo.treatingConsultant || null,
        other_consultants: patientInfo.otherConsultants || null,
        reason_of_discharge: patientInfo.reasonOfDischarge || null,
        corporate_type: patientInfo.corporateType || null,

        // Medical data - using correct schema column names
        primary_diagnosis: diagnosis || null,
        ot_notes: stayNotes || null,
        chief_complaints: caseSummaryPresentingComplaints || null,
        discharge_advice: advice || null,

        // Treatment info - using correct schema column names
        condition_on_discharge: treatmentCondition || null,
        treatment_during_stay: treatmentStatus || null,
        review_on_date: formatDate(reviewDate),
        resident_on_discharge: residentOnDischarge || null,

        // Store investigations in JSONB column
        lab_investigations: {
          investigations_text: investigations
        },

        // Examination data in vital_signs JSONB column
        vital_signs: {
          temperature: examination.temp,
          pulse_rate: examination.pr,
          respiratory_rate: examination.rr,
          blood_pressure: examination.bp,
          spo2: examination.spo2,
          examination_details: examination.details
        },

        // Medications in discharge_medications JSONB column
        discharge_medications: medicationRows.map(med => ({
          name: med.name,
          unit: med.unit,
          dose: med.dose,
          quantity: med.quantity,
          days: med.days,
          route: med.route,
          timing: med.timing,
          is_sos: med.isSos,
          remark: med.remark
        })),

        // Surgery details in procedures_performed JSONB column
        procedures_performed: {
          surgery_date: surgeryDetails.date,
          procedure_performed: surgeryDetails.procedurePerformed,
          surgeon: surgeryDetails.surgeon,
          anesthetist: surgeryDetails.anesthetist,
          anesthesia_type: surgeryDetails.anesthesia,
          implant: surgeryDetails.implant,
          description: surgeryDetails.description
        },

        // Store original visit_id string in additional_data for reference
        additional_data: {
          visit_id_string: visitId,
          enable_sms_alert: enableSmsAlert
        }
      };

      console.log('💾 Saving IPD discharge summary with data:', JSON.stringify(dischargeData, null, 2));

      // 3. Check if a discharge summary already exists for this visit
      const { data: existingRecord } = await supabase
        .from('ipd_discharge_summary')
        .select('id')
        .eq('visit_id', visitUUID)
        .maybeSingle();

      let dischargeSummary, summaryError;

      if (existingRecord) {
        // Update existing record
        console.log('📝 Updating existing discharge summary:', existingRecord.id);
        const result = await supabase
          .from('ipd_discharge_summary')
          .update(dischargeData)
          .eq('id', existingRecord.id)
          .select()
          .single();
        dischargeSummary = result.data;
        summaryError = result.error;
      } else {
        // Insert new record
        console.log('➕ Inserting new discharge summary');
        const result = await supabase
          .from('ipd_discharge_summary')
          .insert(dischargeData)
          .select()
          .single();
        dischargeSummary = result.data;
        summaryError = result.error;
      }

      if (summaryError) {
        console.error('❌ Supabase Error Details:', {
          message: summaryError.message,
          details: summaryError.details,
          hint: summaryError.hint,
          code: summaryError.code
        });
        throw new Error(`Database error: ${summaryError.message}${summaryError.hint ? ' - ' + summaryError.hint : ''}`);
      }

      console.log('✅ IPD discharge summary saved successfully:', dischargeSummary.id);
      console.log('📋 Summary contains:', {
        medications: medicationRows.length,
        investigations: investigations.length,
        diagnosis: diagnosis ? 'Yes' : 'No',
        stay_notes: stayNotes ? 'Yes' : 'No'
      });

      console.log('🎉 IPD discharge summary saved to database successfully!');

      toast({
        title: "Success",
        description: "Discharge summary saved successfully!",
      });

    } catch (error) {
      console.error('❌ Error saving discharge summary:', error);
      toast({
        title: "Error",
        description: `Failed to save discharge summary: ${error.message}`,
      });
    }
  };

  const handlePrintPreview = async () => {
    try {
      toast({
        title: "Generating Print Preview",
        description: "Loading discharge summary for printing...",
      });

      console.log('🖨️ Fetching data for print preview...');

      // Get visit UUID
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id, visit_id, patient_id')
        .eq('visit_id', visitId)
        .single();

      console.log('🔍 Visit data fetch result:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('❌ Visit not found:', visitError);
        toast({
          title: "Error",
          description: `Visit not found for ID: ${visitId}. ${visitError?.message || ''}`,
          variant: "destructive"
        });
        return;
      }

      // Fetch patient details separately using visit's patient_id
      let patientDetails = null;
      if (visitData.patient_id) {
        console.log('🔍 Fetching patient with ID:', visitData.patient_id);
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('patients_id, phone')
          .eq('id', visitData.patient_id)
          .single();

        if (patientError) {
          console.error('❌ Error fetching patient:', patientError);
        }

        patientDetails = patientData;
        console.log('👤 Patient details:', patientDetails);
      } else {
        console.warn('⚠️ No patient_id in visitData');
      }

      // Fetch the most recent discharge summary (there might be multiple)
      console.log('🔍 Querying latest discharge summary with visit_id:', visitData.id);
      const { data: summariesData, error: summaryError } = await supabase
        .from('ipd_discharge_summary')
        .select('*')
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('📊 Discharge summary query result:', { summariesData, summaryError });

      if (summaryError || !summariesData || summariesData.length === 0) {
        console.error('❌ Failed to fetch discharge summary:', summaryError);

        toast({
          title: "Error",
          description: `No discharge summary found. Please save first. Error: ${summaryError?.message || 'No records found'}`,
          variant: "destructive"
        });
        return;
      }

      // Get the most recent discharge summary
      const summaryData = summariesData[0];
      console.log('✅ Using latest discharge summary:', summaryData.id, 'created at:', summaryData.created_at);

      console.log('✅ Summary data loaded for print:', summaryData);

      // Add patient_id and mobile to summaryData for print
      if (patientDetails) {
        console.log('📝 Adding patient details to summary:', patientDetails);
        summaryData.patient_id = patientDetails.patients_id;
        summaryData.mobile_no = patientDetails.phone;
        console.log('✅ Updated summaryData.patient_id:', summaryData.patient_id);
        console.log('✅ Updated summaryData.mobile_no:', summaryData.mobile_no);
      } else {
        console.warn('⚠️ No patient details found to add to summary');
      }

      // Fetch lab results for this visit
      const { data: labTestResults } = await supabase
        .from('lab_results')
        .select(`
          id,
          visit_id,
          test_name,
          test_category,
          result_value,
          result_unit,
          main_test_name,
          created_at
        `)
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false });

      console.log('🧪 Lab results fetched:', labTestResults?.length || 0);

      // Format lab results
      let formattedLabResults = null;
      if (labTestResults && labTestResults.length > 0) {
        const groupedResults = labTestResults.reduce((acc, result) => {
          const date = result.created_at;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.main_test_name || result.test_category || 'General Tests';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedResults = Object.entries(groupedResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, results]: [string, any]) => {
                const resultString = results
                  .map((result: any) => {
                    // Parse result_value - AGGRESSIVE parsing to extract value
                    let value = result.result_value;

                    // Step 1: Handle null/undefined
                    if (value === null || value === undefined) {
                      return null; // Skip this result
                    }

                    // Step 2: If it's already an object (Supabase JSONB auto-parse)
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      value = value.value || value.val || 'N/A';
                    }
                    // Step 3: If it's a string, try to parse
                    else if (typeof value === 'string') {
                      const trimmedValue = value.trim();

                      // Try to parse JSON string
                      if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
                        try {
                          const parsed = JSON.parse(trimmedValue);
                          if (typeof parsed === 'object' && parsed !== null) {
                            value = parsed.value || parsed.val || trimmedValue;
                          }
                        } catch (e) {
                          // Not valid JSON, keep as string
                        }
                      }
                    }
                    // Step 4: Convert numbers to string
                    else {
                      value = String(value);
                    }

                    // Step 5: Final safety check - if value is still an object or looks like JSON, extract the number
                    if (typeof value === 'object' && value !== null) {
                      value = value.value || value.val || JSON.stringify(value);
                    }

                    // If final value is still a JSON string, do regex extraction
                    if (typeof value === 'string' && value.includes('"value"')) {
                      const match = value.match(/"value"\s*:\s*"?(\d+)"?/);
                      if (match) {
                        value = match[1];
                      }
                    }

                    const unit = result.result_unit ? ` ${result.result_unit}` : '';

                    // Only include test_name if it's different from category name
                    if (result.test_name && result.test_name !== categoryName) {
                      return `${result.test_name}:${value}${unit}`;
                    } else {
                      return `${value}${unit}`;
                    }
                  })
                  .filter((item: any) => item !== null) // Remove null entries
                  .join(', ');

                return `${date}:-${categoryName}: ${resultString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        formattedLabResults = {
          rawData: labTestResults,
          groupedResults,
          formattedResults
        };
      }

      // Generate print HTML
      const printHTML = generatePrintHTML(summaryData, patientInfo, visitId, formattedLabResults);

      // Open print preview in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        toast({
          title: "Success",
          description: "Print preview opened successfully!",
        });
      }

    } catch (error) {
      console.error('❌ Print preview error:', error);
      toast({
        title: "Error",
        description: `Failed to generate print preview: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Function to convert markdown tables and formatting to HTML
  const formatOtNotesHTML = (content: string) => {
    if (!content) return '';

    let formatted = content;

    // Convert markdown tables to HTML tables - handles all markdown table formats
    // Matches: | header | header | followed by separator line, then data rows
    const lines = formatted.split(/\r?\n/);
    let inTable = false;
    let tableLines: string[] = [];
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line looks like a table row (starts and ends with |)
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableLines = [line];
        } else {
          tableLines.push(line);
        }
      } else {
        // Not a table line - process any accumulated table
        if (inTable && tableLines.length >= 3) {
          result.push(convertMarkdownTableToHTML(tableLines));
          tableLines = [];
        }
        inTable = false;
        result.push(line);
      }
    }

    // Process any remaining table at the end
    if (inTable && tableLines.length >= 3) {
      result.push(convertMarkdownTableToHTML(tableLines));
    }

    formatted = result.join('\n');

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert newlines to <br> but preserve table structure
    formatted = formatted.replace(/\n(?!<table|<\/table|<tr|<\/tr|<th|<\/th|<td|<\/td)/g, '<br>');

    return formatted;
  };

  // Helper function to convert markdown table lines to HTML
  const convertMarkdownTableToHTML = (tableLines: string[]): string => {
    if (tableLines.length < 3) return tableLines.join('\n');

    // First line is headers
    const headerLine = tableLines[0];
    const headers = headerLine.split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // Second line is separator (skip it)
    // Remaining lines are data rows
    const dataLines = tableLines.slice(2);

    let html = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;"><thead><tr>';

    // Add headers
    headers.forEach(header => {
      html += `<th style="border: 1px solid #000; background-color: transparent; padding: 6px; text-align: left;">${header}</th>`;
    });

    html += '</tr></thead><tbody>';

    // Add data rows
    dataLines.forEach(dataLine => {
      const cells = dataLine.split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      if (cells.length > 0) {
        html += '<tr>';
        cells.forEach(cell => {
          html += `<td style="border: 1px solid #000; padding: 6px;">${cell}</td>`;
        });
        html += '</tr>';
      }
    });

    html += '</tbody></table>';
    return html;
  };

  // Function to generate formatted print HTML
  const generatePrintHTML = (summaryData: any, patientInfo: any, visitIdString: string, labResults?: any) => {
    const currentDate = format(new Date(), 'dd/MM/yyyy');

    console.log('🖨️ Generating print HTML with summaryData:', summaryData);
    console.log('🧪 Lab results data:', labResults);

    // Format medications for table - use correct field name from database
    const medications = summaryData.discharge_medications || summaryData.medications_on_discharge || [];
    const medicationsHTML = medications.map((med: any) => `
      <tr>
        <td>${med.name || ''}</td>
        <td>${med.unit || ''}</td>
        <td>${med.route || 'P.O'}</td>
        <td>${med.dose || ''}</td>
        <td>${med.days || ''} DAYS</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Discharge Summary - ${patientInfo.name}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      background: white;
      padding: 0;
    }

    .header {
      text-align: center;
      border-bottom: 1.5px solid #000;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      color: #000;
      margin: 0;
    }

    .patient-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 15px;
      padding: 10px;
      border-bottom: 1.5px solid #000;
      margin-bottom: 10px;
      background: white;
    }

    .info-row {
      display: flex;
      align-items: baseline;
      font-size: 9pt;
      line-height: 1.4;
    }

    .info-label {
      font-weight: bold;
      min-width: 140px;
      margin-right: 5px;
    }

    .info-value {
      flex: 1;
    }

    .section {
      margin-bottom: 8px;
      background: white;
      page-break-inside: avoid;
    }

    .section-title {
      font-weight: bold;
      font-size: 11pt;
      text-align: center;
      margin-bottom: 8px;
      text-decoration: underline;
    }

    .section-subtitle {
      font-weight: bold;
      font-size: 10pt;
      margin-top: 8px;
      margin-bottom: 4px;
      text-decoration: underline;
    }

    .section-content {
      text-align: justify;
      line-height: 1.4;
      white-space: pre-wrap;
      font-size: 9pt;
    }

    .diagnosis-list {
      list-style-position: inside;
      padding-left: 0;
      margin: 0;
    }

    .diagnosis-list li {
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9pt;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th {
      background-color: #d0d0d0;
      font-weight: bold;
      padding: 5px 4px;
      text-align: center;
      font-size: 9pt;
    }

    td {
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }

    .review-table {
      width: 100%;
      margin-top: 15px;
      border: 1px solid #000;
    }

    .review-table td {
      padding: 5px 8px;
      border: 1px solid #000;
    }

    .signature-section {
      margin-top: 20px;
      text-align: right;
      font-weight: bold;
    }

    .emergency-note {
      text-align: center;
      font-weight: bold;
      margin-top: 20px;
      padding: 8px;
      border: 1px solid #000;
      background-color: white;
      font-size: 10pt;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: white;
        padding: 0;
      }

      .section {
        background: white;
        padding: 0;
      }

      .no-print {
        display: none;
      }

      @page {
        margin: 15mm 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Discharge Summary</h1>
  </div>

  <div class="patient-info">
    <div class="info-row">
      <span class="info-label">Name</span>
      <span class="info-value">: ${summaryData.patient_name || patientInfo.name || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Patient ID</span>
      <span class="info-value">: ${summaryData.patient_id || summaryData.reg_id || patientInfo.regId || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Primary Care Provider</span>
      <span class="info-value">: ${summaryData.treating_consultant || patientInfo.treatingConsultant || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Registration ID</span>
      <span class="info-value">: ${visitIdString || summaryData.reg_id || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Sex / Age</span>
      <span class="info-value">: ${summaryData.age_sex || patientInfo.ageSex || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mobile No</span>
      <span class="info-value">: ${summaryData.mobile_no || summaryData.phone || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tariff</span>
      <span class="info-value">: ${summaryData.corporate_type || patientInfo.corporateType || 'Private'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address</span>
      <span class="info-value">: ${summaryData.address || patientInfo.address || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Admission Date</span>
      <span class="info-value">: ${summaryData.admission_date ? format(new Date(summaryData.admission_date), 'dd/MM/yyyy') : 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Discharge Date</span>
      <span class="info-value">: ${summaryData.date_of_discharge ? format(new Date(summaryData.date_of_discharge), 'dd/MM/yyyy') : currentDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Discharge Reason</span>
      <span class="info-value">: ${summaryData.reason_of_discharge || 'Recovered'}</span>
    </div>
  </div>

  ${summaryData.primary_diagnosis ? `
  <div class="section">
    <div class="section-title">Present Condition</div>
    <div class="section-subtitle">DIAGNOSIS:</div>
    <div class="section-content">${summaryData.primary_diagnosis.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}

  ${medications.length > 0 ? `
  <div class="section">
    <div class="section-subtitle">**MEDICATIONS (TREATMENT ON DISCHARGE):**</div>
    <table>
      <thead>
        <tr>
          <th>Medication Name</th>
          <th>Strength</th>
          <th>Route</th>
          <th>Dosage</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${medicationsHTML}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${summaryData.chief_complaints ? `
  <div class="section">
    <div class="section-subtitle">CLINICAL HISTORY:</div>
    <div class="section-content">${summaryData.chief_complaints.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}

  ${summaryData.vital_signs ? `
  <div class="section">
    <div class="section-subtitle">EXAMINATION:</div>
    <div class="section-content">
      On physical examination, patient was found to be stably maintaining vitals.
      ${summaryData.vital_signs.temperature ? `Temperature of ${summaryData.vital_signs.temperature}°F, ` : ''}
      ${summaryData.vital_signs.pulse_rate ? `pulse rate of ${summaryData.vital_signs.pulse_rate}/min, ` : ''}
      ${summaryData.vital_signs.blood_pressure ? `blood pressure of ${summaryData.vital_signs.blood_pressure} were recorded. ` : ''}
      ${summaryData.vital_signs.spo2 ? `Oxygen saturation was at ${summaryData.vital_signs.spo2}% in room air.` : ''}
      ${summaryData.vital_signs.examination_details ? `<br><br>${summaryData.vital_signs.examination_details}` : ''}
    </div>
  </div>
  ` : ''}

  ${summaryData.procedures_performed && (summaryData.procedures_performed.surgery_date || summaryData.procedures_performed.procedure_performed) ? `
  <div class="section">
    <div class="section-subtitle">**Operation Notes**</div>
    <table>
      <tbody>
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f0f0f0;">Date & Time</td>
          <td>${summaryData.procedures_performed.surgery_date ? format(new Date(summaryData.procedures_performed.surgery_date), 'dd/MM/yyyy, HH:mm') + ' hours' : ''}</td>
        </tr>
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f0f0f0;">Procedure</td>
          <td>${summaryData.procedures_performed.procedure_performed || ''}</td>
        </tr>
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f0f0f0;">Surgeon</td>
          <td>${summaryData.procedures_performed.surgeon || ''}</td>
        </tr>
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f0f0f0;">Anaesthetist</td>
          <td>${summaryData.procedures_performed.anesthetist || ''}</td>
        </tr>
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f0f0f0;">Anaesthesia Type</td>
          <td>${summaryData.procedures_performed.anesthesia_type || ''}</td>
        </tr>
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f0f0f0;">Description</td>
          <td>${summaryData.procedures_performed.description || ''}</td>
        </tr>
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f0f0f0;">IMPLANT:</td>
          <td>${summaryData.procedures_performed.implant || ''}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  ${summaryData.discharge_advice ? `
  <div class="section">
    <div class="section-subtitle">**ADVICE:**</div>
    <div class="section-content">${summaryData.discharge_advice.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}

  ${labResults?.formattedResults || summaryData.lab_investigations?.investigations_text ? `
  <div class="section">
    <div class="section-subtitle">INVESTIGATIONS</div>
    <div class="section-content">
      ${labResults?.formattedResults ? labResults.formattedResults.replace(/\n/g, '<br>') : (summaryData.lab_investigations?.investigations_text ? cleanJSONFromText(summaryData.lab_investigations.investigations_text).replace(/\n/g, '<br>') : '')}
    </div>
  </div>
  ` : ''}

  ${summaryData.review_on_date || summaryData.resident_on_discharge ? `
  <table class="review-table">
    <tbody>
      ${summaryData.review_on_date ? `
      <tr>
        <td style="width: 30%; font-weight: bold;">Review on</td>
        <td style="width: 5%;">:</td>
        <td style="text-align: left;">${format(new Date(summaryData.review_on_date), 'dd/MM/yyyy')}</td>
      </tr>
      ` : ''}
      ${summaryData.resident_on_discharge ? `
      <tr>
        <td style="width: 30%; font-weight: bold;">Resident On Discharge</td>
        <td style="width: 5%;">:</td>
        <td style="text-align: left;">${summaryData.resident_on_discharge}</td>
      </tr>
      ` : ''}
    </tbody>
  </table>
  ` : ''}

  <div class="signature-section">
    <strong>${summaryData.treating_consultant || 'Dr. Amod Shirode (IMS Residence)'}</strong>
  </div>

  <div class="emergency-note">
    <strong>Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709.</strong>
  </div>
</body>
</html>
    `;
  };

  // Helper function to format medication timing for print
  const formatMedicationTiming = (timing: any) => {
    if (!timing) return '';
    const times = [];
    if (timing.morning) times.push('सुबह (Morning)');
    if (timing.afternoon) times.push('दोपहर (Afternoon)');
    if (timing.evening) times.push('शाम (Evening)');
    if (timing.night) times.push('रात (Night)');
    return times.join(', ') || '';
  };

  // Function to fetch patient data for generating discharge summary
  const handleFetchPatientData = async () => {
    try {
      toast({
        title: "Fetching Patient Data",
        description: "Loading patient information for discharge summary...",
      });

      console.log('📥 Fetching patient data for visit:', visitId);

      let formattedText = '';

      // 1. PATIENT INFORMATION
      if (patientData?.patients) {
        const patient = patientData.patients;
        formattedText += `PATIENT INFORMATION:\n`;
        formattedText += `Name: ${patient.name || 'N/A'}\n`;
        formattedText += `Age: ${patient.age || 'N/A'} Years\n`;
        formattedText += `Gender: ${patient.gender || 'N/A'}\n`;
        formattedText += `Registration ID: ${patientData.visit_id || visitId}\n`;
        if (patient.address) formattedText += `Address: ${patient.address}\n`;
        if (patient.phone) formattedText += `Phone: ${patient.phone}\n`;
        formattedText += `Admission Date: ${patientData.admission_date ? format(new Date(patientData.admission_date), 'dd-MM-yyyy') : 'N/A'}\n`;
        formattedText += `Treating Consultant: ${patientData.doctor_name || 'N/A'}\n\n`;
      }

      // 2. DIAGNOSIS
      if (visitDiagnosisData && visitDiagnosisData.length > 0) {
        formattedText += `DIAGNOSIS:\n`;
        visitDiagnosisData.forEach((diag, index) => {
          const diagnosisName = diag.diagnoses?.name || 'Unknown diagnosis';
          const isPrimary = diag.is_primary ? ' (Primary)' : '';
          formattedText += `${index + 1}. ${diagnosisName}${isPrimary}\n`;
          if (diag.notes) formattedText += `   Notes: ${diag.notes}\n`;
        });
        formattedText += '\n';
      }

      // 3. SURGERY DETAILS
      if (visitSurgeryData && visitSurgeryData.length > 0) {
        formattedText += `SURGERY DETAILS:\n`;
        visitSurgeryData.forEach((surgery, index) => {
          formattedText += `${index + 1}. ${surgery.surgery_master?.name || 'Unknown procedure'}\n`;
          if (surgery.created_at) formattedText += `   Date: ${format(new Date(surgery.created_at), 'dd-MM-yyyy HH:mm')}\n`;
          if (surgery.surgery_master?.description) formattedText += `   Description: ${surgery.surgery_master.description}\n`;
        });
        formattedText += '\n';
      }

      // 4. MEDICATIONS
      if (medicationRows && medicationRows.length > 0) {
        formattedText += `MEDICATIONS (TREATMENT ON DISCHARGE):\n`;
        medicationRows.forEach((med, index) => {
          formattedText += `${index + 1}. ${med.name || 'N/A'}`;
          if (med.dose) formattedText += ` - ${med.dose}`;
          if (med.route) formattedText += ` (${med.route})`;
          if (med.days) formattedText += ` for ${med.days} days`;
          const timings = [];
          if (med.timing?.morning) timings.push('Morning');
          if (med.timing?.afternoon) timings.push('Afternoon');
          if (med.timing?.evening) timings.push('Evening');
          if (med.timing?.night) timings.push('Night');
          if (timings.length > 0) formattedText += ` - ${timings.join(', ')}`;
          if (med.remark) formattedText += ` | Remark: ${med.remark}`;
          formattedText += '\n';
        });
        formattedText += '\n';
      }

      // 5. LAB RESULTS / INVESTIGATIONS
      if (labResultsData?.formattedResults && labResultsData.formattedResults !== `No lab results found for visit ID: ${visitId}`) {
        formattedText += `INVESTIGATIONS:\n${labResultsData.formattedResults}\n\n`;
      }

      // 6. RADIOLOGY RESULTS
      if (radiologyData && radiologyData.length > 0) {
        formattedText += `RADIOLOGY:\n`;
        radiologyData.forEach((rad, index) => {
          formattedText += `${index + 1}. ${rad.radiology_master?.name || 'Unknown study'}\n`;
          if (rad.status) formattedText += `   Status: ${rad.status}\n`;
          if (rad.ordered_date) formattedText += `   Date: ${format(new Date(rad.ordered_date), 'dd-MM-yyyy')}\n`;
          if (rad.radiology_master?.description) formattedText += `   Description: ${rad.radiology_master.description}\n`;
        });
        formattedText += '\n';
      }

      // 7. OPERATION NOTES
      if (otNotesData) {
        formattedText += `OPERATION NOTES:\n${otNotesData}\n\n`;
      }

      // Display formatted text in the newTemplateContent textarea
      setNewTemplateContent(formattedText);

      toast({
        title: "Success",
        description: "Patient data loaded successfully!",
      });

      console.log('✅ Patient data formatted and displayed');

    } catch (error) {
      console.error('❌ Error fetching patient data:', error);
      toast({
        title: "Error",
        description: `Failed to fetch patient data: ${error.message}`,
        variant: "destructive"
      });
    }
  };


  const handleFetchInvestigations = async () => {
    try {
      toast({
        title: "Searching Investigations",
        description: "Searching for lab results and radiology data...",
      });

      console.log('🔍 Searching investigations for visit_id:', visitId);
      const combinedResults = [];

      // First, get the visit UUID from the visit_id string
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      const visitUUID = visitData?.id;
      console.log('🔍 Visit UUID found:', visitUUID);

      // Search for lab results using the UUID
      console.log('🧪 Searching lab results for visit UUID:', visitUUID);

      let data, error;

      if (visitUUID) {
        console.log('🧪 Fetching LATEST lab results for visit UUID:', visitUUID);

        const result = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            created_at,
            updated_at
          `)
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false })
          .order('updated_at', { ascending: false });

        data = result.data;
        error = result.error;

        console.log('✅ Lab results fetched:', {
          count: data?.length,
          firstResult: data?.[0],
          error
        });

        // Log first few results to see what we got
        if (data && data.length > 0) {
          console.log('📋 First 3 results:', data.slice(0, 3));
        }
      } else {
        console.log('⚠️ No visit UUID found, cannot fetch lab results');
        data = [];
      }

      // If no results for this visit ID, try to get any recent lab results to show example format
      if (!data || data.length === 0) {
        console.log('No results for visit ID, trying to get sample data...');

        const { data: sampleData } = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            created_at,
            patient_name
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (sampleData && sampleData.length > 0) {
          const sampleResult = sampleData[0];
          const sampleFormat = `${format(new Date(sampleResult.created_at), 'dd/MM/yyyy')}:-${sampleResult.main_test_name || 'Sample Test'}: ${sampleResult.test_name}:${sampleResult.result_value || 'Sample Value'}${sampleResult.result_unit ? ' ' + sampleResult.result_unit : ''}`;

          setInvestigations(`No lab results found for visit ID: ${visitId}

Sample format (from other patients):
${sampleFormat}

You can manually enter lab results in this format:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit

Example:
26/09/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl, Sr. Sodium:147 mmol/L`);

          toast({
            title: "No Data for This Visit",
            description: `No lab results found for visit ${visitId}. Sample format provided.`,
          });
          return;
        }
      }

      // Process lab results
      if (data && data.length > 0) {
        console.log('✅ Found lab results:', data.length);

        const groupedLabResults = data.reduce((acc, result) => {
          const date = result.created_at;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.main_test_name || result.test_category || 'General Tests';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedLabResults = Object.entries(groupedLabResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, results]) => {
                const resultString = results
                  .map(result => {
                    // Use the new extractValueFromJSON function
                    const value = extractValueFromJSON(result.result_value);

                    console.log(`🔬 ${categoryName} - ${result.test_name}:`, {
                      raw: result.result_value,
                      extracted: value
                    });

                    // Skip if no value
                    if (value === 'N/A' && !result.result_value) {
                      return null;
                    }

                    const unit = result.result_unit ? ` ${result.result_unit}` : '';

                    // Only include test_name if it's different from category name
                    if (result.test_name && result.test_name !== categoryName) {
                      return `${result.test_name}:${value}${unit}`;
                    } else {
                      return `${value}${unit}`;
                    }
                  })
                  .filter(item => item !== null) // Remove null entries
                  .join(', ');

                return `${date}:-${categoryName}: ${resultString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        combinedResults.push(formattedLabResults);
      }

      // Now fetch radiology data
      console.log('🩻 Searching radiology data for visit_id:', visitId);

      // Try to get radiology data using the visit's UUID (from patientData)
      let radiologyResults = [];

      if (patientData?.id) {
        console.log('🔍 Trying radiology lookup with visit UUID:', patientData.id);
        const { data: radiologyViaUUID } = await supabase
          .from('visit_radiology')
          .select(`
            id,
            status,
            ordered_date,
            scheduled_date,
            completed_date,
            findings,
            impression,
            notes,
            radiology!inner(
              id,
              name,
              category,
              description
            )
          `)
          .eq('visit_id', patientData.id)
          .order('ordered_date', { ascending: false });

        if (radiologyViaUUID && radiologyViaUUID.length > 0) {
          radiologyResults = radiologyViaUUID;
          console.log('✅ Found radiology data via visit UUID:', radiologyResults.length, 'studies');
        }
      }

      // Process radiology results
      if (radiologyResults.length > 0) {
        const groupedRadiologyResults = radiologyResults.reduce((acc, result) => {
          const date = result.ordered_date || result.scheduled_date;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.radiology.category || 'Radiology';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedRadiologyResults = Object.entries(groupedRadiologyResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, studies]) => {
                const studyString = studies
                  .map(study => {
                    const name = study.radiology.name;
                    const status = study.status ? ` (${study.status})` : '';
                    const findings = study.findings ? `, Findings: ${study.findings}` : '';
                    const impression = study.impression ? `, Impression: ${study.impression}` : '';
                    return `${name}${status}${findings}${impression}`;
                  })
                  .join(', ');

                return `${date}:-${categoryName}: ${studyString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        combinedResults.push(formattedRadiologyResults);
      }

      // Combine all results
      if (combinedResults.length > 0) {
        const finalResults = combinedResults.join('\n\n--- RADIOLOGY ---\n\n');

        // IMPORTANT: Clean any JSON that might still be in the text
        console.log('🧹 Auto-cleaning fetched data before displaying...');
        const cleanedResults = cleanJSONFromText(finalResults);
        console.log('✅ Auto-clean complete, setting investigations');

        setInvestigations(cleanedResults);

        const labCount = data?.length || 0;
        const radiologyCount = radiologyResults.length;

        toast({
          title: "Success",
          description: `Fetched ${labCount} lab results and ${radiologyCount} radiology studies.`,
        });
      } else {
        // No data found
        setInvestigations(`No investigations found in database for visit ID: ${visitId}

You can manually enter investigations in this format:

LAB RESULTS:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit

RADIOLOGY:
DD/MM/YYYY:-Study Category: Study Name (status), Findings: findings, Impression: impression

Example:
26/09/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl, Sr. Sodium:147 mmol/L

--- RADIOLOGY ---

26/09/2024:-Chest Imaging: Chest X-Ray (completed), Findings: Clear lungs, Impression: Normal study`);

        toast({
          title: "No Data Found",
          description: "No investigations found for this visit. You can enter them manually.",
        });
      }
    } catch (error) {
      console.error('Error fetching investigations:', error);
      setInvestigations(`Error occurred while fetching lab results.

You can still manually enter lab results in this format:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit`);

      toast({
        title: "Error",
        description: "Error occurred, but you can still enter lab results manually.",
      });
    }
  };

  // Function to clear all caches and force refresh
  const handleClearCacheAndRefresh = () => {
    try {
      queryClient.clear();
      sessionStorage.clear();

      // Clear React Query related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('react-query') || key.includes('discharge') || key.includes('investigation')) {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: "Cache Cleared",
        description: "All caches have been cleared. Refreshing page...",
      });

      // Force a hard refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.log('Cache clearing attempt completed');
      toast({
        title: "Cache Clear Attempted",
        description: "Cache clearing attempted. Please refresh the page manually.",
      });
    }
  };

  // Force complete page refresh on component mount to clear all browser cache
  React.useEffect(() => {
    const isFirstLoad = !sessionStorage.getItem('discharge-summary-loaded');

    if (isFirstLoad) {
      sessionStorage.setItem('discharge-summary-loaded', 'true');
      // Clear all possible caches on first load
      try {
        queryClient.clear();

        // Clear any cached data that might be causing errors
        Object.keys(localStorage).forEach(key => {
          if (key.includes('react-query') ||
              key.includes('supabase') ||
              key.includes('discharge') ||
              key.includes('investigation') ||
              key.includes('patient-data')) {
            localStorage.removeItem(key);
          }
        });

        console.log('✅ Browser cache fully cleared on component mount');
      } catch (error) {
        console.log('Cache clearing completed with minor issues');
      }
    }
  }, [queryClient]);

  // Show loading spinner while patient data is being fetched
  if (isPatientLoading || isInvestigationsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 mb-2">
              {isPatientLoading && 'Loading patient data...'}
              {isInvestigationsLoading && 'Loading lab results...'}
            </p>
            <p className="text-sm text-gray-500">
              Visit ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{visitId}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Create a fallback component that shows a working form even when no data exists
  const renderFallbackForm = () => {
    return (
      <form id="discharge_summaryForm" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="container mx-auto p-6 space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-800">
              <h3 className="font-semibold">⚠️ No Data Found for Visit ID: {visitId}</h3>
              <p className="text-sm mt-1">
                Working with demo/placeholder data. You can still use the form to create a new discharge summary.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            IPD Discharge Summary
            <span className="text-lg font-normal text-gray-600 ml-2">
              - New Patient ({visitId})
            </span>
          </h1>
          <div className="space-x-2">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handlePrintPreview} className="bg-blue-600 hover:bg-blue-700">
              Print Preview
            </Button>
            <Button
              onClick={() => navigate('/todays-ipd')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Patient Information with placeholder data */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name:</Label>
                <Input
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Reg ID:</Label>
                <Input
                  value={patientInfo.regId}
                  onChange={(e) => setPatientInfo({...patientInfo, regId: e.target.value})}
                  placeholder="Enter registration ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Address:</Label>
                <Input
                  value={patientInfo.address}
                  onChange={(e) => setPatientInfo({...patientInfo, address: e.target.value})}
                  placeholder="Enter patient address"
                />
              </div>
              <div className="space-y-2">
                <Label>Age/Sex:</Label>
                <Input
                  value={patientInfo.ageSex}
                  onChange={(e) => setPatientInfo({...patientInfo, ageSex: e.target.value})}
                  placeholder="Enter age/sex"
                />
              </div>
              <div className="space-y-2">
                <Label>Treating Consultant:</Label>
                <Input
                  value={patientInfo.treatingConsultant}
                  onChange={(e) => setPatientInfo({...patientInfo, treatingConsultant: e.target.value})}
                  placeholder="Enter treating consultant"
                />
              </div>
              <div className="space-y-2">
                <Label>DOA:</Label>
                <Input
                  type="date"
                  value={patientInfo.doa}
                  onChange={(e) => setPatientInfo({...patientInfo, doa: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investigations with demo data fetching */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Investigations:</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchInvestigations}
                >
                  Try Fetch Lab Data
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              placeholder="Enter investigation details here. You can manually add lab results in the format: DD/MM/YYYY:-Test Name: Result1:Value1 unit, Result2:Value2 unit"
              className="min-h-[120px]"
            />
            <div className="text-sm text-gray-600">
              💡 Tip: You can manually enter lab results or try the "Try Fetch Lab Data" button to search for any existing data.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4 pb-6">
          <Button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-700">
            Save New Summary
          </Button>
          <Button
            onClick={() => navigate('/todays-ipd')}
            variant="outline"
            className="px-8 py-2 border-gray-300 hover:bg-gray-50"
          >
            Back to Dashboard
          </Button>
        </div>
        </div>
      </form>
    );
  };

  // Show error if patient data not found, but provide working fallback form
  if (!patientData && !isPatientLoading && patientError) {
    return renderFallbackForm();
  }

  return (
    <form id="discharge_summaryForm" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          IPD Discharge Summary
          {patientData && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {patientData.patients.name} ({patientData.patients.patients_id})
            </span>
          )}
        </h1>
        <div className="space-x-2">
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={handlePrintPreview} className="bg-blue-600 hover:bg-blue-700">
            Print Preview
          </Button>
          <Button
            onClick={handleClearCacheAndRefresh}
            variant="outline"
            className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          >
            Clear Cache & Refresh
          </Button>
          <Button
            onClick={() => navigate('/todays-ipd')}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name:</Label>
              <Input
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                placeholder="Patient Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Reg ID:</Label>
              <Input
                value={patientInfo.regId}
                onChange={(e) => setPatientInfo({...patientInfo, regId: e.target.value})}
                placeholder="Registration ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Address:</Label>
              <Input
                value={patientInfo.address}
                onChange={(e) => setPatientInfo({...patientInfo, address: e.target.value})}
                placeholder="Patient Address"
              />
            </div>
            <div className="space-y-2">
              <Label>Age/Sex:</Label>
              <Input
                value={patientInfo.ageSex}
                onChange={(e) => setPatientInfo({...patientInfo, ageSex: e.target.value})}
                placeholder="Age/Sex"
              />
            </div>
            <div className="space-y-2">
              <Label>Treating Consultant:</Label>
              <Input
                value={patientInfo.treatingConsultant}
                onChange={(e) => setPatientInfo({...patientInfo, treatingConsultant: e.target.value})}
                placeholder="Treating Consultant"
              />
            </div>
            <div className="space-y-2">
              <Label>DOA:</Label>
              <Input
                type="date"
                value={patientInfo.doa}
                onChange={(e) => setPatientInfo({...patientInfo, doa: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Other Consultants:</Label>
              <Textarea
                value={patientInfo.otherConsultants}
                onChange={(e) => setPatientInfo({...patientInfo, otherConsultants: e.target.value})}
                placeholder="Other Consultants"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Date Of Discharge:</Label>
              <Input
                type="date"
                value={patientInfo.dateOfDischarge}
                onChange={(e) => setPatientInfo({...patientInfo, dateOfDischarge: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason Of Discharge:</Label>
              <Select
                value={patientInfo.reasonOfDischarge}
                onValueChange={(value) => setPatientInfo({...patientInfo, reasonOfDischarge: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Please select">Please select</SelectItem>
                  <SelectItem value="DAMA">DAMA</SelectItem>
                  <SelectItem value="Discharge on request">Discharge on request</SelectItem>
                  <SelectItem value="Death">Death</SelectItem>
                  <SelectItem value="Recovered">Recovered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Corporate Type:</Label>
              <Input
                value={patientInfo.corporateType}
                onChange={(e) => setPatientInfo({...patientInfo, corporateType: e.target.value})}
                placeholder="Corporate Type"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Diagnosis</span>
            {isDiagnosisLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Loading diagnosis data...
              </div>
            )}
            {visitDiagnosisData && visitDiagnosisData.length > 0 && (
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                {visitDiagnosisData.length} Diagnosis(es) Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Diagnosis Details:</Label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis details..."
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Case Summary Presenting Complaints */}
      <Card>
        <CardHeader>
          <CardTitle>Case Summary Presenting Complaints:</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={caseSummaryPresentingComplaints}
            onChange={(e) => setCaseSummaryPresentingComplaints(e.target.value)}
            placeholder="Enter case summary and presenting complaints..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Advice */}
      <Card>
        <CardHeader>
          <CardTitle>Advice:</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Enter discharge advice..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Treatment on Discharge */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment on Discharge:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-sm">Name of Medication</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Remark</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Route</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Dose</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Quantity</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">No. of Days</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Start Date</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Timing</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Is SOS</th>
                </tr>
              </thead>
              <tbody>
                {medicationRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border border-gray-300 px-1 py-1 relative">
                      <div className="relative">
                        <Input
                          value={row.name}
                          onChange={(e) => {
                            updateMedicationRow(row.id, 'name', e.target.value);
                            setMedicationSearchTerm(e.target.value);
                            setActiveSearchRowId(row.id);
                          }}
                          onFocus={() => setActiveSearchRowId(row.id)}
                          onBlur={() => setTimeout(() => setActiveSearchRowId(null), 300)}
                          className="border-0 focus:ring-0 text-sm"
                          placeholder="Search medicine name..."
                        />
                        {medicationSearchTerm.length >= 2 && availableMedications.length > 0 && activeSearchRowId === row.id && (
                          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {availableMedications.map((medication) => (
                              <div
                                key={medication.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur event
                                  const medicationName = medication.medicine_name + (medication.type ? ` (${medication.type})` : '');
                                  updateMedicationRow(row.id, 'name', medicationName);
                                  setMedicationSearchTerm('');
                                  setActiveSearchRowId(null);
                                }}
                              >
                                <div className="font-medium text-gray-900">{medication.medicine_name}</div>
                                {medication.type && (
                                  <div className="text-xs text-gray-500">Type: {medication.type}</div>
                                )}
                                {medication.generic_name && (
                                  <div className="text-xs text-gray-500">Generic: {medication.generic_name}</div>
                                )}
                                {medication.manufacturer?.name && (
                                  <div className="text-xs text-gray-400">Mfg: {medication.manufacturer.name}</div>
                                )}
                                {(medication.selling_price || medication.mrp_price) && (
                                  <div className="text-xs text-gray-400">
                                    Price: ₹{medication.selling_price || medication.mrp_price}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.unit}
                        onChange={(e) => updateMedicationRow(row.id, 'unit', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.remark}
                        onChange={(e) => updateMedicationRow(row.id, 'remark', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Select
                        value={row.route}
                        onValueChange={(value) => updateMedicationRow(row.id, 'route', value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Select">Select</SelectItem>
                          <SelectItem value="PO">PO</SelectItem>
                          <SelectItem value="IV">IV</SelectItem>
                          <SelectItem value="IM">IM</SelectItem>
                          <SelectItem value="S/C">S/C</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="P/V">P/V</SelectItem>
                          <SelectItem value="R.T">R.T</SelectItem>
                          <SelectItem value="LA">LA</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                          <SelectItem value="Oral">Oral</SelectItem>
                          <SelectItem value="Sublingual">Sublingual</SelectItem>
                          <SelectItem value="Inhalation">Inhalation</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Select
                        value={row.dose}
                        onValueChange={(value) => updateMedicationRow(row.id, 'dose', value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Select">Select</SelectItem>
                          <SelectItem value="SOS">SOS</SelectItem>
                          <SelectItem value="OD">OD</SelectItem>
                          <SelectItem value="BD">BD</SelectItem>
                          <SelectItem value="TDS">TDS</SelectItem>
                          <SelectItem value="QID">QID</SelectItem>
                          <SelectItem value="HS">HS</SelectItem>
                          <SelectItem value="Twice a week">Twice a week</SelectItem>
                          <SelectItem value="Once a week">Once a week</SelectItem>
                          <SelectItem value="Once fort nightly">Once fort nightly</SelectItem>
                          <SelectItem value="Once a month">Once a month</SelectItem>
                          <SelectItem value="A/D">A/D</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="0.5">0.5</SelectItem>
                          <SelectItem value="1/2">1/2</SelectItem>
                          <SelectItem value="1/4">1/4</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.quantity}
                        onChange={(e) => updateMedicationRow(row.id, 'quantity', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.days}
                        onChange={(e) => updateMedicationRow(row.id, 'days', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        type="date"
                        value={row.startDate}
                        onChange={(e) => updateMedicationRow(row.id, 'startDate', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <div className="flex space-x-1">
                        {['I', 'II', 'III', 'IV'].map((timing, timingIndex) => (
                          <Select key={timing}>
                            <SelectTrigger className="border-0 focus:ring-0 text-xs h-6 w-16">
                              <SelectValue placeholder={timing} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1AM">1AM</SelectItem>
                              <SelectItem value="2AM">2AM</SelectItem>
                              <SelectItem value="3AM">3AM</SelectItem>
                              <SelectItem value="4AM">4AM</SelectItem>
                              <SelectItem value="5AM">5AM</SelectItem>
                              <SelectItem value="6AM">6AM</SelectItem>
                              <SelectItem value="7AM">7AM</SelectItem>
                              <SelectItem value="8AM">8AM</SelectItem>
                              <SelectItem value="9AM">9AM</SelectItem>
                              <SelectItem value="10AM">10AM</SelectItem>
                              <SelectItem value="11AM">11AM</SelectItem>
                              <SelectItem value="12AM">12AM</SelectItem>
                              <SelectItem value="1PM">1PM</SelectItem>
                              <SelectItem value="2PM">2PM</SelectItem>
                              <SelectItem value="3PM">3PM</SelectItem>
                              <SelectItem value="4PM">4PM</SelectItem>
                              <SelectItem value="5PM">5PM</SelectItem>
                              <SelectItem value="6PM">6PM</SelectItem>
                              <SelectItem value="7PM">7PM</SelectItem>
                              <SelectItem value="8PM">8PM</SelectItem>
                              <SelectItem value="9PM">9PM</SelectItem>
                              <SelectItem value="10PM">10PM</SelectItem>
                              <SelectItem value="11PM">11PM</SelectItem>
                              <SelectItem value="12PM">12PM</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-1 py-1 text-center">
                      <Checkbox
                        checked={row.isSos}
                        onCheckedChange={(checked) => updateMedicationRow(row.id, 'isSos', checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex space-x-2 mt-2">
              <Button onClick={addMedicationRow} size="sm">Add More</Button>
              <Button onClick={() => removeMedicationRow(medicationRows[medicationRows.length - 1]?.id)} size="sm" variant="outline">Remove</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examination */}
      <Card>
        <CardHeader>
          <CardTitle>Examination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Temp:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.temp}
                  onChange={(e) => setExamination({...examination, temp: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">°F</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>P.R:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.pr}
                  onChange={(e) => setExamination({...examination, pr: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">/Min</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>R.R:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.rr}
                  onChange={(e) => setExamination({...examination, rr: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">/Min</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>BP:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.bp}
                  onChange={(e) => setExamination({...examination, bp: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">mmHg</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>SPO₂:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.spo2}
                  onChange={(e) => setExamination({...examination, spo2: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">% in Room Air</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigations */}
      <Card>
        <CardHeader>
          <CardTitle>Investigations:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={printRecentOnly}
              onCheckedChange={setPrintRecentOnly}
            />
            <Label>Print Recent Investigation only</Label>
          </div>
          <Textarea
            value={investigations}
            onChange={(e) => setInvestigations(e.target.value)}
            placeholder="Investigation details will be populated here..."
            className="min-h-[120px]"
          />
          <div className="text-sm text-gray-600">
            {isInvestigationsLoading ? 'Loading lab results and radiology data...' : 'Click "Fetch Lab & Radiology Data" to load latest results.'}
          </div>
        </CardContent>
      </Card>

      {/* Surgery Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Surgery Details</span>
            {(isSurgeryLoading || isOtNotesLoading) && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                {isSurgeryLoading && isOtNotesLoading ? 'Loading surgery & OT data...' :
                 isSurgeryLoading ? 'Loading surgery data...' :
                 'Loading OT notes...'}
              </div>
            )}
            {visitSurgeryData && visitSurgeryData.length > 0 && (
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                {visitSurgeryData.length} Surgery(s) Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date:</Label>
              <Input
                type="datetime-local"
                value={surgeryDetails.date}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, date: e.target.value})}
                placeholder="Select date and time"
              />
            </div>
            <div className="space-y-2">
              <Label>Procedure Performed:</Label>
              <Input
                value={surgeryDetails.procedurePerformed}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, procedurePerformed: e.target.value})}
                placeholder="e.g., Femoral Hernia Repair (427), Hernia Repair (CGHS-003), 2D echocardiography (592)"
                className={visitSurgeryData && visitSurgeryData.length > 0 ? 'bg-green-50 border-green-200' : ''}
                readOnly={isSurgeryLoading}
              />
              {visitSurgeryData && visitSurgeryData.length > 0 && (
                <div className="text-xs text-green-600">
                  ✅ Loaded from billing system
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Surgeon:</Label>
              <Input
                value={surgeryDetails.surgeon}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, surgeon: e.target.value})}
                placeholder="Enter surgeon name"
                className={isSurgeryLoading ? 'bg-gray-50' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Anesthetist:</Label>
              <Input
                value={surgeryDetails.anesthetist}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, anesthetist: e.target.value})}
                placeholder="Enter anesthetist name"
                className={isSurgeryLoading ? 'bg-gray-50' : ''}
                readOnly={isSurgeryLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Anesthesia:</Label>
              <Input
                value={surgeryDetails.anesthesia}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, anesthesia: e.target.value})}
                placeholder="Enter anesthesia type"
                className={isSurgeryLoading ? 'bg-gray-50' : ''}
                readOnly={isSurgeryLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Implant:</Label>
              <Input
                value={surgeryDetails.implant}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, implant: e.target.value})}
                placeholder="e.g., asssssassax or N/A if no implant"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description:</Label>
              <Button
                size="sm"
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                onClick={async () => {
                  try {
                    toast({
                      title: "Processing",
                      description: "Generating detailed surgical steps...",
                    });

                    // Prepare surgical context for AI generation
                    const surgicalContext = `
**SURGERY DETAILS:**
- Procedure: ${surgeryDetails.procedurePerformed || 'N/A'}
- Surgeon: ${surgeryDetails.surgeon || 'N/A'}
- Anesthetist: ${surgeryDetails.anesthetist || 'N/A'}
- Anesthesia Type: ${surgeryDetails.anesthesia || 'General Anesthesia'}
- Date: ${surgeryDetails.date ? format(new Date(surgeryDetails.date), 'dd-MM-yyyy HH:mm') : 'N/A'}
- Implant: ${surgeryDetails.implant || 'None'}

**PATIENT INFORMATION:**
- Name: ${patientData?.patients?.name || 'N/A'}
- Age: ${patientData?.patients?.age || 'N/A'}
- Gender: ${patientData?.patients?.gender || 'N/A'}

**DIAGNOSIS:**
${diagnosis || 'N/A'}
`;

                    console.log('🔪 Generating surgical steps for:', surgeryDetails.procedurePerformed);

                    // Call OpenAI API for surgical step generation
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                      },
                      body: JSON.stringify({
                        model: 'gpt-4',
                        messages: [
                          {
                            role: 'system',
                            content: `You are a surgical documentation specialist. Generate detailed, step-by-step surgical procedure notes for the given surgery.

**REQUIRED FORMAT:**

**DETAILED SURGICAL PROCEDURE NOTES**

**Procedure:** [Surgical Procedure Name]
**Date & Time:** [Surgery Date & Time]
**Surgeon:** [Surgeon Name]
**Anesthetist:** [Anesthetist Name]
**Anesthesia:** [Type of Anesthesia]
**Implant:** [Implant details or None]

**DETAILED SURGICAL STEPS:**

**1. Pre-operative Preparation:**
- [Specific preparation steps for this procedure]
- [Patient positioning details]
- [Surgical site preparation]
- [Antibiotic prophylaxis]

**2. Anesthesia Administration:**
- [Specific anesthesia details]
- [Monitoring requirements]
- [Intubation if required]

**3. Surgical Approach:**
- [Specific incision details for this procedure]
- [Anatomical landmarks]
- [Tissue dissection approach]

**4. Operative Procedure:**
- [Detailed step-by-step surgical technique specific to this procedure]
- [Key anatomical structures identification]
- [Specific surgical maneuvers]
- [Hemostasis techniques]
- [Implant placement if applicable]

**5. Closure:**
- [Layer-by-layer closure specific to this procedure]
- [Suture materials and techniques]
- [Drainage if required]
- [Dressing application]

**6. Post-operative:**
- [Immediate post-operative care]
- [Recovery considerations]
- [Follow-up requirements]

**Estimated Blood Loss:** [Estimate based on procedure]
**Duration:** [Typical duration for this procedure]
**Complications:** [Any complications or None]

IMPORTANT: Create detailed, procedure-specific surgical steps. Use medical terminology appropriate for the specific surgery being performed. Be thorough and professional.`
                          },
                          {
                            role: 'user',
                            content: `Please generate detailed surgical procedure steps for the following surgery:

${surgicalContext}

Focus on creating step-by-step surgical notes that are specific to the procedure being performed. Include all relevant surgical steps, techniques, and considerations for this specific operation.`
                          }
                        ],
                        temperature: 0.7,
                        max_tokens: 3000
                      })
                    });

                    if (!response.ok) {
                      throw new Error(`OpenAI API error: ${response.statusText}`);
                    }

                    const data = await response.json();
                    const generatedSteps = data.choices[0]?.message?.content;

                    if (generatedSteps) {
                      // Update the surgery description with generated steps
                      setSurgeryDetails(prev => ({
                        ...prev,
                        description: generatedSteps
                      }));

                      toast({
                        title: "Success",
                        description: "Detailed surgical steps generated successfully!",
                      });

                      console.log('✅ Generated Surgical Steps:', generatedSteps);
                    } else {
                      throw new Error('No response from ChatGPT');
                    }

                  } catch (error) {
                    console.error('❌ Surgical Steps Generation Error:', error);
                    toast({
                      title: "Error",
                      description: `Failed to generate surgical steps: ${error.message}`,
                      variant: "destructive"
                    });
                  }
                }}
              >
                🤖 AI Generate
              </Button>
            </div>
            <Textarea
              value={surgeryDetails.description}
              onChange={(e) => setSurgeryDetails({...surgeryDetails, description: e.target.value})}
              placeholder={`**Surgical Operation Record**

**Patient Information:**
- Name: USA
- Age: 25
- Gender: Male

**Date of Surgery:** September 25, 2025

Enter surgical procedure description here...`}
              className="min-h-[150px]"
            />
          </div>
        </CardContent>
      </Card>


      {/* Treatment During Hospital Stay */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment During Hospital Stay:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>The condition of patient at the time of discharge was:</Label>
              <div className="flex space-x-4">
                <Select value={treatmentCondition} onValueChange={setTreatmentCondition}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={treatmentStatus} onValueChange={setTreatmentStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Please select">Please select</SelectItem>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="Improving">Improving</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Review on*</Label>
              <Input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Resident On Discharge*</Label>
              <Select value={residentOnDischarge} onValueChange={setResidentOnDischarge}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Please select">Please select</SelectItem>
                  {consultants.map((consultant: any) => (
                    <SelectItem key={consultant.id} value={consultant.name}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                checked={enableSmsAlert}
                onCheckedChange={setEnableSmsAlert}
              />
              <Label>Enable SMS Alert</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center space-x-4 pb-6">
        <Button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-700">
          Save
        </Button>
        <Button
          onClick={() => navigate('/todays-ipd')}
          variant="outline"
          className="px-8 py-2 border-gray-300 hover:bg-gray-50"
        >
          Close
        </Button>
      </div>

      {/* AI Generated Discharge Summary Section */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-end mb-2">
                  <Button
                    onClick={() => setShowAddTemplate(!showAddTemplate)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white px-3"
                  >
                    {showAddTemplate ? 'Cancel' : 'Add'}
                  </Button>
                </div>

                {/* Collapsible Add New Template */}
                {showAddTemplate && (
                  <div className="mb-2 p-3 border rounded bg-gray-50 animate-in slide-in-from-top-2 duration-200">
                    <Label className="text-sm font-medium mb-2 block">Add New Template:</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Template name..."
                        className="text-sm"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        autoFocus
                      />
                      <Textarea
                        placeholder="Template content..."
                        className="text-sm min-h-[60px]"
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={addNewTemplate}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                        >
                          Add Template
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddTemplate(false);
                            setNewTemplateName('');
                            setNewTemplateContent('');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Label>Favorite Templates:</Label>
                <div className="border rounded p-2 h-48 overflow-y-auto bg-cyan-50">
                  {stayNotesTemplates.map((template, index) => {
                    const isEditing = editingTemplateIndex === index;

                    return (
                      <div key={index} className="p-2 hover:bg-white hover:shadow-sm rounded mb-2 border-b border-gray-100 last:border-b-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editingTemplateName}
                              onChange={(e) => setEditingTemplateName(e.target.value)}
                              className="text-sm h-8 font-medium"
                              placeholder="Template name..."
                              autoFocus
                            />
                            <Textarea
                              value={editingTemplateContent}
                              onChange={(e) => setEditingTemplateContent(e.target.value)}
                              className="text-sm min-h-[60px]"
                              placeholder="Template content..."
                            />
                            <div className="flex space-x-2">
                              <Button
                                onClick={saveEditTemplate}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={cancelEditTemplate}
                                size="sm"
                                variant="outline"
                                className="text-xs flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 cursor-pointer" onClick={() => {
                                // Build patient details context
                                let patientContext = `\n\nPATIENT DETAILS:\n`;
                                patientContext += `Name: ${patientInfo.name}\n`;
                                patientContext += `Reg ID: ${patientInfo.regId}\n`;
                                patientContext += `Age/Sex: ${patientInfo.ageSex}\n`;
                                patientContext += `Address: ${patientInfo.address}\n`;
                                patientContext += `Admission Date: ${patientInfo.doa}\n`;
                                patientContext += `Discharge Date: ${patientInfo.dateOfDischarge}\n`;
                                patientContext += `Treating Consultant: ${patientInfo.treatingConsultant}\n`;
                                if (patientInfo.corporateType) patientContext += `Corporate Type: ${patientInfo.corporateType}\n`;

                                // Add diagnosis if available
                                if (diagnosis) {
                                  patientContext += `\nDIAGNOSIS:\n${diagnosis}\n`;
                                }

                                // Add investigations if available
                                if (investigations) {
                                  patientContext += `\nINVESTIGATIONS:\n${investigations}\n`;
                                }

                                // Add surgery details if available
                                if (surgeryDetails.procedurePerformed) {
                                  patientContext += `\nSURGERY PERFORMED:\n`;
                                  patientContext += `Procedure: ${surgeryDetails.procedurePerformed}\n`;
                                  if (surgeryDetails.surgeon) patientContext += `Surgeon: ${surgeryDetails.surgeon}\n`;
                                  if (surgeryDetails.anesthetist) patientContext += `Anesthetist: ${surgeryDetails.anesthetist}\n`;
                                  if (surgeryDetails.date) patientContext += `Date: ${surgeryDetails.date}\n`;
                                }

                                // Add the template content with patient context to newTemplateContent textbox (above Fetch Data button)
                                // Preserve existing content if any
                                setNewTemplateContent(prev => {
                                  const newContent = template.content + patientContext;
                                  // If there's already content, append with separator, otherwise just set new content
                                  return prev ? prev + '\n\n---\n\n' + newContent : newContent;
                                });
                              }}>
                                <div className="text-sm font-medium text-gray-800 mb-1">{template.name}</div>
                                <div className="text-xs text-gray-600 line-clamp-2">{template.content}</div>
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <Button
                                  onClick={() => editTemplate(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                  title="Edit template"
                                >
                                  ✏️
                                </Button>
                                <Button
                                  onClick={() => deleteTemplate(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  title="Delete template"
                                >
                                  🗑️
                                </Button>
                                <Button
                                  onClick={() => moveTemplateUp(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  disabled={index === 0}
                                  title="Move up"
                                >
                                  ⬆️
                                </Button>
                                <Button
                                  onClick={() => moveTemplateDown(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  disabled={index === stayNotesTemplates.length - 1}
                                  title="Move down"
                                >
                                  ⬇️
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Choose from above or type here..."
                    className="min-h-[80px] text-sm"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {/* Row 1 */}
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFetchPatientData();
                      }}
                    >
                      📋 Fetch Data
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!newTemplateContent.trim()) {
                          toast({
                            title: "Error",
                            description: "Please add content to send to ChatGPT",
                            variant: "destructive"
                          });
                          return;
                        }

                        try {
                          toast({
                            title: "Processing",
                            description: "Generating AI discharge summary...",
                          });

                          // Prepare patient data to send with the prompt
                          const patientInfo = patientData?.patients;
                          const patientDataText = `
**PATIENT INFORMATION:**
- Name: ${patientInfo?.name || 'N/A'}
- Age: ${patientInfo?.age || 'N/A'} years
- Gender: ${patientInfo?.gender || 'N/A'}
- MRN: ${patientInfo?.mrn || 'N/A'}
- Admission Date: ${patientInfo?.created_at ? format(new Date(patientInfo.created_at), 'dd-MM-yyyy') : 'N/A'}

**DIAGNOSIS:**
${diagnosis || 'N/A'}

**SURGERY PERFORMED:**
- Procedure: ${surgeryDetails.procedurePerformed || 'N/A'}
- Date: ${surgeryDetails.date ? format(new Date(surgeryDetails.date), 'dd-MM-yyyy HH:mm') : 'N/A'}
- Surgeon: ${surgeryDetails.surgeon || 'N/A'}
- Anesthetist: ${surgeryDetails.anesthetist || 'N/A'}
- Anesthesia Type: ${surgeryDetails.anesthesia || 'N/A'}
- Implant: ${surgeryDetails.implant || 'N/A'}

**MEDICATIONS ON DISCHARGE:**
${medicationRows.map((med, index) =>
  `${index + 1}. ${med.name || 'N/A'} - ${med.dose || 'N/A'} ${med.route || 'P.O'} for ${med.days || 'N/A'} days`
).join('\n') || 'No medications prescribed'}

**VITAL SIGNS:**
- Temperature: ${examination.temp || 'N/A'}°F
- Pulse Rate: ${examination.pr || 'N/A'} bpm
- Blood Pressure: ${examination.bp || 'N/A'} mmHg
- Respiratory Rate: ${examination.rr || 'N/A'} /min
- SpO2: ${examination.spo2 || 'N/A'}%

**INVESTIGATIONS:**
${investigations || 'No investigations available'}
`;

                          const fullPromptWithData = `${newTemplateContent}

${patientDataText}`;

                          console.log('🤖 Sending to ChatGPT with patient data:', fullPromptWithData);

                          // Call OpenAI API with enhanced system prompt for standard discharge summary
                          const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                            },
                            body: JSON.stringify({
                              model: 'gpt-4',
                              messages: [
                                {
                                  role: 'system',
                                  content: `You are a medical specialist creating professionally written discharge summaries. Follow the template requirements exactly as specified by the user. Create comprehensive medical documentation with proper formatting.

**STRICT REQUIREMENTS:**

1. **DIAGNOSIS SECTION** (at the beginning):
   - Primary diagnosis first
   - Secondary diagnoses if applicable
   - Use medical terminology appropriately

2. **MEDICATIONS TABLE** (immediately after diagnosis):
   | Name | Strength | Route | Dosage | Days |
   |------|----------|-------|---------|------|
   - **CRITICAL**: If no medications are provided in patient data, suggest appropriate medications based on the diagnosis and surgery performed
   - For post-surgical patients: Include antibiotics, pain management, and surgery-specific medications
   - For medical conditions: Include condition-specific treatments (e.g., ACE inhibitors for nephritis, diuretics for kidney conditions, anti-seizure medications for SAH)
   - Include Indian brand medications when appropriate (e.g., Augmentin, Paracetamol, Pantoprazole, etc.)
   - Add Hindi translation in dosage column alongside English
   - Detailed instructions (once/twice/thrice daily)
   - Specify route (P.O., I.V., I.M., etc.)
   - Include typical discharge duration (5-7 days for antibiotics, 3-5 days for pain meds)

3. **OPERATION NOTES TABLE** (if surgery performed - minimum 6 rows):
   | Row | Details |
   |-----|---------|
   | 1 | Date and Time of Surgery |
   | 2 | Procedure Title |
   | 3 | Surgeon Name |
   | 4 | Anesthetist Name |
   | 5 | Type of Anesthesia |
   | 6+ | Detailed Description of Surgery |

4. **CLINICAL FINDINGS:**
   - Events during hospital stay
   - Examination findings
   - Course of treatment

5. **INVESTIGATIONS:**
   - Lab results and imaging findings
   - Relevant diagnostic tests

6. **ADVICE:**
   - Home care precautions
   - Warning signs to watch for
   - When to return to hospital
   - Follow up after 7 days/SOS

7. **EMERGENCY CONTACT** (mandatory ending):
   URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT:-7030974619, 9373111709.

IMPORTANT:
- Create detailed, comprehensive content (minimum 800 words)
- Use headings, subheadings, bullet points, and bold formatting
- Professional medical terminology for doctor-to-doctor communication
- Include complications to watch for with symptoms and signs
- Use proper markdown table formatting with clear borders
- Follow the user's template instructions precisely`
                                },
                                {
                                  role: 'user',
                                  content: `Please create a comprehensive discharge summary following the template instructions provided below. Apply the template exactly as specified and use the patient data provided to generate detailed, professional medical documentation.

**TEMPLATE INSTRUCTIONS:**
${fullPromptWithData}

**IMPORTANT NOTES:**
- Follow the template requirements exactly as specified
- Generate comprehensive content (minimum 800 words)
- Include all required sections: Diagnosis, Medications Table, Operation Notes (if surgery), Clinical Findings, Investigations, Advice, Emergency Contact
- **MEDICATION REQUIREMENTS**: If patient data shows no medications or only basic fluids (like NS/Normal Saline), generate appropriate discharge medications based on:
  * Primary and secondary diagnoses
  * Surgery performed (if any)
  * Standard post-operative care
  * Condition-specific treatments
- Use Indian brand medications where appropriate (Augmentin, Calpol, Pan-D, etc.)
- Add Hindi translations in dosage column (e.g., "दिन में दो बार" for twice daily)
- Create detailed operation notes table with minimum 6 rows if surgery was performed
- Include complications to watch for with symptoms and signs
- End with the mandatory emergency contact information

Generate the discharge summary now:`
                                }
                              ],
                              temperature: 0.7,
                              max_tokens: 6000
                            })
                          });

                          if (!response.ok) {
                            throw new Error(`OpenAI API error: ${response.statusText}`);
                          }

                          const data = await response.json();
                          const generatedSummary = data.choices[0]?.message?.content;

                          if (generatedSummary) {
                            // Display generated summary in the right section
                            setStayNotes(generatedSummary);

                            toast({
                              title: "Success",
                              description: "Professional discharge summary generated successfully!",
                            });

                            console.log('✅ Generated Summary:', generatedSummary);
                          } else {
                            throw new Error('No response from ChatGPT');
                          }

                        } catch (error) {
                          console.error('❌ ChatGPT Error:', error);
                          toast({
                            title: "Error",
                            description: `Failed to generate summary: ${error.message}`,
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      🤖 AI Generated Summary
                    </Button>

                    {/* Row 2 */}
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        if (!stayNotes.trim()) {
                          toast({
                            title: "Error",
                            description: "Please generate a discharge summary first",
                            variant: "destructive"
                          });
                          return;
                        }
                        setPreviewContent(stayNotes);
                        setShowPreview(true);
                      }}
                    >
                      👁️ Preview
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                      onClick={() => {
                        if (!stayNotes.trim()) {
                          toast({
                            title: "Error",
                            description: "Please generate a discharge summary first",
                            variant: "destructive"
                          });
                          return;
                        }

                        // Create a print window with formatted content
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          // Function to convert markdown tables to HTML tables
                          const convertMarkdownTables = (content) => {
                            const lines = content.split('\n');
                            let result = [];
                            let inTable = false;
                            let tableRows = [];

                            for (let i = 0; i < lines.length; i++) {
                              const line = lines[i].trim();

                              if (line.startsWith('|') && line.endsWith('|')) {
                                if (!inTable) {
                                  inTable = true;
                                  tableRows = [];
                                }

                                if (!/^[\|\-\s]+$/.test(line)) {
                                  tableRows.push(line);
                                }
                              } else {
                                if (inTable && tableRows.length > 0) {
                                  result.push(convertTableRows(tableRows));
                                  tableRows = [];
                                  inTable = false;
                                }

                                if (line) {
                                  result.push(line);
                                }
                              }
                            }

                            if (inTable && tableRows.length > 0) {
                              result.push(convertTableRows(tableRows));
                            }

                            return result.join('\n');
                          };

                          const convertTableRows = (rows) => {
                            if (rows.length === 0) return '';

                            let html = '<table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 2px solid #2c3e50;">';

                            rows.forEach((row, index) => {
                              const cells = row.split('|').filter(cell => cell.trim() !== '');
                              const isHeader = index === 0;
                              const tag = isHeader ? 'th' : 'td';
                              const style = isHeader
                                ? 'border: 1px solid #2c3e50; padding: 12px; text-align: left; background-color: #ecf0f1; font-weight: bold;'
                                : 'border: 1px solid #2c3e50; padding: 12px; text-align: left;';

                              html += '<tr>';
                              cells.forEach(cell => {
                                html += `<${tag} style="${style}">${cell.trim()}</${tag}>`;
                              });
                              html += '</tr>';
                            });

                            html += '</table>';
                            return html;
                          };

                          let processedContent = convertMarkdownTables(stayNotes);
                          processedContent = processedContent
                            .replace(/\n/g, '<br>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            // Format DISCHARGE SUMMARY header
                            .replace(/DISCHARGE SUMMARY/g, '<h1 style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0 5px 0; color: #000;">DISCHARGE SUMMARY</h1><hr style="border: 1px solid #000; margin: 5px 0 15px 0;">')
                            // Format patient details as subheadings
                            .replace(/Patient Name:/g, '<strong style="font-size: 14px;">Patient Name:</strong>')
                            .replace(/MRN:/g, '<strong style="font-size: 14px;">MRN:</strong>')
                            .replace(/Age:/g, '<strong style="font-size: 14px;">Age:</strong>')
                            .replace(/Gender:/g, '<strong style="font-size: 14px;">Gender:</strong>')
                            .replace(/Admission Date:/g, '<strong style="font-size: 14px;">Admission Date:</strong>')
                            .replace(/Discharge Date:/g, '<strong style="font-size: 14px;">Discharge Date:</strong>')
                            .replace(/<br><strong>(DIAGNOSIS|MEDICATIONS|OPERATION NOTES|CLINICAL FINDINGS|INVESTIGATIONS|ADVICE|EMERGENCY CONTACT)([^<]*?)<\/strong>/g, '<br><br><strong style="font-size: 16px; color: #2c3e50; display: block; margin: 20px 0 10px 0; border-bottom: 2px solid #3498db; padding-bottom: 5px;">$1$2</strong>')
                            .replace(/<br><table/g, '<table')
                            .replace(/<\/table><br>/g, '</table>');

                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Discharge Summary</title>
                              <style>
                                body {
                                  font-family: 'Times New Roman', serif;
                                  line-height: 1.6;
                                  margin: 40px;
                                  color: #000;
                                }
                                h1, h2, h3 {
                                  color: #2c3e50;
                                  border-bottom: 2px solid #3498db;
                                  padding-bottom: 5px;
                                }
                                table {
                                  border-collapse: collapse;
                                  width: 100%;
                                  margin: 20px 0;
                                  border: 2px solid #2c3e50;
                                }
                                th, td {
                                  border: 1px solid #2c3e50;
                                  padding: 12px;
                                  text-align: left;
                                }
                                th {
                                  background-color: #ecf0f1;
                                  font-weight: bold;
                                }
                                @media print {
                                  body { margin: 20px; }
                                  .no-print { display: none; }
                                }
                              </style>
                            </head>
                            <body>
                              <div>${processedContent}</div>
                              <script>
                                window.onload = function() {
                                  window.print();
                                  window.onafterprint = function() {
                                    window.close();
                                  };
                                };
                              </script>
                            </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }}
                    >
                      🖨️ Print
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={stayNotes}
                  onChange={(e) => setStayNotes(e.target.value)}
                  className="min-h-[280px]"
                  placeholder="Generated discharge summary will appear here..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[90%] h-[90%] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-blue-50">
              <h2 className="text-xl font-bold text-gray-800">📋 Discharge Summary Preview</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    // Create a print window with formatted content
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      // Function to convert markdown tables to HTML tables
                      const convertMarkdownTables = (content) => {
                        const lines = content.split('\n');
                        let result = [];
                        let inTable = false;
                        let tableRows = [];

                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i].trim();

                          if (line.startsWith('|') && line.endsWith('|')) {
                            if (!inTable) {
                              inTable = true;
                              tableRows = [];
                            }

                            if (!/^[\|\-\s]+$/.test(line)) {
                              tableRows.push(line);
                            }
                          } else {
                            if (inTable && tableRows.length > 0) {
                              result.push(convertTableRows(tableRows));
                              tableRows = [];
                              inTable = false;
                            }

                            if (line) {
                              result.push(line);
                            }
                          }
                        }

                        if (inTable && tableRows.length > 0) {
                          result.push(convertTableRows(tableRows));
                        }

                        return result.join('\n');
                      };

                      const convertTableRows = (rows) => {
                        if (rows.length === 0) return '';

                        let html = '<table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 2px solid #2c3e50;">';

                        rows.forEach((row, index) => {
                          const cells = row.split('|').filter(cell => cell.trim() !== '');
                          const isHeader = index === 0;
                          const tag = isHeader ? 'th' : 'td';
                          const style = isHeader
                            ? 'border: 1px solid #2c3e50; padding: 12px; text-align: left; background-color: #ecf0f1; font-weight: bold;'
                            : 'border: 1px solid #2c3e50; padding: 12px; text-align: left;';

                          html += '<tr>';
                          cells.forEach(cell => {
                            html += `<${tag} style="${style}">${cell.trim()}</${tag}>`;
                          });
                          html += '</tr>';
                        });

                        html += '</table>';
                        return html;
                      };

                      let processedContent = convertMarkdownTables(previewContent);
                      processedContent = processedContent
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        // Format DISCHARGE SUMMARY header
                        .replace(/DISCHARGE SUMMARY/g, '<h1 style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0 10px 0; color: #000;">DISCHARGE SUMMARY</h1><hr style="border: 1px solid #000; margin: 10px 0 20px 0;">')
                        .replace(/<br><strong>(DIAGNOSIS|MEDICATIONS|OPERATION NOTES|CLINICAL FINDINGS|INVESTIGATIONS|ADVICE|EMERGENCY CONTACT)([^<]*?)<\/strong>/g, '<br><br><strong style="font-size: 16px; color: #2c3e50; display: block; margin: 20px 0 10px 0; border-bottom: 2px solid #3498db; padding-bottom: 5px;">$1$2</strong>')
                        .replace(/<br><table/g, '<table')
                        .replace(/<\/table><br>/g, '</table>');

                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Discharge Summary</title>
                          <style>
                            body {
                              font-family: 'Times New Roman', serif;
                              line-height: 1.6;
                              margin: 40px;
                              color: #000;
                            }
                            h1, h2, h3 {
                              color: #2c3e50;
                              border-bottom: 2px solid #3498db;
                              padding-bottom: 5px;
                            }
                            table {
                              border-collapse: collapse;
                              width: 100%;
                              margin: 20px 0;
                              border: 2px solid #2c3e50;
                            }
                            th, td {
                              border: 1px solid #2c3e50;
                              padding: 12px;
                              text-align: left;
                            }
                            th {
                              background-color: #ecf0f1;
                              font-weight: bold;
                            }
                            @media print {
                              body { margin: 20px; }
                              .no-print { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          <div>${processedContent}</div>
                          <script>
                            window.onload = function() {
                              window.print();
                              window.onafterprint = function() {
                                window.close();
                              };
                            };
                          </script>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                  size="sm"
                >
                  🖨️ Print from Preview
                </Button>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  ✕ Close
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-lg border-2 border-gray-200 rounded-lg p-8">
                  <div className="prose prose-lg max-w-none">
                    <div
                      className="formatted-content"
                      style={{
                        lineHeight: '1.6',
                        fontSize: '14px',
                        fontFamily: 'Times New Roman, serif'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          // Function to convert markdown tables to HTML tables
                          const convertMarkdownTables = (content) => {
                            // Split content by lines
                            const lines = content.split('\n');
                            let result = [];
                            let inTable = false;
                            let tableRows = [];

                            for (let i = 0; i < lines.length; i++) {
                              const line = lines[i].trim();

                              // Check if line contains table markup (starts and ends with |)
                              if (line.startsWith('|') && line.endsWith('|')) {
                                if (!inTable) {
                                  inTable = true;
                                  tableRows = [];
                                }

                                // Skip separator rows (contain only |, -, and spaces)
                                if (!/^[\|\-\s]+$/.test(line)) {
                                  tableRows.push(line);
                                }
                              } else {
                                // If we were in a table and now we're not, convert the table
                                if (inTable && tableRows.length > 0) {
                                  result.push(convertTableRows(tableRows));
                                  tableRows = [];
                                  inTable = false;
                                }

                                // Add the non-table line
                                if (line) {
                                  result.push(line);
                                }
                              }
                            }

                            // Handle case where content ends with a table
                            if (inTable && tableRows.length > 0) {
                              result.push(convertTableRows(tableRows));
                            }

                            return result.join('\n');
                          };

                          // Function to convert table rows to HTML
                          const convertTableRows = (rows) => {
                            if (rows.length === 0) return '';

                            let html = '<table class="medical-table" style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 2px solid #2c3e50;">';

                            rows.forEach((row, index) => {
                              const cells = row.split('|').filter(cell => cell.trim() !== '');
                              const isHeader = index === 0;
                              const tag = isHeader ? 'th' : 'td';
                              const style = isHeader
                                ? 'border: 1px solid #2c3e50; padding: 12px; text-align: left; background-color: #ecf0f1; font-weight: bold;'
                                : 'border: 1px solid #2c3e50; padding: 12px; text-align: left;';

                              html += '<tr>';
                              cells.forEach(cell => {
                                html += `<${tag} style="${style}">${cell.trim()}</${tag}>`;
                              });
                              html += '</tr>';
                            });

                            html += '</table>';
                            return html;
                          };

                          // Process the content
                          let processedContent = previewContent
                            // First convert markdown tables
                            .replace(/\r\n/g, '\n')
                            .replace(/\r/g, '\n');

                          processedContent = convertMarkdownTables(processedContent);

                          // Then apply other formatting
                          return processedContent
                            .replace(/\n/g, '<br>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            // Format DISCHARGE SUMMARY header
                            .replace(/DISCHARGE SUMMARY/g, '<h1 style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0 5px 0; color: #000;">DISCHARGE SUMMARY</h1><hr style="border: 1px solid #000; margin: 5px 0 15px 0;">')
                            // Format patient details as subheadings
                            .replace(/Patient Name:/g, '<strong style="font-size: 14px;">Patient Name:</strong>')
                            .replace(/MRN:/g, '<strong style="font-size: 14px;">MRN:</strong>')
                            .replace(/Age:/g, '<strong style="font-size: 14px;">Age:</strong>')
                            .replace(/Gender:/g, '<strong style="font-size: 14px;">Gender:</strong>')
                            .replace(/Admission Date:/g, '<strong style="font-size: 14px;">Admission Date:</strong>')
                            .replace(/Discharge Date:/g, '<strong style="font-size: 14px;">Discharge Date:</strong>')
                            // Add some spacing around section headers
                            .replace(/<br><strong>(DIAGNOSIS|MEDICATIONS|OPERATION NOTES|CLINICAL FINDINGS|INVESTIGATIONS|ADVICE|EMERGENCY CONTACT)([^<]*?)<\/strong>/g, '<br><br><strong style="font-size: 16px; color: #2c3e50; display: block; margin: 20px 0 10px 0; border-bottom: 2px solid #3498db; padding-bottom: 5px;">$1$2</strong>')
                            // Clean up extra line breaks around tables
                            .replace(/<br><table/g, '<table')
                            .replace(/<\/table><br>/g, '</table>');
                        })()
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </form>
  );
};

export default IpdDischargeSummary;