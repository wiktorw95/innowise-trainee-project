'use client';
import { useState, useRef } from 'react';
import { api } from '@/lib/axios';
import { Image as ImageIcon, X } from 'lucide-react';

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setFiles((prev) =>
        [...prev, ...Array.from(e.target.files!)].slice(0, 10)
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('content', content);
      files.forEach((file) => formData.append('files', file));
      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setContent('');
      setFiles([]);
      onPostCreated();
    } catch (error) {
      console.error(error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl mb-6 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-4">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something..."
          className="w-full resize-none outline-none text-sm min-h-[60px] text-gray-800 placeholder:text-gray-400"
        />

        {files.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0"
              >
                {f.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(f)}
                    alt="prev"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-blue-500 transition-colors p-1"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="submit"
            disabled={isLoading || (!content && !files.length)}
            className="bg-blue-50 hover:bg-blue-100 text-[#0095f6] px-4 py-1.5 rounded-full font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
