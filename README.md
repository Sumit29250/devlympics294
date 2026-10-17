# MedDecode

> **"Understand your medical report, confidently."**

MedDecode helps patients and caregivers understand complex medical lab reports in simple, patient-friendly language. It bridges the gap between intricate laboratory terminology and everyday people.

> ⚕️ **Important Disclaimer:** MedDecode provides educational explanations only. It does not provide medical diagnosis, treatment, or emergency advice. Always consult a qualified healthcare professional.

---

## ✨ Features

- 📄 **Multimodal Report Extraction (OCR)**: Upload lab reports as JPG, PNG, or PDF. MedDecode extracts test names, measured values, units, reference intervals, and flags low-confidence readings with a **⚠️ Verify** badge.
- 🧪 **One-Click Sample Report**: Pre-loads a standard Complete Blood Count (CBC) report (Hemoglobin, WBC, Platelets, RBC, Fasting Glucose) for instant demonstrations.
- 🎯 **Deterministic Range Checks**: Rule-based server analysis verifies values against reference ranges (Normal, Slightly High/Low within 10% bounds, High/Low, or Unclear) before AI explanation.
- 🌐 **Trilingual Support**: Explanations available in **English**, **हिंदी (Hindi)**, and **Hinglish** (conversational Hindi in Roman script with English medical terms).
- 🩺 **Doctor Question Generator**: Suggests specific, respectful questions patients can ask during their clinical consultation.
- 🖨️ **Printable Doctor Discussion Sheet**: One-click print/PDF summary (`window.print()`) formatted specifically for clinical visits with full disclaimers.
- 🔊 **Voice Accessibility (TTS)**: Built-in Web Speech API audio reader (`hi-IN` and `en-IN`) for each explanation card.
- 🚨 **Emergency & Safety Interception**: Automatic detection of critical symptoms (chest pain, severe breathlessness, unconsciousness, severe bleeding, self-harm) immediately routes users to emergency services (India: 112 / US: 911).
- 🚫 **Strict Non-Diagnostic Guardrails**: Refuses requests for diagnoses, prescriptions, or dosages and redirects users to licensed physicians.
- 👤 **Optional Supabase Accounts & Report History**:
  - **Guest Mode**: Full functionality without an account. Zero storage or data retention.
  - **Saved Reports (`/history`)**: Authenticated users can explicitly save reports, explanations, and follow-up Q&A.
  - **Health Trends (`/trends`)**: Interactive chronological trend charts (`recharts`) tracking test values over time with reference interval bands.
  - **Private File Retention**: Optional secure upload of original lab report documents into private Supabase Storage (`report-files` bucket) accessible only via short-lived 60-second signed URLs.
  - **Self-Service Privacy Controls**: Users can delete individual reports or delete their entire account and all associated data in one click.
- 🔧 **Zero-Config Demo Mode**: Works immediately out of the box even without a Gemini API key.

---

## 🚀 Setup & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit [`.env.local`](.env.local):
```env
# Gemini API Key (Server-side only)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-2.0-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash

# Optional: Supabase for User Accounts & Saved Report History
# If omitted or left as placeholders, MedDecode runs in guest-only mode with zero errors.
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

> 💡 **Demo Mode:** If you do not have a Gemini key or Supabase project, you can still run the app! MedDecode automatically provides pre-verified explanations for the sample CBC report and runs seamlessly in Guest Mode.

### 3. Start the Development Server
```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)**.

---

## 🗄️ Supabase Setup (Optional)

To enable user accounts, saved reports, and health trend charts:

