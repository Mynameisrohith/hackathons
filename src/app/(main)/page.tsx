"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Sale, ProductAnalysis, MarketAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  Warehouse,
  BellRing,
  ShieldAlert,
  Zap,
  ArrowUp,
  ArrowDown,
  Activity,
  AlertTriangle,
  Flame,
  Frown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Custom hook for animating numbers
const useAnimatedCounter = (endValue: number, duration = 1500) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0; // Always start from 0 for a fresh animation

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      const percentage = Math.min(progress / duration, 1);
      
      const current = startValue + (endValue - startValue) * percentage;
      setCount(current);

      if (progress < duration) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  return count;
};

// Business Health Indicator Component
const BusinessHealthIndicator = ({ score, isLoading }: { score: number, isLoading: boolean }) => {
  const animatedScore = useAnimatedCounter(isLoading ? 0 : score, 2000);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (animatedScore / 100) * circumference;

  const getGradientColor = (score: number) => {
    if (score < 40) return "url(#gradient-low)";
    if (score < 75) return "url(#gradient-medium)";
    return "url(#gradient-high)";
  };

  if(isLoading) {
    return (
        <Card className="card-glass col-span-full md:col-span-2 lg:col-span-1 flex flex-col items-center justify-center p-6 animate-card-enter">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-6 w-32 mt-4" />
        </Card>
    )
  }

  return (
    <Card className="card-glass col-span-full md:col-span-2 lg:col-span-1 flex flex-col items-center justify-center p-6 animate-card-enter">
      <CardTitle className="text-center mb-4">Business Health</CardTitle>
      <div className="relative h-40 w-40">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradient-low" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f44336" />
              <stop offset="100%" stopColor="#ef9a9a" />
            </linearGradient>
            <linearGradient id="gradient-medium" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffc107" />
              <stop offset="100%" stopColor="#fff176" />
            </linearGradient>
            <linearGradient id="gradient-high" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4caf50" />
              <stop offset="100%" stopColor="#a5d6a7" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={getGradientColor(animatedScore)}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
          {Math.round(animatedScore)}
        </div>
      </div>
    </Card>
  );
};

// Market Trend Overview Component
const MarketTrendOverview = ({ analysis, isLoading }: { analysis?: MarketAnalysis, isLoading: boolean }) => {
    const animatedGrowth = useAnimatedCounter(isLoading || !analysis ? 0 : analysis.weeklyGrowth, 1500);

    if (isLoading || !analysis) {
        return (
            <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 flex flex-col justify-center animate-card-enter" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Market Trends</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                    <Skeleton className="h-10 w-24 mx-auto" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                    <Skeleton className="h-6 w-20 mx-auto mt-2" />
                </CardContent>
            </Card>
        );
    }

    const { weeklyGrowth, volatility, businessImpactLabel } = analysis;
    const isPositive = weeklyGrowth >= 0;

    const volatilityStyles = {
        Stable: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        Moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
        Volatile: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    }

    return (
        <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 flex flex-col justify-center animate-card-enter" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp /> Market Trends</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <div className={cn("flex items-center justify-center gap-1 text-4xl font-bold", isPositive ? "text-green-600" : "text-red-600")}>
                    {isPositive ? <ArrowUp className="h-8 w-8" /> : <ArrowDown className="h-8 w-8" />}
                    <span>{Math.abs(animatedGrowth).toFixed(1)}%</span>
                </div>
                <p className="text-sm text-muted-foreground">vs last 7 days</p>
                <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                       <Activity className="h-4 w-4 text-muted-foreground" />
                        <Badge className={cn("text-xs", volatilityStyles[volatility])}>{volatility}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{businessImpactLabel}</p>
                </div>
            </CardContent>
        </Card>
    );
};

