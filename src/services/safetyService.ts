import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { BlockRecord, ReportRecord } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errors';

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const blockId = `${blockerId}_${blockedId}`;
  try {
    await setDoc(doc(db, 'blocks', blockId), {
      blockerId,
      blockedId,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `blocks/${blockId}`);
  }
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const blockId = `${blockerId}_${blockedId}`;
  try {
    await deleteDoc(doc(db, 'blocks', blockId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `blocks/${blockId}`);
  }
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  try {
    const blocksRef = collection(db, 'blocks');
    // Who I blocked
    const q1 = query(blocksRef, where('blockerId', '==', userId));
    // Who blocked me
    const q2 = query(blocksRef, where('blockedId', '==', userId));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const blockedSet = new Set<string>();

    snap1.forEach((d) => {
      const data = d.data() as BlockRecord;
      blockedSet.add(data.blockedId);
    });
    snap2.forEach((d) => {
      const data = d.data() as BlockRecord;
      blockedSet.add(data.blockerId);
    });

    return Array.from(blockedSet);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'blocks');
  }
}

export async function getMyBlockedList(userId: string): Promise<string[]> {
  try {
    const blocksRef = collection(db, 'blocks');
    const q = query(blocksRef, where('blockerId', '==', userId));
    const snap = await getDocs(q);
    const blocked: string[] = [];
    snap.forEach((d) => {
      const data = d.data() as BlockRecord;
      blocked.push(data.blockedId);
    });
    return blocked;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'blocks');
  }
}

export async function submitReport(report: {
  reporterId: string;
  reporterName?: string;
  targetType: 'user' | 'post' | 'comment' | 'message';
  targetId: string;
  targetUserId?: string;
  targetContent?: string;
  reason: string;
  details?: string;
}): Promise<void> {
  const reportRef = doc(collection(db, 'reports'));
  try {
    await setDoc(reportRef, {
      ...report,
      id: reportRef.id,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reports/${reportRef.id}`);
  }
}

export function listenToReports(callback: (reports: ReportRecord[]) => void) {
  const reportsRef = collection(db, 'reports');
  return onSnapshot(reportsRef, (snap) => {
    const list: ReportRecord[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ReportRecord);
    });
    // Sort newest first
    list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'reports');
  });
}

export async function updateReportStatus(reportId: string, status: ReportRecord['status']): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function suspendUser(userId: string, isSuspended = true): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isSuspended,
      isOnline: false
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}
