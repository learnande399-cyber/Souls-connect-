import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Heart,
  MessageSquare,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import {
  listenToNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../services/notificationService';

interface NotificationsViewProps {
  onNavigateToChat: (conversationId?: string) => void;
  onNavigateToPost: (postId?: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onNavigateToChat,
  onNavigateToPost,
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = listenToNotifications(currentUser.uid, (list) => {
      setNotifications(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
    }

    if (notif.linkType === 'chat') {
      onNavigateToChat(notif.linkId);
    } else if (notif.linkType === 'post') {
      onNavigateToPost(notif.linkId);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.uid);
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_message':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case 'post_like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'post_comment':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'moderation':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-500" />
            <span>Activity Notifications</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Stay updated when people chat with you or react to your thoughts.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white/70 dark:bg-[#1E1120]/70 border border-rose-100 dark:border-rose-950/40 animate-pulse h-16"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/50 dark:bg-[#1E1120]/50 rounded-3xl border border-rose-100 dark:border-rose-950/40">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif-romantic text-neutral-800 dark:text-neutral-200">
            All Caught Up
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 leading-relaxed">
            When someone sends you a message, comments on your post, or gives you a heart, it will appear right here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            let timeString = '';
            if (notif.createdAt?.toDate) {
              timeString = notif.createdAt.toDate().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
            }

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  notif.isRead
                    ? 'bg-white/80 dark:bg-[#1E1120]/80 border-rose-100/60 dark:border-rose-950/40 opacity-80 hover:opacity-100'
                    : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 shadow-xs'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#251528] flex items-center justify-center shadow-xs shrink-0 relative">
                  {getNotificationIcon(notif.type)}
                  {!notif.isRead && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                      {timeString}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
