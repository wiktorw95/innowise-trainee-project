import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Comment } from '@/types/comment';
import { useAuth } from '@/store/useAuth';

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onLike: (id: string, isLiked: boolean, likes: number) => void;
  onReply: (id: string, username: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function CommentItem({
  comment,
  isReply = false,
  onLike,
  onReply,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const likes = comment._count?.commentsLikes || 0;
  const isLiked = comment.isLikedByMe || false;

  const handleSave = () => {
    onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-11 mt-3' : 'mt-4'}`}>
      <div
        className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gray-200 shrink-0 overflow-hidden`}
      >
        {comment.profile.avatarUrl ? (
          <img
            src={comment.profile.avatarUrl}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">
            {comment.profile.username.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex flex-col w-full">
        {isEditing ? (
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              onClick={handleSave}
              className="text-blue-500 text-xs font-bold uppercase"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="text-gray-400 text-xs font-bold uppercase"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2">
            <span className="font-semibold text-sm text-gray-900 mr-2">
              {comment.profile.username}
            </span>
            <span className="text-sm text-gray-800">{comment.content}</span>
          </div>
        )}

        <div className="flex items-center gap-4 mt-1 ml-2">
          <span className="text-[10px] text-gray-400 font-semibold uppercase">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>

          <button
            onClick={() => onLike(comment.id, isLiked, likes)}
            className="flex items-center gap-1 group"
          >
            <Heart
              className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-400'}`}
            />
            {likes > 0 && (
              <span
                className={`text-[10px] font-semibold ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
              >
                {likes}
              </span>
            )}
          </button>

          {!isReply && (
            <button
              onClick={() => onReply(comment.id, comment.profile.username)}
              className="text-[10px] text-gray-500 font-bold uppercase hover:text-gray-900"
            >
              Reply
            </button>
          )}

          {user?.id === comment.created_by && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-gray-500 font-bold uppercase hover:text-gray-900"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this comment?')) onDelete(comment.id);
                }}
                className="text-[10px] text-gray-500 font-bold uppercase hover:text-red-500"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
