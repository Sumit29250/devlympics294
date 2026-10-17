'use client';

import { ReportEntry } from '@/lib/types';

interface ReportTableProps {
  entries: ReportEntry[];
  onChange: (entries: ReportEntry[]) => void;
}

export default function ReportTable({ entries, onChange }: ReportTableProps) {
  const updateEntry = (id: string, field: keyof ReportEntry, value: string) => {
    onChange(
      entries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value, needsVerification: false } : entry
      )
    );
  };

  const deleteEntry = (id: string) => {
    onChange(entries.filter((entry) => entry.id !== id));
  };

  const addEntry = () => {
    const newEntry: ReportEntry = {
      id: `manual-${Date.now()}`,
      testName: '',
      value: '',
      unit: '',
      referenceRange: '',
      confidence: 1.0,
      needsVerification: false,
    };
    onChange([...entries, newEntry]);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No report entries yet. Add values manually or upload a report.</p>
        <button
          onClick={addEntry}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
          aria-label="Add a test entry"
        >
          + Add Test Entry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm" aria-label="Report values table">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-semibold text-gray-600">Test Name</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-600">Value</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-600">Unit</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-600">Reference Range</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-600 w-20">Status</th>
              <th className="py-2 px-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={entry.testName}
                    onChange={(e) => updateEntry(entry.id, 'testName', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
                    placeholder="Test name"
                    aria-label={`Test name for row ${entry.id}`}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
                    placeholder="Value"
                    aria-label={`Value for ${entry.testName || 'test'}`}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={entry.unit}
                    onChange={(e) => updateEntry(entry.id, 'unit', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
                    placeholder="Unit"
                    aria-label={`Unit for ${entry.testName || 'test'}`}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={entry.referenceRange}
                    onChange={(e) => updateEntry(entry.id, 'referenceRange', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
                    placeholder="Reference range"
                    aria-label={`Reference range for ${entry.testName || 'test'}`}
                  />
                </td>
                <td className="py-2 px-2">
                  {entry.needsVerification && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠️ Verify
                    </span>
                  )}
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                    aria-label={`Delete ${entry.testName || 'test entry'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-gray-50 rounded-xl p-4 space-y-2 relative">
            {entry.needsVerification && (
              <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⚠️ Verify
              </span>
            )}
            <input
              type="text"
              value={entry.testName}
              onChange={(e) => updateEntry(entry.id, 'testName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
              placeholder="Test name"
              aria-label="Test name"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={entry.value}
                onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Value"
                aria-label="Value"
              />
              <input
                type="text"
                value={entry.unit}
                onChange={(e) => updateEntry(entry.id, 'unit', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Unit"
                aria-label="Unit"
              />
            </div>
            <input
              type="text"
              value={entry.referenceRange}
              onChange={(e) => updateEntry(entry.id, 'referenceRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Reference range"
              aria-label="Reference range"
            />
            <button
              onClick={() => deleteEntry(entry.id)}
              className="text-sm text-red-500 hover:text-red-700"
              aria-label={`Delete ${entry.testName || 'entry'}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addEntry}
        className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-sky-400 hover:text-sky-600 transition-colors font-medium text-sm"
        aria-label="Add another test entry"
      >
        + Add Test Entry
      </button>
    </div>
  );
}
