import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationItem } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errors';

export function listenToNotifications(userId: string, callback: (notifications: NotificationItem[]) => void) {
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('recipientId', '==', userId));

  return onSnapshot(q, (snap) => {
    const list: NotificationItem[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as NotificationItem);
    });
    // Sort newest first
    list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'notifications');
  });
}

export async function createNotification(item: {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: NotificationItem['type'];
  title: string;
  message: string;
  linkType: NotificationItem['linkType'];
  linkId?: string;
}): Promise<void> {
  // Don't notify self
  if (item.recipientId === item.senderId) return;

  const notifRef = doc(collection(db, 'notifications'));
  try {
    await setDoc(notifRef, {
      ...item,
      id: notifRef.id,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `notifications/${notifRef.id}`);
  }
}

export async function markNotificationRead(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      isRead: true
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${notifId}`);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('recipientId', '==', userId), where('isRead', '==', false));
  try {
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'notifications');
  }
}
