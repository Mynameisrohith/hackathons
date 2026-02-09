'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { UserProfile, UserRole, RoleStatus, UserRoleType, Store } from '@/lib/types';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useAdmin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type UserWithRole = UserProfile & {
  roleInfo?: UserRole & { id: string };
};

const statusBadgeVariants: { [key in RoleStatus]: string } = {
    active: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-500/30',
    rejected: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-500/30',
};


function AssignStoreDialog({ onAssign, stores, isLoadingStores, children }: { onAssign: (storeId: string) => void, stores: Store[] | null, isLoadingStores: boolean, children: React.ReactNode }) {
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleAssign = () => {
        if(selectedStoreId) {
            onAssign(selectedStoreId);
            setIsOpen(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Dealer to Store</DialogTitle>
                    <DialogDescription>
                        To complete the dealer registration, please assign them to a physical store from the list below.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Select onValueChange={setSelectedStoreId} disabled={isLoadingStores}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a store..." />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingStores ? (
                                <SelectItem value="loading" disabled>Loading stores...</SelectItem>
                            ) : (
                                stores?.map(store => (
                                    <SelectItem key={store.id} value={store.id}>{store.name} - {store.address}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleAssign} disabled={!selectedStoreId}>Assign Store</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Component to manage role assignment for a user
function RoleManager({ user, adminUser, adminRoleData, stores, isLoadingStores }: { user: UserWithRole, adminUser: any, adminRoleData: UserRole | null, stores: Store[] | null, isLoadingStores: boolean }) {
    const firestore = useFirestore();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const rolesToAssign: UserRoleType[] = ['admin', 'dealer', 'delivery', 'customer'];

    const handleRoleUpdate = async (newRole?: UserRoleType, newStatus?: RoleStatus, storeId?: string) => {
        if (!firestore) return;
        setIsUpdating(true);

        const roleRef = doc(firestore, 'roles', user.id);
        
        const currentRole = user.roleInfo;
        const payload: Partial<UserRole> = {
            role: newRole || currentRole?.role || 'customer',
            status: newStatus || currentRole?.status || 'pending',
            assignedAt: serverTimestamp() as any,
            assignedBy: adminUser.uid,
        };

        if (storeId) {
            payload.storeId = storeId;
        }

        try {
            await setDoc(roleRef, payload, { merge: true });
            toast({ title: 'User Updated', description: `${user.displayName} has been updated.` });
        } catch (error) {
            console.error('Failed to update role:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user.' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleDeleteUser = async () => {
        if (!firestore) return;
        setIsDeleting(true);

        try {
            const userRef = doc(firestore, 'users', user.id);
            const roleRef = doc(firestore, 'roles', user.id);
            
            await Promise.all([
                deleteDoc(userRef),
                deleteDoc(roleRef)
            ]);

            toast({ title: "User Data Deleted", description: `${user.displayName}'s profile and role data have been removed.` });
        } catch(e) {
            console.error("Error deleting user data: ", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete user data.' });
        } finally {
            setIsDeleting(false);
        }
    }
    
    const isSuperAdminLoggedIn = adminRoleData?.isSuperAdmin === true;
    const isTargetSuperAdmin = user.roleInfo?.isSuperAdmin === true;

    const canManage = isSuperAdminLoggedIn
      ? user.id !== adminUser.uid
      : !isTargetSuperAdmin && user.id !== adminUser.uid;

    const currentStatus = user.roleInfo?.status;
    const isDealerApplication = user.roleInfo?.role === 'dealer' && currentStatus === 'pending';


    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating || isDeleting || !canManage}>
                        <span className="sr-only">Open menu</span>
                        {isUpdating || isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    
                    {currentStatus === 'pending' && !isDealerApplication && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRoleUpdate(undefined, 'active')}>
                               <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve Application
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleUpdate(undefined, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject Application
                            </DropdownMenuItem>
                        </>
                    )}
                    
                    {isDealerApplication && (
                         <>
                            <DropdownMenuSeparator />
                            <AssignStoreDialog
                                stores={stores}
                                isLoadingStores={isLoadingStores}
                                onAssign={(storeId) => handleRoleUpdate('dealer', 'active', storeId)}
                            >
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                   <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve & Assign Store
                                </DropdownMenuItem>
                            </AssignStoreDialog>
                            <DropdownMenuItem onClick={() => handleRoleUpdate(undefined, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject Application
                            </DropdownMenuItem>
                        </>
                    )}

                     {currentStatus === 'active' && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                {rolesToAssign.map(role => (
                                    <DropdownMenuItem
                                        key={role}
                                        disabled={user.roleInfo?.role === role}
                                        onClick={() => handleRoleUpdate(role, 'active')}
                                    >
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </>
                    )}
                     {currentStatus === 'rejected' && (
                        <>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => handleRoleUpdate(undefined, 'pending')}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Re-open Application
                        </DropdownMenuItem>
                        </>
                     )}
                     {(currentStatus === 'active' || currentStatus === 'pending') && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => handleRoleUpdate('customer', 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4" /> Revoke Access
                            </DropdownMenuItem>
                        </>
                     )}
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User Data
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user '{user.displayName}' and their associated role data from Firestore. It will not delete their authentication record.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="animate-spin mr-2" />}
                        Yes, delete data
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function mapUsersToRoles(users: UserProfile[] | null, roles: (UserRole & {id: string})[] | null): UserWithRole[] {
  if (!users) return [];
  
  const roleMap = new Map<string, UserRole & {id: string}>();
  if (roles) {
      for (const role of roles) {
          roleMap.set(role.id, role);
      }
  }

  return users.map(user => ({
      ...user,
      roleInfo: roleMap.get(user.id),
  })).sort((a,b) => (a.displayName || '').localeCompare(b.displayName || ''));
}

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { user: adminUser, roleData: adminRoleData } = useRole();

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const rolesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'roles')) : null, [firestore]);
  const storesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'stores')) : null, [firestore]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: roles, isLoading: loadingRoles } = useCollection<(UserRole & { id: string })>(rolesQuery);
  const { data: stores, isLoading: loadingStores } = useCollection<Store>(storesQuery);


  const isLoading = loadingUsers || loadingRoles || loadingStores;
  const usersWithRoles = useMemo(() => mapUsersToRoles(users, roles), [users, roles]);

  if (!adminUser || !adminRoleData) return null;

  return (
    <div className="animate-card-enter">
      <PageHeader title="User Management" subtitle="Assign roles and manage user access." />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card className="card-glass">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithRoles.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No users found.</TableCell>
                    </TableRow>
                  )}
                  {usersWithRoles.map(user => {
                    const roleName = user.roleInfo?.role || 'N/A';
                    const statusName = user.roleInfo?.status || 'N/A';

                    return (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-3 font-medium">
                            <Avatar>
                              <AvatarImage src={user.photoURL} alt={user.displayName} />
                              <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            {user.displayName}
                            {user.roleInfo?.isSuperAdmin && (
                               <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg border-yellow-300">Super Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                           <TableCell>
                            <Badge variant={roleName === 'admin' ? 'default' : 'secondary'}>
                                {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                             <Badge className={cn(statusBadgeVariants[statusName as keyof typeof statusBadgeVariants] || 'bg-gray-500/20 text-gray-700')}>
                                {statusName.charAt(0).toUpperCase() + statusName.slice(1)}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                              <RoleManager user={user} adminUser={adminUser} adminRoleData={adminRoleData} stores={stores} isLoadingStores={loadingStores} />
                          </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
