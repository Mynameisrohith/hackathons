'use client';

import React, { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, Review, UserProfile } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { explainFraudMetrics, type AIFraudReportOutput, type FraudMetricsInput } from '@/ai/flows/explain-fraud-flow';
import { Button } from '@/components/ui/button';

type ReviewAnalysis = Review & {
  isDuplicateComment: boolean;
  isShortComment: boolean;
  isRapidReview: boolean;
};

function calculateFraudMetrics(reviews: Review[] | null, orders: Order[] | null, users: UserProfile[] | null) {
    if (!reviews || !orders || !users) return null;

    const commentCounts = new Map<string, number>();
    reviews.forEach(r => commentCounts.set(r.comment, (commentCounts.get(r.comment) || 0) + 1));
    
    const userReviewCounts = new Map<string, number>();
    reviews.forEach(r => userReviewCounts.set(r.userId, (userReviewCounts.get(r.userId) || 0) + 1));

    const analyzedReviews: ReviewAnalysis[] = reviews.map(r => ({
        ...r,
        isDuplicateComment: (commentCounts.get(r.comment) || 0) > 1,
        isShortComment: r.comment.length < 15,
        isRapidReview: false, // More complex check needed
    }));

    let score = 0;
    const duplicateComments = analyzedReviews.filter(r => r.isDuplicateComment).length;
    const shortComments = analyzedReviews.filter(r => r.isShortComment).length;
    const highCancellationUsers = new Map<string, { total: number; cancelled: number }>();

    orders.forEach(o => {
        const stats = highCancellationUsers.get(o.userId) || { total: 0, cancelled: 0 };
        stats.total++;
        if (o.orderStatus === 'Cancelled') stats.cancelled++;
        highCancellationUsers.set(o.userId, stats);
    });
    
    const highCancellationRateUsers = Array.from(highCancellationUsers.entries())
        .filter(([_, stats]) => stats.total > 2 && (stats.cancelled / stats.total) > 0.5)
        .map(([userId]) => userId);

    if (duplicateComments > 5) score += 20;
    if (shortComments > 10) score += 15;
    if (highCancellationRateUsers.length > 0) score += (highCancellationRateUsers.length * 10);
    score = Math.min(100, score);
    
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (score > 60) riskLevel = 'High';
    else if (score > 30) riskLevel = 'Medium';

    const metrics: FraudMetricsInput = {
      fraudScore: score,
      suspiciousPatterns: {
        duplicateComments: duplicateComments,
        ratingSpike: false, // placeholder
        shortComments: shortComments,
        rapidReviews: 0, // placeholder
        abnormalFrequency: false, // placeholder
      },
    };

    return {
      metrics,
      riskLevel,
      highCancellationRateUsers,
      suspiciousReviews: analyzedReviews.filter(r => r.isDuplicateComment || r.isShortComment).slice(0, 5),
    };
}


function RiskBadge({ level }: { level: 'Low' | 'Medium' | 'High' }) {
    const variants = {
        Low: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/30',
        Medium: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-500/30',
        High: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-500/30 fraud-glow',
    };
    return <Badge className={variants[level]}>{level} Risk</Badge>
}

function AIReport({ metrics }: { metrics: FraudMetricsInput }) {
    const [report, setReport] = React.useState<AIFraudReportOutput | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const getReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await explainFraudMetrics(metrics);
            setReport(res);
        } catch (e) {
            setError("Failed to generate AI insight.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="card-glass">
            <CardHeader>
                <CardTitle>AI Risk Insight</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <Skeleton className="h-24 w-full" />}
                {error && <p className="text-destructive">{error}</p>}
                {report && (
                    <div className="space-y-4">
                        <p className="font-semibold italic">"{report.fraudSummary}"</p>
                        <div>
                            <h4 className="font-bold">Key Concerns:</h4>
                            <ul className="list-disc list-inside text-muted-foreground text-sm">
                                {report.keyConcerns.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-bold">Recommended Actions:</h4>
                            <ul className="list-disc list-inside text-muted-foreground text-sm">
                                {report.recommendedActions.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={getReport} disabled={isLoading}>Generate AI Insight</Button>
            </CardFooter>
        </Card>
    );
}

export default function FraudPage() {
  const firestore = useFirestore();

  const reviewsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'reviews')) : null, [firestore]);
  const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);

  const { data: reviews, isLoading: loadingReviews } = useCollection<Review>(reviewsQuery);
  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = loadingReviews || loadingOrders || loadingUsers;

  const fraudData = useMemo(() => calculateFraudMetrics(reviews, orders, users), [reviews, orders, users]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Fraud & Risk Center" subtitle="AI-powered analysis of reviews and orders to detect suspicious activity." />
      <main className="p-4 sm:p-6 lg:p-8 space-y-8">
        {isLoading || !fraudData ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <Card className="card-glass text-center">
                    <CardHeader>
                        <CardTitle>Overall Fraud Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-6xl font-bold">{fraudData.metrics.fraudScore}</div>
                        <p className="text-muted-foreground">out of 100</p>
                        <div className="mt-4">
                            <RiskBadge level={fraudData.riskLevel} />
                        </div>
                    </CardContent>
                </Card>
                <AIReport metrics={fraudData.metrics} />
            </div>
            <div className="lg:col-span-2 space-y-8">
                <Card className="card-glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertCircle className="text-yellow-500" />Suspicious Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {fraudData.suspiciousReviews.length === 0 ? (
                             <p className="text-muted-foreground text-center p-4">No suspicious reviews found.</p>
                        ) : (
                            <ul className="space-y-2">
                                {fraudData.suspiciousReviews.map(r => (
                                    <li key={r.id} className="text-sm p-2 rounded-md bg-muted/50">
                                        <p>"{r.comment}" on {r.productName} <Badge variant="outline">{r.isDuplicateComment ? "Duplicate" : "Short"}</Badge></p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                 <Card className="card-glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingDown className="text-red-500" />High Cancellation Rate Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {fraudData.highCancellationRateUsers.length === 0 ? (
                             <p className="text-muted-foreground text-center p-4">No users with high cancellation rates detected.</p>
                        ) : (
                            <ul className="space-y-2">
                               {fraudData.highCancellationRateUsers.map(uid => (
                                   <li key={uid} className="text-sm p-2 rounded-md bg-muted/50">User ID: <span className="font-mono">{uid.slice(0,12)}...</span></li>
                               ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
