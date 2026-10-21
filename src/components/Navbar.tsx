import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Bell,
  Compass,
  Home,
  User,
  Moon,
  Sun,
  LogOut,
  ShieldAlert,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  onOpenAuth: () => void;
  onOpenGuidelines: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  unreadMessagesCount,
  unreadNotificationsCount,
  onOpenAuth,
  onOpenGuidelines,
  onOpenAdmin,
}) => {
  const { currentUser, userProfile, isAdmin, isDarkMode, toggleDarkMode, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1A0F1D]/80 backdrop-blur-md border-b border-rose-100 dark:border-rose-950/40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => setCurrentView(currentUser ? 'feed' : 'landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gradient-romantic">
              SoulConnect
            </span>
            <span className="hidden sm:inline-block text-[10px] tracking-wider uppercase text-rose-500/80 font-semibold ml-2 px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40">
              Community
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setCurrentView('feed')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                currentView === 'feed'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Feed</span>
            </button>

            <button
              onClick={() => setCurrentView('discover')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                currentView === 'discover'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Discover</span>
            </button>

            <button
              onClick={() => setCurrentView('chats')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative ${
                currentView === 'chats'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chats</span>
              {unreadMessagesCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center animate-pulse">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('notifications')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative ${
                currentView === 'notifications'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {!currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-rose-600 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/25 transition-all hover:scale-[1.02]"
              >
                Join Free
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full border-2 border-rose-200 dark:border-rose-900/60 hover:border-rose-400 transition-colors"
              >
                <img
                  src={
                    userProfile?.photoURL ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={userProfile?.displayName || 'Profile'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1E1120] rounded-2xl shadow-xl border border-rose-100 dark:border-rose-950/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-rose-50 dark:border-rose-950/40">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {userProfile?.displayName || 'Welcome'}
                      </p>
                      <p className="text-xs text-rose-500 dark:text-rose-400 truncate">
                        @{userProfile?.username || 'setup_profile'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentView('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                    >
                      <User className="w-4 h-4 text-rose-500" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView('settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                    >
                      <Settings className="w-4 h-4 text-rose-500" />
                      <span>Settings & Privacy</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenGuidelines();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Community Guidelines</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          onOpenAdmin();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition-colors font-semibold"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Moderation Panel</span>
                      </button>
                    )}

                    <div className="border-t border-rose-50 dark:border-rose-950/40 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
