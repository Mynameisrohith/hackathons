
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Product,
  Review,
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
import { cn } from "@/lib/utils";
import {
  Star,
  PlusCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";


const reviewSchema = z.object({
  productId: z.string().min(1, "Please select a product."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters long."),
});

function AddReviewForm({ products, setOpen, firestore, userId }: { products: Product[], setOpen: (open: boolean) => void; firestore: Firestore, userId: string }) {
  const { t } = useLanguage();
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
      await addDoc(collection(firestore, "reviews"), {
        ...values,
        productName: selectedProduct.name,
        userId: userId,
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
              <FormLabel>{t('product')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
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
              <FormLabel>{t('rating')}</FormLabel>
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
              <FormLabel>{t('comment')}</FormLabel>
              <FormControl>
                <Textarea placeholder="Share your thoughts on the product..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submitReview')}
        </Button>
      </form>
    </Form>
  );
}

export default function ReviewsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (!firestore || !isAdmin) {
        setIsLoading(false);
        return;
    };

    const productsQuery = query(collection(firestore, "products"));
    const reviewsQuery = query(collection(firestore, "reviews"));
    
    let productsLoaded = false;
    let reviewsLoaded = false;

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        productsLoaded = true;
        if (reviewsLoaded) setIsLoading(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        productsLoaded = true;
        if (reviewsLoaded) setIsLoading(false);
    });
    
    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
        reviewsLoaded = true;
        if (productsLoaded) setIsLoading(false);
    }, (error) => {
        console.error("Error fetching reviews:", error);
        reviewsLoaded = true;
        if (productsLoaded) setIsLoading(false);
    });

    return () => {
      unsubProducts();
      unsubReviews();
    };
  }, [firestore, isAdmin]);


  return (
    <div className="grid gap-6 md:grid-cols-3">
    <Card className="md:col-span-1 card-glass">
        <CardHeader>
        <CardTitle>{t('submitReview')}</CardTitle>
        <CardDescription>{t('submitReviewDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
        {isLoading || !user || !firestore ? <Skeleton className="h-64 w-full"/> : (
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full"><PlusCircle className="mr-2"/>{t('addYourReview')}</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t('newReview')}</DialogTitle></DialogHeader>
                    <AddReviewForm products={products} setOpen={setFormOpen} firestore={firestore} userId={user.uid} />
                </DialogContent>
            </Dialog>
        )}
        </CardContent>
    </Card>
    <Card className="md:col-span-2 card-glass">
        <CardHeader>
        <CardTitle>{t('recentReviews')}</CardTitle>
        <CardDescription>{t('whatCustomersSay')}</CardDescription>
        </CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>{t('productName')}</TableHead>
                <TableHead>{t('rating')}</TableHead>
                <TableHead>{t('comment')}</TableHead>
                <TableHead>{t('user')}</TableHead>
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
                    {t('noReviewsYet')}
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </CardContent>
  </Card>
  </div>
  );
}
