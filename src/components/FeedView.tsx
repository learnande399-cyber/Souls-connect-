import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Flag,
  Image as ImageIcon,
  Sparkles,
  Send,
  MoreVertical,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Post, Comment, UserProfile } from '../types';
import {
  createPost,
  listenToPosts,
  toggleLikePost,
  checkUserLikedPost,
  addComment,
  listenToComments,
  deletePost,
  deleteComment
} from '../services/postService';
import { POST_MOODS } from '../utils/constants';

interface FeedViewProps {
  onStartChatWithUser: (user: UserProfile) => void;
  onViewProfile: (user: UserProfile) => void;
  onReportPost: (post: Post) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  onStartChatWithUser,
  onViewProfile,
  onReportPost,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // New post composer state
  const [postContent, setPostContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(POST_MOODS[0]);
  const [postImageUrl, setPostImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Expanded post comments state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [likedPostsMap, setLikedPostsMap] = useState<{ [postId: string]: boolean }>({});
  const [actionMenuPostId, setActionMenuPostId] = useState<string | null>(null);

  // Listen to community posts
  useEffect(() => {
    const unsubscribe = listenToPosts((allPosts) => {
      setPosts(allPosts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check like states for posts
  useEffect(() => {
    if (!currentUser || posts.length === 0) return;
    posts.forEach(async (post) => {
      const isLiked = await checkUserLikedPost(post.id, currentUser.uid);
      setLikedPostsMap((prev) => ({ ...prev, [post.id]: isLiked }));
    });
  }, [posts, currentUser]);

  // Listen to comments for currently expanded post
  useEffect(() => {
    if (!expandedPostId) return;
    const unsubscribe = listenToComments(expandedPostId, (comments) => {
      setCommentsMap((prev) => ({ ...prev, [expandedPostId]: comments }));
    });
    return () => unsubscribe();
  }, [expandedPostId]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !currentUser || isPublishing) return;

    const hasText = Boolean(postContent.trim());
    const hasImageUrl = Boolean(postImageUrl.trim());

    if (!hasText && !hasImageUrl) {
      setComposerError('Please write a thought or enter an image URL to publish.');
      return;
    }

    setIsPublishing(true);
    setComposerError(null);

    try {
      await createPost(
        userProfile,
        postContent.trim(),
        selectedMood,
        postImageUrl.trim() || undefined
      );

      // Reset form
      setPostContent('');
      setPostImageUrl('');
      setShowImageInput(false);
    } catch (err: any) {
      console.error('Post creation error:', err);
      setComposerError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!userProfile) return;
    const currentlyLiked = Boolean(likedPostsMap[post.id]);
    // Optimistic update
    setLikedPostsMap((prev) => ({ ...prev, [post.id]: !currentlyLiked }));
    try {
      await toggleLikePost(post.id, userProfile, post.authorId);
    } catch {
      // Revert on error
      setLikedPostsMap((prev) => ({ ...prev, [post.id]: currentlyLiked }));
    }
  };

  const handleAddComment = async (postId: string, postAuthorId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!userProfile || !text) return;

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    try {
      await addComment(postId, userProfile, text, postAuthorId);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;
    try {
      await deletePost(postId);
      setActionMenuPostId(null);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteComment(postId, commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Create Post Card */}
      {userProfile && (
        <div className="bg-white dark:bg-[#1E1120] rounded-3xl p-5 sm:p-6 border border-rose-100 dark:border-rose-950/60 shadow-sm mb-8">
          <div className="flex items-start gap-3.5 mb-3">
            <img
              src={
                userProfile.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
              }
              alt={userProfile.displayName}
              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-rose-200 dark:ring-rose-900 shrink-0"
            />
            <div className="flex-1">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                {userProfile.displayName}
              </span>
              <span className="text-[11px] text-rose-500/80">
                Share a thought with the community
              </span>
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-3">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What is on your mind today? Share a musing, question, or story..."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none transition-all"
            />

            {/* Image URL input field */}
            {showImageInput && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={postImageUrl}
                      onChange={(e) => setPostImageUrl(e.target.value)}
                      placeholder="Paste image link (e.g. https://images.unsplash.com/...)"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  {postImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPostImageUrl('')}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      title="Clear image URL"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Live Preview of linked image URL */}
                {postImageUrl.trim() && (
                  <div className="relative rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-950/60 max-h-60 bg-neutral-900/5 dark:bg-black/30">
                    <img
                      src={postImageUrl.trim()}
                      alt="Linked preview"
                      className="w-full h-auto max-h-60 object-contain rounded-2xl"
                      onError={() => {
                        // Keep URL but user can see it fails to load
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {composerError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{composerError}</span>
              </div>
            )}

            {/* Composer Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-rose-50 dark:border-rose-950/40">
              <div className="flex items-center gap-2.5">
                {/* Button to attach/paste image URL */}
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    showImageInput || postImageUrl
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/40 hover:bg-rose-100'
                  }`}
                  title="Attach Photo URL"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{showImageInput ? 'Image URL' : 'Add Image URL'}</span>
                </button>

                {/* Mood Tag Selector */}
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-rose-100 dark:border-neutral-800 bg-rose-50/40 dark:bg-[#251528] text-rose-600 dark:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  {POST_MOODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Publish Post Button */}
              <button
                type="submit"
                disabled={(!postContent.trim() && !postImageUrl.trim()) || isPublishing}
                className="px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 shadow-md shadow-rose-500/25 disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
              >
                {isPublishing ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white/70 dark:bg-[#1E1120]/70 border border-rose-100 dark:border-rose-950/40 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-neutral-800" />
                <div className="h-4 bg-rose-100 dark:bg-neutral-800 rounded-md w-1/4" />
              </div>
              <div className="h-16 bg-rose-50 dark:bg-neutral-900 rounded-xl" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/50 dark:bg-[#1E1120]/50 rounded-3xl border border-rose-100 dark:border-rose-950/40">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif-romantic text-neutral-800 dark:text-neutral-200">
            No Musings Shared Yet
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Be the first kindred soul to post a thought, question, or story above!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const isAuthor = currentUser?.uid === post.authorId;
            const canDelete = isAuthor || isAdmin;
            const isLiked = Boolean(likedPostsMap[post.id]);
            const isExpanded = expandedPostId === post.id;
            const postComments = commentsMap[post.id] || [];

            let dateString = '';
            if (post.createdAt?.toDate) {
              dateString = post.createdAt.toDate().toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-[#1E1120] rounded-3xl p-5 sm:p-6 border border-rose-100 dark:border-rose-950/60 shadow-xs hover:border-rose-200 dark:hover:border-rose-900 transition-all"
              >
                {/* Author Info & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        post.authorAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={post.authorName}
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-rose-100 dark:ring-rose-900"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {post.authorName}
                        </span>
                        <span className="text-xs text-rose-500/80">
                          @{post.authorUsername}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>{dateString || 'Just now'}</span>
                        {post.category && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-medium">
                              {post.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActionMenuPostId(actionMenuPostId === post.id ? null : post.id)
                      }
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {actionMenuPostId === post.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setActionMenuPostId(null)}
                        />
                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#251528] rounded-xl shadow-lg border border-rose-100 dark:border-rose-900/60 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              onReportPost(post);
                              setActionMenuPostId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                          >
                            <Flag className="w-3.5 h-3.5 text-amber-500" />
                            <span>Report Post</span>
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed mb-3">
                  {post.content}
                </p>

                {/* Optional Image */}
                {post.imageUrl && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-950/40 max-h-96">
                    <img
                      src={post.imageUrl}
                      alt="Post visual"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Footer Reactions */}
                <div className="flex items-center gap-4 pt-3 border-t border-rose-50 dark:border-rose-950/40 text-xs">
                  {/* Like Button */}
                  <button
                    onClick={() => handleToggleLike(post)}
                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all active:scale-95 ${
                      isLiked
                        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 font-semibold'
                        : 'text-neutral-500 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-transform ${
                        isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                      }`}
                    />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  {/* Comment Toggle */}
                  <button
                    onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-neutral-500 hover:text-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentsCount || 0} Comments</span>
                  </button>
                </div>

                {/* Expanded Comments Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-rose-50 dark:border-rose-950/40 space-y-3 animate-in fade-in duration-150">
                    {/* Add Comment Input */}
                    {userProfile && (
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            userProfile.photoURL ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt="Me"
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-rose-200 shrink-0"
                        />
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id, post.authorId);
                              }
                            }}
                            placeholder="Write a kind comment..."
                            maxLength={500}
                            className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id, post.authorId)}
                            className="absolute right-2 p-1 text-rose-500 hover:text-rose-600"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {postComments.length === 0 ? (
                        <p className="text-[11px] text-neutral-400 text-center py-2">
                          No comments yet. Share your thoughts!
                        </p>
                      ) : (
                        postComments.map((comment) => {
                          const canDeleteComm =
                            currentUser?.uid === comment.authorId ||
                            currentUser?.uid === post.authorId ||
                            isAdmin;

                          return (
                            <div
                              key={comment.id}
                              className="p-2.5 rounded-xl bg-rose-50/30 dark:bg-neutral-900/40 flex items-start justify-between gap-2 group"
                            >
                              <div className="flex items-start gap-2">
                                <img
                                  src={
                                    comment.authorAvatar ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                                  }
                                  alt={comment.authorName}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-neutral-900 dark:text-white">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">
                                      @{comment.authorUsername}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5 whitespace-pre-wrap">
                                    {comment.text}
                                  </p>
                                </div>
                              </div>

                              {canDeleteComm && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 p-1 transition-opacity"
                                  title="Delete Comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
