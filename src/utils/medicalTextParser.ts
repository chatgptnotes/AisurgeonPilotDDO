import { DocumentCategory } from '@/components/DocumentUpload';

export interface ParsedMedicalData {
  [key: string]: string;
}

export interface BloodReportData {
  hemoglobin?: string;
  rbc_count?: string;
  wbc_count?: string;
  platelet_count?: string;
  blood_sugar?: string;
  hba1c?: string;
  cholesterol?: string;
  triglycerides?: string;
  creatinine?: string;
  urea?: string;
  bilirubin?: string;
  alt_sgpt?: string;
  ast_sgot?: string;
  general_findings?: string;
}

export interface RadiologyReportData {
  study_type?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  technique?: string;
  contrast?: string;
  organs_examined?: string;
}

export interface PreviousReportData {
  diagnosis?: string;
  complaints?: string;
  medications?: string;
  advice?: string;
  procedures?: string;
  follow_up?: string;
  vital_signs?: string;
}

/**
 * Medical text patterns and keywords for parsing
 */
const MEDICAL_PATTERNS = {
  blood: {
    hemoglobin: /(?:hemoglobin|hb|hgb)[\s:]*(\d+\.?\d*)\s*(?:g\/dl|gm\/dl|g%)/i,
    rbc_count: /(?:rbc|red blood cell)[\s:]*([\d.]+)\s*(?:million\/cumm|10\^6\/ul|x10\^6\/ul)/i,
    wbc_count: /(?:wbc|white blood cell|total leucocyte)[\s:]*([\d,]+)\s*(?:\/cumm|\/ul|10\^3\/ul)/i,
    platelet_count: /(?:platelet|plt)[\s:]*([\d,]+)\s*(?:\/cumm|\/ul|10\^3\/ul)/i,
    blood_sugar: /(?:glucose|blood sugar|random blood sugar|rbs|fbs|fasting glucose)[\s:]*(\d+)\s*(?:mg\/dl|mmol\/l)/i,
    hba1c: /(?:hba1c|glycated hemoglobin|glycosylated hemoglobin)[\s:]*(\d+\.?\d*)\s*(?:%|percent)/i,
    cholesterol: /(?:total cholesterol|cholesterol)[\s:]*(\d+)\s*(?:mg\/dl|mmol\/l)/i,
    triglycerides: /(?:triglycerides|tg)[\s:]*(\d+)\s*(?:mg\/dl|mmol\/l)/i,
    creatinine: /(?:creatinine|creat)[\s:]*(\d+\.?\d*)\s*(?:mg\/dl|mmol\/l|umol\/l)/i,
    urea: /(?:urea|blood urea nitrogen|bun)[\s:]*(\d+)\s*(?:mg\/dl|mmol\/l)/i,
    bilirubin: /(?:total bilirubin|bilirubin)[\s:]*(\d+\.?\d*)\s*(?:mg\/dl|mmol\/l|umol\/l)/i,
    alt_sgpt: /(?:alt|sgpt|alanine aminotransferase)[\s:]*(\d+)\s*(?:u\/l|iu\/l)/i,
    ast_sgot: /(?:ast|sgot|aspartate aminotransferase)[\s:]*(\d+)\s*(?:u\/l|iu\/l)/i,
  },

  radiology: {
    study_type: /(?:study|examination|scan)[\s:]*([^\n\r.]+)(?:\.|$)/i,
    findings: /(?:findings|observations?)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:impression|conclusion|recommendation)|$)/i,
    impression: /(?:impression|conclusion|diagnosis)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:recommendation|advice|note)|$)/i,
    recommendations: /(?:recommendation|advice|suggestion)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=$|\n\s*\n)/i,
    technique: /(?:technique|method|protocol)[\s:]*([^\n\r.]+)/i,
    contrast: /(?:contrast|enhancement)[\s:]*([^\n\r.]+)/i,
  },

  previous: {
    diagnosis: /(?:diagnosis|provisional diagnosis|final diagnosis|clinical diagnosis)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:treatment|medication|advice|complaint)|$)/i,
    complaints: /(?:chief complaint|complaint|presenting complaint|history of present illness|symptoms?)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:diagnosis|examination|treatment)|$)/i,
    medications: /(?:medication|prescription|drugs?|treatment|rx)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:advice|follow|next)|$)/i,
    advice: /(?:advice|instruction|recommendation|plan)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:follow|next|date)|$)/i,
    procedures: /(?:procedure|investigation|test|examination performed)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:result|finding|advice)|$)/i,
    follow_up: /(?:follow[\s\-]?up|next visit|review)[\s:]*([^\n\r.]+)/i,
    vital_signs: /(?:vital sign|bp|blood pressure|pulse|temperature|weight|height)[\s:]*([^\n\r]+)/i,
  },
};

/**
 * Medical terms and abbreviations dictionary for better parsing
 */
