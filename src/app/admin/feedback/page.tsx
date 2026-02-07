
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/StarRating';
import { AlertTriangle } from 'lucide-react';

function FeedbackCard({ order }: { order: Order }) {
    return (
        <Card className="card-glass animate-card-enter">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{order.customerName}</CardTitle>
                        <CardDescription>Order: {order.id}</CardDescription>
                    </div>
                    <StarRating rating={order.rating || 0} />
                </div>
            </CardHeader>
            <CardContent>
                <blockquote className="border-l-2 pl-6 italic">
                    {order.feedback}
                </blockquote>
                 <div className="text-xs text-muted-foreground mt-4">
                    <p>Dealer: {order.dealerName}</p>
                    <p>Date: {order.updatedAt.toDate().toLocaleDateString()}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminFeedbackPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();

    const feedbackQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'orders'),
            where('rating', '>', 0),
            orderBy('rating', 'asc'),
            orderBy('updatedAt', 'desc')
        );
    }, [firestore]);

    const { data: ordersWithFeedback, isLoading } = useCollection<Order>(feedbackQuery);

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
            ) : ordersWithFeedback && ordersWithFeedback.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ordersWithFeedback.map(order => (
                        <FeedbackCard key={order.id} order={order} />
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
/*
"feedbackCenter": "Feedback Center",
"feedbackCenterDesc": "Review and manage customer feedback for all delivered orders.",
"noFeedback": "No Feedback Yet",
"noFeedbackDesc": "Customer feedback will appear here once they submit reviews for delivered orders."
*/
