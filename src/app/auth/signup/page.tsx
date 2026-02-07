
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User as UserIcon, Building, Truck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { UserRole, UserRoleType } from '@/lib/types';
import { RetailSparkIcon } from '@/components/icons';

export default function SignupPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleRoleSelection = async (role: UserRoleType) => {
        if (!user || !firestore) return;

        setIsLoading(true);
        const roleRef = doc(firestore, 'roles', user.uid);
        
        let rolePayload: Partial<UserRole>;

        if (role === 'customer') {
            rolePayload = { role: 'customer', status: 'active', assignedAt: serverTimestamp() as any, assignedBy: 'system' };
        } else {
            rolePayload = { role, status: 'pending', assignedAt: serverTimestamp() as any };
        }

        try {
            await setDoc(roleRef, rolePayload, { merge: true });
            
            if (role === 'customer') {
                toast({ title: "Welcome!", description: "Your customer account is ready." });
                router.push('/');
            } else {
                toast({ title: "Application Submitted", description: "Your application is under review." });
                router.push('/auth/pending');
            }

        } catch (error) {
            console.error("Error setting role:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not process your request." });
            setIsLoading(false);
        }
    };
    
    if (isUserLoading || isLoading) {
         return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg card-glass animate-card-enter">
                 <CardHeader className="text-center">
                    <RetailSparkIcon className="h-12 w-12 text-primary mx-auto" />
                    <CardTitle className="mt-4">Join RetailSpark</CardTitle>
                    <CardDescription>Choose how you want to get started.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <RoleCard 
                        icon={UserIcon}
                        title="I'm a Customer"
                        description="Browse and buy unique products."
                        onClick={() => handleRoleSelection('customer')}
                    />
                    <RoleCard 
                        icon={Building}
                        title="I'm a Dealer"
                        description="Sell your products on our platform."
                        onClick={() => handleRoleSelection('dealer')}
                    />
                    <RoleCard 
                        icon={Truck}
                        title="I'm a Delivery Partner"
                        description="Deliver orders and earn."
                        onClick={() => handleRoleSelection('delivery')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

function RoleCard({ icon: Icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="p-6 text-center rounded-lg border bg-background hover:bg-accent/50 hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
            <Icon className="h-10 w-10 mx-auto text-primary mb-4" />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </button>
    )
}
