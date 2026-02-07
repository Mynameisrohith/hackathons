import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
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

export interface ProductAnalysis extends Product {
  salesVelocity: number;
  daysUntilStockout: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'N/A';
  isOverstocked: boolean;
  suggestedRestock: number;
}
