/**
 * HTTP client for ZYNK backend API.
 * All methods return typed JSON and throw on non-2xx.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = (): string | null => {
  try {
    const stored = localStorage.getItem('zynk_current_user');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.token ?? null;
  } catch {
    return null;
  }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || json.error || `Request failed (${res.status})`);
  }
  return json as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChefPreview {
  chefId: number;
  kitchenName: string;
  rating: number;
  deliveryWindow: string;
  dishesPreview: { planId: number; planName: string; monthlyPrice: number; mealType: string }[];
  startingPrice: number;
}

export interface ChefFull {
  chef: {
    chefId: number;
    fullName: string;
    kitchenName: string;
    rating: number;
    deliveryWindow: string;
    serviceZones: string;
    dailyCapacity: number;
  };
  plans: {
    id: number;
    chefId: number;
    planName: string;
    monthlyPrice: number;
    frequency: string;
    mealType: string;
  }[];
}

export interface SubscriptionResponse {
  id: number;
  userId: number;
  chefId: number | null;
  planId: number | null;
  planName: string;
  status: string;
  startDate: string | null;
  nextBillingDate: string;
  priceInCents: number;
  priceSnapshot: number | null;
  deliveryAddress: string;
  postalCode: string;
  kitchenName: string | null;
}

export interface DeliveryEntry {
  id: number;
  subscriptionId: number;
  chefId: number;
  customerId: number;
  deliveryDate: string;
  addressSnapshot: string;
  mealType: string;
  status: 'scheduled' | 'skipped' | 'delivered';
  deliveredAt: string | null;
}

// ── Customer Browse ───────────────────────────────────────────────────────────

export const fetchChefsWithPreview = () =>
  request<{ success: boolean; chefs: ChefPreview[] }>('/customer/chefs-with-preview');

export const fetchChefFull = (chefId: number) =>
  request<{ success: boolean } & ChefFull>(`/customer/chefs/${chefId}/full`);

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const createSubscription = (planId: number) =>
  request<{ success: boolean; subscription: { id: number } }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });

export const fetchMySubscriptions = () =>
  request<{ success: boolean; subscriptions: SubscriptionResponse[] }>('/customer/subscriptions');

export const fetchSubscription = (id: number) =>
  request<{ success: boolean; subscription: SubscriptionResponse }>(`/customer/subscription/${id}`);

export const pauseSubscription = (id: number) =>
  request<{ success: boolean }>(`/customer/subscription/${id}/pause`, { method: 'PATCH' });

export const resumeSubscription = (id: number) =>
  request<{ success: boolean }>(`/customer/subscription/${id}/resume`, { method: 'PATCH' });

// ── Payment ───────────────────────────────────────────────────────────────────

export const createPaymentOrder = (subscriptionId: number) =>
  request<{ success: boolean; orderId: string }>('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId }),
  });

export const sendPaymentWebhook = (orderId: string, paymentId: string, signature: string) =>
  request<{ success: boolean; message: string }>('/payments/webhook', {
    method: 'POST',
    body: JSON.stringify({ orderId, paymentId, signature }),
  });

// ── Deliveries ────────────────────────────────────────────────────────────────

export const fetchDeliveries = (subscriptionId: number) =>
  request<{ success: boolean; deliveries: DeliveryEntry[] }>(`/customer/subscription/${subscriptionId}/deliveries`);

export const skipDelivery = (deliveryId: number) =>
  request<{ success: boolean }>(`/delivery/${deliveryId}/skip`, { method: 'PATCH' });
