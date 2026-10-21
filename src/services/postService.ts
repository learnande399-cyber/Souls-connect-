import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { Post, Comment, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errors';
import { createNotification } from './notificationService';

export async function createPost(
  author: UserProfile,
  content: string,
  category?: string,
  imageUrl?: string
): Promise<string> {
  const postRef = doc(collection(db, 'posts'));
  try {
    await setDoc(postRef, {
      id: postRef.id,
      authorId: author.userId,
      authorName: author.displayName,
      authorUsername: author.username,
      authorAvatar: author.photoURL || '',
      content: content.trim(),
      category: category || 'Thought of the day',
      imageUrl: imageUrl || '',
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return postRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `posts/${postRef.id}`);
  }
}

export function listenToUserPosts(userId: string, callback: (posts: Post[]) => void) {
  const postsRef = collection(db, 'posts');
  return onSnapshot(postsRef, (snap) => {
    const list: Post[] = [];
    snap.forEach((d) => {
      const p = { id: d.id, ...d.data() } as Post;
      if (p.authorId === userId) {
        list.push(p);
      }
    });
    list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'posts');
  });
}

export function listenToPosts(callback: (posts: Post[]) => void) {
  const postsRef = collection(db, 'posts');

  return onSnapshot(postsRef, (snap) => {
    const list: Post[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Post);
    });
    // Sort newest first
    list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'posts');
  });
}

export async function checkUserLikedPost(postId: string, userId: string): Promise<boolean> {
  try {
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const snap = await getDoc(likeRef);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function toggleLikePost(
  postId: string,
  user: UserProfile,
  postAuthorId: string
): Promise<boolean> {
  const likeRef = doc(db, 'posts', postId, 'likes', user.userId);
  const postRef = doc(db, 'posts', postId);

  try {
    const snap = await getDoc(likeRef);
    if (snap.exists()) {
      // Unlike
      await deleteDoc(likeRef);
      await updateDoc(postRef, {
        likesCount: increment(-1)
      });
      return false;
    } else {
      // Like
      await setDoc(likeRef, {
        postId,
        userId: user.userId,
        createdAt: serverTimestamp()
      });
      await updateDoc(postRef, {
        likesCount: increment(1)
      });

      // Send notification
      if (postAuthorId !== user.userId) {
        await createNotification({
          recipientId: postAuthorId,
          senderId: user.userId,
          senderName: user.displayName,
          senderAvatar: user.photoURL,
          type: 'post_like',
          title: 'New post reaction',
          message: `${user.displayName} loved your post!`,
          linkType: 'post',
          linkId: postId
        });
      }
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `posts/${postId}/likes/${user.userId}`);
  }
}

export async function addComment(
  postId: string,
  author: UserProfile,
  text: string,
  postAuthorId: string
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;

  const commentRef = doc(collection(db, 'posts', postId, 'comments'));
  const postRef = doc(db, 'posts', postId);

  try {
    await setDoc(commentRef, {
      id: commentRef.id,
      postId,
      authorId: author.userId,
      authorName: author.displayName,
      authorUsername: author.username,
      authorAvatar: author.photoURL || '',
      text: cleanText,
      createdAt: serverTimestamp()
    });

    await updateDoc(postRef, {
      commentsCount: increment(1)
    });

    // Notify post author
    if (postAuthorId !== author.userId) {
      await createNotification({
        recipientId: postAuthorId,
        senderId: author.userId,
        senderName: author.displayName,
        senderAvatar: author.photoURL,
        type: 'post_comment',
        title: 'New comment',
        message: `${author.displayName} commented: "${cleanText.slice(0, 45)}..."`,
        linkType: 'post',
        linkId: postId
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `posts/${postId}/comments`);
  }
}

export function listenToComments(postId: string, callback: (comments: Comment[]) => void) {
  const commentsRef = collection(db, 'posts', postId, 'comments');

  return onSnapshot(commentsRef, (snap) => {
    const list: Comment[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Comment);
    });
    // Sort oldest first
    list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tA - tB;
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `posts/${postId}/comments`);
  });
}

export async function deletePost(postId: string): Promise<void> {
  try {
    // Delete comments & likes subcollections best-effort
    const commentsSnap = await getDocs(collection(db, 'posts', postId, 'comments'));
    commentsSnap.forEach(d => deleteDoc(d.ref));
    const likesSnap = await getDocs(collection(db, 'posts', postId, 'likes'));
    likesSnap.forEach(d => deleteDoc(d.ref));

    await deleteDoc(doc(db, 'posts', postId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    await updateDoc(doc(db, 'posts', postId), {
      commentsCount: increment(-1)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
  }
}
