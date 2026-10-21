import React from 'react';
import { Home, Compass, PlusCircle, MessageCircle, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  unreadMessagesCount: number;
  onOpenCreatePost: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  setCurrentView,
  unreadMessagesCount,
  onOpenCreatePost,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1A0F1D]/95 backdrop-blur-md border-t border-rose-100 dark:border-rose-950/40 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Feed */}
        <button
          onClick={() => setCurrentView('feed')}
          className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
            currentView === 'feed'
              ? 'text-rose-600 dark:text-rose-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-500'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Feed</span>
        </button>

        {/* Discover */}
        <button
          onClick={() => setCurrentView('discover')}
          className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
            currentView === 'discover'
              ? 'text-rose-600 dark:text-rose-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-500'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Discover</span>
        </button>

        {/* Post Action Button */}
        <button
          onClick={onOpenCreatePost}
          className="flex flex-col items-center justify-center w-12 h-12 -mt-4 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white shadow-lg shadow-rose-500/35 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Create Post"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {/* Chats */}
        <button
          onClick={() => setCurrentView('chats')}
          className={`flex flex-col items-center justify-center w-14 h-full transition-colors relative ${
            currentView === 'chats'
              ? 'text-rose-600 dark:text-rose-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-500'
          }`}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 mb-0.5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Chats</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setCurrentView('profile')}
          className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
            currentView === 'profile'
              ? 'text-rose-600 dark:text-rose-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-500'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </div>
    </nav>
  );
};
