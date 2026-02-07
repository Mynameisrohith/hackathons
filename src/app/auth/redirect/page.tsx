
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useAdmin";
import { RetailSparkIcon } from "@/components/icons";

export default function AuthRedirectPage() {
  const router = useRouter();
  const { roleData, isLoading, user } = useRole();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until role and user status are loaded
    }

    if (!user) {
        router.replace("/login");
        return;
    }

    if (!roleData) {
        // This is a new user who doesn't have a role document yet.
        // Redirect them to the signup/role selection page.
        router.replace("/auth/signup");
        return;
    }

    // Handle different application statuses for non-active users
    if (roleData.status !== 'active') {
        switch (roleData.status) {
            case 'pending':
                router.replace('/auth/pending');
                return;
            case 'rejected':
                router.replace('/auth/rejected');
                return;
            default:
                // Fallback for any other unknown status
                router.replace('/auth/pending');
                return;
        }
    }
    
    // If the role status is 'active', redirect to the appropriate dashboard
    switch (roleData.role) {
      case "admin":
        router.replace("/admin/dashboard");
        break;
      case "dealer":
        router.replace("/dealer/dashboard");
        break;
      case "delivery":
        router.replace("/delivery/dashboard");
        break;
      case "customer":
      default:
        // Default to customer view (homepage)
        router.replace("/");
        break;
    }
  }, [roleData, isLoading, router, user]);

  return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-4">
            <RetailSparkIcon className="size-10 animate-spin text-primary" />
            <p className="text-lg">Redirecting...</p>
        </div>
      </div>
    );
}
