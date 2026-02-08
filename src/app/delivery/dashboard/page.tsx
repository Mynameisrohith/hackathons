'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Loader2, MapPin, PackageCheck, ListOrdered, Navigation, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRealtimeLocationUpdater } from '@/hooks/useRealtimeLocationUpdater';
import { predictDeliveryDelay } from '@/lib/aiDeliveryDelay';

function AvailableJobCard({ job }: { job: Order }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isAccepting, setIsAccepting] = useState(false);

    const handleAccept = async () => {
        if (!user || !firestore) return;
        setIsAccepting(true);
        const orderRef = doc(firestore, 'users', job.userId, 'orders', job.id);
        try {
            await updateDoc(orderRef, {
                orderStatus: 'Out for Delivery',
                deliveryStatus: 'Assigned',
                deliveryBoyId: user.uid,
                deliveryBoyName: user.displayName,
                deliveryBoyPhone: user.phoneNumber || '',
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Job Accepted!', description: 'You can now start the delivery.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not accept job.' });
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <Card className="card-glass">
            <CardHeader>
                <CardTitle className="text-base">Delivery to: {job.city}</CardTitle>
                <p className="text-sm text-muted-foreground">From: {job.dealerName}</p>
            </CardHeader>
            <CardContent>
                <p>{job.items.length} items - Total: ${job.totalAmount.toFixed(2)}</p>
                 <p className="text-sm text-muted-foreground mt-2">Pickup: {job.dealerAddress}</p>
            </CardContent>
            <CardFooter>
                <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
                    {isAccepting ? <Loader2 className="animate-spin" /> : <PackageCheck className="mr-2" />}
                    Accept Job
                </Button>
            </CardFooter>
        </Card>
    );
}

function ActiveJobCard({ job }: { job: Order }) {
    const firestore = useFirestore();
    const [isCompleting, setIsCompleting] = useState(false);
    const delayInfo = useMemo(() => predictDeliveryDelay(job), [job]);
    
    const { stopTracking } = useRealtimeLocationUpdater(job.id, job.userId);

    const handleComplete = async () => {
        setIsCompleting(true);
        const orderRef = doc(firestore, 'users', job.userId, 'orders', job.id);
        try {
            await updateDoc(orderRef, {
                orderStatus: 'Delivered',
                deliveryStatus: 'Delivered',
                updatedAt: serverTimestamp(),
            });
            stopTracking(); 
            toast({ title: 'Delivery Complete!', description: 'Great job!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not complete delivery.' });
        } finally {
            setIsCompleting(false);
        }
    };
    
    useEffect(() => {
        return () => stopTracking();
    }, [stopTracking]);

    const pickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${job.dealerLat},${job.dealerLng}`;
    const dropoffUrl = `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`;

    return (
        <Card className="card-glass border-primary">
            <CardHeader>
                <CardTitle className="text-base">Delivering to: {job.customerName}</CardTitle>
                <p className="text-sm text-muted-foreground">{job.address}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <p className="font-medium">Contact: {job.phone}</p>
                    <p className="mt-1">Total: ${job.totalAmount.toFixed(2)} ({job.paymentMethod})</p>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>ETA: {delayInfo.predictedDelay} min</span>
                    <Badge variant={delayInfo.riskLevel === 'High' ? 'destructive' : 'secondary'}>{delayInfo.riskLevel} Delay Risk</Badge>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 items-stretch">
                <Button asChild variant="outline">
                    <Link href={pickupUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="mr-2" /> Navigate to Pickup
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={dropoffUrl} target="_blank" rel="noopener noreferrer">
                        <Navigation className="mr-2" /> Navigate to Customer
                    </Link>
                </Button>
                <Button onClick={handleComplete} disabled={isCompleting}>
                    {isCompleting ? <Loader2 className="animate-spin" /> : <PackageCheck className="mr-2" />}
                    Mark as Delivered
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function DeliveryDashboardPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Query for jobs available for pickup
    const availableJobsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'orders'), where('orderStatus', '==', 'Packed'));
    }, [firestore]);
    const { data: availableJobs, isLoading: loadingAvailable } = useCollection<Order>(availableJobsQuery);

    // Query for the job currently being delivered by this user
    const activeJobsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collectionGroup(firestore, 'orders'), 
            where('deliveryBoyId', '==', user.uid), 
            where('orderStatus', '==', 'Out for Delivery')
        );
    }, [user, firestore]);
    const { data: activeJobs, isLoading: loadingActive } = useCollection<Order>(activeJobsQuery);
    
    const isLoading = loadingAvailable || loadingActive;
    const activeJob = useMemo(() => (activeJobs && activeJobs.length > 0 ? activeJobs[0] : null), [activeJobs]);

    return (
        <div>
            <PageHeader title="Delivery Dashboard" subtitle="Manage your assigned deliveries." />
            <main className="p-4 sm:p-6 lg:p-8 space-y-12">
                {isLoading ? <Skeleton className="h-80 w-full" /> : 
                    activeJob ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><PackageCheck className="text-primary"/> Your Active Delivery</h2>
                            <div className="max-w-md">
                                <ActiveJobCard job={activeJob} />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ListOrdered/> Available Jobs</h2>
                            {availableJobs && availableJobs.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {availableJobs.map(job => (
                                        <AvailableJobCard key={job.id} job={job} />
                                    ))}
                                </div>
                            ) : (
                                <Card className="text-center p-8 card-glass">
                                    <p className="text-muted-foreground">No available jobs right now. Check back soon!</p>
                                </Card>
                            )}
                        </div>
                    )
                }
            </main>
        </div>
    );
}
