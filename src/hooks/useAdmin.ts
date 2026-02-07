'use client';
import { useUser } from '@/firebase';

export function useAdmin() {
  const { user, isUserLoading } = useUser();

  // This is a temporary, client-side check.
  // For production, you should use a more secure method like custom claims.
  const isHardcodedAdmin = user?.email === 'ddrohith7080@gmail.com';

  return { isAdmin: isHardcodedAdmin, isLoading: isUserLoading };
}
