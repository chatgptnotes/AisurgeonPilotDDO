import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For development - move to backend in production
});

export interface PatientOpdData {
  diagnosis: string;
  prescriptions: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  labReports: Array<{
    reportName: string;
    reportDate: string;
    tests: Array<{
      testName: string;
      result: string;
      unit?: string;
      normalRange?: string;
    }>;
  }>;
}

const OPD_SUMMARY_PROMPT = `Act like a medical specialist. Make a professionally written OPD summary based ONLY on the provided patient data.

IMPORTANT: Do NOT invent or make up any information. Only use the data provided. If prescriptions or lab reports are not provided, clearly state "No prescriptions on record" or "No lab reports on record" respectively.

The summary should be comprehensive but factual. Do not mention the name, sex or age of the patient. The person who is going to read what you share will be a doctor.

Start summary with the Diagnosis followed by medication. These should be at the beginning of summary and in table form with columns for name, strength, route, dosage and the number of days to be taken. Another line in Hindi to be added in the column of dosage in addition to English.

This patient does not have comorbidities other than that is mentioned. Do not add any lab reports that have not been provided with the patient details.

Format the output in Markdown with:
- A clear heading for Diagnosis
- A markdown table for medications with columns: Medicine Name | Strength | Route | Dosage | Days (only if prescriptions exist)
- Sections for: Chief Complaints, History of Present Illness, Examination Findings, Investigations, Treatment Plan, Advice & Follow-up

Make it look professional and factual based on provided data only.`;

export async function generateOpdSummary(data: PatientOpdData): Promise<string> {
  const userMessage = `Generate an OPD summary based on the following patient data:

**Diagnosis:** ${data.diagnosis || 'Not specified'}

**Current Medications/Prescriptions:**
${data.prescriptions.length > 0
    ? data.prescriptions.map(p => `- ${p.name}: ${p.dosage}, ${p.frequency} for ${p.duration}`).join('\n')
    : 'No prescriptions on record'}

**Lab Reports:**
${data.labReports.length > 0
    ? data.labReports.map(r => `
Report: ${r.reportName} (${r.reportDate})
${r.tests.map(t => `  - ${t.testName}: ${t.result} ${t.unit || ''} (Normal: ${t.normalRange || 'N/A'})`).join('\n')}
`).join('\n')
    : 'No lab reports on record'}

Please generate a comprehensive OPD summary in markdown format.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: OPD_SUMMARY_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    return completion.choices[0].message.content || 'Failed to generate summary';
  } catch (error) {
    console.error('Error generating OPD summary:', error);
    throw new Error('Failed to generate OPD summary. Please check your OpenAI API key and try again.');
  }
}