### 1. Create a Project
1. Go to [database.new](https://database.new) and create a free Supabase project.
2. Note your **Project URL**, **Anon (public) Key**, and **Service Role Key** under **Project Settings → API**.

### 2. Run Database Migration
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Copy and paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. This creates:
   - `profiles` table & auto-creation trigger on new user signup.
   - `reports`, `report_tests`, and `chat_messages` tables.
   - Private `report-files` storage bucket.
   - Strict **Row-Level Security (RLS)** policies ensuring users can only read, write, or delete their own data.

### 3. Configure Auth Redirect URLs
1. In the Supabase Dashboard, go to **Authentication → URL Configuration**.
2. Set **Site URL** to:
   ```
   http://localhost:3000
   ```
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   ```
4. (Optional) Under **Authentication → Providers**, enable **Google** if you want one-click OAuth login.

---

## 🛠️ API Routes Overview

All routes run on the Node.js server runtime (`export const runtime = "nodejs"`, `export const dynamic = "force-dynamic"`), enforce in-memory rate limiting, and return a consistent JSON envelope `{ ok: boolean, data?, error?, demoMode? }`:

### Gemini AI Routes
| Route | Method | Description |
|---|---|---|
| `/api/extract-report` | `POST` | Accepts base64 encoded JPG/PNG/PDF (≤10MB) and returns structured test data using Gemini multimodal document understanding. |
| `/api/explain` | `POST` | Computes deterministic test statuses server-side, then queries Gemini to generate compassionate patient-friendly explanations, causes, and doctor questions in English, Hindi, or Hinglish. |
| `/api/ask` | `POST` | Context-aware Q&A about the report with pre-execution emergency keyword screening and prompt-injection defense. |
| `/api/health` | `GET` | Returns `{ ok: true, geminiConfigured: boolean, model: string }` without exposing the API key. |

### Supabase Reports & Account Routes
| Route | Method | Description |
|---|---|---|
| `/api/reports` | `GET` | Lists saved reports for the authenticated user with test counts and trend metadata. |
| `/api/reports` | `POST` | Explicitly saves a report, its tests, chat history, and optional original file to private storage (enforces 50 report limit). |
| `/api/reports/[id]` | `GET` | Retrieves full details, tests, and conversation history for a saved report. |
| `/api/reports/[id]` | `DELETE` | Permanently deletes a saved report, cascading test rows and deleting stored files. |
| `/api/reports/[id]/chat` | `POST` | Appends a follow-up question & answer to a saved report's chat history. |
| `/api/reports/[id]/file` | `GET` | Generates a secure, temporary 60-second signed URL to view the original uploaded file. |
| `/api/account` | `DELETE` | Requires typed `"DELETE"` confirmation. Deletes all user storage files, database records, and auth user account via server-only admin client. |

---

## 🧪 Demo Mode

If the `GEMINI_API_KEY` is missing, placeholder, or encounters a quota limit:
1. The app automatically enters **Demo Mode** with a calm banner:
   *"Demo Mode: showing pre-written sample explanations because the Gemini API is unavailable."*
2. Clicking **"Load Sample CBC Report"** and **"Confirm & Explain My Report"** renders complete, curated explanations in English, Hindi, or Hinglish.
3. The **"Ask About Your Report"** box responds with pre-verified answers (e.g., asking *"What does low hemoglobin mean?"*).
4. Safety interventions (emergency keywords and medicine refusal) work 100% offline without needing any API calls.

---

## 🔐 Privacy & Security Architecture

- **Guest Mode Privacy**: When signed out, report data lives exclusively in React component state for the duration of the browser tab. Nothing is stored to disk or database.
- **Explicit Save Only**: Reports are NEVER saved automatically. Saving requires an explicit user click on **"Save to My Account"**.
- **Row-Level Security (RLS)**: Every row in `reports`, `report_tests`, and `chat_messages` is strictly isolated by `user_id = auth.uid()`.
- **Private Storage**: Original lab files are stored in the private `report-files` bucket under `{user_id}/{report_id}/...`. Direct public access is disabled; files are accessed exclusively via 60-second expiring signed URLs.
- **Complete Data Erasure**: Users can delete individual reports at any time, or execute a complete account deletion that removes all storage objects, database rows, and the auth user record.
- **Key Isolation**: The Gemini API key and `SUPABASE_SERVICE_ROLE_KEY` are read exclusively server-side (`import 'server-only'`) and never exposed to the client bundle or network responses.

---

## 📋 Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **AI SDK**: `@google/genai` (Gemini 2.0 Flash with 2.5 Flash fallback)
- **Database & Auth**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`, PostgreSQL, RLS)
- **Charts**: Recharts (chronological time-series line charts with reference areas)
- **Validation**: Zod (all request/response boundaries)
- **Speech**: HTML5 Web Speech API

---

## ⚖️ Legal & Medical Disclaimer

MedDecode provides educational explanations only. It does not provide medical diagnosis, treatment, or emergency advice. Always consult a qualified healthcare professional.
