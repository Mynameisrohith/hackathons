'use client';

import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RetailSparkIcon } from '@/components/icons';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <RetailSparkIcon className="size-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md card-glass animate-card-enter">
        <CardHeader className="text-center">
            <RetailSparkIcon className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl">Welcome to RetailSpark</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => initiateGoogleSignIn(auth)}
          >
            <Chrome className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
