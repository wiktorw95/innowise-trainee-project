'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/axios';
import { Post } from '@/types/post';
import { CreatePost } from '@/components/CreatePost';
import { PostCard } from '@/components/PostCard';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/posts/feed?page=1&limit=20');
      setPosts(data.data);
    } catch (e) {
      console.error('Failed to fetch feed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="w-full max-w-[470px] mx-auto pt-8 px-4 md:px-0">
      <CreatePost onPostCreated={fetchFeed} />
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Loading feed...</div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={(id) =>
              setPosts((p) => p.filter((post) => post.id !== id))
            }
          />
        ))
      )}
    </div>
  );
}
