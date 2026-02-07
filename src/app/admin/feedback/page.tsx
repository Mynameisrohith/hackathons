'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Review } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { StarRating } from '@/components/StarRating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ReviewCard({ review }: { review: Review }) {
    return (
        <Card className="card-glass">
            <CardHeader className="flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-base">{review.productName}</CardTitle>
                    <p className="text-xs text-muted-foreground">User: {review.userId.slice(0, 8)}...</p>
                </div>
                <StarRating rating={review.rating} />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">{new Date(review.createdAt.seconds * 1000).toLocaleString()}</p>
            </CardFooter>
        </Card>
    )
}

export default function FeedbackPage() {
  const firestore = useFirestore();
  const [filter, setFilter] = useState('all');

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    if (filter === 'all') return reviews;
    if (filter === 'positive') return reviews.filter(r => r.rating >= 4);
    if (filter === 'negative') return reviews.filter(r => r.rating <= 2);
    return [];
  }, [reviews, filter]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Feedback Center" subtitle="Review and manage customer feedback for all delivered orders." />
      <main className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="positive">Positive</TabsTrigger>
            <TabsTrigger value="negative">Negative</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map(review => <ReviewCard key={review.id} review={review} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No feedback in this category.</p>
          </div>
        )}

      </main>
    </div>
  );
}
