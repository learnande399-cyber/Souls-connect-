import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Conversation, Message, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errors';
import { createNotification } from './notificationService';

export function getCanonicalConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function getOrCreateConversation(
  currentUser: UserProfile,
  targetUser: UserProfile
): Promise<string> {
  const convId = getCanonicalConversationId(currentUser.userId, targetUser.userId);
  const convRef = doc(db, 'conversations', convId);

  try {
    const snap = await getDoc(convRef);
    if (!snap.exists()) {
      await setDoc(convRef, {
        id: convId,
        participants: [currentUser.userId, targetUser.userId],
        participantDetails: {
          [currentUser.userId]: {
            displayName: currentUser.displayName,
            username: currentUser.username,
            photoURL: currentUser.photoURL || '',
            isOnline: currentUser.isOnline || false
          },
          [targetUser.userId]: {
            displayName: targetUser.displayName,
            username: targetUser.username,
            photoURL: targetUser.photoURL || '',
            isOnline: targetUser.isOnline || false
          }
        },
        unreadCounts: {
          [currentUser.userId]: 0,
          [targetUser.userId]: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    return convId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `conversations/${convId}`);
  }
}

export function listenToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const convRef = collection(db, 'conversations');
  const q = query(convRef, where('participants', 'array-contains', userId));

  return onSnapshot(q, (snap) => {
    const list: Conversation[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Conversation);
    });
    // Sort latest message first
    list.sort((a, b) => {
      const tA = a.lastMessageTimestamp?.toMillis
        ? a.lastMessageTimestamp.toMillis()
        : a.updatedAt?.toMillis
        ? a.updatedAt.toMillis()
        : 0;
      const tB = b.lastMessageTimestamp?.toMillis
        ? b.lastMessageTimestamp.toMillis()
        : b.updatedAt?.toMillis
        ? b.updatedAt.toMillis()
        : 0;
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'conversations');
  });
}

export function listenToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');

  return onSnapshot(messagesRef, (snap) => {
    const list: Message[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Message);
    });
    // Sort chronological (oldest to newest)
    list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tA - tB;
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `conversations/${conversationId}/messages`);
  });
}

export async function sendMessage(
  conversationId: string,
  sender: UserProfile,
  recipientId: string,
  content: string | {
    text?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    imageFileName?: string;
  }
): Promise<void> {
  const textVal = typeof content === 'string' ? content.trim() : (content.text || '').trim();
  const imageUrlVal = typeof content === 'object' ? content.imageUrl : undefined;
  const thumbnailUrlVal = typeof content === 'object' ? content.thumbnailUrl : undefined;
  const imageFileNameVal = typeof content === 'object' ? content.imageFileName : undefined;

  // Must have at least text or image
  if (!textVal && !imageUrlVal) return;

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const msgDocRef = doc(messagesRef);
  const convRef = doc(db, 'conversations', conversationId);

  // Determine last message preview for conversation history
  let previewText = '';
  if (imageUrlVal && textVal) {
    previewText = `📷 Photo: ${textVal}`;
  } else if (imageUrlVal) {
    previewText = '📷 Photo';
  } else {
    previewText = textVal;
  }

  try {
    const batch = writeBatch(db);

    // Build message document
    const messageDocData: any = {
      id: msgDocRef.id,
      conversationId,
      senderId: sender.userId,
      senderName: sender.displayName,
      createdAt: serverTimestamp(),
      isRead: false
    };

    if (textVal) {
      messageDocData.text = textVal;
    }
    if (imageUrlVal) {
      messageDocData.imageUrl = imageUrlVal;
      if (thumbnailUrlVal) {
        messageDocData.imageThumbnailUrl = thumbnailUrlVal;
      }
      if (imageFileNameVal) {
        messageDocData.imageFileName = imageFileNameVal;
      }
    }

    batch.set(msgDocRef, messageDocData);

    // Update conversation metadata
    const convUpdateData: any = {
      lastMessageText: previewText.slice(0, 200),
      lastMessageSenderId: sender.userId,
      lastMessageTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCounts.${recipientId}`]: 1
    };

    // Store thumbnail in conversation for quick list rendering
    if (thumbnailUrlVal || imageUrlVal) {
      convUpdateData.lastMessageImageUrl = thumbnailUrlVal || imageUrlVal;
    }

    batch.update(convRef, convUpdateData);

    await batch.commit();

    // Trigger notification
    let notifMessage = '';
    if (imageUrlVal && textVal) {
      notifMessage = `${sender.displayName} sent a photo: "${textVal.slice(0, 45)}"`;
    } else if (imageUrlVal) {
      notifMessage = `${sender.displayName} sent you a private photo`;
    } else {
      notifMessage = `${sender.displayName}: "${textVal.slice(0, 60)}${textVal.length > 60 ? '...' : ''}"`;
    }

    await createNotification({
      recipientId,
      senderId: sender.userId,
      senderName: sender.displayName,
      senderAvatar: sender.photoURL,
      type: 'new_message',
      title: 'New private message',
      message: notifMessage,
      linkType: 'chat',
      linkId: conversationId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `conversations/${conversationId}/messages`);
  }
}

export async function markConversationAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  const convRef = doc(db, 'conversations', conversationId);
  try {
    await updateDoc(convRef, {
      [`unreadCounts.${currentUserId}`]: 0
    });

    // Mark unread messages as read
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, where('isRead', '==', false));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d) => {
        const msg = d.data() as Message;
        if (msg.senderId !== currentUserId) {
          batch.update(d.ref, { isRead: true });
        }
      });
      await batch.commit();
    }
  } catch {
    // Ignore minor read update failures
  }
}
