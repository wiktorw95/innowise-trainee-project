'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/store/useAuth';
import { Home, Search, PlusSquare, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { SearchModal } from '@/components/SearchModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/auth/signin');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <nav className="fixed bottom-0 w-full md:relative md:w-[244px] md:min-h-screen bg-white border-t md:border-t-0 md:border-r border-gray-300 z-40">
        <div className="flex md:flex-col justify-between md:justify-start h-full p-3 md:p-6">
          <div className="hidden md:block font-serif text-2xl mb-10 pt-4 px-2">
            Innogram
          </div>
          <div className="flex md:flex-col justify-around md:justify-start w-full gap-2">
            <Link
              href="/app/feed"
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 ${pathname === '/app/feed' ? 'font-bold' : ''}`}
            >
              <Home className="w-6 h-6" />{' '}
              <span className="hidden md:block">Home</span>
            </Link>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
            >
              <Search className="w-6 h-6" />{' '}
              <span className="hidden md:block">Search</span>
            </button>

            <Link
              href="/app/feed"
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100"
            >
              <PlusSquare className="w-6 h-6" />{' '}
              <span className="hidden md:block">Create</span>
            </Link>
            <Link
              href="/app/profile/me"
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 ${pathname === '/app/profile/me' ? 'font-bold' : ''}`}
            >
              <UserIcon className="w-6 h-6" />{' '}
              <span className="hidden md:block">Profile</span>
            </Link>
          </div>
          <div className="hidden md:block mt-auto">
            <button
              onClick={logout}
              className="flex items-center gap-4 p-3 w-full rounded-lg hover:bg-gray-100 text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">{children}</main>

      {/* --- NEW: Render the Search Modal --- */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
