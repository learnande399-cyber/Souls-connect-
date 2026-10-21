import React, { useState, useEffect } from 'react';
import {
  Heart,
  Upload,
  Check,
  AlertCircle,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_INTERESTS, DEFAULT_AVATARS } from '../utils/constants';
import { checkUsernameAvailable, calculateAgeFromBirthdate } from '../services/userService';
import { Gender } from '../types';

export const ProfileSetupWizard: React.FC = () => {
  const { currentUser, updateProfileData, savePrivateInfo } = useAuth();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [birthDate, setBirthDate] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Privacy controls
  const [showAge, setShowAge] = useState(true);
  const [showGender, setShowGender] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Debounce username check
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    // Regex check
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(clean, currentUser?.uid);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, currentUser?.uid]);

  // Recalculate age when birthDate changes
  useEffect(() => {
    if (birthDate) {
      const age = calculateAgeFromBirthdate(birthDate);
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [birthDate]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, or WEBP).');
      return;
    }
    // Limit to 450KB for safe base64 storage in Firestore document
    if (file.size > 450 * 1024) {
      setError('Image is too large. Please select an image under 450KB or choose a preset avatar.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!displayName.trim()) {
        setError('Please provide a display name.');
        return;
      }
      if (!username.trim() || username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (usernameAvailable === false) {
        setError('This username is already taken or invalid. Only letters, numbers and underscores allowed.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!birthDate) {
        setError('Please enter your date of birth.');
        return;
      }
      if (calculatedAge === null || calculatedAge < 18) {
        setError('You must be at least 18 years old to join SoulConnect.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!bio.trim()) {
        setError('Please write a short bio to introduce yourself.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (selectedInterests.length === 0) {
        setError('Please select at least 1 interest so others can discover you.');
        return;
      }
      setStep(5);
    }
  };

  const handleFinish = async () => {
    if (!currentUser) return;
    setSaving(true);
    setError(null);

    try {
      if (calculatedAge === null || calculatedAge < 18) {
        throw new Error('Age requirement not met (minimum 18).');
      }

      // 1. Save sensitive full birthDate into isolated private subcollection
      await savePrivateInfo({
        birthDate,
        email: currentUser.email || ''
      });

      // 2. Save public profile data
      await updateProfileData({
        userId: currentUser.uid,
        email: currentUser.email || '',
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        photoURL: selectedAvatar,
        bio: bio.trim(),
        age: calculatedAge,
        gender,
        city: city.trim(),
        interests: selectedInterests,
        showAge,
        showGender,
        showCity,
        showOnlineStatus,
        isOnline: true,
        isSuspended: false,
        createdAt: new Date()
      });
    } catch (err: any) {
      console.error('Profile creation error:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-romantic-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#1E1120] rounded-3xl shadow-xl border border-rose-100 dark:border-rose-950/60 p-6 sm:p-10 relative overflow-hidden">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30 ring-4 ring-rose-100 dark:ring-rose-950/40'
                    : step > s
                    ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 5 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full ${
                    step > s ? 'bg-rose-300 dark:bg-rose-800' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Identity & Avatar */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Create Your Identity
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Choose how people will see you on SoulConnect.
              </p>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Choose an Avatar or Upload
              </label>
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={selectedAvatar}
                  alt="Selected Avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-rose-500 shadow-md"
                />
                <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`rounded-full overflow-hidden transition-all aspect-square relative ${
                      selectedAvatar === url
                        ? 'ring-2 ring-rose-500 scale-105'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Luna Vance"
                maxLength={50}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-neutral-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Unique Username
                </label>
                {isCheckingUsername && (
                  <span className="text-[11px] text-neutral-400">Checking...</span>
                )}
                {usernameAvailable === true && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Available
                  </span>
                )}
                {usernameAvailable === false && (
                  <span className="text-[11px] text-rose-500 font-medium">
                    ✕ Unavailable or invalid
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="lunavance"
                  maxLength={30}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-neutral-400"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Letters, numbers, and underscores only.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Age Verification & Gender */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Age Verification & Gender
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                SoulConnect is for adults aged 18 and older. Your birth date remains completely private.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                Your full date of birth is securely isolated in your private document and is never shown to any other user.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              {calculatedAge !== null && (
                <p className="text-xs mt-2 font-medium">
                  {calculatedAge >= 18 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Calculated Age: {calculatedAge} years old (Eligible)
                    </span>
                  ) : (
                    <span className="text-rose-500">
                      Calculated Age: {calculatedAge} years old (Must be 18+)
                    </span>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Gender
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'non-binary', label: 'Non-binary' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value as Gender)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                      gender === g.value
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-rose-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Bio & Location */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Tell Your Story
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Write a thoughtful bio that helps people understand who you are.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  About You
                </label>
                <span className="text-[11px] text-neutral-400">{bio.length}/300</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="A lover of rainy afternoons, philosophical questions, and acoustic melodies. Looking for deep conversations and new perspectives."
                className="w-full px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-neutral-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                City / Region (Optional)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Seattle, WA or Paris"
                maxLength={60}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-neutral-400"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Only city-level is requested. Never share exact home addresses.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Soul Interests
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Select interests to help discover kindred souls with aligned passions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs scale-[1.02]'
                        : 'bg-rose-50/50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-rose-100 dark:border-neutral-700 hover:border-rose-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {interest}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-neutral-400">
              Selected: {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Step 5: Privacy Settings */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-2xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Profile Visibility & Privacy
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                You control what other members can see on your public profile.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/50 border border-rose-100 dark:border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                    Display my age
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Shows your calculated age ({calculatedAge}) on your profile card
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showAge}
                  onChange={(e) => setShowAge(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 rounded-md"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/50 border border-rose-100 dark:border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                    Display my gender
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Shows your gender on your profile card
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showGender}
                  onChange={(e) => setShowGender(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 rounded-md"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/50 border border-rose-100 dark:border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                    Display my city
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Shows your city on your profile card
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showCity}
                  onChange={(e) => setShowCity(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 rounded-md"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 dark:bg-neutral-800/50 border border-rose-100 dark:border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                    Real-time online status
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Allow others to see when you are active on the site
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showOnlineStatus}
                  onChange={(e) => setShowOnlineStatus(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 rounded-md"
                />
              </label>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 pt-4 border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="px-8 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 shadow-md shadow-rose-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enter SoulConnect</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
