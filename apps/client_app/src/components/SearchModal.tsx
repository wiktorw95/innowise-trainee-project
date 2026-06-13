'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Adjust this endpoint to match your NestJS route!
        const { data } = await api.get(`/users/search?q=${query}`);
        setResults(data.users || data || []);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/40 backdrop-blur-sm transition-opacity">
      {/* Sliding Drawer */}
      <div className="w-full md:w-[400px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Search</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : results.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4">
              {isSearching ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {results.map((user) => {
                    // --- FOOLPROOF ID EXTRACTION ---
                    // If it's a Profile object, we want userId. If it's a User object, we want id.
                    const targetId = user.userId || user.id;

                    // Safety catch: Don't render a broken link if the ID is missing
                    if (!targetId) return null;

                    return (
                      <Link
                        key={user.id || targetId}
                        href={`/app/profile/${targetId}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border border-gray-200 shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 uppercase">
                              {user.username?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-gray-900">
                            {user.username || 'Unknown User'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {user.displayName || ''}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : query.trim() ? (
                <p className="text-center text-sm text-gray-500 py-10">
                  No recent searches.
                </p>
              ) : null}
            </div>
          ) : query.trim() ? (
            <p className="text-center text-sm text-gray-500 py-10">
              No recent searches.
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="hidden md:block flex-1 cursor-pointer"
        onClick={onClose}
      />
    </div>
  );
}
