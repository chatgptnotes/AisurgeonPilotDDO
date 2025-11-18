/**
 * AI SOAP Notes Service using OpenAI GPT-4
 *
 * SOAP Format:
 * - S (Subjective): Patient's complaints, symptoms, history
 * - O (Objective): Physical examination findings, vital signs, lab results
 * - A (Assessment): Diagnosis, differential diagnosis
 * - P (Plan): Treatment plan, medications, follow-up
 *
 * Features:
 * - Generate SOAP notes from transcription
 * - Generate prescriptions
 * - Medical coding (ICD-10, CPT)
 * - Treatment recommendations
 * - Follow-up scheduling suggestions
 */

import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - move to backend in production
});

export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  chief_complaint?: string;
  vital_signs?: VitalSigns;
  diagnoses?: Diagnosis[];
  medications?: Medication[];
  procedures?: string[];
  follow_up?: string;
}

export interface VitalSigns {
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  height?: number;
  weight?: number;
  bmi?: number;
}

export interface Diagnosis {
  code: string; // ICD-10 code
  description: string;
  type: 'primary' | 'secondary';
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  route?: string; // oral, topical, injection, etc.
}

export interface Prescription {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  medications: Medication[];
  instructions: string;
  created_at: string;
  valid_until?: string;
}

export interface SOAPNotesRecord {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  soap_notes: SOAPNotes;
  created_at: string;
  updated_at: string;
}

