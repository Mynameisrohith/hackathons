
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [user, firestore]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminDocRef);
  
  // Hardcoded email for super-admin fallback
  const isHardcodedAdmin = user?.email === 'drohith7080@gmail.com';

  const isAdmin = !!adminRole || isHardcodedAdmin;
  const isLoading = isUserLoading || (user ? isAdminRoleLoading : false);

  return { isAdmin, isLoading };
}
