const API_BASE_URL = 'http://localhost:8080/api/v1';

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
  const res = await fetch(`${API_BASE_URL}/menu`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch menu from backend');
  }
  
  return res.json();
}
