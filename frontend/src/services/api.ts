import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number) {
    super(`Erreur HTTP ${status}`);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().user?.token;
  const needsAuthentication = !path.startsWith('/auth/');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(needsAuthentication && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    if (response.status === 401 && token) useAuthStore.getState().logout();
    throw new ApiError(response.status);
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
  return request<{ email: string; verificationRequired: boolean }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyEmail(email: string, code: string) {
  return request<any>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
}

export async function resendVerificationCode(email: string) {
  return request<any>('/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function requestPasswordReset(email: string) {
  return request<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(email: string, code: string, password: string) {
  return request<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, password })
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
  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');
  }
  if (response.status === 403) throw new Error('Envoi de la photo refusé. Réessayez avec une autre photo.');
  if (response.status === 400) throw new Error('Cette photo n’est pas supportée. Utilisez une image JPG, PNG ou WebP.');
  if (response.status === 413) throw new Error('Une photo est trop volumineuse.');
  if (!response.ok) throw new Error(`Échec de l’envoi d’une photo (erreur ${response.status}).`);
  return response.json();
}

const ASSET_ORIGIN = /^https?:\/\//.test(API_BASE) ? new URL(API_BASE).origin : '';

export function assetUrl(src: string) {
  return src.startsWith('/uploads/') ? `${ASSET_ORIGIN}${src}` : src;
}

export function thumbUrl(src: string) {
  if (src.includes('res.cloudinary.com') && src.includes('/image/upload/') && !src.includes('/image/upload/c_limit')) {
    return src.replace('/image/upload/', '/image/upload/c_limit,w_640,q_auto,f_auto/');
  }
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

export async function deleteAdminUser(id: number) {
  return request<void>(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function getAdminSiteVisits() {
  return request<AdminSiteVisit[]>('/admin/visits');
}

export type AdminSiteVisit = {
  id: number;
  visitorId: string;
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  path: string;
  userAgent: string | null;
  visitedAt: string;
};

export function trackVisit(path: string) {
  let visitorId = localStorage.getItem('speedshift-visitor');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('speedshift-visitor', visitorId);
  }
  const token = useAuthStore.getState().user?.token;
  void fetch(`${API_BASE}/public/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ visitorId, path })
  }).catch(() => undefined);
}

export async function getAdminListingViews() {
  return request<AdminListingView[]>('/admin/views');
}

export type AdminListingView = {
  id: number;
  listingId: number;
  listingTitle: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  viewedAt: string;
};

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
  showPhone?: boolean;
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
  sellerId?: number | null;
  showPhone?: boolean | null;
  expiresAt?: string | null;
};

export type ReviewItem = { id: number; reviewerName: string; rating: number; comment: string | null; createdAt: string; mine: boolean };
export type ReviewsResponse = { average: number | null; count: number; reviews: ReviewItem[] };

export const getSellerReviews = (sellerId: number) => request<ReviewsResponse>(`/sellers/${sellerId}/reviews`);
export const saveSellerReview = (sellerId: number, rating: number, comment: string) =>
  request<ReviewsResponse>(`/sellers/${sellerId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
export const deleteSellerReview = (sellerId: number) => request<ReviewsResponse>(`/sellers/${sellerId}/reviews`, { method: 'DELETE' });

export const reportListing = (id: number, reason: string, details: string) =>
  request<void>(`/listings/${id}/report`, { method: 'POST', body: JSON.stringify({ reason, details }) });

export function recordListingEvent(id: number, type: 'WHATSAPP' | 'CALL' | 'SHARE') {
  void request<void>(`/listings/${id}/events`, { method: 'POST', body: JSON.stringify({ type }) }).catch(() => undefined);
}

export type ListingStats = { listingId: number; views: number; whatsapp: number; calls: number; shares: number; messages: number };
export const getMyListingStats = () => request<ListingStats[]>('/listings/mine/stats');
export const renewListing = (id: number) => request<AdminListing>(`/listings/${id}/renew`, { method: 'POST' });

export type ConversationSummary = {
  id: number; listingId: number; listingTitle: string; otherUserName: string; lastMessage: string; lastMessageAt: string; unreadCount: number;
};
export type MessageItem = { id: number; senderId: number; body: string; createdAt: string; mine: boolean };
export type ConversationDetail = { conversation: ConversationSummary; messages: MessageItem[] };

export const getConversations = () => request<ConversationSummary[]>('/conversations');
export const getConversation = (id: number) => request<ConversationDetail>(`/conversations/${id}`);
export const getUnreadCount = () => request<{ count: number }>('/conversations/unread-count');
export const sendMessage = (id: number, body: string) =>
  request<ConversationDetail>(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
export const startConversation = (listingId: number, body: string) =>
  request<ConversationDetail>(`/listings/${listingId}/conversations`, { method: 'POST', body: JSON.stringify({ body }) });

export type AdminReport = {
  id: number; listingId: number; listingTitle: string; listingStatus: string | null; reporterEmail: string | null;
  reason: string; details: string | null; status: 'OPEN' | 'RESOLVED' | 'DISMISSED'; createdAt: string; resolvedAt: string | null;
};
export type DayCount = { date: string; count: number };
export type LabelCount = { label: string; count: number };
export type AdminAnalytics = {
  days: number; listingsByDay: DayCount[]; usersByDay: DayCount[]; viewsByDay: DayCount[];
  listingsByCategory: LabelCount[]; listingsByStatus: LabelCount[];
  totalViews: number; totalContacts: number; openReports: number; totalConversations: number;
};
export type AdminAuditEntry = {
  id: number; adminEmail: string | null; action: string; targetType: string | null; targetId: number | null; details: string | null; createdAt: string;
};

export const getAdminReports = () => request<AdminReport[]>('/admin/reports');
export const resolveAdminReport = (id: number, status: 'RESOLVED' | 'DISMISSED', archiveListing: boolean) =>
  request<AdminReport>(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status, archiveListing }) });
export const getAdminAnalytics = (days = 30) => request<AdminAnalytics>(`/admin/analytics?days=${days}`);
export const getAdminAudit = () => request<AdminAuditEntry[]>('/admin/audit?limit=200');

export async function downloadAdminCsv(kind: 'users' | 'listings') {
  const token = useAuthStore.getState().user?.token;
  const response = await fetch(`${API_BASE}/admin/export/${kind}.csv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new ApiError(response.status);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `speedshift-${kind}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
