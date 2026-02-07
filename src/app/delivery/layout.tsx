'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useAdmin';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function AccessDenied() {
    const router = useRouter();
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Alert variant="destructive" className="max-w-md text-center">
                <ShieldX className="h-8 w-8 mx-auto mb-4" />
                <AlertTitle className="text-2xl">Access Denied</AlertTitle>
                <AlertDescription className="mt-2">
                You do not have the required role to access this page.
                </AlertDescription>
                <Button variant="secondary" className="mt-6" onClick={() => router.push('/')}>Go to Homepage</Button>
            </Alert>
        </div>
    )
}

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { roleData, isLoading, user } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/delivery/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user && roleData?.role !== 'delivery') {
    return <AccessDenied />;
  }
  
  if (user && roleData?.role === 'delivery') {
      // We can create a delivery-specific sidebar/header here in the future
      return <main>{children}</main>;
  }

  return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
}
