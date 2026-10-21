import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  MessageCircle,
  User as UserIcon,
  Shield,
  Flag,
  Sparkles,
  MapPin,
  Circle,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { getDiscoverUsers } from '../services/userService';
import { getBlockedUserIds, blockUser } from '../services/safetyService';
import { AVAILABLE_INTERESTS } from '../utils/constants';

interface DiscoverViewProps {
  onStartChatWithUser: (user: UserProfile) => void;
  onViewProfile: (user: UserProfile) => void;
  onReportUser: (user: UserProfile) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onStartChatWithUser,
  onViewProfile,
  onReportUser,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('all');
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const blocked = await getBlockedUserIds(currentUser.uid);
      setBlockedIds(blocked);
      const list = await getDiscoverUsers(currentUser.uid, blocked);
      setUsers(list);
    } catch (err) {
      console.error('Error fetching discover users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  // Determine genuine online status (active in last 90 seconds if allowed)
  const isUserGenuinelyOnline = (user: UserProfile): boolean => {
    if (!user.showOnlineStatus || !user.isOnline) return false;
    if (!user.lastActive) return false;

    let timestampMs = 0;
    if (typeof user.lastActive?.toMillis === 'function') {
      timestampMs = user.lastActive.toMillis();
    } else if (user.lastActive instanceof Date) {
      timestampMs = user.lastActive.getTime();
    } else if (typeof user.lastActive === 'string') {
      timestampMs = new Date(user.lastActive).getTime();
    }

    if (!timestampMs) return false;
    const diffSeconds = (Date.now() - timestampMs) / 1000;
    return diffSeconds < 90;
  };

  const handleBlock = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    const confirmed = window.confirm(`Block @${targetUser.username}? You won't see their profile, posts, or chats.`);
    if (!confirmed) return;
    try {
      await blockUser(currentUser.uid, targetUser.userId);
      setUsers(prev => prev.filter(u => u.userId !== targetUser.userId));
      setActionMenuUserId(null);
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.displayName?.toLowerCase().includes(q);
        const matchesUsername = u.username?.toLowerCase().includes(q);
        const matchesBio = u.bio?.toLowerCase().includes(q);
        const matchesCity = u.city?.toLowerCase().includes(q);
        const matchesInterests = u.interests?.some(i => i.toLowerCase().includes(q));
        if (!matchesName && !matchesUsername && !matchesBio && !matchesCity && !matchesInterests) {
          return false;
        }
      }

      // Interest filter
      if (selectedInterest !== 'All') {
        if (!u.interests?.includes(selectedInterest)) return false;
      }

      // Online only filter
      if (filterOnlineOnly) {
        if (!isUserGenuinelyOnline(u)) return false;
      }

      // Gender filter
      if (selectedGenderFilter !== 'all') {
        if (u.gender !== selectedGenderFilter) return false;
      }

      return true;
    });
  }, [users, searchQuery, selectedInterest, filterOnlineOnly, selectedGenderFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-romantic text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Discover Kindred Souls</span>
            <Sparkles className="w-5 h-5 text-rose-500" />
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real registered members ready for meaningful conversation. Filter by passions and presence.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/80 dark:bg-[#1E1120]/80 backdrop-blur-md rounded-2xl p-4 border border-rose-100 dark:border-rose-950/60 shadow-xs mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, @username, city, or interests..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/40 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterOnlineOnly(!filterOnlineOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                filterOnlineOnly
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'border-rose-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-rose-50 dark:hover:bg-neutral-800'
              }`}
            >
              <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
              <span>Online Now</span>
            </button>

            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-rose-100 dark:border-neutral-800 bg-white dark:bg-[#1E1120] text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="all">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>
        </div>

        {/* Interests Scrollable Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedInterest('All')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedInterest === 'All'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-rose-50/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-rose-100'
            }`}
          >
            All Interests
          </button>
          {AVAILABLE_INTERESTS.map((interest) => (
            <button
              key={interest}
              onClick={() => setSelectedInterest(interest)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedInterest === interest
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-50/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-rose-100'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* User Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white/70 dark:bg-[#1E1120]/70 border border-rose-100 dark:border-rose-950/40 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-neutral-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-rose-100 dark:bg-neutral-800 rounded-md w-2/3" />
                  <div className="h-3 bg-rose-100 dark:bg-neutral-800 rounded-md w-1/3" />
                </div>
              </div>
              <div className="h-10 bg-rose-50 dark:bg-neutral-900 rounded-xl" />
              <div className="h-8 bg-rose-100 dark:bg-neutral-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/50 dark:bg-[#1E1120]/50 rounded-3xl border border-rose-100 dark:border-rose-950/40">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif-romantic text-neutral-800 dark:text-neutral-200">
            No Kindred Souls Found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 leading-relaxed">
            {searchQuery || selectedInterest !== 'All' || filterOnlineOnly
              ? 'Try relaxing your search terms or filters to discover more people.'
              : 'You are among the pioneer members of SoulConnect! Check back soon or invite a friend to discover together.'}
          </p>
          {(searchQuery || selectedInterest !== 'All' || filterOnlineOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedInterest('All');
                setFilterOnlineOnly(false);
                setSelectedGenderFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((user) => {
            const online = isUserGenuinelyOnline(user);

            return (
              <div
                key={user.userId}
                className="group relative bg-white dark:bg-[#1E1120] rounded-3xl p-5 border border-rose-100/90 dark:border-rose-950/60 shadow-xs hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-900 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Avatar & Meta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={
                            user.photoURL ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                          }
                          alt={user.displayName}
                          className="w-13 h-13 rounded-2xl object-cover ring-2 ring-rose-100 dark:ring-rose-950 shadow-xs"
                        />
                        {/* Live online dot */}
                        {online && (
                          <span
                            title="Online Now"
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1E1120] shadow-xs"
                          />
                        )}
                      </div>

                      <div className="overflow-hidden">
                        <h4
                          onClick={() => onViewProfile(user)}
                          className="font-bold text-sm text-neutral-900 dark:text-white truncate cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          {user.displayName}
                        </h4>
                        <p className="text-xs text-rose-500/90 dark:text-rose-400/90 truncate">
                          @{user.username}
                        </p>
                        {/* Age & City if allowed */}
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          {user.showAge && user.age ? (
                            <span>{user.age} yrs</span>
                          ) : null}
                          {user.showAge && user.age && user.showCity && user.city ? (
                            <span>•</span>
                          ) : null}
                          {user.showCity && user.city ? (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5" />
                              {user.city}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Three-dot dropdown for safety actions */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionMenuUserId(
                            actionMenuUserId === user.userId ? null : user.userId
                          )
                        }
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuUserId === user.userId && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActionMenuUserId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#251528] rounded-xl shadow-lg border border-rose-100 dark:border-rose-900/60 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                onReportUser(user);
                                setActionMenuUserId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                            >
                              <Flag className="w-3.5 h-3.5 text-amber-500" />
                              <span>Report User</span>
                            </button>
                            <button
                              onClick={() => handleBlock(user)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium"
                            >
                              <Shield className="w-3.5 h-3.5 text-rose-500" />
                              <span>Block User</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed mb-3">
                    {user.bio || 'Seeking serendipitous connections and kind conversations.'}
                  </p>

                  {/* Interests */}
                  {user.interests && user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {user.interests.slice(0, 3).map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30"
                        >
                          {interest}
                        </span>
                      ))}
                      {user.interests.length > 3 && (
                        <span className="text-[10px] text-neutral-400 self-center">
                          +{user.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-50 dark:border-rose-950/40">
                  <button
                    onClick={() => onViewProfile(user)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-rose-50/60 dark:bg-neutral-800/80 hover:bg-rose-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => onStartChatWithUser(user)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-xs shadow-rose-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
