
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PredictionReport } from "@/app/admin/ai-demand/page";

interface DemandChartProps {
    historicalPredictions: PredictionReport[];
    isLoading: boolean;
}

const chartConfig = {
    demand: {
        label: "Predicted Demand",
        color: "hsl(var(--chart-1))",
    },
};

export default function DemandChart({ historicalPredictions, isLoading }: DemandChartProps) {

    const chartData = historicalPredictions.map(report => ({
        date: new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        demand: report.predictedDemand7d,
    }));

    if (isLoading && historicalPredictions.length === 0) {
        return (
            <Card className="card-glass">
                <CardHeader>
                    <CardTitle>Prediction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="card-glass">
            <CardHeader>
                <CardTitle>7-Day Demand Prediction History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartConfig.demand.color} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={chartConfig.demand.color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Area type="monotone" dataKey="demand" stroke={chartConfig.demand.color} fillOpacity={1} fill="url(#colorDemand)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
