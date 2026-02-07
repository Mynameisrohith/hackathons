
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Review } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/StarRating';
import { AlertTriangle } from 'lucide-react';

function FeedbackCard({ review }: { review: Review }) {
    return (
        <Card className="card-glass animate-card-enter">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{review.productName}</CardTitle>
                        <CardDescription>User: {review.userId.substring(0,8)}...</CardDescription>
                    </div>
                    <StarRating rating={review.rating || 0} />
                </div>
            </CardHeader>
            <CardContent>
                <blockquote className="border-l-2 border-primary pl-6 italic">
                    {review.comment}
                </blockquote>
                 <div className="text-xs text-muted-foreground mt-4">
                    <p>Date: {review.createdAt.toDate().toLocaleDateString()}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminFeedbackPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const feedbackQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return query(
            collection(firestore, 'reviews'),
            where('rating', '<', 3), // Example: filter for low ratings
            orderBy('rating', 'asc'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, isAdmin]);

    const { data: lowRatedReviews, isLoading: isLoadingFeedback } = useCollection<Review>(feedbackQuery);

    const isLoading = isAdminLoading || isLoadingFeedback;

    return (
        <div className="space-y-6">
            <Card className="card-glass">
                <CardHeader>
                    <CardTitle>{t('feedbackCenter')}</CardTitle>
                    <CardDescription>{t('feedbackCenterDesc')}</CardDescription>
                </CardHeader>
            </Card>
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            ) : lowRatedReviews && lowRatedReviews.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lowRatedReviews.map(review => (
                        <FeedbackCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <Card className="col-span-full flex items-center justify-center p-12 text-center card-glass">
                    <div>
                        <AlertTriangle className="mx-auto size-12 text-muted-foreground/50 mb-4" />
                        <h2 className="text-2xl font-semibold">{t('noFeedback')}</h2>
                        <p className="text-muted-foreground mt-2 max-w-md">{t('noFeedbackDesc')}</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
