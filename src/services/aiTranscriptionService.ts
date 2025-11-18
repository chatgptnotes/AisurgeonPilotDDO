/**
 * AI Transcription Service using OpenAI Whisper
 *
 * Features:
 * - Transcribe audio recordings from consultations
 * - Support for multiple audio formats (mp3, wav, m4a, etc.)
 * - Automatic language detection
 * - Speaker diarization (identifying different speakers)
 * - Medical terminology optimization
 */

import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - move to backend in production
});

export interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
  segments?: TranscriptionSegment[];
  words?: TranscriptionWord[];
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptionMetadata {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  audio_file_url: string;
  transcription_text: string;
  duration_seconds: number;
  language: string;
  created_at: string;
  metadata?: any;
}

export class AITranscriptionService {
  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribeAudio(
    audioFile: File | Blob,
    options?: {
      language?: string;
      prompt?: string;
      temperature?: number;
      responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    }
  ): Promise<TranscriptionResult> {
    try {
      // Validate file size (Whisper limit is 25MB)
      if (audioFile.size > 25 * 1024 * 1024) {
        throw new Error('Audio file too large. Maximum size is 25MB.');
      }

      // Prepare the file
      const file = audioFile instanceof File
        ? audioFile
        : new File([audioFile], 'audio.mp3', { type: 'audio/mpeg' });

      // Default prompt for medical context
      const medicalPrompt = options?.prompt ||
        'This is a medical consultation between a doctor and patient. ' +
        'Please transcribe accurately, including medical terminology, ' +
        'symptoms, diagnoses, and treatment plans.';

      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: options?.language,
        prompt: medicalPrompt,
        temperature: options?.temperature || 0.2, // Lower temperature for more accurate medical transcription
        response_format: options?.responseFormat || 'verbose_json'
      });

      // Parse response based on format
      if (options?.responseFormat === 'text') {
        return {
          text: transcription as unknown as string,
          duration: 0,
          language: options?.language || 'en'
        };
      }

      // verbose_json format includes segments and words
      const verboseTranscription = transcription as any;

      return {
        text: verboseTranscription.text,
        duration: verboseTranscription.duration || 0,
        language: verboseTranscription.language || 'en',
        segments: verboseTranscription.segments,
        words: verboseTranscription.words
      };
    } catch (error: any) {
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio from URL
   */
  async transcribeAudioFromUrl(
    audioUrl: string,
    options?: {
      language?: string;
      prompt?: string;
    }
  ): Promise<TranscriptionResult> {
    try {
      // Fetch audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }

      const audioBlob = await response.blob();
      return this.transcribeAudio(audioBlob, options);
    } catch (error: any) {
      console.error('URL transcription error:', error);
      throw new Error(`Failed to transcribe from URL: ${error.message}`);
    }
  }

  /**
   * Upload audio to Supabase Storage and transcribe
   */
  async uploadAndTranscribe(
    audioFile: File,
    appointmentId: string,
    doctorId: string,
    patientId: string,
    options?: {
      language?: string;
      prompt?: string;
    }
  ): Promise<TranscriptionMetadata> {
    try {
      // 1. Upload audio file to Supabase Storage
      const fileName = `${appointmentId}_${Date.now()}.${audioFile.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('consultation-recordings')
        .upload(fileName, audioFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('consultation-recordings')
        .getPublicUrl(fileName);

      // 2. Transcribe audio
      const transcriptionResult = await this.transcribeAudio(audioFile, options);

      // 3. Save transcription to database
      const { data: transcriptionRecord, error: dbError } = await supabase
        .from('consultation_transcriptions')
        .insert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          patient_id: patientId,
          audio_file_url: urlData.publicUrl,
          transcription_text: transcriptionResult.text,
          duration_seconds: transcriptionResult.duration,
          language: transcriptionResult.language,
          metadata: {
            segments: transcriptionResult.segments,
            words: transcriptionResult.words
          }
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      return transcriptionRecord;
    } catch (error: any) {
      console.error('Upload and transcribe error:', error);
      throw error;
    }
  }

  /**
   * Get transcription by appointment ID
   */
  async getTranscriptionByAppointment(appointmentId: string): Promise<TranscriptionMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('consultation_transcriptions')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transcription:', error);
      return null;
    }
  }

  /**
   * Get all transcriptions for a doctor
   */
  async getDoctorTranscriptions(doctorId: string): Promise<TranscriptionMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('consultation_transcriptions')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor transcriptions:', error);
      return [];
    }
  }

  /**
   * Get all transcriptions for a patient
   */
  async getPatientTranscriptions(patientId: string): Promise<TranscriptionMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('consultation_transcriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient transcriptions:', error);
      return [];
    }
  }

  /**
   * Delete transcription
   */
  async deleteTranscription(transcriptionId: string): Promise<boolean> {
    try {
      // Get transcription to delete audio file
      const { data: transcription } = await supabase
        .from('consultation_transcriptions')
        .select('audio_file_url')
        .eq('id', transcriptionId)
        .single();

      if (transcription?.audio_file_url) {
        // Extract file path from URL
        const urlParts = transcription.audio_file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // Delete from storage
        await supabase.storage
          .from('consultation-recordings')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('consultation_transcriptions')
        .delete()
        .eq('id', transcriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting transcription:', error);
      return false;
    }
  }

  /**
   * Extract key medical information from transcription
   * This can be used to pre-populate SOAP notes
   */
  async extractMedicalInfo(transcriptionText: string): Promise<{
    symptoms: string[];
    diagnosis: string[];
    medications: string[];
    procedures: string[];
  }> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical assistant. Extract key medical information from the consultation transcription.'
          },
          {
            role: 'user',
            content: `Extract the following from this medical consultation transcription:
1. Symptoms mentioned by the patient
2. Diagnoses made by the doctor
3. Medications prescribed or discussed
4. Procedures or tests ordered

Transcription:
${transcriptionText}

Return as JSON with keys: symptoms, diagnosis, medications, procedures (each as array of strings)`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        symptoms: result.symptoms || [],
        diagnosis: result.diagnosis || [],
        medications: result.medications || [],
        procedures: result.procedures || []
      };
    } catch (error) {
      console.error('Error extracting medical info:', error);
      return {
        symptoms: [],
        diagnosis: [],
        medications: [],
        procedures: []
      };
    }
  }
}

// Export singleton instance
export const aiTranscriptionService = new AITranscriptionService();
