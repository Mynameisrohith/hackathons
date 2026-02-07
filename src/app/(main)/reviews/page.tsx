"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Product,
  Review,
  ReviewAnalysis,
  FraudMetrics,
  AIFraudReport,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Star,
  PlusCircle,
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


const reviewSchema = z.object({
  productId: z.string().min(1, "Please select a product."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters long."),
});

// Mock user ID generation for demo purposes
const getOrSetUserId = () => {
    let userId = localStorage.getItem('retail-spark-userId');
    if (!userId) {
        userId = uuidv4();
        localStorage.setItem('retail-spark-userId', userId);
    }
    return userId;
}

function AddReviewForm({ products, setOpen }: { products: Product[], setOpen: (open: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId: "", rating: 5, comment: "" },
  });

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    setIsSubmitting(true);
    const selectedProduct = products.find(p => p.id === values.productId);
    if (!selectedProduct) return;

    try {
      await addDoc(collection(db, "reviews"), {
        ...values,
        productName: selectedProduct.name,
        userId: getOrSetUserId(),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: "Review submitted successfully." });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding review: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit review.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-6 w-6 cursor-pointer",
                        field.value >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                      )}
                      onClick={() => field.onChange(star)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea placeholder="Share your thoughts on the product..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Form>
  );
}

