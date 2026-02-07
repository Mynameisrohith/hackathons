
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Order, UserProfile } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Package, CheckCircle, Truck, Star, XCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { sendEmail } from '@/lib/email-client';
import Link from 'next/link';

const statusTimeline: { [key in Order['orderStatus']]: { step: number; icon: React.ElementType } } = {
    Pending: { step: 1, icon: Package },
    Packed: { step: 2, icon: CheckCircle },
    'Out for Delivery': { step: 3, icon: Truck },
    Delivered: { step: 4, icon: Star },
    Cancelled: { step: 0, icon: XCircle },
};

function OrderTimeline({ status }: { status: Order['orderStatus'] }) {
    const { t } = useLanguage();
    const { step: currentStep, icon: CurrentIcon } = statusTimeline[status];

    if (status === 'Cancelled') {
        return (
             <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <XCircle className="h-6 w-6" />
                <span className="font-semibold">{t('orderCancelled')}</span>
            </div>
        )
    }

    return (
        <div className="relative w-full">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
            <div className="relative flex justify-between">
                {Object.entries(statusTimeline)
                    .filter(([s]) => s !== 'Cancelled')
                    .map(([s, { step, icon: Icon }]) => (
                        <div key={s} className="relative flex flex-col items-center">
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-300",
                                step <= currentStep ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted'
                            )}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs text-muted-foreground mt-2 absolute top-full text-center w-20">{t(s.toLowerCase().replace(/ /g, '') as any)}</span>
                        </div>
                ))}
            </div>
        </div>
    );
}

function FeedbackForm({ order, userProfile }: { order: Order, userProfile: UserProfile }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [rating, setRating] = useState(order.rating || 0);
    const [comment, setComment] = useState(order.feedback || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        try {
            await updateDoc(orderRef, {
                rating,
                feedback: comment,
                updatedAt: serverTimestamp(),
            });
            toast({ title: t('feedbackSubmitted') });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: t('feedbackError') });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="mt-4 bg-muted/50">
            <CardHeader><CardTitle>{t('shareYourFeedback')}</CardTitle></CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                     <div>
                        <p className="text-sm font-medium mb-2">{t('yourRating')}</p>
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "h-7 w-7 cursor-pointer transition-colors",
                                        rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50 hover:text-muted-foreground"
                                    )}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <Textarea 
                            placeholder={t('feedbackPlaceholder')}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting || !rating}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                        {t('submitFeedback')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

function OrderCard({ order, userProfile }: { order: Order, userProfile: UserProfile }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [isCancelling, setIsCancelling] = useState(false);
    
    const handleCancel = async () => {
        setIsCancelling(true);
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        try {
            const updatedOrderData: Partial<Order> = { orderStatus: 'Cancelled', cancellationReason: 'Cancelled by user', updatedAt: serverTimestamp() as any };
            await updateDoc(orderRef, updatedOrderData);
            
            await sendEmail({ emailType: 'cancellation-notification', order: { ...order, ...updatedOrderData }, user: userProfile });

            toast({ title: t('orderCancelled') });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: t('cancelError') });
        } finally {
            setIsCancelling(false);
        }
    };
    
    const canCancel = order.orderStatus === 'Pending' || order.orderStatus === 'Packed';

    return (
        <Card className="card-glass animate-card-enter">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle>{t('orderId')}: <span className="font-mono text-base">{order.id}</span></CardTitle>
                    <p className="text-sm text-muted-foreground">{t('placedOn').replace('{date}', new Date(order.createdAt.seconds * 1000).toLocaleDateString())}</p>
                </div>
                <Badge className={cn("text-base", statusTimeline[order.orderStatus].step ? 'bg-primary' : 'bg-destructive')}>
                    {t(order.orderStatus.toLowerCase().replace(/ /g, '') as any)}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="mb-8 pt-6">
                    <OrderTimeline status={order.orderStatus} />
                </div>
                <div className="space-y-4">
                    {order.items.map(item => (
                        <div key={item.productId} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Image src={item.imageUrl} alt={item.productName} width={48} height={48} className="rounded-md"/>
                                <div>
                                    <p className="font-medium">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground">{t('quantity')}: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <div className="border-t mt-4 pt-4 flex justify-end text-lg font-bold">
                    {t('grandTotal')}: ${order.totalAmount.toFixed(2)}
                </div>
                {order.orderStatus === 'Delivered' && <FeedbackForm order={order} userProfile={userProfile}/>}
            </CardContent>
            {canCancel && (
                 <CardFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isCancelling}>
                                {isCancelling ? <Loader2 className="animate-spin" /> : <XCircle />}
                                {t('cancelOrder')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('confirmCancel')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('confirmCancelDesc')}</AlertDialogDescription>
                            </AlertDialogHeader>
                             <AlertDialogFooter>
                                <AlertDialogCancel>{t('goBack')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancel}>{t('yesCancel')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            )}
        </Card>
    )
}

export default function MyOrdersPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login?redirect=/my-orders');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        if (searchParams.get('success')) {
            toast({
                title: t('orderSuccessTitle'),
                description: t('orderSuccessDesc'),
            });
            // Clean up URL
            router.replace('/my-orders', { scroll: false });
        }
    }, [searchParams, router, t]);

    const ordersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'orders'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    if (isUserLoading || !user) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }
    
    // We need user profile for sending emails. We'll assume it's loaded if user is loaded.
    const userProfile: UserProfile = {
        id: user.uid,
        email: user.email!,
        displayName: user.displayName!,
        photoURL: user.photoURL || undefined
    };

    return (
        <>
            <PageHeader title={t('myOrders')} subtitle={t('myOrdersDesc')} />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {isLoading ? (
                        [...Array(2)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
                    ) : orders && orders.length > 0 ? (
                        orders.map(order => <OrderCard key={order.id} order={order} userProfile={userProfile} />)
                    ) : (
                        <Card className="text-center p-12">
                             <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold">{t('noOrdersFound')}</h2>
                            <p className="mt-2 text-muted-foreground">{t('noOrdersDesc')}</p>
                            <Button asChild className="mt-6">
                                <Link href="/products">{t('startShopping')}</Link>
                            </Button>
                        </Card>
                    )}
                </div>
            </main>
        </>
    )
}
