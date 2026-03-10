
import type { Timestamp } from 'firebase-admin/firestore';

export type UserRoleType = 'admin' | 'dealer' | 'delivery' | 'customer';
export type RoleStatus = 'active' | 'pending' | 'rejected';

export interface UserRole {
  role: UserRoleType;
  status: RoleStatus;
  isSuperAdmin?: boolean;
  storeId?: string;
  assignedAt?: Timestamp;
  assignedBy?: string;
}