const FraudDashboard = ({ metrics, isLoading }: { metrics: FraudMetrics | null, isLoading: boolean }) => {
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
            
            toast({
                variant: "destructive",
                title: "Fraud Alert",
                description: `Fraud score has reached ${metrics.fraudScore}. Please review.`
            })
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
                    Marketplace Trust & Fraud Detection
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Panel */}
                <div className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-lg",
                    riskLevel === 'High' && 'fraud-glow'
                )}>
                    <h3 className="text-lg font-medium mb-4">Fraud Risk Score</h3>
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
                    <Badge variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Medium' ? 'secondary' : 'default'} className="mt-4">{riskLevel} Risk</Badge>
                </div>

                {/* AI Insight Panel */}
                 <Card className={cn(
                    "lg:col-span-2 card-glass",
                     riskLevel === 'High' ? "border-red-500/20 bg-red-950/10" : "bg-card/50"
                )}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Bot /> AI Risk Insight
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isAiLoading && <Skeleton className="h-32 w-full" />}
                        {!isAiLoading && aiReport && (
                            <div className="space-y-4 text-sm">
                                <p className="font-semibold italic text-primary/90">{aiReport.fraudSummary}</p>
                                <div>
                                    <h4 className="font-medium mb-1">Key Concerns:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        {aiReport.keyConcerns.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Recommended Actions:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        {aiReport.recommendedActions.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {!isAiLoading && !aiReport && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                                <p className="font-semibold">All Clear</p>
                                <p className="text-sm text-muted-foreground">AI analysis shows no significant fraud indicators.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Details Panels */}
                <Card className="card-glass">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><ThumbsDown /> Suspicious Reviews</CardTitle></CardHeader>
                    <CardContent>
                        {suspiciousReviews.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {suspiciousReviews.slice(0,5).map(r => (
                                    <li key={r.id} className="p-2 bg-background/50 rounded-md">
                                        <p className="font-medium truncate">{r.productName}</p>
                                        <p className="text-xs text-muted-foreground truncate italic">"{r.comment}"</p>
                                        <div className="flex gap-2 mt-1">
                                            {r.isDuplicateComment && <Badge variant="destructive" className="text-xs">Duplicate</Badge>}
                                            {r.isShortComment && <Badge variant="destructive" className="text-xs">Spam</Badge>}
                                            {r.isRapidReview && <Badge variant="destructive" className="text-xs">Rapid</Badge>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No suspicious reviews found.</p>}
                    </CardContent>
                </Card>
                 <Card className="card-glass">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck /> Suspicious Users</CardTitle></CardHeader>
                    <CardContent>
                        {suspiciousUsers.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {suspiciousUsers.map(u => (
                                    <li key={u.userId} className="flex justify-between items-center p-2 bg-background/50 rounded-md">
                                        <p className="font-mono text-xs truncate">{u.userId}</p>
                                        <p>{u.reviewCount} reviews</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No suspicious user activity.</p>}
                    </CardContent>
                </Card>
                 <Card className="card-glass">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles /> Key Metrics</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="flex items-center gap-1"><Repeat size={14}/>Duplicate Comments</span> <span className="font-bold">{metrics.analysis.duplicateComments}</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><FileText size={14}/>Short Comments</span> <span className="font-bold">{metrics.analysis.shortComments}</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><Clock size={14}/>Rapid Reviews</span> <span className="font-bold">{metrics.analysis.rapidReviews}</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><Star size={14}/>Rating Spike</span> <Badge variant={metrics.analysis.ratingSpike ? 'destructive' : 'default'}>{metrics.analysis.ratingSpike ? 'Detected' : 'None'}</Badge></div>
                        <div className="flex justify-between"><span className="flex items-center gap-1"><AlertTriangle size={14}/>Abnormal Frequency</span> <Badge variant={metrics.analysis.abnormalFrequency ? 'destructive' : 'default'}>{metrics.analysis.abnormalFrequency ? 'Yes' : 'No'}</Badge></div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
};

export default function ReviewsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Ensure a user ID exists for the session
    getOrSetUserId();

    const productsQuery = query(collection(db, "products"));
    const reviewsQuery = query(collection(db, "reviews"));
    
    let productsLoaded = false;
    let reviewsLoaded = false;

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        productsLoaded = true;
        if (reviewsLoaded) setIsLoading(false);
    });
    
    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
        reviewsLoaded = true;
        if (productsLoaded) setIsLoading(false);
    });

    return () => {
      unsubProducts();
      unsubReviews();
    };
  }, []);

  const fraudMetrics: FraudMetrics | null = useMemo(() => {
      if (reviews.length < 5) return null;

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const todayStart = new Date(now.setHours(0,0,0,0));

      // Group reviews by user and comment
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
      
      // 1. Duplicate comments
      const duplicateComments = analyzedReviews.filter(r => r.isDuplicateComment).length;
      if (duplicateComments > 1) fraudScore += 20;

      // 2. Very short comments
      const shortComments = analyzedReviews.filter(r => r.isShortComment).length;
      if (shortComments / reviews.length > 0.3) fraudScore += 20;
      
      // 3. Multiple reviews by same user within 1 hour
      const rapidReviews = analyzedReviews.filter(r => r.isRapidReview).length;
      if (rapidReviews > 0) fraudScore += 20;

      // 4. 80%+ 5-star spike in one day
      const todayReviews = reviews.filter(r => r.createdAt.toDate() > todayStart);
      const fiveStarToday = todayReviews.filter(r => r.rating === 5).length;
      const ratingSpike = todayReviews.length > 5 && (fiveStarToday / todayReviews.length) >= 0.8;
      if (ratingSpike) fraudScore += 20;

      // 5. Unusual review frequency
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
        <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
            <CardHeader>
            <CardTitle>Submit a Review</CardTitle>
            <CardDescription>Share your experience with a product.</CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full"/> : (
                <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full"><PlusCircle className="mr-2"/>Add Your Review</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Review</DialogTitle></DialogHeader>
                        <AddReviewForm products={products} setOpen={setFormOpen} />
                    </DialogContent>
                </Dialog>
            )}
            </CardContent>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>What customers are saying.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>User</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    </TableRow>
                    ))
                ) : reviews.length > 0 ? (
                    reviews.slice(0, 10).map((review) => (
                    <TableRow key={review.id} className="animate-card-enter">
                        <TableCell>{review.productName}</TableCell>
                        <TableCell>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4", review.rating > i ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                                ))}
                            </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                        <TableCell className="font-mono text-xs">{review.userId.substring(0, 8)}...</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No reviews yet. Be the first!
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
      </Card>
      </div>
    </div>
  );
}
