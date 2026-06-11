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

const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  displayName: z.string().min(1),
  password: z.string().min(8),
  birthday: z.string(),
});

export default function SignUpPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    try {
      // 1. Send the data to your NestJS Core Gateway
      await api.post('/auth/signup', data);

      // 2. Fetch the user profile to update Zustand state
      await checkAuth();

      // 3. Force the browser to navigate to the feed
      router.push('/app/feed');
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred during sign up.');
      }
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-300 px-10 py-12 flex flex-col items-center">
        <h1 className="text-3xl font-serif mb-4">Innogram</h1>
        {error && <div className="text-sm text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <Input
            type="email"
            placeholder="Email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            placeholder="Username"
            {...register('username')}
            error={errors.username?.message}
          />
          <Input
            placeholder="Full Name"
            {...register('displayName')}
            error={errors.displayName?.message}
          />
          <Input
            type="date"
            {...register('birthday')}
            error={errors.birthday?.message}
          />
          <Input
            type="password"
            placeholder="Password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            Sign up
          </Button>
        </form>
      </div>
      <div className="bg-white border border-gray-300 p-5 text-center text-sm">
        Have an account?{' '}
        <Link href="/auth/signin" className="text-[#0095f6] font-semibold">
          Log in
        </Link>
      </div>
    </>
  );
}
