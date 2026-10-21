export type Gender = 'male' | 'female' | 'non-binary' | 'prefer_not_to_say';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string;
  bio?: string;
  age?: number;
  gender?: Gender;
  city?: string;
  interests?: string[];
  showAge?: boolean;
  showGender?: boolean;
  showCity?: boolean;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  lastActive?: any; // Timestamp or string
  isSuspended?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface PrivateInfo {
  userId: string;
  birthDate: string;
  email: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  category?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  text: string;
  createdAt: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails?: {
    [userId: string]: {
      displayName: string;
      username: string;
      photoURL?: string;
      isOnline?: boolean;
      lastActive?: any;
    };
  };
  lastMessageText?: string;
  lastMessageImageUrl?: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp?: any;
  unreadCounts?: {
    [userId: string]: number;
  };
  updatedAt?: any;
  createdAt: any;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  imageFileName?: string;
  createdAt: any;
  isRead?: boolean;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'new_message' | 'post_like' | 'post_comment' | 'moderation';
  title: string;
  message: string;
  linkType: 'chat' | 'post' | 'profile' | 'system';
  linkId?: string;
  isRead: boolean;
  createdAt: any;
}

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: any;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: 'user' | 'post' | 'comment' | 'message';
  targetId: string;
  targetUserId?: string;
  targetContent?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  createdAt: any;
}
