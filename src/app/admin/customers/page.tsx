'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { collection, query, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/lib/types';
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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { UserRoleType } from '@/lib/types';

type UserWithRole = UserProfile & {
  role: UserRoleType | 'pending';
};

// Component to manage role assignment for a user
function RoleManager({ user, currentRole, adminId }: { user: UserWithRole, currentRole: UserRoleType | 'pending', adminId: string }) {
    const firestore = useFirestore();
    const [isUpdating, setIsUpdating] = useState(false);
    const rolesToAssign: UserRoleType[] = ['admin', 'dealer', 'delivery', 'customer'];

    const handleRoleChange = async (newRole: UserRoleType) => {
        if (!firestore) return;
        setIsUpdating(true);

        const roleRef = doc(firestore, 'roles', user.id);
        const rolePayload: UserRole = { 
            role: newRole,
            assignedAt: serverTimestamp() as any,
            assignedBy: adminId
        };

        try {
            await setDoc(roleRef, rolePayload, { merge: true });
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
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating || user.id === adminId}>
                    <span className="sr-only">Open menu</span>
                    {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Assign Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {rolesToAssign.map(role => (
                    <DropdownMenuItem
                        key={role}
                        disabled={currentRole === role}
                        onClick={() => handleRoleChange(role)}
                    >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function mapUsersToRoles(users: UserProfile[] | null, roles: (UserRole & {id: string})[] | null): UserWithRole[] {
  if (!users) return [];
  
  const roleMap = new Map<string, UserRoleType>();
  if (roles) {
      for (const role of roles) {
          roleMap.set(role.id, role.role);
      }
  }

  return users.map(user => {
    const role = roleMap.get(user.id) || 'pending';
    return { ...user, role };
  }).sort((a,b) => a.displayName.localeCompare(b.displayName));
}

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const rolesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'roles')) : null, [firestore]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: roles, isLoading: loadingRoles } = useCollection<(UserRole & { id: string })>(rolesQuery);

  const isLoading = loadingUsers || loadingRoles;
  const usersWithRoles = useMemo(() => mapUsersToRoles(users, roles), [users, roles]);

  if (!adminUser) return null; // Should be handled by layout, but as a safeguard.

  return (
    <div className="animate-card-enter">
      <PageHeader title="User Management" subtitle="Assign roles and manage user access." />
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
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithRoles.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No users found.</TableCell>
                    </TableRow>
                  )}
                  {usersWithRoles.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-3 font-medium">
                        <Avatar>
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        {user.displayName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                       <TableCell>
                        <Badge variant={user.role === 'pending' ? 'destructive' : user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <RoleManager user={user} currentRole={user.role} adminId={adminUser.uid} />
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
