import { useAuthStore } from '@/store/useAuthStore';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Dynamically use whatever IP or hostname the browser is currently at
    return `http://${window.location.hostname}:8080/api/v1`;
  }
  return 'http://localhost:8080/api/v1'; // Fallback for SSR
};

// Custom fetch wrapper that automatically attaches the JWT token
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
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
