export type Language = 'en' | 'fr';

export interface Product {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  price: number;
  category: string;
  images: string[];
  sizes?: string[];
  isKit: boolean;
}

export interface Store {
  id: string;
  name: string;
  address: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  stores: Store[];
}
