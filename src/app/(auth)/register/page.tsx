'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Mail, Lock, User } from 'lucide-react';
import { registerSchema, type RegisterSchema } from '@/lib/validations';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.full_name);
      setSuccess(true);
      toast.success('Account created! Please check your email to confirm your account.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <GraduationCap className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Check Your Email</h2>
            <p className="mb-6 text-sm text-slate-400">
              We&apos;ve sent a confirmation link to your email. Please verify your account before signing in.
            </p>
            <Button variant="outline" className="border-slate-600 text-white" onClick={() => router.push('/login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <p className="text-sm text-slate-400">Create your student/faculty account</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              Fill in the details below to register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-200">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="full_name"
                    placeholder="Dr. Jane Smith"
                    className="border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-500"
                    {...register('full_name')}
                  />
                </div>
                {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    className="border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-500"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-500"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" loading={isLoading}>
                Create Account
              </Button>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
