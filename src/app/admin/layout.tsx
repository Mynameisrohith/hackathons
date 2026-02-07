'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useAdmin';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function AdminAccessDenied() {
    const router = useRouter();
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Alert variant="destructive" className="max-w-md text-center">
                <div className="flex justify-center mb-4">
                     <ShieldX className="h-8 w-8" />
                </div>
                <AlertTitle className="text-2xl">Access Denied</AlertTitle>
                <AlertDescription className="mt-2">
                You do not have permission to view this page. Please contact an administrator.
                </AlertDescription>
                <Button variant="secondary" className="mt-6" onClick={() => router.push('/')}>Go to Homepage</Button>
            </Alert>
        </div>
    )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoading, user } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/admin/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== 'admin') {
    return <AdminAccessDenied />;
  }

  return (
    <div className="flex min-h-screen bg-secondary/50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
