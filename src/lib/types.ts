import type { Timestamp } from "firebase/firestore";

export interface Category {
  id: string;
  name: string;
  description: string;
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
  categoryName: string;
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
