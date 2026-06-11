'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/store/useAuth';
import Link from 'next/link';
import { isAxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function SignInPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await api.post('/auth/login', data);
      await checkAuth();
      router.push('/app/feed');
    } catch (e: unknown) {
      // ---> MODIFIED: Changed 'any' to 'unknown'
      if (isAxiosError(e)) {
        // ---> MODIFIED: Safely checking if the error is from Axios
        setError(e.response?.data?.message || 'Login failed');
      } else {
        setError('An unexpected error occurred during login');
      }
    }
  };

  const handleGoogle = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // 2. FORCE a full page navigation. Do NOT use api.get() here!
      window.location.href = `${apiUrl}/auth/login/google`;
    } catch (error) {
      console.error('Failed to init Google OAuth', error);
      setError('Failed to connect to Google OAuth backend.');
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-300 px-10 py-12 flex flex-col items-center">
        <h1 className="text-3xl font-serif mb-8">Innogram</h1>
        {error && (
          <div className="text-sm text-red-500 mb-4 text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          {/* ... Rest remains unchanged ... */}
          <Input
            type="email"
            placeholder="Email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            type="password"
            placeholder="Password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            Log in
          </Button>
        </form>

        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-sm text-gray-500 font-semibold uppercase">
            or
          </span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-6 flex items-center text-[#385185] font-semibold text-sm"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="G"
            className="w-4 h-4 mr-2"
          />
          Log in with Google
        </button>
      </div>

      <div className="bg-white border border-gray-300 p-5 text-center text-sm">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-[#0095f6] font-semibold">
          Sign up
        </Link>
      </div>
    </>
  );
}
