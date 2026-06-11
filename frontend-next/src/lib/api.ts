const API_BASE_URL = 'http://localhost:8080/api/v1';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  imageUrl: string;
}

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE_URL}/menu`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch menu from backend');
  }
  
  return res.json();
}
