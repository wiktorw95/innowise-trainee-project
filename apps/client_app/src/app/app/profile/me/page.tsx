'use client';
import { useAuth } from '@/store/useAuth';
import { api } from '@/lib/axios';
import { useEffect, useState } from 'react';
import { Settings, Grid3X3, X } from 'lucide-react';
import { Profile, Post } from '@/types/post';

const MEDIA_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<
    (Profile & { bio?: string; id: string; _count?: { posts: number } }) | null
  >(null);

  const [myPosts, setMyPosts] = useState<Post[]>([]);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${user.id}`),
          api.get('/posts/me'),
        ]);

        setProfileData(
          profileRes.data.user || profileRes.data.profile || profileRes.data
        );

        // Safely extract the array
        const fetchedPosts = postsRes.data?.data || postsRes.data;
        setMyPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
      } catch (e) {
        console.error('Failed to fetch data:', e);
      }
    };
    fetchData();
  }, [user]);

  const openEditModal = () => {
    setEditForm({
      displayName: profileData?.displayName || '',
      bio: profileData?.bio || '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/me', editForm);
      setProfileData((prev) => (prev ? { ...prev, ...editForm } : null));
      setIsEditing(false);
    } catch (e) {
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profileData) return null;

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
              {profileData.username.charAt(0)}
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
        {profileData.bio || 'Welcome to my profile!'}
      </p>

      {/* Action Buttons (Specific to 'me') */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={openEditModal}
          className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-6 py-2 rounded-full text-sm transition-colors shadow-sm"
        >
          Edit profile
        </button>
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-2 rounded-full transition-colors shadow-sm">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex justify-center gap-12 w-full max-w-md border-t border-gray-200 pt-6 mb-8">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-gray-900">
            {myPosts.length}
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
        {myPosts.map((post) => (
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

      {/* --- EDIT PROFILE MODAL --- */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 resize-none h-24"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