// Rising Products Component
const RisingProducts = ({ products, isLoading }: { products: ProductAnalysis[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-500"><Flame /> Rising Products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-500"><Flame /> Rising Products</CardTitle>
            </CardHeader>
            <CardContent>
                {products.length > 0 ? (
                    <ul className="space-y-2">
                        {products.map((p, i) => (
                            <li key={p.id} className="flex items-center justify-between rounded-md bg-background/50 p-2 animate-subtle-pulse" style={{animationDelay: `${i * 100}ms`}}>
                                <span className="font-medium">{p.name}</span>
                                <div className="flex items-center gap-1 text-green-600 text-sm">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>+{(p.trendInfo.momentumScore * 100 - 100).toFixed(0)}%</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No significant rising trends.</p>
                )}
            </CardContent>
        </Card>
    );
};

// Declining Products Component
const DecliningProducts = ({ products, isLoading }: { products: ProductAnalysis[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.3s' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-500"><Frown /> Declining Products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-500"><Frown /> Declining Products</CardTitle>
            </CardHeader>
            <CardContent>
                {products.length > 0 ? (
                    <ul className="space-y-2">
                        {products.map((p) => (
                            <li key={p.id} className="flex items-center justify-between rounded-md bg-background/50 p-2">
                                <span className="font-medium">{p.name}</span>
                                <div className="flex items-center gap-1 text-red-600 text-sm">
                                    <TrendingDown className="h-4 w-4" />
                                    <span>-{(100 - p.trendInfo.momentumScore * 100).toFixed(0)}%</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No products are declining.</p>
                )}
            </CardContent>
        </Card>
    );
};


// Inventory Risk Panel Component
const InventoryRiskPanel = ({ products, isLoading }: { products: ProductAnalysis[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card className="card-glass col-span-full lg:col-span-2 animate-card-enter" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert /> Inventory at Risk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </CardContent>
            </Card>
        );
    }
  
    const highRiskProducts = products.filter(p => p.riskLevel === 'High').slice(0, 5);

  return (
    <Card className="card-glass col-span-full lg:col-span-2 animate-card-enter" style={{ animationDelay: '0.4s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldAlert /> Inventory at Risk (High)</CardTitle>
      </CardHeader>
      <CardContent>
        {highRiskProducts.length > 0 ? (
          <ul className="space-y-2">
            {highRiskProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md bg-background/50 p-2">
                <span className="font-medium">{p.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {p.daysUntilStockout < 1 ? '<1 day left' : `${Math.floor(p.daysUntilStockout)} days left`}
                  </span>
                  <RiskBadge level={p.riskLevel} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-4">No products at high risk. Well done!</p>
        )}
      </CardContent>
    </Card>
  );
};

// Restock Suggestions Component
const RestockSuggestions = ({ products, isLoading }: { products: ProductAnalysis[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.5s' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackageCheck /> Restock Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </CardContent>
            </Card>
        )
    }

    const restockNeeded = products.filter(p => p.suggestedRestock > 0).slice(0, 5);

  return (
    <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.5s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PackageCheck /> Restock Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {restockNeeded.length > 0 ? (
          <ul className="space-y-2">
            {restockNeeded.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md bg-background/50 p-2">
                <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Current: {p.stock}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-primary">+{p.suggestedRestock}</p>
                    <p className="text-xs text-muted-foreground">units</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-4">No restock suggestions for now.</p>
        )}
      </CardContent>
    </Card>
  );
};


// Overstock Warnings Component
const OverstockWarnings = ({ products, isLoading }: { products: ProductAnalysis[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.6s' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Warehouse /> Overstock Warnings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </CardContent>
            </Card>
        )
    }

    const overstocked = products.filter(p => p.isOverstocked).slice(0, 5);

  return (
    <Card className="card-glass col-span-full md:col-span-1 lg:col-span-1 animate-card-enter" style={{ animationDelay: '0.6s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Warehouse /> Overstock Warnings</CardTitle>
      </CardHeader>
      <CardContent>
        {overstocked.length > 0 ? (
          <ul className="space-y-2">
            {overstocked.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md bg-background/50 p-2">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-amber-600 font-semibold">{p.stock} units</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-4">No overstocked products detected.</p>
        )}
      </CardContent>
    </Card>
  );
};

// Risk Level Badge Component
const RiskBadge = ({ level }: { level: ProductAnalysis['riskLevel'] }) => {
  const variants = {
    High: "destructive",
    Medium: "secondary",
    Low: "default",
    'N/A': "outline",
  } as const;

  const glowClass = level === 'High' ? 'animate-glow' : '';

  return <Badge variant={variants[level]} className={cn('w-16 justify-center', glowClass)}>{level}</Badge>;
};

// Helper function to calculate standard deviation
const calculateStdDev = (arr: number[]) => {
    const n = arr.length;
    if (n === 0) return 0;
    const mean = arr.reduce((a, b) => a + b) / n;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    return Math.sqrt(variance);
};

// Main Dashboard Page
export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const productsQuery = query(collection(db, "products"));
    const salesQuery = query(collection(db, "sales"));

    let productLoaded = false;
    let salesLoaded = false;

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(productsData);
      productLoaded = true;
      if(salesLoaded) setIsLoading(false);
    });

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Sale)
      );
      setSales(salesData);
      salesLoaded = true;
      if(productLoaded) setIsLoading(false);
    });
    
    const timer = setTimeout(() => {
        if (isLoading) setIsLoading(false);
    }, 3000);

    return () => {
      unsubProducts();
      unsubSales();
      clearTimeout(timer);
    };
  }, []);

  const analytics = useMemo(() => {
    if (products.length === 0) {
        return { 
            analyzedProducts: [], 
            businessHealth: { score: 0 }, 
            marketAnalysis: { weeklyGrowth: 0, volatility: 'Stable', volatilityScore: 0, businessImpactLabel: 'Awaiting data...' },
            risingProducts: [],
            decliningProducts: []
        };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
    const fourteenDaysAgo = new Date(new Date().setDate(now.getDate() - 14));

    const salesLast7Days = sales.filter(s => s.createdAt.toDate() > sevenDaysAgo);
    const sales8to14Days = sales.filter(s => s.createdAt.toDate() <= sevenDaysAgo && s.createdAt.toDate() > fourteenDaysAgo);

    const revenueLast7Days = salesLast7Days.reduce((sum, s) => sum + s.totalAmount, 0);
    const revenue8to14Days = sales8to14Days.reduce((sum, s) => sum + s.totalAmount, 0);
    const weeklyGrowth = revenue8to14Days > 0 ? ((revenueLast7Days - revenue8to14Days) / revenue8to14Days) * 100 : (revenueLast7Days > 0 ? 100 : 0);
    
    const salesLast14Days = sales.filter(s => s.createdAt.toDate() > fourteenDaysAgo);
    const dailyRevenue = Array(14).fill(0);
    salesLast14Days.forEach(sale => {
        const dayIndex = 13 - Math.floor((now.getTime() - sale.createdAt.toDate().getTime()) / (1000 * 3600 * 24));
        if (dayIndex >= 0 && dayIndex < 14) dailyRevenue[dayIndex] += sale.totalAmount;
    });
    const meanDailyRevenue = dailyRevenue.reduce((a, b) => a + b, 0) / 14;
    const revenueStdDev = calculateStdDev(dailyRevenue);
    const volatilityScore = meanDailyRevenue > 0 ? (revenueStdDev / meanDailyRevenue) * 100 : 0;
    
    let volatility: MarketAnalysis['volatility'] = 'Stable';
    if (volatilityScore > 40) volatility = 'Volatile';
    else if (volatilityScore > 20) volatility = 'Moderate';

    let businessImpactLabel = "Market conditions are stable.";
    if (weeklyGrowth > 10) businessImpactLabel = volatility === 'Stable' ? "Strong, stable growth detected." : "Growth is strong but volatile.";
    else if (weeklyGrowth < -10) businessImpactLabel = "Market slowdown detected, monitor trends.";
    
    const analyzedProducts: ProductAnalysis[] = products.map((product) => {
      const salesLast7 = salesLast7Days.filter((s) => s.productId === product.id);
      const totalQuantitySold7d = salesLast7.reduce((sum, s) => sum + s.quantity, 0);
      const salesVelocity = totalQuantitySold7d / 7;

      const sales8to14 = sales8to14Days.filter(s => s.productId === product.id);
      const totalQuantitySold8to14d = sales8to14.reduce((sum, s) => sum + s.quantity, 0);
      const oldSalesVelocity = totalQuantitySold8to14d / 7;

      const momentumScore = oldSalesVelocity > 0 ? salesVelocity / oldSalesVelocity : (salesVelocity > 0 ? 2 : 1);
      let trend: ProductAnalysis['trendInfo']['trend'] = 'Stable';
      if (momentumScore > 1.2) trend = 'Rising';
      else if (momentumScore < 0.8) trend = 'Declining';

      const daysUntilStockout = salesVelocity > 0 ? product.stock / salesVelocity : Infinity;
      let riskLevel: ProductAnalysis['riskLevel'] = 'N/A';
      if (salesVelocity > 0) {
        if (daysUntilStockout < 5) riskLevel = 'High';
        else if (daysUntilStockout <= 14) riskLevel = 'Medium';
        else riskLevel = 'Low';
      } else {
        riskLevel = product.stock > 0 ? 'Low' : 'N/A';
      }

      const isOverstocked = salesVelocity > 0 && product.stock > salesVelocity * 60;
      const suggestedRestock = salesVelocity > 0 ? Math.max(0, Math.ceil((salesVelocity * 14) - product.stock)) : 0;

      return {
        ...product,
        salesVelocity, daysUntilStockout, riskLevel, isOverstocked, suggestedRestock,
        trendInfo: { momentumScore, trend },
      };
    });

    const growth = revenue8to14Days > 0 ? (revenueLast7Days - revenue8to14Days) / revenue8to14Days : (revenueLast7Days > 0 ? 1 : 0);
    const normalizedGrowth = Math.max(-1, Math.min(1, growth));
    const revenueScore = ((normalizedGrowth + 1) / 2) * 100;
    const highRiskCount = analyzedProducts.filter(p => p.riskLevel === 'High').length;
    const overstockedCount = analyzedProducts.filter(p => p.isOverstocked).length;
    const stockScore = products.length > 0 ? ((products.length - highRiskCount - overstockedCount) / products.length) * 100 : 0;
    const transactionScore = Math.min(100, (salesLast7Days.length / 50) * 100);
    const businessHealthScore = (revenueScore * 0.4) + (stockScore * 0.4) + (transactionScore * 0.2);

    const risingProducts = analyzedProducts.filter(p => p.trendInfo.trend === 'Rising').sort((a,b) => b.trendInfo.momentumScore - a.trendInfo.momentumScore).slice(0, 3);
    const decliningProducts = analyzedProducts.filter(p => p.trendInfo.trend === 'Declining').sort((a,b) => a.trendInfo.momentumScore - b.trendInfo.momentumScore).slice(0, 3);

    return { 
        analyzedProducts,
        businessHealth: { score: businessHealthScore || 0 },
        marketAnalysis: { weeklyGrowth, volatility, volatilityScore, businessImpactLabel },
        risingProducts,
        decliningProducts
    };
  }, [products, sales]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BusinessHealthIndicator score={analytics.businessHealth?.score} isLoading={isLoading} />
      <MarketTrendOverview analysis={analytics.marketAnalysis} isLoading={isLoading} />
      <RisingProducts products={analytics.risingProducts} isLoading={isLoading} />
      <DecliningProducts products={analytics.decliningProducts} isLoading={isLoading} />
      
      <InventoryRiskPanel products={analytics.analyzedProducts} isLoading={isLoading} />
      <RestockSuggestions products={analytics.analyzedProducts} isLoading={isLoading} />
      <OverstockWarnings products={analytics.analyzedProducts} isLoading={isLoading} />
    </div>
  );
}
