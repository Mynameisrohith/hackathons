
'use client';
import { StatCard } from "@/components/admin/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionReport } from "@/app/admin/ai-demand/page";
import { TrendingUp, Package, AlertTriangle, BadgePercent } from "lucide-react";
import NumberTicker from "@/components/landing/NumberTicker";

export default function DemandCards({ prediction, isLoading }: { prediction: PredictionReport | null, isLoading: boolean }) {
     if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    if (!prediction) {
        return (
            <div className="space-y-4">
                <StatCard title="Predicted Demand (7d)" value="--" icon={TrendingUp} />
                <StatCard title="Stockout Risk" value="--" icon={AlertTriangle} />
                <StatCard title="Model Confidence" value="--" icon={BadgePercent} />
            </div>
        )
    }

    const stockoutRiskPercent = (prediction.stockoutRisk * 100).toFixed(1);
    const confidenceScorePercent = (prediction.confidenceScore * 100).toFixed(1);

    return (
        <div className="space-y-4">
            <StatCard 
                title="Predicted Demand (7d)" 
                icon={TrendingUp} 
                change={`${prediction.predictedDemand30d} units / 30d`}
            >
                 <div className="text-2xl font-bold">
                    <NumberTicker value={prediction.predictedDemand7d} />
                </div>
            </StatCard>
            <StatCard 
                title="Stockout Risk" 
                icon={AlertTriangle}
                className={prediction.stockoutRisk > 0.7 ? 'text-destructive border-destructive/50' : prediction.stockoutRisk > 0.4 ? 'text-yellow-500 border-yellow-500/50' : ''}
            >
                <div className="text-2xl font-bold">
                    <NumberTicker value={parseFloat(stockoutRiskPercent)} />%
                </div>
            </StatCard>
             <StatCard 
                title="Model Confidence" 
                icon={BadgePercent}
            >
                 <div className="text-2xl font-bold">
                    <NumberTicker value={parseFloat(confidenceScorePercent)} />%
                </div>
            </StatCard>
        </div>
    )
}