const MEDICAL_ABBREVIATIONS = {
  // Common medical abbreviations
  'bp': 'blood pressure',
  'hr': 'heart rate',
  'rr': 'respiratory rate',
  'temp': 'temperature',
  'wt': 'weight',
  'ht': 'height',
  'bmi': 'body mass index',
  'dm': 'diabetes mellitus',
  'htn': 'hypertension',
  'cad': 'coronary artery disease',
  'copd': 'chronic obstructive pulmonary disease',
  'uti': 'urinary tract infection',
  'uri': 'upper respiratory infection',
  'mi': 'myocardial infarction',
  'cvd': 'cardiovascular disease',
  'ckd': 'chronic kidney disease',
  'esrd': 'end stage renal disease',
  'tb': 'tuberculosis',
  'hiv': 'human immunodeficiency virus',
  'hbsag': 'hepatitis b surface antigen',
  'hcv': 'hepatitis c virus',
  'ecg': 'electrocardiogram',
  'echo': 'echocardiogram',
  'cxr': 'chest x-ray',
  'ct': 'computed tomography',
  'mri': 'magnetic resonance imaging',
  'usg': 'ultrasonography',
  'pet': 'positron emission tomography',
};

/**
 * Parse blood investigation reports
 */
const parseBloodReport = (text: string): BloodReportData => {
  const data: BloodReportData = {};
  const cleanText = text.toLowerCase().replace(/\s+/g, ' ');

  // Extract specific blood parameters
  Object.entries(MEDICAL_PATTERNS.blood).forEach(([key, pattern]) => {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      data[key as keyof BloodReportData] = match[1].trim();
    }
  });

  // Extract general findings or summary
  const findingsPatterns = [
    /(?:interpretation|result|conclusion|summary)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=$|\n\s*\n)/i,
    /(?:remarks?|notes?)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*?)(?=$|\n\s*\n)/i,
  ];

  for (const pattern of findingsPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.general_findings = match[1].trim();
      break;
    }
  }

  return data;
};

/**
 * Parse radiology reports
 */
const parseRadiologyReport = (text: string): RadiologyReportData => {
  const data: RadiologyReportData = {};

  // Extract structured sections
  Object.entries(MEDICAL_PATTERNS.radiology).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      data[key as keyof RadiologyReportData] = match[1].trim();
    }
  });

  // Try to identify study type from common patterns
  if (!data.study_type) {
    const studyPatterns = [
      /(chest x[\-\s]?ray|cxr)/i,
      /(ct scan|computed tomography)/i,
      /(mri|magnetic resonance)/i,
      /(ultrasound|ultrasonography|usg)/i,
      /(mammography|mammogram)/i,
      /(pet scan|positron emission)/i,
    ];

    for (const pattern of studyPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.study_type = match[1];
        break;
      }
    }
  }

  return data;
};

/**
 * Parse previous consultation reports
 */
const parsePreviousReport = (text: string): PreviousReportData => {
  const data: PreviousReportData = {};

  // Extract structured sections
  Object.entries(MEDICAL_PATTERNS.previous).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      data[key as keyof PreviousReportData] = match[1].trim();
    }
  });

  return data;
};

/**
 * Clean and normalize extracted text
 */
const cleanMedicalText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\w\s.,;:()/-]/g, '') // Remove special characters except common punctuation
    .trim();
};

/**
 * Expand medical abbreviations in text
 */
const expandAbbreviations = (text: string): string => {
  let expandedText = text;

  Object.entries(MEDICAL_ABBREVIATIONS).forEach(([abbr, expansion]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    expandedText = expandedText.replace(regex, expansion);
  });

  return expandedText;
};

/**
 * Map parsed data to form fields based on document category
 */
