export interface Asset {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}
export interface PostAsset {
  post_id: string;
  asset_id: string;
  assets: Asset;
}
export interface Profile {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Post {
  id: string;
  content: string;
  isArchived: boolean;
  created_at: string;
  created_by: string;
  profile: Profile;
  postsAssets: PostAsset[];
  _count: { postsLikes: number; comment: number };
  isLikedByMe?: boolean;
}