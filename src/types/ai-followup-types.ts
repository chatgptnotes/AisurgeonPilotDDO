/**
 * AI Patient Follow-Up System Types
 * Version: 1.3
 * Date: 2025-10-26
 *
 * Type definitions for AI-powered patient follow-up, education, and automation features
 */

// ============================================
// PATIENT EDUCATION CONTENT
// ============================================

export interface PatientEducationContent {
  id: string;
  title: string;
  content_type: 'video' | 'blog' | 'pdf' | 'article' | 'infographic';
  content_url: string | null;
  content_text: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  surgery_types: string[] | null;
  diagnosis_ids: string[] | null;
  tags: string[] | null;
  view_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientEducationContentInsert {
  id?: string;
  title: string;
  content_type: 'video' | 'blog' | 'pdf' | 'article' | 'infographic';
  content_url?: string | null;
  content_text?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  duration_minutes?: number | null;
  surgery_types?: string[] | null;
  diagnosis_ids?: string[] | null;
  tags?: string[] | null;
  view_count?: number;
  is_active?: boolean;
  created_by?: string | null;
}

// ============================================
// PATIENT EDUCATION TRACKING
// ============================================

export interface PatientEducationTracking {
  id: string;
  patient_id: string;
  content_id: string;
  sent_via: 'whatsapp' | 'email' | 'sms' | 'voice_call';
  sent_date: string;
  opened_date: string | null;
  completed_date: string | null;
  engagement_score: number;
  feedback_rating: number | null;
  feedback_notes: string | null;
  sent_by: string | null;
  created_at: string;
}

export interface PatientEducationTrackingInsert {
  id?: string;
  patient_id: string;
  content_id: string;
  sent_via: 'whatsapp' | 'email' | 'sms' | 'voice_call';
  sent_date?: string;
  opened_date?: string | null;
  completed_date?: string | null;
  engagement_score?: number;
  feedback_rating?: number | null;
  feedback_notes?: string | null;
  sent_by?: string | null;
}

// ============================================
// SURGERY OPTIONS
// ============================================

export interface SurgeryOption {
  id: string;
  diagnosis_id: string;
  surgery_name: string;
  procedure_type: 'laparoscopic' | 'open' | 'robotic' | 'minimally_invasive' | null;
  procedure_details: string | null;
  indications: string | null;
  contraindications: string | null;
  risks: string[] | null;
  benefits: string[] | null;
  recovery_time_days: number | null;
  hospital_stay_days: number | null;
  cost_range_min: number | null;
  cost_range_max: number | null;
  success_rate: number | null;
  anesthesia_type: string | null;
  preparation_requirements: string | null;
  post_op_care: string | null;
  alternative_treatments: string | null;
  is_recommended: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurgeryOptionInsert {
  id?: string;
  diagnosis_id: string;
  surgery_name: string;
  procedure_type?: 'laparoscopic' | 'open' | 'robotic' | 'minimally_invasive' | null;
  procedure_details?: string | null;
  indications?: string | null;
  contraindications?: string | null;
  risks?: string[] | null;
  benefits?: string[] | null;
  recovery_time_days?: number | null;
  hospital_stay_days?: number | null;
  cost_range_min?: number | null;
  cost_range_max?: number | null;
  success_rate?: number | null;
  anesthesia_type?: string | null;
  preparation_requirements?: string | null;
  post_op_care?: string | null;
  alternative_treatments?: string | null;
  is_recommended?: boolean;
  display_order?: number;
  is_active?: boolean;
}

// ============================================
// PATIENT SURGERY PREFERENCES
// ============================================

export interface PatientSurgeryPreference {
  id: string;
  patient_id: string;
  visit_id: string;
  surgery_option_id: string;
  preference_rank: number | null;
  decision_status: 'considering' | 'preferred' | 'selected' | 'rejected';
  concerns: string[] | null;
  questions: string[] | null;
  notes: string | null;
  decided_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientSurgeryPreferenceInsert {
  id?: string;
  patient_id: string;
  visit_id: string;
  surgery_option_id: string;
  preference_rank?: number | null;
  decision_status?: 'considering' | 'preferred' | 'selected' | 'rejected';
  concerns?: string[] | null;
  questions?: string[] | null;
  notes?: string | null;
  decided_date?: string | null;
}

// ============================================
// VOICE CALL LOGS
// ============================================

export interface VoiceCallLog {
  id: string;
  patient_id: string;
  visit_id: string | null;
  call_type: 'follow_up' | 'education' | 'reminder' | 'survey';
  call_direction: 'outbound' | 'inbound';
  phone_number: string;
  call_date: string;
  call_duration_seconds: number | null;
  call_status: 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail' | null;
  call_recording_url: string | null;
  call_transcript: string | null;
  sentiment_analysis: 'positive' | 'neutral' | 'negative' | 'mixed' | null;
  key_topics: string[] | null;
  concerns_raised: string[] | null;
  questions_asked: string[] | null;
  follow_up_required: boolean;
  follow_up_notes: string | null;
  ai_agent_id: string | null;
  cost: number | null;
  triggered_by: 'manual' | 'automation_rule' | 'scheduled';
  created_at: string;
}

export interface VoiceCallLogInsert {
  id?: string;
  patient_id: string;
  visit_id?: string | null;
  call_type: 'follow_up' | 'education' | 'reminder' | 'survey';
  call_direction?: 'outbound' | 'inbound';
  phone_number: string;
  call_date?: string;
  call_duration_seconds?: number | null;
  call_status?: 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail' | null;
  call_recording_url?: string | null;
  call_transcript?: string | null;
  sentiment_analysis?: 'positive' | 'neutral' | 'negative' | 'mixed' | null;
  key_topics?: string[] | null;
  concerns_raised?: string[] | null;
  questions_asked?: string[] | null;
  follow_up_required?: boolean;
  follow_up_notes?: string | null;
  ai_agent_id?: string | null;
  cost?: number | null;
  triggered_by?: 'manual' | 'automation_rule' | 'scheduled';
}

// ============================================
// WHATSAPP AUTOMATION LOG
// ============================================

export interface WhatsAppAutomationLog {
  id: string;
  patient_id: string;
  visit_id: string | null;
  content_id: string | null;
  message_type: 'educational_content' | 'reminder' | 'follow_up' | 'survey';
  template_name: string | null;
  phone_number: string;
  message_text: string | null;
  media_url: string | null;
  sent_date: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  delivery_timestamp: string | null;
  read_timestamp: string | null;
  failed_reason: string | null;
  doubletick_message_id: string | null;
  response_received: boolean;
  response_text: string | null;
  response_timestamp: string | null;
  triggered_by: 'manual' | 'automation_rule' | 'scheduled';
  automation_rule_id: string | null;
  created_at: string;
}

export interface WhatsAppAutomationLogInsert {
  id?: string;
  patient_id: string;
  visit_id?: string | null;
  content_id?: string | null;
  message_type: 'educational_content' | 'reminder' | 'follow_up' | 'survey';
  template_name?: string | null;
  phone_number: string;
  message_text?: string | null;
  media_url?: string | null;
  sent_date?: string;
  delivery_status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  delivery_timestamp?: string | null;
  read_timestamp?: string | null;
  failed_reason?: string | null;
  doubletick_message_id?: string | null;
  response_received?: boolean;
  response_text?: string | null;
  response_timestamp?: string | null;
  triggered_by?: 'manual' | 'automation_rule' | 'scheduled';
  automation_rule_id?: string | null;
}

// ============================================
// PATIENT DECISION JOURNEY
// ============================================

export interface PatientDecisionJourney {
  id: string;
  patient_id: string;
  visit_id: string;
  diagnosis_id: string | null;
  initial_consultation_date: string;
  decision_deadline: string | null;
  current_stage: 'initial_consultation' | 'education_phase' | 'options_review' | 'decision_making' | 'surgery_scheduled' | 'completed' | 'declined';
  stage_updated_at: string;
  concerns: string[] | null;
  patient_questions: string[] | null;
  last_contact_date: string | null;
  last_contact_method: 'whatsapp' | 'voice_call' | 'in_person' | 'email' | null;
  next_scheduled_contact_date: string | null;
  total_education_content_sent: number;
  total_education_content_viewed: number;
  total_voice_calls: number;
  total_whatsapp_messages: number;
  engagement_score: number;
  decision_confidence_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | null;
  preferred_surgery_option_id: string | null;
  surgery_scheduled_date: string | null;
  final_decision: 'agreed' | 'declined' | 'deferred' | 'transferred' | null;
  final_decision_date: string | null;
  final_decision_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientDecisionJourneyInsert {
  id?: string;
  patient_id: string;
  visit_id: string;
  diagnosis_id?: string | null;
  initial_consultation_date: string;
  decision_deadline?: string | null;
  current_stage?: 'initial_consultation' | 'education_phase' | 'options_review' | 'decision_making' | 'surgery_scheduled' | 'completed' | 'declined';
  stage_updated_at?: string;
  concerns?: string[] | null;
  patient_questions?: string[] | null;
  last_contact_date?: string | null;
  last_contact_method?: 'whatsapp' | 'voice_call' | 'in_person' | 'email' | null;
  next_scheduled_contact_date?: string | null;
  total_education_content_sent?: number;
  total_education_content_viewed?: number;
  total_voice_calls?: number;
  total_whatsapp_messages?: number;
  engagement_score?: number;
  decision_confidence_level?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | null;
  preferred_surgery_option_id?: string | null;
  surgery_scheduled_date?: string | null;
  final_decision?: 'agreed' | 'declined' | 'deferred' | 'transferred' | null;
  final_decision_date?: string | null;
  final_decision_notes?: string | null;
}

// ============================================
// AUTOMATION RULES
// ============================================

export interface AutomationRule {
  id: string;
  rule_name: string;
  rule_type: 'whatsapp' | 'voice_call' | 'email';
  trigger_type: 'days_after_consultation' | 'stage_change' | 'no_engagement' | 'scheduled';
  trigger_value: number | null;
  target_stage: string | null;
  action_type: 'send_content' | 'make_call' | 'send_reminder';
  content_id: string | null;
  message_template: string | null;
  time_of_day: string | null;
  days_of_week: number[] | null;
  is_active: boolean;
  priority: number;
  max_attempts: number;
  retry_interval_hours: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRuleInsert {
  id?: string;
  rule_name: string;
  rule_type: 'whatsapp' | 'voice_call' | 'email';
  trigger_type: 'days_after_consultation' | 'stage_change' | 'no_engagement' | 'scheduled';
  trigger_value?: number | null;
  target_stage?: string | null;
  action_type: 'send_content' | 'make_call' | 'send_reminder';
  content_id?: string | null;
  message_template?: string | null;
  time_of_day?: string | null;
  days_of_week?: number[] | null;
  is_active?: boolean;
  priority?: number;
  max_attempts?: number;
  retry_interval_hours?: number | null;
  created_by?: string | null;
}

// ============================================
// HELPER TYPES
// ============================================

export interface PatientEngagementStats {
  patient_id: string;
  total_content_sent: number;
  total_content_viewed: number;
  engagement_rate: number;
  total_voice_calls: number;
  total_whatsapp_messages: number;
  last_contact_date: string | null;
  current_stage: string;
}

export interface SurgeryOptionComparison {
  option_id: string;
  surgery_name: string;
  procedure_type: string | null;
  recovery_days: number | null;
  cost_range: string;
  success_rate: number | null;
  is_recommended: boolean;
  risks_count: number;
  benefits_count: number;
}

export interface PatientJourneyTimeline {
  stage: string;
  started_at: string;
  completed_at: string | null;
  duration_days: number | null;
  actions_taken: string[];
}
