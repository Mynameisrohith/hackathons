import type { Timestamp } from "firebase/firestore";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type UserRoleType = 'admin' | 'dealer' | 'delivery' | 'customer';

export type RoleStatus = 'active' | 'pending' | 'rejected';

export interface UserRole {
  role: UserRoleType;
  status: RoleStatus;
  isSuperAdmin?: boolean;
  storeId?: string; // For dealers
  assignedAt?: Timestamp;
  assignedBy?: string; // Admin's UID or 'system'
  applicationId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  creationTime?: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number; 
  description: string;
  imageUrl: string;
  categoryId: string;
  createdAt: Timestamp;
}

export interface Sale {
  id:string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  createdAt: Timestamp;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  userId: string;
  createdAt: Timestamp;
}

export interface CartItem {
  id: string; // Document ID from Firestore
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
  categoryId: string;
  createdAt: Timestamp;
}

export interface Store {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  placeId?: string;
  active?: boolean;
  createdAt?: Timestamp;
  stock: { [productId: string]: number }; // Map of productId to quantity
}

export interface Order {
  id: string; // Document ID from Firestore
  userId: string;
  userEmail: string;
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
  paymentId?: string;
  orderStatus: 'Pending' | 'Packed' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Not Deliverable';
  deliveryStatus?: 'Assigned' | 'Picked' | 'Out for Delivery' | 'Delivered';
  deliveryBoyLat?: number;
  deliveryBoyLng?: number;
  estimatedArrivalMinutes?: number;
  cancellationReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Logistics Fields
  dealerId?: string;
  dealerName?: string;
  dealerAddress?: string;
  dealerLat?: number;
  dealerLng?: number;
  dealerPlaceId?: string;
  
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  deliveryBoyPhone?: string;

  feedback?: string;
  rating?: number;

  // Stock Routing Fields
  assignedHubId?: string;
  stockConfirmed: boolean;
}

export interface DeliveryLocation {
    id: string; // same as delivery boy user id
    latitude: number;
    longitude: number;
    updatedAt: Timestamp;
}


export interface ReviewAnalysis extends Review {
  isDuplicateComment: boolean;
  isShortComment: boolean;
  isRapidReview: boolean;
}

export interface FraudMetrics {
    fraudScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    suspiciousReviews: ReviewAnalysis[];
    suspiciousUsers: { userId: string; reviewCount: number }[];
    analysis: {
        duplicateComments: number;
        ratingSpike: boolean;
        shortComments: number;
        rapidReviews: number;
        abnormalFrequency: boolean;
    };
}

export interface AIFraudReport {
    fraudSummary: string;
    keyConcerns: string[];
    recommendedActions: string[];
}


export interface ProductTrendInfo {
    momentumScore: number;
    trend: 'Rising' | 'Declining' | 'Stable';
}

export interface ProductAnalysis extends Product {
  salesVelocity: number;
  daysUntilStockout: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'N/A';
  isOverstocked: boolean;
  suggestedRestock: number;
  trendInfo: ProductTrendInfo;
}

export interface MarketAnalysis {
    weeklyGrowth: number;
    volatility: 'Stable' | 'Moderate' | 'Volatile';
    volatilityScore: number;
    businessImpactLabel: string;
}

// From Google Places API
export interface Place {
    id: string;
    place_id: string;
    name: string;
    vicinity: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    rating?: number;
    user_ratings_total?: number;
    formatted_phone_number?: string;
}

export interface Dealer {
    id: string;
    placeId?: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    status: 'Registered' | 'New';
    distance: number;
    rating?: number;
    userRatingsTotal?: number;
    // Added for stock checking
    stock?: { [productId: string]: number };
}


export type EmailPayload = {
    emailType: 'order-confirmation' | 'status-update' | 'feedback-request' | 'cancellation-notification' | 'new-order-admin';
    order: Order;
    user: UserProfile;
}

export interface DeliveryDelayPrediction {
  predictedDelay: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  reasons: string[];
}
