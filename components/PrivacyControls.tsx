'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUserAccount } from '@/lib/reportsApi';
import { createClient } from '@/lib/supabase/client';

export default function PrivacyControls() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmationInput !== 'DELETE') {
      setError('Please type DELETE in uppercase to confirm.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    const res = await deleteUserAccount('DELETE');

    if (res.ok) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      setShowModal(false);
      router.push('/?deleted=true');
      router.refresh();
    } else {
      setError(res.error || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Privacy & Data Controls</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            You maintain 100% control over your personal health records.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
        <p>
          <strong>What is stored:</strong> When you click &ldquo;Save to my account&rdquo;, we store your test values, AI explanations, follow-up questions, and optionally your original uploaded file if you opted in.
        </p>
        <p>
          <strong>Ownership & Access:</strong> Every record is protected by database Row Level Security (RLS) and is visible solely to your signed-in account. Nothing is shared, sold, or used to train public AI models.
        </p>
        <p>
          <strong>Right to Erase:</strong> You can delete individual reports at any time, or permanently erase your account and all associated records with one click below.
        </p>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={() => {
            setShowModal(true);
            setConfirmationInput('');
            setError(null);
          }}
          className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-xl transition-colors"
        >
          Delete Account & All Data
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Account & All Data?</h3>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              This action is <strong>irreversible</strong>. It will permanently delete your user account, all saved lab reports, test values, doctor sheets, and all files stored in private cloud storage.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="confirmInput" className="block text-xs font-semibold text-gray-700">
                Type <span className="font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded">DELETE</span> to confirm:
              </label>
              <input
                id="confirmInput"
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmationInput !== 'DELETE'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? 'Deleting Everything…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
