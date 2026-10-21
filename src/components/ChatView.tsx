import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Flag,
  Shield,
  Smile,
  CheckCheck,
  Check,
  MessageCircle,
  Sparkles,
  Heart,
  Image as ImageIcon,
  X,
  Camera,
  AlertCircle,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, Message, UserProfile } from '../types';
import {
  listenToConversations,
  listenToMessages,
  sendMessage,
  markConversationAsRead
} from '../services/chatService';
import { blockUser } from '../services/safetyService';
import { processChatImage, validateChatImageFile } from '../services/chatImageService';

interface ChatViewProps {
  initialActiveConversationId?: string | null;
  initialTargetUser?: UserProfile | null;
  onBackToDiscover: () => void;
  onReportUser: (user: UserProfile) => void;
  onViewProfile: (user: UserProfile) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialActiveConversationId,
  initialTargetUser,
  onBackToDiscover,
  onReportUser,
  onViewProfile,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialActiveConversationId || null
  );
  const [activePartner, setActivePartner] = useState<UserProfile | null>(
    initialTargetUser || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [quickEmojiBarOpen, setQuickEmojiBarOpen] = useState(false);

  // Photo staging & compression state
  const [stagedPhoto, setStagedPhoto] = useState<{
    dataUrl: string;
    thumbnailUrl: string;
    name: string;
    sizeKb: number;
  } | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [viewingModalImage, setViewingModalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Listen to user's conversations
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = listenToConversations(currentUser.uid, (convs) => {
      setConversations(convs);

      // If active conversation is selected, ensure partner details are synced
      if (activeConversationId) {
        const found = convs.find((c) => c.id === activeConversationId);
        if (found && !activePartner) {
          const partnerId = found.participants.find((p) => p !== currentUser.uid);
          if (partnerId && found.participantDetails?.[partnerId]) {
            const pd = found.participantDetails[partnerId];
            setActivePartner({
              userId: partnerId,
              displayName: pd.displayName,
              username: pd.username,
              photoURL: pd.photoURL,
              isOnline: pd.isOnline,
              lastActive: pd.lastActive,
              createdAt: new Date(),
              email: ''
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeConversationId, activePartner]);

  // 2. Listen to messages for active conversation
  useEffect(() => {
    if (!activeConversationId || !currentUser) {
      setMessages([]);
      return;
    }

    // Mark as read
    markConversationAsRead(activeConversationId, currentUser.uid);

    const unsubscribe = listenToMessages(activeConversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 50);
    });

    return () => unsubscribe();
  }, [activeConversationId, currentUser]);

  const handleSelectConversation = (conv: Conversation) => {
    if (!currentUser) return;
    setActiveConversationId(conv.id);

    const partnerId = conv.participants.find((p) => p !== currentUser.uid);
    if (partnerId && conv.participantDetails?.[partnerId]) {
      const pd = conv.participantDetails[partnerId];
      setActivePartner({
        userId: partnerId,
        displayName: pd.displayName,
        username: pd.username,
        photoURL: pd.photoURL,
        isOnline: pd.isOnline,
        lastActive: pd.lastActive,
        createdAt: new Date(),
        email: ''
      });
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setChatError(null);
    const validation = validateChatImageFile(file);
    if (!validation.valid) {
      setChatError(validation.error || 'Invalid photo format.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessingPhoto(true);
    setPhotoProgress(10);

    try {
      const processed = await processChatImage(file, (p) => setPhotoProgress(p));
      setStagedPhoto({
        dataUrl: processed.dataUrl,
        thumbnailUrl: processed.thumbnailUrl,
        name: file.name,
        sizeKb: processed.sizeKb
      });
    } catch (err: any) {
      setChatError(err.message || 'Failed to process selected photo.');
    } finally {
      setIsProcessingPhoto(false);
      setPhotoProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveStagedPhoto = () => {
    setStagedPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = Boolean(inputText.trim());
    const hasPhoto = Boolean(stagedPhoto);

    if (
      (!hasText && !hasPhoto) ||
      !activeConversationId ||
      !userProfile ||
      !activePartner ||
      isSending ||
      isProcessingPhoto
    ) {
      return;
    }

    const textToSend = inputText.trim();
    const photoToSend = stagedPhoto;

    setInputText('');
    setStagedPhoto(null);
    setIsSending(true);
    setChatError(null);

    try {
      await sendMessage(
        activeConversationId,
        userProfile,
        activePartner.userId,
        {
          text: textToSend || undefined,
          imageUrl: photoToSend?.dataUrl,
          thumbnailUrl: photoToSend?.thumbnailUrl,
          imageFileName: photoToSend?.name
        }
      );
      scrollToBottom();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setInputText(textToSend);
      if (photoToSend) setStagedPhoto(photoToSend);
      setChatError(err.message || 'Failed to deliver message. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  const handleBlockPartner = async () => {
    if (!currentUser || !activePartner) return;
    const confirmed = window.confirm(`Block @${activePartner.username}?`);
    if (!confirmed) return;
    try {
      await blockUser(currentUser.uid, activePartner.userId);
      setActiveConversationId(null);
      setActivePartner(null);
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to block partner:', err);
    }
  };

  const quickEmojis = ['❤️', '✨', '🌸', '☕', '🌟', '😊', '🕊️'];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-5rem)]">
      <div className="bg-white dark:bg-[#1E1120] rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-lg h-full flex overflow-hidden">
        {/* Left Pane: Conversation List (hidden on mobile if active conversation selected) */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-rose-100 dark:border-rose-950/60 flex flex-col ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-rose-100 dark:border-rose-950/60 flex items-center justify-between">
            <h2 className="font-bold font-serif-romantic text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-rose-500" />
              <span>Private Messages</span>
            </h2>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-rose-50 dark:divide-rose-950/30">
            {conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Heart className="w-8 h-8 text-rose-300 dark:text-rose-700 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  No Conversations Yet
                </p>
                <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px] mx-auto">
                  Find people on the Discover page and send a gentle hello.
                </p>
                <button
                  onClick={onBackToDiscover}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
                >
                  Explore Discover
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const partnerId = conv.participants.find((p) => p !== currentUser?.uid);
                const partnerInfo = partnerId ? conv.participantDetails?.[partnerId] : null;
                const unread = conv.unreadCounts?.[currentUser?.uid || ''] || 0;
                const isSelected = conv.id === activeConversationId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/50'
                        : 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={
                          partnerInfo?.photoURL ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-100 dark:ring-rose-900"
                      />
                      {partnerInfo?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1E1120]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                          {partnerInfo?.displayName || 'Kind Stranger'}
                        </span>
                        {unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {conv.lastMessageImageUrl && (
                          <img
                            src={conv.lastMessageImageUrl}
                            alt="Preview thumbnail"
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-rose-200 dark:ring-rose-800 shrink-0"
                          />
                        )}
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex-1">
                          {conv.lastMessageText || 'Started a conversation'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Room */}
        <div
          className={`flex-1 flex flex-col bg-rose-50/10 dark:bg-[#1A0E1C]/40 ${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversationId && activePartner ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 bg-white/90 dark:bg-[#1E1120]/90 backdrop-blur-md border-b border-rose-100 dark:border-rose-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div
                    onClick={() => onViewProfile(activePartner)}
                    className="relative cursor-pointer group"
                  >
                    <img
                      src={
                        activePartner.photoURL ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={activePartner.displayName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-200 dark:ring-rose-900 group-hover:scale-105 transition-transform"
                    />
                    {activePartner.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1E1120]" />
                    )}
                  </div>

                  <div
                    onClick={() => onViewProfile(activePartner)}
                    className="cursor-pointer"
                  >
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white hover:text-rose-600 transition-colors">
                      {activePartner.displayName}
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      {activePartner.isOnline ? (
                        <span className="text-emerald-500 font-medium">Active now</span>
                      ) : (
                        `@${activePartner.username}`
                      )}
                    </p>
                  </div>
                </div>

                {/* Dropdown menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#251528] rounded-2xl shadow-xl border border-rose-100 dark:border-rose-900/60 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            onViewProfile(activePartner);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                        >
                          <Sparkles className="w-4 h-4 text-rose-500" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            onReportUser(activePartner);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left"
                        >
                          <Flag className="w-4 h-4" />
                          <span>Report Conversation</span>
                        </button>
                        <button
                          onClick={handleBlockPartner}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Block User</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Messages stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                {messages.length === 0 ? (
                  <div className="text-center py-12 px-4 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 mx-auto mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Say hello to {activePartner.displayName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Start your conversation with kindness, curious questions, or share a photo.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentUser?.uid;

                    let timeString = '';
                    if (msg.createdAt?.toDate) {
                      timeString = msg.createdAt.toDate().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md p-2.5 sm:p-3 rounded-2xl text-xs sm:text-sm shadow-xs ${
                            isMine
                              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white rounded-br-xs'
                              : 'bg-white dark:bg-[#251528] text-neutral-800 dark:text-neutral-100 border border-rose-100 dark:border-rose-950/60 rounded-bl-xs'
                          }`}
                        >
                          {/* Image message */}
                          {msg.imageUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden cursor-pointer group/img relative bg-black/10">
                              <img
                                src={msg.imageUrl}
                                alt="Shared photo"
                                onClick={() => setViewingModalImage(msg.imageUrl || null)}
                                className="w-full h-auto max-h-72 object-cover rounded-xl transition-transform group-hover/img:scale-[1.01]"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                                  Tap to expand
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Text caption or message */}
                          {msg.text && (
                            <p className="whitespace-pre-wrap break-words leading-relaxed px-1">
                              {msg.text}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-1 px-1">
                          <span>{timeString}</span>
                          {isMine && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-rose-500" />
                              ) : (
                                <Check className="w-3 h-3 text-neutral-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Emojis */}
              {quickEmojiBarOpen && (
                <div className="px-4 py-1.5 bg-white/80 dark:bg-[#1E1120]/80 border-t border-rose-50 dark:border-rose-950/40 flex items-center gap-2">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        setQuickEmojiBarOpen(false);
                      }}
                      className="text-base hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Photo Staging Preview */}
              {stagedPhoto && (
                <div className="px-4 py-2.5 bg-rose-50/80 dark:bg-[#251528] border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-rose-200 dark:border-rose-800 shrink-0">
                      <img
                        src={stagedPhoto.dataUrl}
                        alt="Staged"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        Photo ready to send
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {stagedPhoto.sizeKb} KB • Add an optional caption below
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveStagedPhoto}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Processing/Compressing Progress */}
              {isProcessingPhoto && (
                <div className="px-4 py-2 bg-rose-50/60 dark:bg-rose-950/40 border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between text-xs text-rose-600 dark:text-rose-300 animate-in fade-in">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing photo for secure delivery...</span>
                  </span>
                  {photoProgress !== null && <span className="font-semibold">{photoProgress}%</span>}
                </div>
              )}

              {/* Chat Error Toast */}
              {chatError && (
                <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/80 border-t border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{chatError}</span>
                  </span>
                  <button
                    onClick={() => setChatError(null)}
                    className="p-0.5 text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 bg-white dark:bg-[#1E1120] border-t border-rose-100 dark:border-rose-950/60 flex items-center gap-2"
              >
                {/* Native gallery / camera file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto || isSending}
                  className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Send Photo from Gallery or Computer"
                >
                  <ImageIcon className="w-5 h-5 text-rose-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setQuickEmojiBarOpen(!quickEmojiBarOpen)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    stagedPhoto
                      ? "Add a caption (optional)..."
                      : "Write a warm, thoughtful message..."
                  }
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
                />

                <button
                  type="submit"
                  disabled={
                    (!inputText.trim() && !stagedPhoto) ||
                    isSending ||
                    isProcessingPhoto
                  }
                  className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4 shadow-xs">
                <Heart className="w-8 h-8 fill-rose-500/20" />
              </div>
              <h3 className="text-xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Select a Conversation
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
                Choose someone from your message list or discover new members to start a private conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {viewingModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setViewingModalImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingModalImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={viewingModalImage}
              alt="Shared full size"
              className="max-h-[82vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
            />

            <div className="mt-3 flex items-center gap-3">
              <a
                href={viewingModalImage}
                download="soulconnect_photo.jpg"
                className="px-4 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Photo</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
