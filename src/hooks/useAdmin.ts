"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserRole } from "@/lib/types";

export function useRole() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const roleDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "roles", user.uid);
  }, [user, firestore]);

  const { data: role, isLoading: isRoleLoading } = useDoc<UserRole>(roleDocRef);

  const isLoading = isUserLoading || (user ? isRoleLoading : false);

  return {
    user,
    role: role?.role || null,
    storeId: role?.storeId || null,
    isLoading,
  };
}
