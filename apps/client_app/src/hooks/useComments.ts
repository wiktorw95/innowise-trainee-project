import { useState, useCallback } from 'react';
import { api } from '@/lib/axios';
import { Comment } from '@/types/comment';

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/posts/${postId}/comments`);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Helper for deep nested updates
  const updateComment = useCallback(
    (targetId: string, updater: (c: Comment) => Comment) => {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === targetId) return updater(c);
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === targetId ? updater(r) : r
              ),
            };
          }
          return c;
        })
      );
    },
    []
  );

  const addComment = async (content: string, parentId?: string) => {
    const { data } = await api.post(`/posts/${postId}/comments`, {
      content,
      parent_comment_id: parentId,
    });

    if (parentId) {
      updateComment(parentId, (c) => ({
        ...c,
        replies: [...(c.replies || []), data],
      }));
    } else {
      setComments((prev) => [...prev, { ...data, replies: [] }]);
    }
  };

  const toggleLike = async (
    commentId: string,
    currentIsLiked: boolean,
    currentLikes: number
  ) => {
    const nextIsLiked = !currentIsLiked;
    updateComment(commentId, (c) => ({
      ...c,
      isLikedByMe: nextIsLiked,
      _count: {
        ...c._count,
        commentsLikes: nextIsLiked ? currentLikes + 1 : currentLikes - 1,
      },
    }));

    try {
      await api.post(`/posts/comments/${commentId}/like`);
    } catch {
      updateComment(commentId, (c) => ({
        // Revert on fail
        ...c,
        isLikedByMe: currentIsLiked,
        _count: { ...c._count, commentsLikes: currentLikes },
      }));
    }
  };

  const editComment = async (commentId: string, content: string) => {
    const { data } = await api.patch(`/posts/comments/${commentId}`, {
      content,
    });
    updateComment(commentId, (c) => ({ ...c, content: data.content }));
  };

  const deleteComment = async (commentId: string, userId?: string) => {
    await api.delete(`/posts/comments/${commentId}`);

    // Check if it was the last comment for the feed sync
    const myComments = comments
      .flatMap((c) => [c, ...(c.replies || [])])
      .filter((c) => c.created_by === userId);
    const wasLast = myComments.length === 1;

    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== commentId) || [],
        }))
    );

    return wasLast; 
  };

  return {
    comments,
    isLoading,
    fetchComments,
    addComment,
    toggleLike,
    editComment,
    deleteComment,
  };
}
