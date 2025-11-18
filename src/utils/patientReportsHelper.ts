import { supabase } from '@/integrations/supabase/client';

export interface LabResult {
  id: string;
  test_name: string;
  test_category?: string;
  result_value?: string;
  result_unit?: string;
  reference_range?: string;
  comments?: string;
  is_abnormal?: boolean;
  result_status: string;
  technician_name?: string;
  pathologist_name?: string;
  created_at: string;
  visit_id?: string;
}

export interface RadiologyResult {
  id: string;
  radiology_id: string;
  status: string;
  findings?: string;
  impression?: string;
  notes?: string;
  report_text?: string;
  image_impression?: string;
  advice?: string;
  selected_doctor?: string;
  result_status: string;
  created_at: string;
  completed_date?: string;
  visit_id?: string;
  radiology?: {
    name: string;
    category?: string;
    description?: string;
  };
}

export interface GroupedLabResults {
  [category: string]: LabResult[];
}

export interface GroupedRadiologyResults {
  [category: string]: RadiologyResult[];
}

/**
 * Fetch all lab results for a specific patient
 */
export const getPatientLabResults = async (patientId: string): Promise<LabResult[]> => {
  try {
    // First get all visits for this patient
    const { data: patientVisits, error: visitsError } = await supabase
      .from('visits')
      .select('id')
      .eq('patient_id', patientId);

    if (visitsError) {
      throw new Error(`Failed to fetch patient visits: ${visitsError.message}`);
    }

    if (!patientVisits || patientVisits.length === 0) {
      return []; // No visits found for this patient
    }

    const visitIds = patientVisits.map(v => v.id);

    // Now get lab results for all these visits
    const { data, error } = await supabase
      .from('lab_results')
      .select(`
        id,
        test_name,
        test_category,
        result_value,
        result_unit,
        reference_range,
        comments,
        is_abnormal,
        result_status,
        technician_name,
        pathologist_name,
        created_at,
        visit_id
      `)
      .in('visit_id', visitIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch lab results: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error fetching patient lab results:', error);
    throw error;
  }
};

/**
 * Fetch all radiology results for a specific patient
 */
export const getPatientRadiologyResults = async (patientId: string): Promise<RadiologyResult[]> => {
  try {
    // First get all visits for this patient
    const { data: patientVisits, error: visitsError } = await supabase
      .from('visits')
      .select('id')
      .eq('patient_id', patientId);

    if (visitsError) {
      throw new Error(`Failed to fetch patient visits: ${visitsError.message}`);
    }

    if (!patientVisits || patientVisits.length === 0) {
      return []; // No visits found for this patient
    }

    const visitIds = patientVisits.map(v => v.id);

    // Now get radiology results for all these visits
    const { data, error } = await supabase
      .from('visit_radiology')
      .select(`
        id,
        radiology_id,
        status,
        findings,
        impression,
        notes,
        completed_date,
        created_at,
        visit_id,
        radiology(name, category, description)
      `)
      .in('visit_id', visitIds)
      .in('status', ['completed'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch radiology results: ${error.message}`);
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map(item => ({
      id: item.id,
      radiology_id: item.radiology_id,
      status: item.status,
      findings: item.findings,
      impression: item.impression,
      notes: item.notes,
      result_status: item.status, // Map status to result_status
      created_at: item.created_at,
      completed_date: item.completed_date,
      visit_id: item.visit_id,
      radiology: item.radiology
    }));

    return transformedData;

  } catch (error) {
    console.error('Error fetching patient radiology results:', error);
    throw error;
  }
};

/**
 * Fetch lab results for a specific visit
 */
export const getVisitLabResults = async (visitId: string): Promise<LabResult[]> => {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select(`
        id,
        test_name,
        test_category,
        result_value,
        result_unit,
        reference_range,
        comments,
        is_abnormal,
        result_status,
        technician_name,
        pathologist_name,
        created_at,
        visit_id
      `)
      .eq('visits.visit_id', visitId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch visit lab results: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error fetching visit lab results:', error);
    throw error;
  }
};

/**
 * Fetch radiology results for a specific visit
 */
export const getVisitRadiologyResults = async (visitId: string): Promise<RadiologyResult[]> => {
  try {
    const { data, error } = await supabase
      .from('visit_radiology')
      .select(`
        id,
        radiology_id,
        status,
        findings,
        impression,
        notes,
        report_text,
        image_impression,
        advice,
        selected_doctor,
        result_status,
        created_at,
        completed_date,
        visit_id,
        radiology!inner(name, category, description)
      `)
      .eq('visit_id', visitId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch visit radiology results: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error fetching visit radiology results:', error);
    throw error;
  }
};

/**
 * Group lab results by category
 */
export const groupLabResultsByCategory = (results: LabResult[]): GroupedLabResults => {
  return results.reduce((grouped, result) => {
    const category = result.test_category || 'General';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(result);
    return grouped;
  }, {} as GroupedLabResults);
};

/**
 * Group radiology results by category
 */
export const groupRadiologyResultsByCategory = (results: RadiologyResult[]): GroupedRadiologyResults => {
  return results.reduce((grouped, result) => {
    const category = result.radiology?.category || 'General';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(result);
    return grouped;
  }, {} as GroupedRadiologyResults);
};

/**
 * Format lab result for display
 */
export const formatLabResult = (result: LabResult): string => {
  let formatted = `${result.test_name}`;

  if (result.result_value) {
    formatted += `: ${result.result_value}`;

    if (result.result_unit) {
      formatted += ` ${result.result_unit}`;
    }

    if (result.reference_range) {
      formatted += ` (Ref: ${result.reference_range})`;
    }
  }

  if (result.is_abnormal) {
    formatted += ' [ABNORMAL]';
  }

  if (result.comments) {
    formatted += `\nComments: ${result.comments}`;
  }

  return formatted;
};

/**
 * Format radiology result for display
 */
export const formatRadiologyResult = (result: RadiologyResult): string => {
  let formatted = `${result.radiology?.name || 'Unknown Study'}`;

  if (result.findings) {
    formatted += `\nFindings: ${result.findings}`;
  }

  if (result.impression || result.image_impression) {
    const impression = result.impression || result.image_impression;
    formatted += `\nImpression: ${impression}`;
  }

  if (result.advice) {
    formatted += `\nAdvice: ${result.advice}`;
  }

  if (result.report_text) {
    formatted += `\nReport: ${result.report_text}`;
  }

  if (result.selected_doctor) {
    formatted += `\nReported by: ${result.selected_doctor}`;
  }

  return formatted;
};

/**
 * Get recent lab results (last 30 days) for a patient
 */
export const getRecentLabResults = async (patientId: string, days: number = 30): Promise<LabResult[]> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // First get all visits for this patient
    const { data: patientVisits, error: visitsError } = await supabase
      .from('visits')
      .select('id')
      .eq('patient_id', patientId);

    if (visitsError) {
      throw new Error(`Failed to fetch patient visits: ${visitsError.message}`);
    }

    if (!patientVisits || patientVisits.length === 0) {
      return []; // No visits found for this patient
    }

    const visitIds = patientVisits.map(v => v.id);

    // Now get recent lab results for all these visits
    const { data, error } = await supabase
      .from('lab_results')
      .select(`
        id,
        test_name,
        test_category,
        result_value,
        result_unit,
        reference_range,
        comments,
        is_abnormal,
        result_status,
        technician_name,
        pathologist_name,
        created_at,
        visit_id
      `)
      .in('visit_id', visitIds)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recent lab results: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error fetching recent lab results:', error);
    throw error;
  }
};

/**
 * Get recent radiology results (last 30 days) for a patient
 */
export const getRecentRadiologyResults = async (patientId: string, days: number = 30): Promise<RadiologyResult[]> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // First get all visits for this patient
    const { data: patientVisits, error: visitsError } = await supabase
      .from('visits')
      .select('id')
      .eq('patient_id', patientId);

    if (visitsError) {
      throw new Error(`Failed to fetch patient visits: ${visitsError.message}`);
    }

    if (!patientVisits || patientVisits.length === 0) {
      return []; // No visits found for this patient
    }

    const visitIds = patientVisits.map(v => v.id);

    // Now get recent radiology results for all these visits
    const { data, error } = await supabase
      .from('visit_radiology')
      .select(`
        id,
        radiology_id,
        status,
        findings,
        impression,
        notes,
        completed_date,
        created_at,
        visit_id,
        radiology(name, category, description)
      `)
      .in('visit_id', visitIds)
      .in('status', ['completed'])
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recent radiology results: ${error.message}`);
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map(item => ({
      id: item.id,
      radiology_id: item.radiology_id,
      status: item.status,
      findings: item.findings,
      impression: item.impression,
      notes: item.notes,
      result_status: item.status, // Map status to result_status
      created_at: item.created_at,
      completed_date: item.completed_date,
      visit_id: item.visit_id,
      radiology: item.radiology
    }));

    return transformedData;

  } catch (error) {
    console.error('Error fetching recent radiology results:', error);
    throw error;
  }
};

/**
 * Search lab results by test name or value
 */
export const searchLabResults = async (
  patientId: string,
  searchTerm: string
): Promise<LabResult[]> => {
  try {
    // First get all visits for this patient
    const { data: patientVisits, error: visitsError } = await supabase
      .from('visits')
      .select('id')
      .eq('patient_id', patientId);

    if (visitsError) {
      throw new Error(`Failed to fetch patient visits: ${visitsError.message}`);
    }

    if (!patientVisits || patientVisits.length === 0) {
      return []; // No visits found for this patient
    }

    const visitIds = patientVisits.map(v => v.id);

    // Now search lab results for all these visits
    const { data, error } = await supabase
      .from('lab_results')
      .select(`
        id,
        test_name,
        test_category,
        result_value,
        result_unit,
        reference_range,
        comments,
        is_abnormal,
        result_status,
        technician_name,
        pathologist_name,
        created_at,
        visit_id
      `)
      .in('visit_id', visitIds)
      .or(`test_name.ilike.%${searchTerm}%,result_value.ilike.%${searchTerm}%,comments.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search lab results: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error searching lab results:', error);
    throw error;
  }
};

/**
 * Generate summary text for multiple lab results
 */
export const generateLabResultsSummary = (results: LabResult[]): string => {
  if (results.length === 0) {
    return 'No lab results available.';
  }

  const grouped = groupLabResultsByCategory(results);
  let summary = '';

  Object.entries(grouped).forEach(([category, categoryResults]) => {
    summary += `${category.toUpperCase()}:\n`;
    categoryResults.forEach(result => {
      summary += `- ${formatLabResult(result)}\n`;
    });
    summary += '\n';
  });

  return summary.trim();
};

/**
 * Generate summary text for multiple radiology results
 */
export const generateRadiologyResultsSummary = (results: RadiologyResult[]): string => {
  if (results.length === 0) {
    return 'No radiology results available.';
  }

  const grouped = groupRadiologyResultsByCategory(results);
  let summary = '';

  Object.entries(grouped).forEach(([category, categoryResults]) => {
    summary += `${category.toUpperCase()}:\n`;
    categoryResults.forEach(result => {
      summary += `- ${formatRadiologyResult(result)}\n`;
    });
    summary += '\n';
  });

  return summary.trim();
};