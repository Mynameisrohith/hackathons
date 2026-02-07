
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserRole } from "@/lib/types";

// This is the designated administrator email for initial setup.
const ADMIN_EMAIL = "drohith7080@gmail.com";

export function useRole() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // We only need to fetch a role document if the user is not the hardcoded admin.
  const shouldFetchRole = user && user.email !== ADMIN_EMAIL;

  const roleDocRef = useMemoFirebase(() => {
    if (!user || !firestore || !shouldFetchRole) return null;
    return doc(firestore, "roles", user.uid);
  }, [user, firestore, shouldFetchRole]);

  const { data: roleData, isLoading: isRoleLoading } = useDoc<UserRole>(roleDocRef);

  // The hook is loading if the user is loading, or if we are actively fetching a role for a non-admin user.
  const isLoading = isUserLoading || (shouldFetchRole && isRoleLoading);

  // Determine the effective role. Grant 'admin' if the email matches.
  const effectiveRole = user?.email === ADMIN_EMAIL ? 'admin' : (roleData?.role || null);
  
  const effectiveStoreId = user?.email === ADMIN_EMAIL ? null : (roleData?.storeId || null);

  return {
    user,
    role: effectiveRole,
    storeId: effectiveStoreId,
    isLoading,
  };
}
