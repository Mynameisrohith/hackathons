
import type { Firestore } from 'firebase-admin/firestore';
import type { UserRole } from './types';


// This version of getUserRole reads from Firestore instead of DynamoDB
export const getUserRoleFromFirestore = async (db: Firestore, userId: string): Promise<UserRole | null> => {
    const roleDoc = await db.collection('roles').doc(userId).get();
    if (!roleDoc.exists) {
        return null;
    }
    return roleDoc.data() as UserRole;
};
