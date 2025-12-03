import type { ZodSchema } from 'zod';

/**
 * API client error
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public issues?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Typed fetch wrapper with automatic validation
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit & {
    responseSchema?: ZodSchema<T>;
    bodyData?: unknown;
  } = {}
): Promise<T> {
  const { responseSchema, bodyData, ...fetchOptions } = options;

  // Automatically stringify body if bodyData is provided
  if (bodyData) {
    fetchOptions.body = JSON.stringify(bodyData);
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
  }

  const response = await fetch(url, fetchOptions);

  // Parse response
  const data: unknown = await response.json();

  // Handle errors
  if (!response.ok) {
    const errorData = data as { error?: string; issues?: Array<{ path: string; message: string }> };
    throw new ApiClientError(
      errorData.error ?? 'Request failed',
      response.status,
      errorData.issues
    );
  }

  // Validate response with Zod schema if provided
  if (responseSchema) {
    return responseSchema.parse(data);
  }

  return data as T;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(url: string, responseSchema?: ZodSchema<T>) =>
    apiRequest(url, { method: 'GET', responseSchema }),

  post: <T>(url: string, bodyData: unknown, responseSchema?: ZodSchema<T>) =>
    apiRequest(url, { method: 'POST', bodyData, responseSchema }),

  patch: <T>(url: string, bodyData: unknown, responseSchema?: ZodSchema<T>) =>
    apiRequest(url, { method: 'PATCH', bodyData, responseSchema }),

  delete: <T>(url: string, responseSchema?: ZodSchema<T>) =>
    apiRequest(url, { method: 'DELETE', responseSchema }),
};
