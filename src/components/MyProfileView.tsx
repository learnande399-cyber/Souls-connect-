import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  MapPin,
  Calendar,
  Sparkles,
  Heart,
  Edit3,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATARS } from '../utils/constants';
import { Post } from '../types';
import { listenToUserPosts } from '../services/postService';

interface MyProfileViewProps {
  onGoToSettings: () => void;
  onGoToFeed: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  onGoToSettings,
  onGoToFeed,
}) => {
  const { userProfile, currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!userProfile?.userId) return;
    const unsub = listenToUserPosts(userProfile.userId, (posts) => {
      setUserPosts(posts);
      setLoadingPosts(false);
    });
    return () => unsub();
  }, [userProfile?.userId]);

  if (!userProfile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Profile Card Header */}
      <div className="bg-white dark:bg-[#1E1120] rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 relative" />

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 mb-4 gap-4">
            <div className="relative inline-block">
              <img
                src={userProfile.photoURL || DEFAULT_AVATARS[0]}
                alt={userProfile.displayName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white dark:ring-[#1E1120] shadow-md"
              />
              {userProfile.showOnlineStatus && (
                <span
                  title="Online Status Active"
                  className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-[#1E1120]"
                />
              )}
            </div>

            <button
              onClick={onGoToSettings}
              className="self-start sm:self-auto px-4 py-2 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5 text-rose-500" />
              <span>Edit Profile & Privacy</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                {userProfile.displayName}
              </h1>
              {userProfile.gender && userProfile.gender !== 'prefer_not_to_say' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-medium capitalize">
                  {userProfile.gender}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-500 font-medium mt-0.5">
              @{userProfile.username}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {userProfile.age && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {userProfile.age} years old {!userProfile.showAge && '(Hidden from others)'}
                  </span>
                </span>
              )}
              {userProfile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {userProfile.city} {!userProfile.showCity && '(Hidden from others)'}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5 p-4 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/30">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-rose-500 mb-1">
              About Me
            </h3>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {userProfile.bio || 'Introduce yourself to kindred souls by writing a short bio.'}
            </p>
          </div>

          {/* Interests */}
          {userProfile.interests && userProfile.interests.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>My Passions & Interests</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.interests.map((interest) => (
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
        </div>
      </div>

      {/* User's Published Posts & Photos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-serif-romantic text-neutral-900 dark:text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>My Musings & Photos</span>
            <span className="text-xs font-normal text-neutral-400">({userPosts.length})</span>
          </h2>
          <button
            onClick={onGoToFeed}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Create New Post →
          </button>
        </div>

        {loadingPosts ? (
          <div className="p-8 text-center text-xs text-neutral-400 bg-white/60 dark:bg-[#1E1120]/60 rounded-3xl border border-rose-100 dark:border-rose-950/40">
            Loading your posts...
          </div>
        ) : userPosts.length === 0 ? (
          <div className="p-8 text-center bg-white/60 dark:bg-[#1E1120]/60 rounded-3xl border border-rose-100 dark:border-rose-950/40 space-y-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              No posts shared yet
            </p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Share a thought or photo to connect with kindred souls across SoulConnect.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-[#1E1120] rounded-3xl p-5 border border-rose-100 dark:border-rose-950/60 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-medium text-[10px]">
                    {post.category || 'Thought of the day'}
                  </span>
                  <span>
                    {post.createdAt?.toDate
                      ? post.createdAt.toDate().toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'Recently'}
                  </span>
                </div>

                {post.content && (
                  <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                )}

                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-950/40 max-h-80 bg-neutral-900/5 dark:bg-black/20">
                    <img
                      src={post.imageUrl}
                      alt="Uploaded post photo"
                      className="w-full h-auto max-h-80 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
                  <span className="flex items-center gap-1 text-rose-500 font-medium">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    <span>{post.likesCount || 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.commentsCount || 0} comments</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
