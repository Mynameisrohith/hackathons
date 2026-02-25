
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionReport } from "@/app/admin/ai-demand/page";
import { BrainCircuit } from "lucide-react";

export default function AISummary({ prediction, isLoading }: { prediction: PredictionReport | null, isLoading: boolean }) {
    if (isLoading) {
        return (
             <Card className="card-glass h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if(!prediction) return null;

    return (
        <Card className="card-glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                  className="prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: prediction.summary.replace(/\n/g, '<br />') }}
                />
            </CardContent>
        </Card>
    )
}