const mapToFormFields = (parsedData: unknown, category: DocumentCategory): ParsedMedicalData => {
  const mapped: ParsedMedicalData = {};

  switch (category) {
    case 'blood': {
      // Map blood report data to pathology fields
      const bloodData = parsedData as BloodReportData;

      if (bloodData.blood_sugar) {
        mapped.pathology_rbs = `RBS: ${bloodData.blood_sugar} mg/dl`;
      }

      // Combine multiple values into pathology_rbs if available
      const bloodValues = [];
      if (bloodData.hemoglobin) bloodValues.push(`Hb: ${bloodData.hemoglobin} g/dl`);
      if (bloodData.wbc_count) bloodValues.push(`WBC: ${bloodData.wbc_count}/cumm`);
      if (bloodData.platelet_count) bloodValues.push(`Platelets: ${bloodData.platelet_count}/cumm`);
      if (bloodData.creatinine) bloodValues.push(`Creatinine: ${bloodData.creatinine} mg/dl`);

      if (bloodValues.length > 0) {
        mapped.pathology_rbs = bloodValues.join(', ');
      }

      if (bloodData.general_findings) {
        mapped.vital_bp = bloodData.general_findings;
      }
      break;
    }

    case 'radiology': {
      const radiologyData = parsedData as RadiologyReportData;

      if (radiologyData.study_type?.toLowerCase().includes('x-ray') ||
          radiologyData.study_type?.toLowerCase().includes('cxr')) {
        mapped.pathology_xray = `${radiologyData.study_type}: ${radiologyData.findings || radiologyData.impression || ''}`.trim();
      } else {
        mapped.pathology_ct_mri_usg = `${radiologyData.study_type || 'Imaging'}: ${radiologyData.findings || radiologyData.impression || ''}`.trim();
      }

      if (radiologyData.recommendations) {
        mapped.advice = radiologyData.recommendations;
      }
      break;
    }

    case 'previous': {
      const previousData = parsedData as PreviousReportData;

      if (previousData.diagnosis) {
        mapped.diagnosis = previousData.diagnosis;
      }

      if (previousData.complaints) {
        mapped.relevance_complaints = previousData.complaints;
      }

      if (previousData.medications) {
        mapped.rx = previousData.medications;
      }

      if (previousData.advice) {
        mapped.advice = previousData.advice;
      }

      if (previousData.vital_signs) {
        mapped.vital_bp = previousData.vital_signs;
      }

      if (previousData.procedures) {
        mapped.speciality_injectable = previousData.procedures;
      }
      break;
    }
  }

  return mapped;
};

/**
 * Main function to parse medical text based on document category
 */
export const parseMedicalText = async (
  text: string,
  category: DocumentCategory
): Promise<ParsedMedicalData> => {
  try {
    // Clean and preprocess the text
    const cleanedText = cleanMedicalText(text);
    const expandedText = expandAbbreviations(cleanedText);

    let parsedData: unknown;

    // Parse based on document category
    switch (category) {
      case 'blood':
        parsedData = parseBloodReport(expandedText);
        break;
      case 'radiology':
        parsedData = parseRadiologyReport(expandedText);
        break;
      case 'previous':
        parsedData = parsePreviousReport(expandedText);
        break;
      default:
        throw new Error(`Unsupported document category: ${category}`);
    }

    // Map parsed data to form fields
    const mappedData = mapToFormFields(parsedData, category);

    return mappedData;

  } catch (error) {
    console.error('Error parsing medical text:', error);
    throw new Error(`Failed to parse medical text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract structured data from free-form medical text
 */
export const extractStructuredData = (text: string): {
  medications: string[];
  diagnoses: string[];
  procedures: string[];
  vitalSigns: Record<string, string>;
} => {
  const data = {
    medications: [] as string[],
    diagnoses: [] as string[],
    procedures: [] as string[],
    vitalSigns: {} as Record<string, string>,
  };

  // Extract medications
  const medicationPatterns = [
    /(?:tab|cap|inj|syrup)\.?\s+([a-z]+(?:\s+[a-z]+)*)\s+(\d+(?:\.\d+)?)\s*(?:mg|mcg|g)\s*(?:bd|od|tds|qid)?/gi,
    /([a-z]+(?:\s+[a-z]+)*)\s+(\d+(?:\.\d+)?)\s*(?:mg|mcg|g)\s+(?:once|twice|thrice)\s+(?:daily|a day)/gi,
  ];

  medicationPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        data.medications.push(match[0].trim());
      }
    }
  });

  // Extract vital signs
  const vitalPatterns = {
    blood_pressure: /(?:bp|blood pressure)[\s:]*(\d+\/\d+)\s*(?:mmhg)?/i,
    pulse: /(?:pulse|heart rate|hr)[\s:]*(\d+)\s*(?:\/min|bpm)?/i,
    temperature: /(?:temp|temperature)[\s:]*(\d+(?:\.\d+)?)\s*(?:°f|°c|f|c)?/i,
    weight: /(?:weight|wt)[\s:]*(\d+(?:\.\d+)?)\s*(?:kg|kgs)?/i,
    height: /(?:height|ht)[\s:]*(\d+(?:\.\d+)?)\s*(?:cm|cms|ft|feet)?/i,
  };

  Object.entries(vitalPatterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.vitalSigns[key] = match[1];
    }
  });

  return data;
};

/**
 * Validate parsed medical data for completeness and accuracy
 */
export const validateMedicalData = (data: ParsedMedicalData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for common validation issues
  Object.entries(data).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      warnings.push(`Empty value for ${key}`);
    }

    // Check for suspiciously short values
    if (value && value.length < 3) {
      warnings.push(`Very short value for ${key}: "${value}"`);
    }

    // Check for common OCR errors
    if (value && /[0O]{3,}|[1l]{3,}/.test(value)) {
      warnings.push(`Possible OCR error in ${key}: "${value}"`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};