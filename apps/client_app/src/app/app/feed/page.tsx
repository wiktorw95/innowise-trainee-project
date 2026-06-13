'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/axios';
import { Post } from '@/types/post';
import { CreatePost } from '@/components/CreatePost';
import { PostCard } from '@/components/PostCard';

const FEED_TABS = [
  { id: 'all', label: 'For You'},
  { id: 'liked', label: 'Liked'},
  { id: 'commented', label: 'Commented'},
  { id: 'archived', label: 'Archived'},
];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data } = await api.get(
        `/posts/feed?page=1&limit=20&tab=${activeTab}`
      );
      const fetchedPosts = data?.data || data;
      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
    } catch (e) {
      console.error('Failed to fetch feed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="w-full max-w-[470px] mx-auto pt-8 px-4 md:px-0">
      <CreatePost onPostCreated={fetchFeed} />
      <div className="flex justify-between items-center border-b border-gray-200 mb-6 pb-2 overflow-x-auto hide-scrollbar">
        {FEED_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-gray-900 border-b-2 border-gray-900 -mb-[9px]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {isLoading && posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500 font-medium animate-pulse">
          Loading feed...
        </div>
      ) : (
        <div
          className={`transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        >
          {posts.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No posts found for this filter.
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={(id) =>
                  setPosts((p) => p.filter((post) => post.id !== id))
                }
                onUnlike={
                  activeTab === 'liked'
                    ? (id) =>
                        setPosts((p) => p.filter((post) => post.id !== id))
                    : undefined
                }
                onUncomment={
                  activeTab === 'commented'
                    ? (id) =>
                        setPosts((p) => p.filter((post) => post.id !== id))
                    : undefined
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
