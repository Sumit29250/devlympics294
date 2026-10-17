'use client';

interface EmergencyNoticeProps {
  onDismiss: () => void;
}

export default function EmergencyNotice({ onDismiss }: EmergencyNoticeProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" role="alertdialog" aria-label="Emergency notice">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-700">Emergency Notice</h2>
        </div>
        <div className="space-y-3 mb-6">
          <p className="text-gray-800 font-medium">
            If you or someone is experiencing a medical emergency, please:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              <span>Call <strong>112</strong> (India) or your local emergency number immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              <span>Go to the nearest hospital emergency room</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              <span>For mental health crisis, call <strong>iCall: 9152987821</strong></span>
            </li>
          </ul>
          <p className="text-sm text-red-600 font-medium">
            This app cannot provide emergency medical help. Please seek immediate professional assistance.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          aria-label="Dismiss emergency notice"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
