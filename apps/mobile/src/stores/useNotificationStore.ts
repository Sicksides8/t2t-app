import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { create } from 'zustand';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from '../services/firebase';
import type { AppNotification } from '../types';

interface NotificationState {
  items: AppNotification[];
  loading: boolean;
  subscribe: (userId: string | undefined) => () => void;
}

function mapDoc(id: string, data: any): AppNotification {
  return {
    id,
    userId: data.userId,
    type: data.type,
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
        set({
          items: snapshot.docs.map((doc) => mapDoc(doc.id, doc.data())),
          loading: false,
        });
      },
      () => set({ loading: false }),
    );

    return unsub;
  },
}));
