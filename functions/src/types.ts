
import type { Timestamp } from "firebase-admin/firestore";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  creationTime?: Timestamp;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
  createdAt: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  items: Omit<CartItem, 'id' | 'createdAt' | 'stock'>[];
  totalAmount: number;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  paymentMethod: 'COD' | 'Card' | 'UPI';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  deliveryStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  cancellationReason?: string;
  createdAt: Timestamp;
  dealerName: string;
  dealerAddress: string;
  dealerLat: number;
  dealerLng: number;
  dealerPlaceId?: string;
}
