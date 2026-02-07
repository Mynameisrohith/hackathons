
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { XCircle } from "lucide-react";
import Link from 'next/link';

export default function RejectedPage() {
    const auth = useAuth();
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center card-glass animate-card-enter">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Application Not Approved</CardTitle>
                    <CardDescription>
                        Unfortunately, your application for the requested role was not approved at this time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        If you believe this is a mistake, please contact support. You can continue to use the platform as a customer.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <Button variant="outline" className="w-full" onClick={() => auth?.signOut()}>
                            Logout
                        </Button>
                         <Button asChild className="w-full">
                            <Link href="/">Continue as Customer</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
