
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  addDoc,
  query,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
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
import { Star, PlusCircle } from "lucide-react";
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
  const [isFormOpen, setFormOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  const productsQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, "products")) : null, [firestore, isAdmin]);
  const reviewsQuery = useMemoFirebase(() => (firestore && isAdmin) ? query(collection(firestore, "reviews")) : null, [firestore, isAdmin]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: reviews, isLoading: isLoadingReviews } = useCollection<Review>(reviewsQuery);

  const isLoading = isAdminLoading || isLoadingProducts || isLoadingReviews;
  
  if (isLoading || !isAdmin) {
    return (
        <div className="grid gap-6 md:grid-cols-3">
             <Card className="md:col-span-1 card-glass">
                <CardHeader>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full"/>
                </CardContent>
             </Card>
             <Card className="md:col-span-2 card-glass">
                <CardHeader>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-56 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-80 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
    <Card className="md:col-span-1 card-glass">
        <CardHeader>
        <CardTitle>{t('submitReview')}</CardTitle>
        <CardDescription>{t('submitReviewDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
        { !user || !firestore ? <Skeleton className="h-10 w-full"/> : (
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full"><PlusCircle className="mr-2"/>{t('addYourReview')}</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t('newReview')}</DialogTitle></DialogHeader>
                    {products && <AddReviewForm products={products} setOpen={setFormOpen} firestore={firestore} userId={user.uid} />}
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
            {reviews && reviews.length > 0 ? (
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
