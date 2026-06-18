export type RequestOptions = {
  timeoutMs?: number;
  retry?: number;
  skipAuth?: boolean;
};

export type ApiErrorCode = 'http_error' | 'network_error' | 'timeout' | 'parse_error';

type ApiErrorParams = {
  code: ApiErrorCode;
  path: string;
  status?: number;
  body?: string;
};

export class ApiError extends Error {
  code: ApiErrorCode;
  path: string;
  status?: number;
  body?: string;

  constructor(message: string, params: ApiErrorParams) {
    super(message);
    this.name = 'ApiError';
    this.code = params.code;
    this.path = params.path;
    this.status = params.status;
    this.body = params.body;
  }
}

type AuthTokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

let authTokenProvider: AuthTokenProvider | null = null;

export function setAuthTokenProvider(provider: AuthTokenProvider | null) {
  authTokenProvider = provider;
}

async function buildRequestHeaders(headers: HeadersInit | undefined, options: RequestOptions) {
  const mergedHeaders = new Headers(headers);
  if (!mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }
  if (!options.skipAuth && authTokenProvider && !mergedHeaders.has('Authorization')) {
    const token = await authTokenProvider();
    if (token) {
      mergedHeaders.set('Authorization', `Bearer ${token}`);
    }
  }
  return mergedHeaders;
}

async function readErrorBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function requestMethod(init?: RequestInit) {
  return (init?.method ?? 'GET').toUpperCase();
}

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError')
  );
}

function normalizeRequestError(error: unknown, path: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAbortError(error)) {
    return new ApiError('Request timed out', { code: 'timeout', path });
  }
  const message = error instanceof Error ? error.message : 'Network request failed';
  return new ApiError(message, { code: 'network_error', path });
}

function shouldRetryRequest(init: RequestInit | undefined, error: ApiError) {
  const method = requestMethod(init);
  if (method !== 'GET' && method !== 'HEAD') {
    return false;
  }
  if (error.code === 'network_error' || error.code === 'timeout') {
    return true;
  }
  return error.status === 408 || error.status === 429 || Boolean(error.status && error.status >= 500);
}

async function parseJsonResponse<T>(response: Response, path: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('Invalid JSON response', { code: 'parse_error', path, status: response.status });
  }
}

export async function request<T>(path: string, init?: RequestInit, options: RequestOptions = {}): Promise<T> {
  const attempts = Math.max(1, (options.retry ?? 0) + 1);
  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = options.timeoutMs ? new AbortController() : undefined;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), options.timeoutMs) : undefined;
    const { headers, signal, ...requestInit } = init ?? {};

    try {
      const response = await fetch(path, {
        ...requestInit,
        headers: await buildRequestHeaders(headers, options),
        signal: controller?.signal ?? signal
      });
      if (!response.ok) {
        const body = await readErrorBody(response);
        throw new ApiError(body || `HTTP ${response.status}`, {
          code: 'http_error',
          path,
          status: response.status,
          body
        });
      }
      return parseJsonResponse<T>(response, path);
    } catch (error) {
      lastError = normalizeRequestError(error, path);
      if (attempt < attempts - 1 && shouldRetryRequest(init, lastError)) {
        continue;
      }
      throw lastError;
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  throw lastError ?? new ApiError('Network request failed', { code: 'network_error', path });
}
