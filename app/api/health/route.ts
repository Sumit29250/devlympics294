import { isGeminiConfigured, PRIMARY_MODEL } from '@/lib/gemini';
import { ok } from '@/lib/apiResponse';
import { HealthResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isGeminiConfigured();

  const healthData: HealthResponse = {
    ok: true,
    geminiConfigured: configured,
    model: PRIMARY_MODEL,
  };

  return ok<HealthResponse>(healthData);
}
