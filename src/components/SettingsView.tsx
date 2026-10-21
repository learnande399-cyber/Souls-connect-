import React, { useState, useEffect } from 'react';
import {
  Save,
  Shield,
  Trash2,
  AlertTriangle,
  Upload,
  Sparkles,
  Check,
  UserX,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_INTERESTS, DEFAULT_AVATARS } from '../utils/constants';
import { getMyBlockedList, unblockUser } from '../services/safetyService';
import { getUserProfile } from '../services/userService';
import { UserProfile } from '../types';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    updateProfileData,
    deleteUserAccount,
    logout
  } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.photoURL || DEFAULT_AVATARS[0]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userProfile?.interests || []);

  // Privacy toggles
  const [showAge, setShowAge] = useState(userProfile?.showAge ?? true);
  const [showGender, setShowGender] = useState(userProfile?.showGender ?? true);
  const [showCity, setShowCity] = useState(userProfile?.showCity ?? true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(userProfile?.showOnlineStatus ?? true);

  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync profile when loaded
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setCity(userProfile.city || '');
      setSelectedAvatar(userProfile.photoURL || DEFAULT_AVATARS[0]);
      setSelectedInterests(userProfile.interests || []);
      setShowAge(userProfile.showAge ?? true);
      setShowGender(userProfile.showGender ?? true);
      setShowCity(userProfile.showCity ?? true);
      setShowOnlineStatus(userProfile.showOnlineStatus ?? true);
    }
  }, [userProfile]);

  // Load blocked users
  const loadBlocked = async () => {
    if (!currentUser) return;
    setLoadingBlocked(true);
    try {
      const blockedIds = await getMyBlockedList(currentUser.uid);
      const profiles: UserProfile[] = [];
      for (const id of blockedIds) {
        const p = await getUserProfile(id);
        if (p) profiles.push(p);
      }
      setBlockedUsers(profiles);
    } catch (err) {
      console.error('Error loading blocked list:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    loadBlocked();
  }, [currentUser]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file.');
      return;
    }
    if (file.size > 450 * 1024) {
      setErrorMsg('Image file size must be less than 450KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Display name is required.');
      return;
    }

    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateProfileData({
        displayName: displayName.trim(),
        bio: bio.trim(),
        city: city.trim(),
        photoURL: selectedAvatar,
        interests: selectedInterests,
        showAge,
        showGender,
        showCity,
        showOnlineStatus
      });
      setSuccessMsg('Profile settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblock = async (blockedUser: UserProfile) => {
    if (!currentUser) return;
    try {
      await unblockUser(currentUser.uid, blockedUser.userId);
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== blockedUser.userId));
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your SoulConnect account? All your profile information and active sessions will be terminated.'
    );
    if (!confirmed) return;

    try {
      await deleteUserAccount();
    } catch (err: any) {
      alert(`Could not delete account: ${err.message}. Please log out and back in first.`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
          Settings & Privacy
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Control your profile presentation, discovery visibility, and safety preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card Settings */}
        <div className="bg-white dark:bg-[#1E1120] rounded-3xl p-5 sm:p-6 border border-rose-100 dark:border-rose-950/60 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Profile Information</span>
          </h2>

          {/* Avatar */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4 mb-3">
              <img
                src={selectedAvatar}
                alt="Selected"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-400"
              />
              <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Upload New</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {DEFAULT_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`rounded-xl overflow-hidden aspect-square ${
                    selectedAvatar === url ? 'ring-2 ring-rose-500' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Username (read-only)
              </label>
              <input
                type="text"
                disabled
                value={`@${userProfile?.username || ''}`}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Short Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              City / Region
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kyoto, Japan"
              maxLength={60}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Passions & Interests
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-rose-50/40 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-rose-100 dark:border-neutral-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Privacy & Visibility Settings */}
        <div className="bg-white dark:bg-[#1E1120] rounded-3xl p-5 sm:p-6 border border-rose-100 dark:border-rose-950/60 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-500" />
            <span>Privacy Controls</span>
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/40 border border-rose-100 dark:border-neutral-800 cursor-pointer">
              <span className="text-xs sm:text-sm text-neutral-900 dark:text-white">
                Show my age on profile
              </span>
              <input
                type="checkbox"
                checked={showAge}
                onChange={(e) => setShowAge(e.target.checked)}
                className="w-4 h-4 accent-rose-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/40 border border-rose-100 dark:border-neutral-800 cursor-pointer">
              <span className="text-xs sm:text-sm text-neutral-900 dark:text-white">
                Show my gender on profile
              </span>
              <input
                type="checkbox"
                checked={showGender}
                onChange={(e) => setShowGender(e.target.checked)}
                className="w-4 h-4 accent-rose-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/40 border border-rose-100 dark:border-neutral-800 cursor-pointer">
              <span className="text-xs sm:text-sm text-neutral-900 dark:text-white">
                Show my city on profile
              </span>
              <input
                type="checkbox"
                checked={showCity}
                onChange={(e) => setShowCity(e.target.checked)}
                className="w-4 h-4 accent-rose-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/40 border border-rose-100 dark:border-neutral-800 cursor-pointer">
              <span className="text-xs sm:text-sm text-neutral-900 dark:text-white">
                Broadcast real-time online status
              </span>
              <input
                type="checkbox"
                checked={showOnlineStatus}
                onChange={(e) => setShowOnlineStatus(e.target.checked)}
                className="w-4 h-4 accent-rose-500"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </form>

      {/* Blocked Users Section */}
      <div className="bg-white dark:bg-[#1E1120] rounded-3xl p-5 sm:p-6 border border-rose-100 dark:border-rose-950/60 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-500" />
          <span>Blocked Users ({blockedUsers.length})</span>
        </h2>

        {loadingBlocked ? (
          <p className="text-xs text-neutral-400">Loading blocked list...</p>
        ) : blockedUsers.length === 0 ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            You have not blocked any users.
          </p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((u) => (
              <div
                key={u.userId}
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/20 dark:bg-neutral-900/40 border border-rose-100 dark:border-neutral-800"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={u.photoURL || DEFAULT_AVATARS[0]}
                    alt={u.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      {u.displayName}
                    </span>
                    <span className="text-[10px] text-neutral-400">@{u.username}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUnblock(u)}
                  className="px-3 py-1 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/40 dark:bg-rose-950/20 rounded-3xl p-5 sm:p-6 border border-rose-200 dark:border-rose-900/50 space-y-3">
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Deleting your account will remove your profile from the discover feed and close all active sessions.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/60 hover:bg-rose-200 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );
};
