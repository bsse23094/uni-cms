'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Mail, Lock, User, CheckCircle2, ShieldCheck, BookOpen, Award } from 'lucide-react';
import { registerSchema, type RegisterSchema } from '@/lib/validations';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useState } from 'react';

const FEATURES = [
  { icon: BookOpen,    title: 'Course Management',    desc: 'Enroll, track, and manage your courses in one place.' },
  { icon: Award,       title: 'Grades & Transcripts', desc: 'Real-time access to grades and academic performance.' },
  { icon: ShieldCheck, title: 'Secure & Private',     desc: 'Enterprise-grade security for all academic data.' },
];

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

  /* ── Success state ──────────────────────────────────── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f6] p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200/60">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-zinc-900">Check your email</h2>
            <p className="mb-8 text-[13px] leading-relaxed text-zinc-500">
              We&apos;ve sent a confirmation link to your email address.
              <br />Please verify your account before signing in.
            </p>
            <Button
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={() => router.push('/login')}
            >
              Back to Sign In
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-zinc-400">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  /* ── Registration page ──────────────────────────────── */
  return (
    <div className="flex min-h-screen bg-[#0c0c0f]">

      {/* ── Left panel (desktop) ─────────────────────── */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden p-12 lg:flex">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#111116] via-[#0f0f14] to-[#0c0c0f]" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/[0.02] blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[34rem] w-[34rem] rounded-full bg-white/[0.025] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">UniCMS</span>
          </div>
        </div>

        {/* Centre content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Join the platform
            </p>
            <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Start your<br />
              academic journey<br />
              <span className="text-zinc-400">today.</span>
            </h2>
            <p className="max-w-xs text-[14px] leading-relaxed text-zinc-500">
              Create your account and get instant access to courses, grades, and everything you need.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 pt-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors duration-200 hover:border-white/[0.10] hover:bg-white/[0.05]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <Icon className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-zinc-200" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <div className="relative z-10">
          <p className="text-[11px] text-zinc-700">
            &copy; {new Date().getFullYear()} UniCMS. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f4f4f6] px-4 py-8 sm:px-6 sm:py-12">

        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <p className="text-[13px] font-bold text-zinc-900">UniCMS</p>
        </div>

        <div className="w-full max-w-[380px]">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Create an account</h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              Fill in your details to register for the platform.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-[13px] font-medium text-zinc-700">
                  Full name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="full_name"
                    placeholder="Dr. Jane Smith"
                    className="border-zinc-200 bg-zinc-50 pl-9 text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
                    {...register('full_name')}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-xs text-red-500">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium text-zinc-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    className="border-zinc-200 bg-zinc-50 pl-9 text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium text-zinc-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="border-zinc-200 bg-zinc-50 pl-9 text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
                <p className="text-[11px] text-zinc-400">Minimum 8 characters</p>
              </div>

              <Button
                type="submit"
                className="mt-1 w-full bg-zinc-900 text-white hover:bg-zinc-800"
                loading={isLoading}
                disabled={isLoading}
              >
                Create account
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-[12px] text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-zinc-800 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
