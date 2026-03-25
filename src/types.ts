import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  category?: string;
  createdAt: Timestamp;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  paymentMethod: 'COD';
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'user';
}

export interface Settings {
  adminPassword?: string;
  shopName?: string;
}
