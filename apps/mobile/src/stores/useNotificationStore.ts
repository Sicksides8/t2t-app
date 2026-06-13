import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { create } from 'zustand';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from '../services/firebase';
import type { AppNotification, NotificationType } from '../types';

interface NotificationState {
  items: AppNotification[];
  loading: boolean;
  subscribe: (userId: string | undefined) => () => void;
  setItems: (items: AppNotification[]) => void;
}

const VALID_TYPES: NotificationType[] = ['streak', 'achievement', 'lesson', 'system'];

function coerceType(value: unknown): NotificationType {
  if (typeof value === 'string' && VALID_TYPES.includes(value as NotificationType)) {
    return value as NotificationType;
  }
  return 'system';
}

function mapDoc(id: string, data: any): AppNotification {
  return {
    id,
    userId: data.userId,
    type: coerceType(data.type),
    title: data.title,
    body: data.body,
    data: data.data,
    read: Boolean(data.read),
    createdAt: data.createdAt?.toDate?.() || new Date(),
  };
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  loading: false,

  setItems: (items) => set({ items }),

  subscribe: (userId) => {
    if (!userId) {
      set({ items: [] });
      return () => undefined;
    }

    set({ loading: true });
    const q = query(collection(db, FS_COL.notifications), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => mapDoc(doc.id, doc.data()));
        set({ items: docs, loading: false });
      },
      () => set({ items: [], loading: false }),
    );

    return unsub;
  },
}));
