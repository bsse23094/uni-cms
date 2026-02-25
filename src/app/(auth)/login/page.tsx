'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Mail, Lock } from 'lucide-react';
import { loginSchema, type LoginSchema } from '@/lib/validations';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Sanitize 'next' to prevent open-redirect attacks
  const rawNext = searchParams.get('next') ?? '';
  const nextUrl =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes(':')
      ? rawNext
      : '/dashboard';
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Welcome back!');
      router.push(nextUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <GraduationCap className="h-9 w-9 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">UniCMS</h1>
            <p className="text-sm text-slate-400">University Management System</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your university credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    className="border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </Button>

              <p className="text-center text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} UniCMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
