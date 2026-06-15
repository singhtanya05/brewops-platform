import { useAuthStore } from '@/store/useAuthStore';

const getApiBaseUrl = () => {
  return '/api/v1'; // Always use relative path, handled by Next.js proxy
};

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Ensure cookies are sent with requests
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;
  
  return response.json();
}

export interface MenuVariant {
  variantId: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  availableQuantity: number;
}

export interface MenuProduct {
  productId: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  variants: MenuVariant[];
}

export interface MenuCategory {
  categoryId: string;
  name: string;
  slug: string;
  products: MenuProduct[];
}

export async function fetchMenu(): Promise<MenuCategory[]> {
  // We can use our secure apiFetch here
  return apiFetch('/menu');
}

export async function addCartItem(sessionId: string, variantId: string, quantity: number, specialInstructions?: string) {
  return apiFetch('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ sessionId, variantId, quantity, specialInstructions })
  });
}

export async function createOrder(sessionId: string) {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
}

export async function getOrderById(orderId: string) {
  return apiFetch(`/orders/${orderId}`);
}

export async function getKitchenOrders(status?: string) {
  const url = status ? `/kitchen/orders?status=${status}` : '/kitchen/orders';
  return apiFetch(url);
}

export async function updateKitchenOrderStatus(orderId: string, status: string) {
  return apiFetch(`/kitchen/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}
