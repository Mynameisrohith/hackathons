
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BrainCircuit, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';

// Lazy load components that are not critical for the initial render
const ProductSelector = React.lazy(() => import('@/components/admin/demand-forecasting/ProductSelector'));
const DemandCards = React.lazy(() => import('@/components/admin/demand-forecasting/DemandCards'));
const DemandChart = React.lazy(() => import('@/components/admin/demand-forecasting/DemandChart'));
const AISummary = React.lazy(() => import('@/components/admin/demand-forecasting/AISummary'));


export interface PredictionReport {
  productId: string;
  predictedDemand7d: number;
  predictedDemand30d: number;
  stockoutRisk: number;
  confidenceScore: number;
  summary: string;
  createdAt: string;
}

export default function AiDemandPage() {
  const auth = useAuth();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionReport | null>(null);
  const [historicalPredictions, setHistoricalPredictions] = useState<PredictionReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async (productId: string) => {
    if (!productId || !auth) return;

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication token not available.");

      // In a real scenario, you'd fetch real sales data here.
      // For this demo, we'll generate plausible random sales data.
      const salesData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5);

      const response = await fetch('/api/predict-demand', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ productId, salesData }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to fetch prediction.');
      }

      const data: PredictionReport = await response.json();
      setPrediction(data);
      setHistoricalPredictions(prev => [...prev, data].slice(-30));

    } catch (err: any) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Prediction Failed',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [auth]);
  
  // Fetch historical predictions for the selected product
  useEffect(() => {
    if(!selectedProductId || !auth) return;
    const fetchHistory = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication token not available.");

            const res = await fetch(`/api/demand-reports/${selectedProductId}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if(!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setHistoricalPredictions(data);
        } catch(e) {
            console.error("Could not fetch prediction history:", e);
        }
    }
    fetchHistory();
  }, [selectedProductId, auth])

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    fetchPrediction(productId);
  };
  
  const handleExport = () => {
    if(!prediction) return;
    const headers = "productId,predictedDemand7d,predictedDemand30d,stockoutRisk,confidenceScore,createdAt\n";
    const row = `${prediction.productId},${prediction.predictedDemand7d},${prediction.predictedDemand30d},${prediction.stockoutRisk},${prediction.confidenceScore},${prediction.createdAt}\n`;
    const csvContent = "data:text/csv;charset=utf-8," + headers + row;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `demand_report_${prediction.productId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="animate-card-enter">
      <PageHeader title="AI Demand Forecasting" subtitle="Predict future demand and optimize your inventory with SageMaker." />
      <main className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Card className="card-glass">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Forecasting Controls</CardTitle>
              <p className="text-sm text-muted-foreground">Select a product to generate a new demand forecast.</p>
            </div>
            <Button onClick={handleExport} variant="outline" disabled={!prediction}>
                <Download className="mr-2" /> Export Report
            </Button>
          </CardHeader>
          <CardContent>
            <React.Suspense fallback={<Skeleton className="h-10 w-full max-w-sm" />}>
              <ProductSelector onProductSelect={handleProductSelect} />
            </React.Suspense>
          </CardContent>
        </Card>

        {error && (
            <Card className="card-glass border-destructive">
                <CardHeader className="flex-row items-center gap-3">
                    <AlertCircle className="text-destructive" />
                    <CardTitle className="text-destructive">An Error Occurred</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">{error}</p>
                    <p className="text-xs text-muted-foreground mt-2">Please ensure the backend services (Firebase and AWS) are running and configured correctly. Check the function logs for more details.</p>
                </CardContent>
            </Card>
        )}

        {!selectedProductId && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-muted rounded-lg">
                <TrendingUp className="h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Select a product to start forecasting</h3>
                <p className="mt-1 text-sm text-muted-foreground">Choose a product from the dropdown above to view its demand prediction.</p>
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <React.Suspense fallback={<Skeleton className="h-80 w-full" />}>
                    <DemandChart historicalPredictions={historicalPredictions} isLoading={isLoading}/>
                 </React.Suspense>
            </div>
            <div className="space-y-8">
                <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <DemandCards prediction={prediction} isLoading={isLoading} />
                </React.Suspense>
                 <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <AISummary prediction={prediction} isLoading={isLoading} />
                 </React.Suspense>
            </div>
        </div>
      </main>
    </div>
  );
}
