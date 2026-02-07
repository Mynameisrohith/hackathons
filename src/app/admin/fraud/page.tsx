
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  Firestore,
  collectionGroup,
} from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Product,
  Review,
  AIFraudReport,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Star,
  ShieldAlert,
  Bot,
  ThumbsDown,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Repeat,
  Sparkles,
} from "lucide-react";
import { explainFraudMetrics, FraudMetricsInput } from "@/ai/flows/explain-fraud-flow";
import type { FraudMetrics, ReviewAnalysis } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";


const FraudDashboard = ({ metrics, isLoading }: { metrics: FraudMetrics | null, isLoading: boolean }) => {
    const { t } = useLanguage();
    const [aiReport, setAiReport] = useState<AIFraudReport | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        if (metrics && metrics.fraudScore > 30 && !aiReport) {
            setIsAiLoading(true);
            const input: FraudMetricsInput = {
                fraudScore: metrics.fraudScore,
                suspiciousPatterns: metrics.analysis
            }
            explainFraudMetrics(input)
                .then(setAiReport)
                .catch(e => console.error("AI explanation failed:", e))
                .finally(() => setIsAiLoading(false));
        }
    }, [metrics, aiReport]);


    if (isLoading || !metrics) {
        return <Skeleton className="h-96 col-span-full" />
    }

    const { fraudScore, riskLevel, suspiciousReviews, suspiciousUsers } = metrics;
    const riskColor = riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'amber' : 'green';
    
    const circumference = 2 * Math.PI * 55; // radius = 55
    const offset = circumference - (fraudScore / 100) * circumference;

    return (
        <Card className={cn(
            "col-span-full animate-card-enter card-glass",
            riskLevel === 'High' && "border-red-500/50 bg-red-950/30",
            riskLevel === 'Medium' && "border-amber-500/50 bg-amber-950/20"
        )}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className={cn(riskLevel === 'High' ? 'text-red-400' : 'text-amber-400')} />
                    {t('marketplaceTrust')}
                </CardTitle>
                 <CardDescription>
                    {t('fraudMonitoringDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Panel */}
                <div className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-lg",
                    riskLevel === 'High' && 'fraud-glow'
                )}>
                    <h3 className="text-lg font-medium mb-4">{t('fraudRiskScore')}</h3>
                    <div className="relative h-40 w-40">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="55" stroke="hsl(var(--muted))" strokeWidth="10" fill="transparent" />
                            <circle
                                cx="60"
                                cy="60"
                                r="55"
                                stroke={`url(#gradient-${riskColor})`}
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="gradient-red"><stop stopColor="#f87171" /><stop offset="1" stopColor="#b91c1c" /></linearGradient>
                                <linearGradient id="gradient-amber"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#b45309" /></linearGradient>
                                <linearGradient id="gradient-green"><stop stopColor="#4ade80" /><stop offset="1" stopColor="#15803d" /></linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold">{fraudScore}</div>
                    </div>
                    <Badge variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Medium' ? 'secondary' : 'default'} className="mt-4">{t('riskLevel').replace('{level}', riskLevel)}</Badge>
                </div>

                {/* AI Insight Panel */}
                 <Card className={cn(
                    "lg:col-span-2 card-glass",
                     riskLevel === 'High' ? "border-red-500/20 bg-red-950/10" : "bg-card/50"
                )}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Bot /> {t('aiRiskInsight')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isAiLoading && <Skeleton className="h-32 w-full" />}
                        {!isAiLoading && aiReport && (
                            <div className="space-y-4 text-sm">
                                <p className="font-semibold italic text-primary/90">{aiReport.fraudSummary}</p>
                                <div>
                                    <h4 className="font-medium mb-1">{t('keyConcerns')}</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        {aiReport.keyConcerns.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">{t('recommendedActions')}</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        {aiReport.recommendedActions.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {!isAiLoading && !aiReport && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                                <p className="font-semibold">{t('allClear')}</p>
                                <p className="text-sm text-muted-foreground">{t('allClearDesc')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Details Panels */}
                <Card className="card-glass">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><ThumbsDown /> {t('suspiciousReviews')}</CardTitle></CardHeader>
                    <CardContent>
                        {suspiciousReviews.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {suspiciousReviews.slice(0,5).map(r => (
                                    <li key={r.id} className="p-2 bg-background/50 rounded-md">
                                        <p className="font-medium truncate">{r.productName}</p>
                                        <p className="text-xs text-muted-foreground truncate italic">"{r.comment}"</p>
                                        <div className="flex gap-2 mt-1">
                                            {r.isDuplicateComment && <Badge variant="destructive" className="text-xs">{t('duplicateComments')}</Badge>}
                                            {r.isShortComment && <Badge variant="destructive" className="text-xs">{t('shortComments')}</Badge>}
                                            {r.isRapidReview && <Badge variant="destructive" className="text-xs">{t('rapidReviews')}</Badge>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">{t('noSuspiciousReviews')}</p>}
                    </CardContent>
                </Card>
                 <Card className="card-glass">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck /> {t('suspiciousUsers')}</CardTitle></CardHeader>
                    <CardContent>
                        {suspiciousUsers.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {suspiciousUsers.map(u => (
                                    <li key={u.userId} className="flex justify-between items-center p-2 bg-background/50 rounded-md">
                                        <p className="font-mono text-xs truncate">{u.userId}</p>
                                        <p>{u.reviewCount} {t('reviews')}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">{t('noSuspiciousUsers')}</p>}
                    </CardContent>
                </Card>
                 <Card className="card-glass">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles /> {t('keyMetrics')}</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="flex items-center gap-1"><Repeat size={14}/>{t('duplicateComments')}</span> <span className="font-bold">{metrics.analysis.duplicateComments}</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><FileText size={14}/>{t('shortComments')}</span> <span className="font-bold">{metrics.analysis.shortComments}</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><Clock size={14}/>{t('rapidReviews')}</span> <span className="font-bold">{metrics.analysis.rapidReviews}</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><Star size={14}/>{t('ratingSpike')}</span> <Badge variant={metrics.analysis.ratingSpike ? 'destructive' : 'default'}>{metrics.analysis.ratingSpike ? t('detected') : t('none')}</Badge></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><AlertTriangle size={14}/>{t('abnormalFrequency')}</span> <Badge variant={metrics.analysis.abnormalFrequency ? 'destructive' : 'default'}>{metrics.analysis.abnormalFrequency ? 'yes' : 'no'}</Badge></div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
};

export default function FraudPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (!firestore || !isAdmin) {
        setIsLoading(false);
        return;
    };

    const reviewsQuery = query(collection(firestore, "reviews"));
    
    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching reviews:", error);
        setIsLoading(false);
    });

    return () => {
      unsubReviews();
    };
  }, [firestore, isAdmin]);

  const fraudMetrics: FraudMetrics | null = useMemo(() => {
      if (reviews.length < 5) return null;

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const todayStart = new Date(now.setHours(0,0,0,0));

      const commentsCount: { [key: string]: number } = {};
      const userReviews: { [key: string]: Review[] } = {};
      
      reviews.forEach(r => {
          commentsCount[r.comment] = (commentsCount[r.comment] || 0) + 1;
          if (!userReviews[r.userId]) userReviews[r.userId] = [];
          userReviews[r.userId].push(r);
      });

      const analyzedReviews = reviews.map(review => {
          const userRevs = userReviews[review.userId];
          const rapidReviews = userRevs.filter(r => r.createdAt.toDate() > oneHourAgo);
          return {
            ...review,
            isDuplicateComment: commentsCount[review.comment] > 1,
            isShortComment: review.comment.length < 10,
            isRapidReview: rapidReviews.length > 1 && rapidReviews.some(r => r.id === review.id),
          };
      });

      let fraudScore = 0;
      
      const duplicateComments = analyzedReviews.filter(r => r.isDuplicateComment).length;
      if (duplicateComments > 1) fraudScore += 20;

      const shortComments = analyzedReviews.filter(r => r.isShortComment).length;
      if (shortComments / reviews.length > 0.3) fraudScore += 20;
      
      const rapidReviews = analyzedReviews.filter(r => r.isRapidReview).length;
      if (rapidReviews > 0) fraudScore += 20;

      const todayReviews = reviews.filter(r => r.createdAt.toDate() > todayStart);
      const fiveStarToday = todayReviews.filter(r => r.rating === 5).length;
      const ratingSpike = todayReviews.length > 5 && (fiveStarToday / todayReviews.length) >= 0.8;
      if (ratingSpike) fraudScore += 20;

      const avgReviewsPerDay = reviews.length / ((reviews[reviews.length-1].createdAt.toDate().getTime() - reviews[0].createdAt.toDate().getTime()) / (1000 * 3600 * 24) + 1);
      const abnormalFrequency = todayReviews.length > avgReviewsPerDay * 3 && todayReviews.length > 5;
      if (abnormalFrequency) fraudScore += 20;

      fraudScore = Math.min(100, fraudScore);
      let riskLevel: FraudMetrics['riskLevel'] = 'Low';
      if (fraudScore > 60) riskLevel = 'High';
      else if (fraudScore > 30) riskLevel = 'Medium';
      
      const suspiciousReviews = analyzedReviews.filter(r => r.isDuplicateComment || r.isShortComment || r.isRapidReview).sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
      
      const suspiciousUsers = Object.entries(userReviews)
        .map(([userId, revs]) => ({ userId, reviewCount: revs.length, reviews: revs }))
        .filter(u => u.reviews.some(r => analyzedReviews.find(ar => ar.id === r.id)?.isRapidReview) || u.reviewCount > 5)
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0,5);

      return {
          fraudScore,
          riskLevel,
          suspiciousReviews,
          suspiciousUsers,
          analysis: {
              duplicateComments,
              ratingSpike,
              shortComments,
              rapidReviews,
              abnormalFrequency
          }
      };

  }, [reviews]);


  return (
    <div className="grid gap-6">
        <FraudDashboard metrics={fraudMetrics} isLoading={isLoading} />
    </div>
  );
}

/*
"fraudMonitoring": "Fraud Monitoring",
"fraudMonitoringDesc": "AI-powered analysis of reviews and orders to detect suspicious activity.",
"keyConcerns": "Key Concerns",
"recommendedActions": "Recommended Actions",
*/
