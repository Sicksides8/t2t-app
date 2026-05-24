import type { Timestamp } from 'firebase-admin/firestore';

const P = 't2t_';

export const FS_COL = {
  waitlist: `${P}waitlist`,
} as const;

export type WaitlistStatus = 'pending' | 'invited';

export type WaitlistDoc = {
  email: string;
  status: WaitlistStatus;
  createdAt: Timestamp;
  invitedAt?: Timestamp;
  source?: string;
};