export class AISoapNotesService {
  /**
   * Generate SOAP notes from consultation transcription
   */
  async generateSoapNotes(
    transcriptionText: string,
    patientInfo?: {
      age?: number;
      gender?: string;
      medical_history?: string[];
      allergies?: string[];
      current_medications?: string[];
    }
  ): Promise<SOAPNotes> {
    try {
      const patientContext = patientInfo
        ? `\nPatient Information:
- Age: ${patientInfo.age || 'Unknown'}
- Gender: ${patientInfo.gender || 'Unknown'}
- Medical History: ${patientInfo.medical_history?.join(', ') || 'None reported'}
- Allergies: ${patientInfo.allergies?.join(', ') || 'None reported'}
- Current Medications: ${patientInfo.current_medications?.join(', ') || 'None'}`
        : '';

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert medical scribe assistant. Generate structured SOAP notes from consultation transcriptions.

SOAP Format:
- Subjective (S): Patient's chief complaint, symptoms, history of present illness, review of systems
- Objective (O): Physical examination findings, vital signs, diagnostic test results
- Assessment (A): Diagnosis, differential diagnoses, clinical impression
- Plan (P): Treatment plan, medications, procedures, follow-up, patient education

Include:
1. Chief Complaint
2. Vital Signs (if mentioned)
3. Diagnoses with ICD-10 codes (if possible)
4. Medications with dosage, frequency, duration
5. Procedures or tests ordered
6. Follow-up recommendations

Be thorough, accurate, and use proper medical terminology.`
          },
          {
            role: 'user',
            content: `Generate SOAP notes from this consultation:
${patientContext}

Transcription:
${transcriptionText}

Return as JSON with this structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "...",
  "chief_complaint": "...",
  "vital_signs": { "blood_pressure": "120/80", "heart_rate": 72, ... },
  "diagnoses": [{ "code": "I10", "description": "Essential hypertension", "type": "primary" }],
  "medications": [{ "name": "...", "dosage": "...", "frequency": "...", "duration": "...", "route": "..." }],
  "procedures": ["..."],
  "follow_up": "..."
}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result as SOAPNotes;
    } catch (error: any) {
      console.error('Error generating SOAP notes:', error);
      throw new Error(`Failed to generate SOAP notes: ${error.message}`);
    }
  }

  /**
   * Generate prescription from SOAP notes
   */
  async generatePrescription(
    soapNotes: SOAPNotes,
    patientName: string,
    doctorName: string,
    doctorLicense?: string
  ): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical prescription generator. Create a properly formatted prescription document.'
          },
          {
            role: 'user',
            content: `Generate a prescription document with the following:

Doctor: ${doctorName}${doctorLicense ? ` (License: ${doctorLicense})` : ''}
Patient: ${patientName}

Diagnosis: ${soapNotes.diagnoses?.map(d => d.description).join(', ') || soapNotes.assessment}

Medications:
${soapNotes.medications?.map(m =>
  `- ${m.name} ${m.dosage} ${m.frequency} for ${m.duration}${m.instructions ? ` - ${m.instructions}` : ''}`
).join('\n') || 'No medications prescribed'}

Format as a professional prescription with:
1. Header with doctor and patient details
2. Date
3. Rx symbol
4. Medications with clear instructions
5. Doctor's signature line
6. Any warnings or special instructions

Return as formatted text (not JSON).`
          }
        ],
        temperature: 0.3
      });

      return completion.choices[0].message.content || '';
    } catch (error: any) {
      console.error('Error generating prescription:', error);
      throw new Error(`Failed to generate prescription: ${error.message}`);
    }
  }

  /**
   * Save SOAP notes to database
   */
  async saveSoapNotes(
    appointmentId: string,
    doctorId: string,
    patientId: string,
    soapNotes: SOAPNotes
  ): Promise<SOAPNotesRecord> {
    try {
      const { data, error } = await supabase
        .from('soap_notes')
        .insert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          patient_id: patientId,
          soap_notes: soapNotes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error saving SOAP notes:', error);
      throw error;
    }
  }

  /**
   * Update existing SOAP notes
   */
  async updateSoapNotes(
    soapNotesId: string,
    soapNotes: Partial<SOAPNotes>
  ): Promise<SOAPNotesRecord> {
    try {
      // Get existing notes first
      const { data: existing, error: fetchError } = await supabase
        .from('soap_notes')
        .select('soap_notes')
        .eq('id', soapNotesId)
        .single();

      if (fetchError) throw fetchError;

      // Merge with existing
      const merged = { ...existing.soap_notes, ...soapNotes };

      const { data, error } = await supabase
        .from('soap_notes')
        .update({
          soap_notes: merged,
          updated_at: new Date().toISOString()
        })
        .eq('id', soapNotesId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating SOAP notes:', error);
      throw error;
    }
  }

  /**
   * Get SOAP notes by appointment
   */
  async getSoapNotesByAppointment(appointmentId: string): Promise<SOAPNotesRecord | null> {
    try {
      const { data, error } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching SOAP notes:', error);
      return null;
    }
  }

  /**
   * Get all SOAP notes for a patient
   */
  async getPatientSoapNotes(patientId: string): Promise<SOAPNotesRecord[]> {
    try {
      const { data, error } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient SOAP notes:', error);
      return [];
    }
  }

  /**
   * Get all SOAP notes for a doctor
   */
  async getDoctorSoapNotes(doctorId: string): Promise<SOAPNotesRecord[]> {
    try {
      const { data, error } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error} throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor SOAP notes:', error);
      return [];
    }
  }

  /**
   * Generate follow-up recommendations
   */
  async generateFollowUpRecommendations(
    soapNotes: SOAPNotes,
    appointmentDate: Date
  ): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical assistant. Generate follow-up recommendations based on SOAP notes.'
          },
          {
            role: 'user',
            content: `Based on these SOAP notes, generate follow-up recommendations:

Assessment: ${soapNotes.assessment}
Plan: ${soapNotes.plan}
Medications: ${soapNotes.medications?.map(m => m.name).join(', ') || 'None'}

Provide:
1. When patient should schedule follow-up (specific timeframe)
2. What to monitor before next visit
3. When to seek immediate care
4. Any lifestyle modifications

Keep it concise and patient-friendly.`
          }
        ],
        temperature: 0.5
      });

      return completion.choices[0].message.content || '';
    } catch (error: any) {
      console.error('Error generating follow-up recommendations:', error);
      return '';
    }
  }

  /**
   * Extract medical codes (ICD-10) from diagnosis
   */
  async extractMedicalCodes(diagnosis: string): Promise<Diagnosis[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical coding expert. Extract ICD-10 codes from diagnoses.'
          },
          {
            role: 'user',
            content: `Extract ICD-10 codes for this diagnosis:
${diagnosis}

Return as JSON array: [{ "code": "I10", "description": "Essential hypertension", "type": "primary" }]`
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"codes":[]}');
      return result.codes || [];
    } catch (error) {
      console.error('Error extracting medical codes:', error);
      return [];
    }
  }

  /**
   * Generate complete consultation report
   */
  async generateConsultationReport(
    appointment: any,
    patient: any,
    doctor: any,
    transcription: string,
    soapNotes: SOAPNotes
  ): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical documentation specialist. Create a comprehensive consultation report.'
          },
          {
            role: 'user',
            content: `Generate a complete medical consultation report:

PATIENT: ${patient.first_name} ${patient.last_name} (${patient.age} years, ${patient.gender})
DOCTOR: ${doctor.full_name}
DATE: ${new Date(appointment.start_time).toLocaleDateString()}

CONSULTATION NOTES:
${transcription}

SOAP NOTES:
Subjective: ${soapNotes.subjective}
Objective: ${soapNotes.objective}
Assessment: ${soapNotes.assessment}
Plan: ${soapNotes.plan}

Format as a professional medical report with:
1. Header with patient and doctor details
2. Chief complaint
3. History of present illness
4. Physical examination
5. Assessment and diagnosis
6. Treatment plan
7. Patient instructions
8. Follow-up recommendations

Use proper medical documentation format.`
          }
        ],
        temperature: 0.3
      });

      return completion.choices[0].message.content || '';
    } catch (error: any) {
      console.error('Error generating consultation report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiSoapNotesService = new AISoapNotesService();
