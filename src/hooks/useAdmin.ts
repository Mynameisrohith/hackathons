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

  // isRoleLoading will be true while the document is fetched for the first time.
  // After that, data will be null if the document does not exist.
  const { data: roleData, isLoading: isRoleLoading } = useDoc<UserRole>(roleDocRef);

  // The overall loading state is true if we are waiting for the user object OR waiting for the role document.
  const isLoading = isUserLoading || isRoleLoading;

  return {
    user,
    roleData, // This will be the role document object or null
    isLoading,
  };
}
