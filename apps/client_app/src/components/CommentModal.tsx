'use client';
import { useState, useEffect } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { useComments } from '@/hooks/useComments';
import { CommentItem } from './CommentItem';

interface CommentModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
  onLastCommentDeleted?: () => void;
}

export function CommentModal({
  postId,
  isOpen,
  onClose,
  onCommentAdded,
  onCommentDeleted,
  onLastCommentDeleted,
}: CommentModalProps) {
  const { user } = useAuth();
  const {
    comments,
    isLoading,
    fetchComments,
    addComment,
    toggleLike,
    editComment,
    deleteComment,
  } = useComments(postId);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      setReplyingTo(null);
    }
  }, [isOpen, postId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    await addComment(newComment, replyingTo?.id);
    setNewComment('');
    setReplyingTo(null);
    onCommentAdded();
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const wasLast = await deleteComment(id, user?.id);
    onCommentDeleted();
    if (wasLast && onLastCommentDeleted) {
      setTimeout(onLastCommentDeleted, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Comments</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-gray-50/50">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
              <p className="font-semibold text-gray-900">No comments yet.</p>
              <p className="text-sm">Start the conversation.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  onLike={toggleLike}
                  onReply={(id, username) => setReplyingTo({ id, username })}
                  onEdit={editComment}
                  onDelete={handleDelete}
                />
                {comment.replies?.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                    onLike={toggleLike}
                    onReply={() => {}}
                    onEdit={editComment}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <div className="p-3 border-t border-gray-100 bg-white">
          {replyingTo && (
            <div className="flex items-center justify-between bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-t-lg -mt-3 mb-2 mx-1">
              <span>Replying to @{replyingTo.username}</span>
              <button onClick={() => setReplyingTo(null)}>
                <X className="w-3.5 h-3.5 hover:text-blue-800" />
              </button>
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 relative"
          >
            <input
              type="text"
              autoFocus={!!replyingTo}
              placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`w-full bg-gray-100 border-transparent focus:bg-white focus:border-gray-300 focus:ring-0 py-2.5 pl-4 pr-12 text-sm outline-none ${replyingTo ? 'rounded-b-lg rounded-t-none' : 'rounded-full'}`}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute right-2 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
