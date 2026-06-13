export interface CommentProfile {
  username: string;
  displayName?: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  created_by: string;
  created_at: string;
  parent_comment_id: string | null;
  isLikedByMe: boolean;
  profile: CommentProfile;
  _count: { commentsLikes: number; replies?: number };
  replies?: Comment[];
}
