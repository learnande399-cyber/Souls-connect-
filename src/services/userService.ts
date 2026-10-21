import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errors';

export async function checkUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
  const cleanUsername = username.toLowerCase().trim();
  if (cleanUsername.length < 3) return false;

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', cleanUsername), limit(1));
  try {
    const snap = await getDocs(q);
    if (snap.empty) return true;
    const match = snap.docs[0];
    if (currentUserId && match.id === currentUserId) return true;
    return false;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

export function calculateAgeFromBirthdate(birthDateStr: string): number {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function getDiscoverUsers(
  currentUserId: string,
  blockedUserIds: string[]
): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  try {
    const snap = await getDocs(usersRef);
    const users: UserProfile[] = [];

    snap.forEach((d) => {
      const data = d.data() as UserProfile;
      // Filter out self, suspended accounts, and blocked users
      if (
        data.userId !== currentUserId &&
        !data.isSuspended &&
        !blockedUserIds.includes(data.userId) &&
        data.username // Ensure profile setup is complete
      ) {
        users.push(data);
      }
    });

    return users;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  }
}
