import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { ProfileSetupWizard } from './components/ProfileSetupWizard';
import { DiscoverView } from './components/DiscoverView';
import { FeedView } from './components/FeedView';
import { ChatView } from './components/ChatView';
import { NotificationsView } from './components/NotificationsView';
import { MyProfileView } from './components/MyProfileView';
import { SettingsView } from './components/SettingsView';
import { UserProfileModal } from './components/UserProfileModal';
import { ReportModal } from './components/ReportModal';
import { AdminModerationModal } from './components/AdminModerationModal';
import { SafetyGuidelinesModal } from './components/SafetyGuidelinesModal';
import { UserProfile, Post, Conversation, NotificationItem } from './types';
import { listenToConversations, getOrCreateConversation } from './services/chatService';
import { listenToNotifications } from './services/notificationService';
import { AlertCircle, ShieldAlert, MailCheck } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    resendVerificationEmail,
    logout
  } = useAuth();

  const [currentView, setCurrentView] = useState<string>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [guidelinesModalOpen, setGuidelinesModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Inspector & Chat state
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);
  const [chatTargetUser, setChatTargetUser] = useState<UserProfile | null>(null);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);

  // Report Modal state
  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    targetType: 'user' | 'post' | 'comment' | 'message';
    targetId: string;
    targetUserId?: string;
    targetContent?: string;
  }>({
    isOpen: false,
    targetType: 'user',
    targetId: ''
  });

  // Unread counters
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  // Auto-route based on login state
  useEffect(() => {
    if (!loading) {
      if (currentUser && userProfile?.username) {
        if (currentView === 'landing') {
          setCurrentView('feed');
        }
      } else if (!currentUser) {
        setCurrentView('landing');
      }
    }
  }, [currentUser, userProfile?.username, loading]);

  // Listen to unread counts
  useEffect(() => {
    if (!currentUser) {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
      return;
    }

    const unsubConvs = listenToConversations(currentUser.uid, (convs) => {
      let totalUnread = 0;
      convs.forEach((c) => {
        const count = c.unreadCounts?.[currentUser.uid] || 0;
        totalUnread += count;
      });
      setUnreadMessagesCount(totalUnread);
    });

    const unsubNotifs = listenToNotifications(currentUser.uid, (notifs) => {
      const count = notifs.filter((n) => !n.isRead).length;
      setUnreadNotificationsCount(count);
    });

    return () => {
      unsubConvs();
      unsubNotifs();
    };
  }, [currentUser]);

  // Handler to initiate 1-to-1 conversation with user
  const handleStartChatWithUser = async (targetUser: UserProfile) => {
    if (!userProfile) return;
    try {
      const convId = await getOrCreateConversation(userProfile, targetUser);
      setChatConversationId(convId);
      setChatTargetUser(targetUser);
      setCurrentView('chats');
    } catch (err) {
      console.error('Could not initiate conversation:', err);
    }
  };

  const handleReportUser = (user: UserProfile) => {
    setReportModalData({
      isOpen: true,
      targetType: 'user',
      targetId: user.userId,
      targetUserId: user.userId,
      targetContent: `@${user.username} (${user.displayName})`
    });
  };

  const handleReportPost = (post: Post) => {
    setReportModalData({
      isOpen: true,
      targetType: 'post',
      targetId: post.id,
      targetUserId: post.authorId,
      targetContent: post.content
    });
  };

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
      setVerificationEmailSent(true);
      setTimeout(() => setVerificationEmailSent(false), 4000);
    } catch (e) {
      console.warn('Could not resend email:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-rose-500/30">
            <span className="text-xl">❤️</span>
          </div>
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Connecting souls...
          </p>
        </div>
      </div>
    );
  }

  // Account suspended state
  if (currentUser && userProfile?.isSuspended) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#1E1120] border border-rose-200 dark:border-rose-900 shadow-xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
            Account Suspended
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Your account has been suspended for violations of the SoulConnect Community Guidelines. Please contact support if you believe this was an error.
          </p>
          <button
            onClick={logout}
            className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Needs profile onboarding wizard
  if (currentUser && !userProfile?.username) {
    return <ProfileSetupWizard />;
  }

  return (
    <div className="min-h-screen bg-romantic-gradient text-neutral-800 dark:text-neutral-100 flex flex-col pb-16 md:pb-0">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        onOpenGuidelines={() => setGuidelinesModalOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Email Verification Banner */}
      {currentUser && !currentUser.emailVerified && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-2xl">
            <MailCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Please verify your email address (<strong>{currentUser.email}</strong>) to keep your account secure.
            </span>
          </div>
          <button
            onClick={handleResendEmail}
            className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0 ml-3"
          >
            {verificationEmailSent ? 'Email Sent!' : 'Resend link'}
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onJoin={() => {
              setAuthModalMode('register');
              setAuthModalOpen(true);
            }}
            onExplore={() => {
              if (currentUser) {
                setCurrentView('discover');
              } else {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }
            }}
            onOpenGuidelines={() => setGuidelinesModalOpen(true)}
          />
        )}

        {currentView === 'feed' && (
          <FeedView
            onStartChatWithUser={handleStartChatWithUser}
            onViewProfile={(u) => setInspectedUser(u)}
            onReportPost={handleReportPost}
          />
        )}

        {currentView === 'discover' && (
          <DiscoverView
            onStartChatWithUser={handleStartChatWithUser}
            onViewProfile={(u) => setInspectedUser(u)}
            onReportUser={handleReportUser}
          />
        )}

        {currentView === 'chats' && (
          <ChatView
            initialActiveConversationId={chatConversationId}
            initialTargetUser={chatTargetUser}
            onBackToDiscover={() => setCurrentView('discover')}
            onReportUser={handleReportUser}
            onViewProfile={(u) => setInspectedUser(u)}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            onNavigateToChat={(convId) => {
              if (convId) setChatConversationId(convId);
              setCurrentView('chats');
            }}
            onNavigateToPost={() => {
              setCurrentView('feed');
            }}
          />
        )}

        {currentView === 'profile' && (
          <MyProfileView
            onGoToSettings={() => setCurrentView('settings')}
            onGoToFeed={() => setCurrentView('feed')}
          />
        )}

        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation for logged in users */}
      {currentUser && (
        <MobileBottomNav
          currentView={currentView}
          setCurrentView={setCurrentView}
          unreadMessagesCount={unreadMessagesCount}
          onOpenCreatePost={() => setCurrentView('feed')}
        />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      <UserProfileModal
        user={inspectedUser}
        onClose={() => setInspectedUser(null)}
        onMessageUser={handleStartChatWithUser}
        onReportUser={handleReportUser}
        onBlockUser={async (u) => {
          // Block user
          if (currentUser) {
            const confirmed = window.confirm(`Block @${u.username}?`);
            if (confirmed) {
              const { blockUser } = await import('./services/safetyService');
              await blockUser(currentUser.uid, u.userId);
            }
          }
        }}
      />

      <ReportModal
        isOpen={reportModalData.isOpen}
        onClose={() =>
          setReportModalData((prev) => ({ ...prev, isOpen: false }))
        }
        targetType={reportModalData.targetType}
        targetId={reportModalData.targetId}
        targetUserId={reportModalData.targetUserId}
        targetContent={reportModalData.targetContent}
      />

      <AdminModerationModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      <SafetyGuidelinesModal
        isOpen={guidelinesModalOpen}
        onClose={() => setGuidelinesModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
