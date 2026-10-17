'use client';

import { ReportEntry } from '@/lib/types';
import ReportTable from './ReportTable';

interface ReportFormProps {
  entries: ReportEntry[];
  patientName: string;
  reportDate: string;
  labName: string;
  onEntriesChange: (entries: ReportEntry[]) => void;
  onPatientNameChange: (name: string) => void;
  onReportDateChange: (date: string) => void;
  onLabNameChange: (name: string) => void;
}

export default function ReportForm({
  entries,
  patientName,
  reportDate,
  labName,
  onEntriesChange,
  onPatientNameChange,
  onReportDateChange,
  onLabNameChange,
}: ReportFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="patientName" className="block text-xs font-medium text-gray-500 mb-1">
            Patient Name (optional)
          </label>
          <input
            id="patientName"
            type="text"
            value={patientName}
            onChange={(e) => onPatientNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
            placeholder="Patient name"
          />
        </div>
        <div>
          <label htmlFor="reportDate" className="block text-xs font-medium text-gray-500 mb-1">
            Report Date
          </label>
          <input
            id="reportDate"
            type="date"
            value={reportDate}
            onChange={(e) => onReportDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
          />
        </div>
        <div>
          <label htmlFor="labName" className="block text-xs font-medium text-gray-500 mb-1">
            Lab Name (optional)
          </label>
          <input
            id="labName"
            type="text"
            value={labName}
            onChange={(e) => onLabNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
            placeholder="Lab name"
          />
        </div>
      </div>

      <ReportTable entries={entries} onChange={onEntriesChange} />
    </div>
  );
}
