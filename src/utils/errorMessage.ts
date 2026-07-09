import axios from 'axios';

/** Extracts a NestJS error response's message (string or validation-error array) with a fallback. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    if (!err.response) {
      return 'Cannot reach the server. Is the backend running?';
    }
  }
  return fallback;
}
