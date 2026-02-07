'use client';
import { useUser } from '@/firebase';

export function useAdmin() {
  const { user, isUserLoading } = useUser();

  const isHardcodedAdmin = user?.email === 'ddrohith7080@gmail.com';

  return { isAdmin: isHardcodedAdmin, isLoading: isUserLoading };
}
