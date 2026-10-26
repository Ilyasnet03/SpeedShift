import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().user?.token;
  const needsAuthentication = path.startsWith('/listings') || path.startsWith('/admin/');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(needsAuthentication && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
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

export async function getMyListings() {
  return request<AdminListing[]>('/listings/mine');
}

export async function getListing(id: number) {
  return request<any>(`/listings/${id}`);
}

export async function deleteMyListing(id: number) {
  return request<void>(`/listings/${id}`, { method: 'DELETE' });
}

export async function updateListingStatus(id: number, status: 'PUBLISHED' | 'RESERVED' | 'SOLD') {
  return request<any>(`/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function uploadImage(blob: Blob): Promise<{ url: string; thumbnailUrl: string }> {
  const token = useAuthStore.getState().user?.token;
  const body = new FormData();
  body.append('file', blob, 'photo.jpg');
  const response = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body
  });
  if (!response.ok) throw new Error('Échec de l’envoi d’une photo.');
  return response.json();
}

const ASSET_ORIGIN = /^https?:\/\//.test(API_BASE) ? new URL(API_BASE).origin : '';

export function assetUrl(src: string) {
  return src.startsWith('/uploads/') ? `${ASSET_ORIGIN}${src}` : src;
}

export function thumbUrl(src: string) {
  return assetUrl(src.startsWith('/uploads/') && !src.startsWith('/uploads/thumbs/') ? src.replace('/uploads/', '/uploads/thumbs/') : src);
}

export async function getPendingListings() {
  return request<any[]>('/admin/listings/pending');
}

export async function getAdminStats() {
  return request<AdminDashboardStats>('/admin/stats');
}

export async function getAdminUsers() {
  return request<AdminUser[]>('/admin/users');
}

export async function setAdminUserEnabled(id: number, enabled: boolean) {
  return request<AdminUser>(`/admin/users/${id}/enabled`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled })
  });
}

export async function setAdminUserRole(id: number, role: 'CLIENT' | 'ADMIN') {
  return request<AdminUser>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
}

export async function getAdminListings() {
  return request<AdminListing[]>('/admin/listings');
}

export async function setAdminListingStatus(id: number, status: AdminListingStatus) {
  return request<AdminListing>(`/admin/listings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function deleteAdminListing(id: number) {
  return request<void>(`/admin/listings/${id}`, { method: 'DELETE' });
}

export async function publishListing(id: number) {
  return request<any>(`/admin/listings/${id}/publish`, { method: 'PATCH' });
}

export async function createListing(payload: CreateListingPayload) {
  return request<any>('/listings', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateListing(id: number, payload: CreateListingPayload) {
  return request<any>(`/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export type CreateListingPayload = {
  title: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  city?: string;
  price: number;
  imageUrl?: string;
  description?: string;
  availability?: string;
};

export type AdminDashboardStats = {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  newUsersLast30Days: number;
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  rejectedListings: number;
  averagePublishedPrice: number | string;
};

export type AdminUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'CLIENT' | 'ADMIN';
  enabled: boolean;
  createdAt: string | null;
};

export type AdminListingStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export type AdminListing = {
  id: number;
  title: string;
  category: string;
  brand: string;
  model: string | null;
  city: string | null;
  price: number | string;
  sellerName: string | null;
  sellerPhone: string | null;
  status: string | null;
  imageUrl: string | null;
  description: string | null;
  createdAt: string | null;
  year?: number | null;
  mileage?: number | null;
  availability?: string | null;
  fuel?: string | null;
  transmission?: string | null;
};
