'use client';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useAdmin() {
  const { user, isUserLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const adminRoleRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [user, firestore]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);

  const isHardcodedAdmin = user?.email === 'ddrohith7080@gmail.com';

  return { isAdmin: !!adminRole || isHardcodedAdmin, isLoading: isUserLoading || isAdminRoleLoading };
}
