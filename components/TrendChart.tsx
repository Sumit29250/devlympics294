'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { SavedReportSummary } from '@/lib/reportsApi';
import { parseReferenceRange } from '@/lib/status';

interface TrendChartProps {
  reports: SavedReportSummary[];
}

interface TestDataPoint {
  date: string;
  displayDate: string;
  value: number;
  displayValue: string;
  unit: string;
  referenceRange: string;
  status: string;
  reportTitle: string;
}

export default function TrendChart({ reports }: TrendChartProps) {
  // 1. Collect all distinct normalized test names across all reports
  const availableTests = useMemo(() => {
    const map = new Map<string, { displayName: string; count: number }>();

    reports.forEach((report) => {
      if (report.tests && Array.isArray(report.tests)) {
        report.tests.forEach((t) => {
          if (t.numeric_value !== null && t.numeric_value !== undefined) {
            const key = t.normalized_name || t.test_name.toLowerCase().trim();
            const existing = map.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              map.set(key, { displayName: t.test_name, count: 1 });
            }
          }
        });
      }
    });

    return Array.from(map.entries())
      .map(([key, data]) => ({
        key,
        name: data.displayName,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  const [selectedTestKey, setSelectedTestKey] = useState<string>(
    availableTests.length > 0 ? availableTests[0].key : ''
  );

  // 2. Build chronological time-series data for the selected test
  const chartData = useMemo(() => {
    if (!selectedTestKey) return [];

    const points: TestDataPoint[] = [];

    reports.forEach((report) => {
      const match = report.tests?.find(
        (t) => (t.normalized_name || t.test_name.toLowerCase().trim()) === selectedTestKey
      );

      if (match && match.numeric_value !== null && match.numeric_value !== undefined) {
        const rawDate = report.report_date || report.created_at.split('T')[0];
        const dateObj = new Date(rawDate);
        const displayDate = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : rawDate;

        points.push({
          date: rawDate,
          displayDate,
          value: match.numeric_value,
          displayValue: match.value,
          unit: match.unit || '',
          referenceRange: match.reference_range || '',
          status: match.status,
          reportTitle: report.title,
        });
      }
    });

    // Sort chronologically ascending
    return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reports, selectedTestKey]);

  // Extract reference range from the latest point
  const latestRefRange = chartData.length > 0 ? chartData[chartData.length - 1].referenceRange : '';
  const parsedRange = useMemo(() => parseReferenceRange(latestRefRange), [latestRefRange]);
  const currentUnit = chartData.length > 0 ? chartData[0].unit : '';
  const selectedTestName = availableTests.find((t) => t.key === selectedTestKey)?.name || 'Selected Test';

  if (availableTests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-2xs">
        <div className="w-12 h-12 mx-auto bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-800 text-base mb-1">No Numeric Data Available for Trends</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Save at least one lab report with numerical values (like Hemoglobin or Blood Sugar) to visualize historical trends here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Test Picker Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <label htmlFor="testSelect" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Select Lab Test to Track
          </label>
          <div className="relative inline-block w-full sm:w-72">
            <select
              id="testSelect"
              value={selectedTestKey}
              onChange={(e) => setSelectedTestKey(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-300 pr-10 cursor-pointer"
            >
              {availableTests.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name} ({t.count} record{t.count === 1 ? '' : 's'})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {latestRefRange && (
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl self-start sm:self-auto">
            <span className="font-semibold text-gray-700">Reference Range:</span> {latestRefRange}
          </div>
        )}
      </div>

      {/* Chart or Insufficient Data State */}
      {chartData.length < 2 ? (
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-6 sm:p-8 text-center space-y-2">
          <p className="text-base font-semibold text-amber-900">
            {chartData.length === 1 ? '1 Record Found for ' : 'No Data Points for '} {selectedTestName}
          </p>
          <p className="text-sm text-amber-700 max-w-md mx-auto">
            {chartData.length === 1
              ? `You currently have 1 recorded measurement (${chartData[0].displayValue} ${chartData[0].unit} on ${chartData[0].displayDate}). Save another report containing this test over time to see trend lines.`
              : 'Add reports with this test to plot trends.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-full h-72 sm:h-80" aria-label={`Trend chart for ${selectedTestName}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  stroke="#cbd5e1"
                  dy={8}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  stroke="#cbd5e1"
                  unit={currentUnit ? ` ${currentUnit}` : ''}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as TestDataPoint;
                      return (
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-gray-800">{data.displayDate}</p>
                          <p className="text-sky-600 font-semibold text-sm">
                            {data.value} {data.unit}
                          </p>
                          {data.referenceRange && (
                            <p className="text-gray-500">Ref: {data.referenceRange}</p>
                          )}
                          <p className="text-gray-400 text-2xs truncate max-w-[180px]">
                            {data.reportTitle}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Shaded normal range area when two-sided */}
                {parsedRange &&
                  parsedRange.type === 'two_sided' &&
                  parsedRange.lower !== undefined &&
                  parsedRange.upper !== undefined && (
                    <ReferenceArea
                      y1={parsedRange.lower}
                      y2={parsedRange.upper}
                      fill="#10b981"
                      fillOpacity={0.08}
                    />
                  )}

                {/* Reference bounds lines */}
                {parsedRange && parsedRange.lower !== undefined && (
                  <ReferenceLine
                    y={parsedRange.lower}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                )}
                {parsedRange && parsedRange.upper !== undefined && (
                  <ReferenceLine
                    y={parsedRange.upper}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#0369a1' }}
                  name={selectedTestName}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-2xs text-gray-400 text-center">
            {parsedRange && parsedRange.type === 'two_sided' && (
              <span className="inline-flex items-center gap-1.5 mr-3">
                <span className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded-xs inline-block" />
                Green band indicates standard reference interval
              </span>
            )}
            Hover or tap points to view exact values and dates.
          </p>
        </div>
      )}

      {/* Mandatory Clinical Disclaimer */}
      <div className="pt-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          ⚕️ <strong>Trends are for your information only.</strong> Discuss changes with your doctor.
        </p>
      </div>
    </div>
  );
}
