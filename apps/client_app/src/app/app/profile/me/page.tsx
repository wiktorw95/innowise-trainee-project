'use client';
import { useAuth } from '@/store/useAuth';
import { api } from '@/lib/axios';
import { useEffect, useState } from 'react';
import { Settings, Grid3X3, Bookmark, UserSquare2 } from 'lucide-react';
import { Profile } from '@/types/post';

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<
    (Profile & { bio?: string; id: string }) | null
  >(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data } = await api.get(`/users/${user.id}`);
        setProfileData(data.profile);
      } catch (e) {
        console.error('Failed to fetch profile data:', e);
      }
    };
    fetchProfile();
  }, [user]);

  if (!profileData) return null;

  return (
    <div className="w-full max-w-[935px] mx-auto pt-12 px-4 flex flex-col items-center">
      {/* 1. Centered Avatar with Figma Gradient Ring */}
      <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 mb-5 shadow-sm">
        <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white bg-gray-200">
          {profileData.avatarUrl ? (
            <img
              src={profileData.avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-gray-300 text-white">
              {profileData.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 2. Centered Typography */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {profileData.username}
      </h1>
      <p className="text-sm font-medium text-gray-500 mb-4">
        {profileData.displayName}
      </p>

      <p className="text-center text-sm text-gray-800 max-w-md mb-6 whitespace-pre-wrap leading-relaxed">
        {profileData.bio || 'Welcome to my profile!'}
      </p>

      {/* 3. Figma-style Pill Buttons */}
      <div className="flex gap-3 mb-8">
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-6 py-2 rounded-full text-sm transition-colors shadow-sm">
          Edit profile
        </button>
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-2 rounded-full transition-colors shadow-sm">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 4. Centered Stats Row */}
      <div className="flex justify-center gap-12 w-full max-w-md border-t border-gray-200 pt-6 mb-8">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-gray-900">0</span>
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

      {/* 5. Posts Grid Layout */}
      <div className="w-full border-t border-gray-200 flex justify-center gap-12 uppercase text-xs font-semibold tracking-widest text-gray-500">
        <div className="py-4 border-t border-gray-900 text-gray-900 flex items-center gap-2 -mt-[1px]">
          <Grid3X3 className="w-3 h-3" /> Posts
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2 w-full">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="aspect-square bg-gray-100 rounded-md hover:opacity-90 transition-opacity cursor-pointer"
          ></div>
        ))}
      </div>
    </div>
  );
}
