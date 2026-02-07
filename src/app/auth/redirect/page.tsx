
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useAdmin";
import { RetailSparkIcon } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

function AccessDenied() {
    const router = useRouter();
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Alert variant="destructive" className="max-w-md text-center">
                <div className="flex justify-center mb-4">
                     <ShieldX className="h-8 w-8" />
                </div>
                <AlertTitle className="text-2xl">Access Denied</AlertTitle>
                <AlertDescription className="mt-2">
                You do not have the required role to access this page. Please contact an administrator.
                </AlertDescription>
                <Button variant="secondary" className="mt-6" onClick={() => router.push('/')}>Go to Homepage</Button>
            </Alert>
        </div>
    )
}

export default function AuthRedirectPage() {
  const router = useRouter();
  const { role, isLoading, user } = useRole();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until role is loaded
    }

    if (!user) {
        router.replace("/login");
        return;
    }

    switch (role) {
      case "admin":
        router.replace("/admin/dashboard");
        break;
      case "dealer":
        router.replace("/dealer/dashboard");
        break;
      case "delivery":
        router.replace("/delivery/dashboard");
        break;
      default:
        // For users with no role, they are customers. Redirect to homepage.
        router.replace("/");
        break;
    }
  }, [role, isLoading, router, user]);

  if (isLoading || !role) { // Show loading spinner while role is being determined OR if user has no role and is being redirected
    return (
      <div className="flex h-screen items-center justify-center">
        <RetailSparkIcon className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and still a role that's not handled (which shouldn't happen), show access denied.
  return <AccessDenied />;
}
