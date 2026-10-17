'use client';

import { useState, useRef, useCallback } from 'react';
import { ExtractionResult, Language } from '@/lib/types';
import { extractReportApi } from '@/lib/api';

interface ReportUploaderProps {
  onExtracted: (result: ExtractionResult, demoMode?: boolean, message?: string) => void;
  language: Language;
  onFileSelected?: (fileData: { base64: string; mimeType: string; name: string } | null) => void;
}

export default function ReportUploader({ onExtracted, onFileSelected }: ReportUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPG, PNG, or PDF file.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB.');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Strip any data URI prefix
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
        });
        reader.readAsDataURL(file);
        const fileBase64 = await base64Promise;

        const response = await extractReportApi(fileBase64, file.type);

        if (!response.ok || !response.data) {
          setError(
            response.error ||
              'Could not extract values from the report. Please check your Gemini API key or use "Load Sample CBC Report".'
          );
          if (response.demoMode) {
            onExtracted(
              { entries: [] },
              true,
              'Gemini API key is required for image/PDF OCR extraction. Click "Load Sample CBC Report" below to test the full app in Demo Mode.'
            );
          }
          return;
        }

        onExtracted(response.data, response.demoMode, response.message);
        onFileSelected?.({ base64: fileBase64, mimeType: file.type, name: file.name });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process the report. Please try again.');
        onFileSelected?.(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onExtracted, onFileSelected]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-sky-500 bg-sky-50'
            : 'border-gray-300 hover:border-sky-400 hover:bg-sky-50/50'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload lab report"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Select report file"
        />

        {isUploading ? (
          <div className="space-y-3" aria-live="polite">
            <div className="w-12 h-12 mx-auto border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-sky-600 font-medium">MedDecode is reading your report…</p>
            <p className="text-sm text-gray-500">Extracting test names, values, and reference ranges</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto bg-sky-100 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Upload your lab report</p>
              <p className="text-sm text-gray-500 mt-1">
                Drag & drop or click to select • JPG, PNG, or PDF • Max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        🔒 Your report is processed temporarily to generate explanations. Nothing is saved unless you sign in and choose Save.
      </p>
    </div>
  );
}
