import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  MapPin,
  Shield,
  Flag,
  Sparkles,
  Heart,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { UserProfile, Post } from '../types';
import { listenToUserPosts } from '../services/postService';

interface UserProfileModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onMessageUser: (user: UserProfile) => void;
  onReportUser: (user: UserProfile) => void;
  onBlockUser: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onMessageUser,
  onReportUser,
  onBlockUser,
}) => {
  const [memberPosts, setMemberPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!user?.userId) return;
    const unsub = listenToUserPosts(user.userId, (posts) => {
      setMemberPosts(posts);
    });
    return () => unsub();
  }, [user?.userId]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1120] rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-950/60 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Banner with soft romantic gradient */}
        <div className="h-24 sm:h-28 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-0 relative flex-1 overflow-y-auto">
          {/* Avatar */}
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="relative">
              <img
                src={
                  user.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
                }
                alt={user.displayName}
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white dark:ring-[#1E1120] shadow-md"
              />
              {user.showOnlineStatus && user.isOnline && (
                <span
                  title="Online"
                  className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-[#1E1120]"
                />
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onMessageUser(user);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/25 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </button>
            </div>
          </div>

          {/* Name & Username */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {user.displayName}
              </h3>
              {user.gender && user.showGender && user.gender !== 'prefer_not_to_say' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-medium capitalize">
                  {user.gender}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-500 font-medium">@{user.username}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {user.showAge && user.age && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{user.age} years old</span>
                </span>
              )}
              {user.showCity && user.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{user.city}</span>
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/30">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-rose-500 mb-1">
              About
            </h4>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {user.bio || 'This member has not written a bio yet.'}
            </p>
          </div>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Interests & Passions</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Member's Shared Photos & Posts */}
          {memberPosts.length > 0 && (
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Shared Musings & Photos ({memberPosts.length})</span>
              </h4>
              <div className="space-y-3">
                {memberPosts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl bg-rose-50/20 dark:bg-neutral-900/50 border border-rose-100 dark:border-rose-900/40 space-y-2"
                  >
                    {post.content && (
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    )}
                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden max-h-56 border border-rose-100 dark:border-rose-950/40">
                        <img
                          src={post.imageUrl}
                          alt="Post photo"
                          className="w-full h-auto max-h-56 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                      <span>{post.category || 'Musing'}</span>
                      <span className="flex items-center gap-1 text-rose-500 font-medium">
                        <Heart className="w-3 h-3 fill-rose-500" />
                        <span>{post.likesCount || 0}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                onReportUser(user);
                onClose();
              }}
              className="text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Account</span>
            </button>

            <button
              onClick={() => {
                onBlockUser(user);
                onClose();
              }}
              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Block Member</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
