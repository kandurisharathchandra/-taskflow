import axios, { AxiosError } from 'axios';
import type { ApiFailure, ApiFieldError } from '../types/api';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

/** An API failure normalized into one shape the UI can display. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly code: string,
    public readonly fieldErrors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as Partial<ApiFailure> | undefined;
    if (body?.error?.message) {
      return new ApiError(body.error.message, error.response?.status ?? null, body.error.code ?? 'ERROR', body.error.details);
    }
    if (!error.response) {
      return new ApiError('Cannot reach the server. Check that the API is running and try again.', null, 'NETWORK_ERROR');
    }
    return new ApiError(`Request failed with status ${error.response.status}.`, error.response.status, 'HTTP_ERROR');
  }
  return new ApiError('Something went wrong. Please try again.', null, 'UNKNOWN');
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
