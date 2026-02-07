
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
    const auth = useAuth();
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center card-glass animate-card-enter">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4">Application Pending</CardTitle>
                    <CardDescription>
                        Your application is under review. An administrator will process your request shortly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        You will be notified once your application has been approved. You can close this window.
                    </p>
                    <Button variant="outline" className="mt-6 w-full" onClick={() => auth?.signOut()}>
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
