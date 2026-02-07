
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collectionGroup, query, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Order, UserProfile } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Package, Check, Loader2, Info } from 'lucide-react';
import { sendEmail } from '@/lib/email-client';

const statusColors: { [key in Order['orderStatus']]: string } = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Packed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Out for Delivery': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

function OrderRow({ order, users }: { order: Order, users: UserProfile[] }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [isUpdating, setIsUpdating] = useState(false);
    const [boyName, setBoyName] = useState(order.deliveryBoyName || '');
    const [boyPhone, setBoyPhone] = useState(order.deliveryBoyPhone || '');
    
    const user = useMemo(() => users.find(u => u.id === order.userId), [users, order.userId]);

    const handleStatusChange = async (newStatus: Order['orderStatus']) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Associated user not found.' });
            return;
        }
        setIsUpdating(true);
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        try {
            const updatedOrderData: Partial<Order> = { orderStatus: newStatus, updatedAt: serverTimestamp() as any };
             if (newStatus === 'Out for Delivery') {
                updatedOrderData.deliveryStatus = 'Assigned';
            }
            await updateDoc(orderRef, updatedOrderData);
            
            const emailOrder = { ...order, ...updatedOrderData, updatedAt: new Date() as any };

            if(newStatus === 'Delivered') {
                await sendEmail({ emailType: 'feedback-request', order: emailOrder, user });
            } else {
                await sendEmail({ emailType: 'status-update', order: emailOrder, user });
            }

            toast({ title: 'Success', description: 'Order status updated.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAssignDeliveryBoy = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Associated user not found.' });
            return;
        }
        setIsUpdating(true);
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);
         try {
            const updatedOrderData: Partial<Order> = { deliveryBoyName: boyName, deliveryBoyPhone: boyPhone, updatedAt: serverTimestamp() as any };
            await updateDoc(orderRef, updatedOrderData);
            
            const emailOrder = { ...order, ...updatedOrderData, updatedAt: new Date() as any };

            if (order.orderStatus === 'Out for Delivery') {
                 await sendEmail({ emailType: 'status-update', order: emailOrder, user });
            }
            toast({ title: 'Success', description: 'Delivery boy assigned.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign delivery boy.' });
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <TableRow className={cn(isUpdating && 'opacity-50')}>
            <TableCell>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Info className="h-4 w-4"/></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Order Details ({order.id.substring(0,8)}...)</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {order.items.map(item => (
                                <div key={item.productId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Image src={item.imageUrl} alt={item.productName} width={40} height={40} className="rounded-md"/>
                                        <div>
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </TableCell>
            <TableCell>{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
            <TableCell>
                <Badge className={statusColors[order.orderStatus]}>{order.orderStatus}</Badge>
            </TableCell>
            <TableCell>
                <Select onValueChange={handleStatusChange} disabled={isUpdating}>
                    <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {(['Pending', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'] as Order['orderStatus'][]).map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
             <TableCell>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isUpdating}>
                            {order.deliveryBoyName || 'Assign'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Assign Delivery Boy</h4>
                                <p className="text-sm text-muted-foreground">Set the name and phone for the delivery person.</p>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="boyName">Name</Label>
                                <Input id="boyName" value={boyName} onChange={e => setBoyName(e.target.value)} />
                             </div>
                             <div className="grid gap-2">
                                <Label htmlFor="boyPhone">Phone</Label>
                                <Input id="boyPhone" value={boyPhone} onChange={e => setBoyPhone(e.target.value)} />
                             </div>
                             <Button onClick={handleAssignDeliveryBoy} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="animate-spin" /> : <Check />}
                                Save
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </TableCell>
        </TableRow>
    )
}


export default function AdminOrdersPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();

    const [statusFilter, setStatusFilter] = useState<Order['orderStatus'] | 'All'>('All');

    const ordersQuery = useMemo(() => {
        if (!firestore) return null;
        let q = query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
        if (statusFilter !== 'All') {
            q = query(q, where('orderStatus', '==', statusFilter));
        }
        return q;
    }, [firestore, statusFilter]);

    const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

    const isLoading = isLoadingOrders || isLoadingUsers;

    return (
        <Card className="card-glass">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Package /> {t('orders')}</CardTitle>
                    <CardDescription>{t('manageOrdersDesc')}</CardDescription>
                </div>
                <Select onValueChange={(value) => setStatusFilter(value as any)} defaultValue="All">
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        {(['Pending', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'] as Order['orderStatus'][]).map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Details</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead>Delivery Boy</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...Array(7)].map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : orders && orders.length > 0 ? (
                            orders.map(order => <OrderRow key={order.id} order={order} users={users || []} />)
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                                        <p>{t('noOrdersFound')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
