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
      return; // Wait until role is loaded
    }

    if (!user) {
        router.replace("/login");
        return;
    }

    if (!roleData) {
        // No role assigned, user is pending approval
        router.replace("/auth/pending");
        return;
    }

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
        // For users with 'customer' role or any other default.
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
