import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { SYSTEM_INSTRUCTION } from './safety';

export class GeminiError extends Error {
  code: string;
  isDemoFallback: boolean;

  constructor(message: string, code = 'GEMINI_ERROR', isDemoFallback = true) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.isDemoFallback = isDemoFallback;
  }
}

let genaiInstance: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;
  const trimmed = apiKey.trim();
  if (
    trimmed === '' ||
    trimmed === 'YOUR_GEMINI_API_KEY_HERE' ||
    trimmed === 'your_gemini_api_key_here'
  ) {
    return false;
  }
  return true;
}

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) {
    return null;
  }
  if (!genaiInstance) {
    const apiKey = process.env.GEMINI_API_KEY!.trim();
    genaiInstance = new GoogleGenAI({ apiKey });
  }
  return genaiInstance;
}

export const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
export const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';

export function cleanJsonText(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // Strip markdown code fences (```json ... ``` or ``` ...)
  const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;
  const match = cleaned.match(codeBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  } else {
    // If text contains a fenced block inside other text
    const innerBlock = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
    if (innerBlock) {
      cleaned = innerBlock[1].trim();
    }
  }

  // If still not starting with { or [, try to extract outermost braces
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const braceMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (braceMatch) {
      cleaned = braceMatch[0].trim();
    }
  }

  return cleaned;
}

export interface CallGeminiJsonOptions<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contents: any;
  systemInstruction?: string;
  schema?: z.ZodSchema<T>;
  timeoutMs?: number;
  retryAttempt?: number;
}

/**
 * Robust JSON caller with @google/genai:
 * - Uses GEMINI_MODEL, falls back to GEMINI_FALLBACK_MODEL on 404/unsupported
 * - Cleans json markdown fences
 * - Validates with zod schema
 * - Retries once on invalid JSON
 * - 30s timeout via Promise.race
 * - Throws typed GeminiError for graceful Demo Mode fallback
 */
export async function callGeminiJSON<T>({
  contents,
  systemInstruction = SYSTEM_INSTRUCTION,
  schema,
  timeoutMs = 30000,
  retryAttempt = 0,
}: CallGeminiJsonOptions<T>): Promise<T> {
  const client = getGeminiClient();
  if (!client) {
    throw new GeminiError(
      'Gemini API key is missing or invalid. Please add it to .env.local as GEMINI_API_KEY and restart the server.',
      'API_KEY_MISSING',
      true
    );
  }

  // Attempt with primary model, then fallback model
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: Error | null = null;
  let rawText = '';

  for (const model of modelsToTry) {
    try {
      const callPromise = client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      // Timeout with Promise.race
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new GeminiError(`Gemini request timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR', true));
        }, timeoutMs);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await Promise.race([callPromise, timeoutPromise]) as any;
      if (timeoutId) clearTimeout(timeoutId);

      rawText = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (rawText) {
        lastError = null;
        break; // Successfully got response text
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // Check if it's a 404, unsupported model, or model-not-found
      const isModelError =
        errorMsg.includes('404') ||
        errorMsg.includes('not found') ||
        errorMsg.includes('unsupported') ||
        errorMsg.includes('deprecated');

      if (isModelError && model === PRIMARY_MODEL) {
        // Try fallback model
        continue;
      }

      // Check for auth / quota / network errors
      lastError = err instanceof Error ? err : new Error(String(err));
      break;
    }
  }

  if (lastError || !rawText) {
    throw new GeminiError(
      lastError?.message || 'Failed to receive a valid response from Gemini API',
      'API_CALL_FAILED',
      true
    );
  }

  // Parse JSON
  const cleaned = cleanJsonText(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If parse failed and we haven't retried yet, retry once with stricter prompt
    if (retryAttempt === 0) {
      const stricterContents = Array.isArray(contents)
        ? [...contents, { role: 'user', parts: [{ text: 'CRITICAL: Your previous response was not valid JSON. Return ONLY the raw JSON matching the required schema. No markdown formatting, no explanations.' }] }]
        : [{ role: 'user', parts: [{ text: 'CRITICAL: Return ONLY valid JSON matching the schema. No explanations.' }] }];

      return callGeminiJSON<T>({
        contents: stricterContents,
        systemInstruction,
        schema,
        timeoutMs,
        retryAttempt: 1,
      });
    }
    throw new GeminiError('Could not parse JSON response from Gemini', 'JSON_PARSE_ERROR', true);
  }

  // Validate with Zod schema if provided
  if (schema) {
    const valResult = schema.safeParse(parsed);
    if (!valResult.success) {
      if (retryAttempt === 0) {
        const schemaIssues = valResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        const retryContents = Array.isArray(contents)
          ? [...contents, { role: 'user', parts: [{ text: `CRITICAL: The JSON returned had schema validation errors (${schemaIssues}). Return ONLY valid JSON adhering strictly to the required fields.` }] }]
          : [{ role: 'user', parts: [{ text: `CRITICAL: The JSON returned had schema validation errors (${schemaIssues}). Return ONLY valid JSON adhering strictly to the required fields.` }] }];

        return callGeminiJSON<T>({
          contents: retryContents,
          systemInstruction,
          schema,
          timeoutMs,
          retryAttempt: 1,
        });
      }
      throw new GeminiError(
        `Gemini response did not match schema: ${valResult.error.message}`,
        'SCHEMA_VALIDATION_ERROR',
        true
      );
    }
    return valResult.data;
  }

  return parsed as T;
}
