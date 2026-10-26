const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function loginUser(email: string, password: string) {
  return request<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function registerUser(payload: any) {
  return request<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getHome() {
  return request<any>('/home');
}

export async function getListings(category?: string, city?: string, query?: string, sort = 'featured') {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (city) params.set('city', city);
  if (query) params.set('query', query);
  if (sort) params.set('sort', sort);
  return request<any>(`/listings?${params.toString()}`);
}

export async function getListing(id: number) {
  return request<any>(`/listings/${id}`);
}

export async function getAdminOverview() {
  return request<any>('/admin/overview');
}
