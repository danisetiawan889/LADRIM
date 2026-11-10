let cachedCsrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.token) {
        cachedCsrfToken = data.token;
        return cachedCsrfToken as string;
      }
    }
  } catch (e) {
    console.warn('Failed to retrieve CSRF token:', e);
  }
  return '';
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // If this is a state-changing method, fetch CSRF token first
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      headers['x-csrf-token'] = token;
    }
  }

  const res = await fetch(endpoint, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  // If CSRF expired or invalid, reset cache and retry once
  if (res.status === 403) {
    cachedCsrfToken = null;
    const freshToken = await getCsrfToken();
    if (freshToken) {
      headers['x-csrf-token'] = freshToken;
      const retryRes = await fetch(endpoint, {
        ...options,
        method,
        headers,
        credentials: 'include',
      });
      const data = await retryRes.json().catch(() => ({}));
      if (!retryRes.ok) {
        throw new Error(data.error || `HTTP ${retryRes.status}`);
      }
      return data as T;
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    err.remainingSec = data.remainingSec;
    err.locked = data.locked;
    throw err;
  }

  return data as T;
}
