import type { Order, Review, UserProfile } from '@/lib/types';
import { toDate } from '@/lib/date-utils';

export interface FraudMetricsInput {
  fraudScore: number;
  suspiciousPatterns: {
    duplicateComments: number;
    ratingSpike: boolean;
    shortComments: number;
    rapidReviews: number;
    abnormalFrequency: boolean;
  };
}

export function calculateFraudMetrics(reviews: Review[] | null, orders: Order[] | null, users: UserProfile[] | null) {
    if (!reviews || !orders || !users || reviews.length === 0) return null;

    const now = new Date();

    // --- Metric 1: Duplicate Comments ---
    const commentCounts = new Map<string, number>();
    reviews.forEach(r => commentCounts.set(r.comment, (commentCounts.get(r.comment) || 0) + 1));
    const duplicateCommentsCount = reviews.filter(r => (commentCounts.get(r.comment) || 0) > 1).length;
    
    // --- Metric 2: Short Comments ---
    const shortCommentsCount = reviews.filter(r => r.comment.length < 15).length;
    
    // --- Metric 3: Rapid Reviews ---
    const userReviewsMap = new Map<string, Review[]>();
    reviews.forEach(r => {
        const userReviewList = userReviewsMap.get(r.userId) || [];
        userReviewList.push(r);
        userReviewsMap.set(r.userId, userReviewList);
    });

    const rapidReviewIds = new Set<string>();
    userReviewsMap.forEach(userReviewsList => {
        userReviewsList.sort((a, b) => toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime());
        for (let i = 1; i < userReviewsList.length; i++) {
            const diffMinutes = (toDate(userReviewsList[i].createdAt).getTime() - toDate(userReviewsList[i-1].createdAt).getTime()) / (1000 * 60);
            if (diffMinutes < 5) { // If a review is posted less than 5 mins after the previous one
                rapidReviewIds.add(userReviewsList[i].id);
                rapidReviewIds.add(userReviewsList[i-1].id); // Mark both as part of a rapid sequence
            }
        }
    });
    const rapidReviewsCount = rapidReviewIds.size;

    // --- Metric 4 & 5: Abnormal Frequency & Rating Spike ---
    const reviewsByDay: { [key: string]: { count: number, fiveStarCount: number } } = {};
    reviews.forEach(r => {
        const day = toDate(r.createdAt).toISOString().split('T')[0];
        if (!reviewsByDay[day]) {
            reviewsByDay[day] = { count: 0, fiveStarCount: 0 };
        }
        reviewsByDay[day].count++;
        if (r.rating === 5) {
            reviewsByDay[day].fiveStarCount++;
        }
    });

    const todayStr = now.toISOString().split('T')[0];
    const todaysReviewsCount = reviewsByDay[todayStr]?.count || 0;
    const todaysFiveStarCount = reviewsByDay[todayStr]?.fiveStarCount || 0;

    const historicalDays = Object.keys(reviewsByDay).filter(day => day !== todayStr);
    const avgReviewsPerDay = historicalDays.length > 0
        ? historicalDays.reduce((sum, day) => sum + reviewsByDay[day].count, 0) / historicalDays.length
        : 0;
    
    const avgFiveStarsPerDay = historicalDays.length > 0
        ? historicalDays.reduce((sum, day) => sum + reviewsByDay[day].fiveStarCount, 0) / historicalDays.length
        : 0;

    const isAbnormalFrequency = todaysReviewsCount > 5 && (avgReviewsPerDay === 0 || todaysReviewsCount > avgReviewsPerDay * 3);
    const isRatingSpike = todaysFiveStarCount > 5 && (avgFiveStarsPerDay === 0 || todaysFiveStarCount > avgFiveStarsPerDay * 3);

    // --- Metric 6: High Cancellation Rate Users ---
    const highCancellationUsers = new Map<string, { total: number; cancelled: number }>();
    orders.forEach(o => {
        const stats = highCancellationUsers.get(o.userId) || { total: 0, cancelled: 0 };
        stats.total++;
        if (o.orderStatus === 'Cancelled') stats.cancelled++;
        highCancellationUsers.set(o.userId, stats);
    });
    
    const highCancellationRateUsers = Array.from(highCancellationUsers.entries())
        .filter(([_, stats]) => stats.total > 3 && (stats.cancelled / stats.total) > 0.6)
        .map(([userId]) => userId);

    // --- Scoring ---
    let score = 0;
    if (duplicateCommentsCount > 5) score += 20;
    if (shortCommentsCount > 10) score += 15;
    if (rapidReviewsCount > 3) score += 25;
    if (isAbnormalFrequency) score += 15;
    if (isRatingSpike) score += 10;
    if (highCancellationRateUsers.length > 0) score += (highCancellationRateUsers.length * 15);
    score = Math.min(100, score);
    
    // --- Risk Level ---
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (score > 70) riskLevel = 'High';
    else if (score > 40) riskLevel = 'Medium';

    const metrics: FraudMetricsInput = {
      fraudScore: score,
      suspiciousPatterns: {
        duplicateComments: duplicateCommentsCount,
        ratingSpike: isRatingSpike,
        shortComments: shortCommentsCount,
        rapidReviews: rapidReviewsCount,
        abnormalFrequency: isAbnormalFrequency,
      },
    };
    
    type ReviewAnalysis = Review & {
      isDuplicateComment: boolean;
      isShortComment: boolean;
      isRapidReview: boolean;
    };
    const analyzedReviews: ReviewAnalysis[] = reviews.map(r => ({
        ...r,
        isDuplicateComment: (commentCounts.get(r.comment) || 0) > 1,
        isShortComment: r.comment.length < 15,
        isRapidReview: rapidReviewIds.has(r.id),
    }));

    return {
      metrics,
      riskLevel,
      highCancellationRateUsers,
      suspiciousReviews: analyzedReviews.filter(r => r.isDuplicateComment || r.isShortComment || r.isRapidReview).slice(0, 5),
    };
}