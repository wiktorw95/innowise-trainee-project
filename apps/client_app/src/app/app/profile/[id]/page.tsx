'use client';
import { useEffect, useState, use } from 'react'; // <-- IMPORT 'use'
import { api } from '@/lib/axios';
import { Grid3X3, UserPlus } from 'lucide-react';
import { Profile, Post } from '@/types/post';

const MEDIA_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Note: params is now technically a Promise in Next 15+
export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Unwrap the params using React.use()
  const { id } = use(params);

  const [profileData, setProfileData] = useState<
    (Profile & { bio?: string; _count?: { posts: number } }) | null
  >(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safety check in case the unwrapped ID is somehow missing
    if (!id) return;

    const fetchUser = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${id}`), // Use the unwrapped ID
          api.get(`/posts/user/${id}`), // Use the unwrapped ID
        ]);

        setProfileData(
          profileRes.data.user || profileRes.data.profile || profileRes.data
        );

        const fetchedPosts = postsRes.data?.data || postsRes.data;
        setUserPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
      } catch (e) {
        console.error('Failed to fetch public profile:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]); // Depend on the unwrapped ID

  if (isLoading)
    return (
      <div className="text-center py-20 text-gray-500 animate-pulse">
        Loading profile...
      </div>
    );
  if (!profileData)
    return (
      <div className="text-center py-20 text-gray-500">User not found.</div>
    );

  return (
    <div className="w-full max-w-[935px] mx-auto pt-12 px-4 flex flex-col items-center relative pb-20">
      {/* Avatar */}
      <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 mb-5 shadow-sm">
        <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white bg-gray-200">
          {profileData.avatarUrl ? (
            <img
              src={profileData.avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-gray-300 text-white uppercase">
              {profileData.username?.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Typography */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {profileData.username}
      </h1>
      <p className="text-sm font-medium text-gray-500 mb-4">
        {profileData.displayName}
      </p>
      <p className="text-center text-sm text-gray-800 max-w-md mb-6 whitespace-pre-wrap leading-relaxed">
        {profileData.bio || 'No bio yet.'}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-2 rounded-full text-sm transition-colors shadow-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Follow
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex justify-center gap-12 w-full max-w-md border-t border-gray-200 pt-6 mb-8">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-gray-900">
            {userPosts.length}
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">
            Posts
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-gray-900">0</span>
          <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">
            Followers
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-gray-900">0</span>
          <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">
            Following
          </span>
        </div>
      </div>

      <div className="w-full border-t border-gray-200 flex justify-center gap-12 uppercase text-xs font-semibold tracking-widest text-gray-500">
        <div className="py-4 border-t border-gray-900 text-gray-900 flex items-center gap-2 -mt-[1px]">
          <Grid3X3 className="w-3 h-3" /> Posts
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-2 mt-2 w-full">
        {userPosts.map((post) => (
          <div
            key={post.id}
            className="aspect-square bg-gray-100 cursor-pointer overflow-hidden relative group"
          >
            {post.postsAssets && post.postsAssets.length > 0 ? (
              <img
                src={encodeURI(
                  `${MEDIA_URL.replace(/\/$/, '')}/${post.postsAssets[0].assets.file_path.replace(/\\/g, '/').replace(/^\/?/, '')}`
                )}
                alt="Post thumbnail"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
