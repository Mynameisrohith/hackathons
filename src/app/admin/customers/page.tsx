
'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, collectionGroup, doc, setDoc } from 'firebase/firestore';
import type { Order, UserProfile, UserRole, UserRoleType } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type CustomerStat = UserProfile & {
  orderCount: number;
  totalSpent: number;
  avgOrderValue: number;
  cancellationRate: number;
  role: UserRoleType | null;
};

// Component to manage role assignment for a user
function RoleManager({ user, currentRole }: { user: CustomerStat, currentRole: UserRoleType | null }) {
    const firestore = useFirestore();
    const [isUpdating, setIsUpdating] = useState(false);
    const rolesToAssign: UserRoleType[] = ['admin', 'dealer', 'delivery', 'customer'];

    const handleRoleChange = async (newRole: UserRoleType) => {
        if (!firestore) return;
        setIsUpdating(true);

        const roleRef = doc(firestore, 'roles', user.id);

        try {
            await setDoc(roleRef, { role: newRole });
            toast({ title: 'Role Updated', description: `${user.displayName}'s role set to ${newRole}.` });
        } catch (error) {
            console.error('Failed to update role:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update role.' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                {rolesToAssign.map(role => (
                    <DropdownMenuItem
                        key={role}
                        disabled={currentRole === role || (currentRole === null && role === 'customer')}
                        onClick={() => handleRoleChange(role)}
                    >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Calculates customer statistics, now including their role
function calculateCustomerStats(users: UserProfile[] | null, orders: Order[] | null, roles: (UserRole & {id: string})[] | null): CustomerStat[] {
  if (!users || !orders) return [];

  const orderMap = new Map<string, Order[]>();
  for (const order of orders) {
    if (!orderMap.has(order.userId)) orderMap.set(order.userId, []);
    orderMap.get(order.userId)!.push(order);
  }
  
  const roleMap = new Map<string, UserRoleType>();
  if (roles) {
      for (const role of roles) {
          roleMap.set(role.id, role.role);
      }
  }

  return users.map(user => {
    const userOrders = orderMap.get(user.id) || [];
    const totalSpent = userOrders.reduce((sum, o) => o.orderStatus !== 'Cancelled' ? sum + o.totalAmount : sum, 0);
    const orderCount = userOrders.length;
    const avgOrderValue = orderCount > 0 ? totalSpent / userOrders.filter(o => o.orderStatus !== 'Cancelled').length : 0;
    const cancellationRate = orderCount > 0 ? userOrders.filter(o => o.orderStatus === 'Cancelled').length / orderCount : 0;
    const role = roleMap.get(user.id) || null;

    return { ...user, orderCount, totalSpent, avgOrderValue, cancellationRate, role };
  }).sort((a,b) => b.totalSpent - a.totalSpent);
}

export default function CustomersPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
  const rolesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'roles')) : null, [firestore]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);
  const { data: roles, isLoading: loadingRoles } = useCollection<UserRole & { id: string }>(rolesQuery);

  const isLoading = loadingUsers || loadingOrders || loadingRoles;
  const customerStats = useMemo(() => calculateCustomerStats(users, orders, roles), [users, orders, roles]);

  return (
    <div className="animate-card-enter">
      <PageHeader title="Customer Management" subtitle="View and manage customer data and roles." />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card className="card-glass">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Cancellation Rate</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerStats.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No customer data available.</TableCell>
                    </TableRow>
                  )}
                  {customerStats.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={customer.photoURL} alt={customer.displayName} />
                          <AvatarFallback>{customer.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{customer.displayName}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{customer.orderCount}</TableCell>
                      <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>
                          <Badge variant={customer.cancellationRate > 0.3 ? 'destructive' : 'secondary'}>
                            {(customer.cancellationRate * 100).toFixed(0)}%
                          </Badge>
                      </TableCell>
                       <TableCell>
                        <Badge variant={!customer.role || customer.role === 'customer' ? 'secondary' : customer.role === 'admin' ? 'default' : 'outline'}>
                            {customer.role ? customer.role.charAt(0).toUpperCase() + customer.role.slice(1) : 'Customer'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <RoleManager user={customer} currentRole={customer.role} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
