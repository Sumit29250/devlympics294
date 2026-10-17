import { ReportEntry } from './types';

export const sampleCBCReport: ReportEntry[] = [
  {
    id: 'sample-1',
    testName: 'Hemoglobin',
    value: '9.8',
    unit: 'g/dL',
    referenceRange: '12.0–15.5 g/dL',
    confidence: 1.0,
    needsVerification: false,
  },
  {
    id: 'sample-2',
    testName: 'White Blood Cell Count',
    value: '11,200',
    unit: '/µL',
    referenceRange: '4,000–11,000 /µL',
    confidence: 1.0,
    needsVerification: false,
  },
  {
    id: 'sample-3',
    testName: 'Platelet Count',
    value: '2,40,000',
    unit: '/µL',
    referenceRange: '1,50,000–4,10,000 /µL',
    confidence: 1.0,
    needsVerification: false,
  },
  {
    id: 'sample-4',
    testName: 'RBC Count',
    value: '4.1',
    unit: 'million/µL',
    referenceRange: '4.2–5.4 million/µL',
    confidence: 1.0,
    needsVerification: false,
  },
  {
    id: 'sample-5',
    testName: 'Blood Sugar (Fasting)',
    value: '96',
    unit: 'mg/dL',
    referenceRange: '70–100 mg/dL',
    confidence: 1.0,
    needsVerification: false,
  },
];

export const samplePatientName = 'Sample Patient';
export const sampleReportDate = '2026-10-15';
export const sampleLabName = 'City Diagnostics Lab';
