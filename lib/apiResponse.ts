import { NextResponse } from 'next/server';

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
  demoMode?: boolean;
  message?: string;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  demoMode?: boolean;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure;

export function ok<T>(
  data: T,
  options?: {
    demoMode?: boolean;
    message?: string;
    status?: number;
    headers?: Record<string, string>;
  }
) {
  const body: ApiSuccess<T> = {
    ok: true,
    data,
    ...(options?.demoMode !== undefined ? { demoMode: options.demoMode } : {}),
    ...(options?.message ? { message: options.message } : {}),
  };

  return NextResponse.json(body, {
    status: options?.status || 200,
    headers: options?.headers,
  });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  options?: {
    demoMode?: boolean;
    details?: unknown;
    headers?: Record<string, string>;
  }
) {
  const body: ApiFailure = {
    ok: false,
    error: {
      code,
      message,
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
    ...(options?.demoMode !== undefined ? { demoMode: options.demoMode } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: options?.headers,
  });
}
