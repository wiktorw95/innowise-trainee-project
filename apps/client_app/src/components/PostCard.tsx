'use client';
import { useState } from 'react';
import { Post } from '@/types/post';
import { api } from '@/lib/axios';
import { useAuth } from '@/store/useAuth';
import { Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react';

const MEDIA_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function PostCard({
  post,
  onDelete,
}: {
  post: Post;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post._count.postsLikes);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    try {
      await api.post(`/posts/${post.id}/like`);
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

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl pb-4 mb-6 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-[2px]">
            <div className="bg-white rounded-full p-[2px] w-full h-full">
              {post.profile.avatarUrl ? (
                <img
                  src={post.profile.avatarUrl}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full text-gray-500 font-bold text-xs uppercase">
                  {post.profile.username.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <span className="font-semibold text-sm text-gray-900">
            {post.profile.username}
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
      {post.postsAssets.length > 0 && (
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
          <button className="hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6 text-gray-800" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <Send className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <p className="font-semibold text-sm text-gray-900 mb-1.5">
          {likes} likes
        </p>

        <p className="text-sm text-gray-800">
          <span className="font-semibold mr-2 text-gray-900">
            {post.profile.username}
          </span>
          {post.content}
        </p>

        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mt-3">
          {new Date(post.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
