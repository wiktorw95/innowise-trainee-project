'use client';
import { useState, useEffect } from 'react';
import { Post } from '@/types/post';
import { api } from '@/lib/axios';
import { useAuth } from '@/store/useAuth';
import { Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import { CommentModal } from '@/components/CommentModal';

const MEDIA_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function PostCard({
  post,
  onDelete,
  onUnlike,
  onUncomment,
}: {
  post: Post;
  onDelete: (id: string) => void;
  onUnlike?: (id: string) => void;
  onUncomment?: (id: string) => void;
}) {
  const { user } = useAuth();

  // Local state synced with props
  const [likes, setLikes] = useState(post._count?.postsLikes || 0);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
  const [commentCount, setCommentCount] = useState(post._count?.comment || 0);

  // UI states
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(post.content);
  const [editValue, setEditValue] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLikes(post._count?.postsLikes || 0);
    setIsLiked(post.isLikedByMe || false);
    setCommentCount(post._count?.comment || 0);
  }, [post._count?.postsLikes, post.isLikedByMe, post._count?.comment]);

  const handleLike = async () => {
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikes((prev) => (nextIsLiked ? prev + 1 : prev - 1));

    try {
      await api.post(`/posts/${post.id}/like`);

      if (!nextIsLiked && onUnlike) {
        setTimeout(() => onUnlike(post.id), 300);
      }
    } catch {
      setIsLiked(isLiked);
      setLikes((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete(post.id);
    } catch {
      alert('Failed to delete post');
    }
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim() || editValue === currentContent) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/posts/${post.id}`, { content: editValue });
      setCurrentContent(editValue);
      setIsEditing(false);
    } catch {
      alert('Failed to edit post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl pb-4 mb-6 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-[2px]">
            <div className="bg-white rounded-full p-[2px] w-full h-full">
              {post.profile?.avatarUrl ? (
                <img
                  src={post.profile.avatarUrl}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full text-gray-500 font-bold text-xs uppercase">
                  {post.profile?.username?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </div>
          <span className="font-semibold text-sm text-gray-900">
            {post.profile?.username}
          </span>
        </div>

        {/* Dropdown Menu */}
        {user?.id === post.created_by && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-gray-900 transition-colors p-1"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-100 shadow-md rounded-lg z-10 w-28 overflow-hidden">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Image */}
      {post.postsAssets && post.postsAssets.length > 0 && (
        <div className="w-full bg-gray-50 flex justify-center overflow-hidden">
          <img
            src={encodeURI(
              `${MEDIA_URL.replace(/\/$/, '')}/${post.postsAssets[0].assets.file_path.replace(/\\/g, '/').replace(/^\/?/, '')}`
            )}
            className="w-full h-auto max-h-[600px] object-contain"
            alt="Post content"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Post Actions & Content */}
      <div className="px-4 pt-3">
        <div className="flex gap-4 mb-3">
          <button
            onClick={handleLike}
            className="hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-800'}`}
            />
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setShowComments(true)}
            className="hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6 text-gray-800" />
          </button>

          <button className="hover:scale-110 transition-transform">
            <Send className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <p className="font-semibold text-sm text-gray-900 mb-1.5">
          {likes} likes {commentCount > 0 && `• ${commentCount} comments`}
        </p>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(currentContent);
                }}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800">
            <span className="font-semibold mr-2 text-gray-900">
              {post.profile?.username}
            </span>
            {currentContent}
          </p>
        )}

        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mt-3">
          {new Date(post.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* --- Comment Modal --- */}
      <CommentModal
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
        onCommentDeleted={() =>
          setCommentCount((prev) => Math.max(0, prev - 1))
        }
        onLastCommentDeleted={() => {
          if (onUncomment) onUncomment(post.id);
        }}
      />
    </div>
  );
}
