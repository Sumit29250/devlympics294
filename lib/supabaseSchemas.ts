import { z } from 'zod';
import { LanguageSchema, TestStatusSchema } from './schemas';

// Single test row to be saved
export const SaveReportTestSchema = z.object({
  position: z.number().int().nonnegative().optional(),
  test_name: z.string().min(1, 'Test name is required'),
  value: z.string().default(''),
  unit: z.string().default(''),
  reference_range: z.string().default(''),
  status: TestStatusSchema.default('unclear'),
  simple_meaning: z.string().default(''),
  what_test_measures: z.string().default(''),
  urgency_note: z.string().default(''),
  possible_general_reasons: z.array(z.string()).default([]),
  questions_for_doctor: z.array(z.string()).default([]),
});

// Single chat message
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty').max(2000),
});

// Save report request payload
export const SaveReportRequestSchema = z.object({
  title: z.string().max(100).optional(),
  patient_name: z.string().max(100).optional().nullable(),
  lab_name: z.string().max(100).optional().nullable(),
  report_date: z.string().max(50).optional().nullable(),
  language: LanguageSchema.default('english'),
  overall_summary: z.string().default(''),
  tests: z.array(SaveReportTestSchema).min(1, 'At least one test row is required').max(60, 'Maximum 60 tests allowed'),
  chat_messages: z.array(ChatMessageSchema).max(200, 'Maximum 200 messages allowed').optional().default([]),
  keep_file: z.boolean().optional().default(false),
  fileBase64: z.string().optional(),
  fileMimeType: z.enum(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']).optional(),
  fileName: z.string().max(100).optional(),
});

// Append chat message to saved report
export const AppendChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

// Delete account confirmation
export const DeleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    message: 'You must type DELETE in all uppercase to confirm account deletion.',
  }),
});
