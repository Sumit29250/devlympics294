import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedDecode — Understand Your Medical Report',
  description:
    'MedDecode helps patients and caregivers understand medical lab reports in simple language. Educational tool only — not a diagnosis or medical advice.',
  keywords: ['medical report', 'lab report', 'health', 'patient education', 'MedDecode'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
