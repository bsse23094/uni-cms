'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { GraduationCap, Mail, Lock, BookOpen, Users, ClipboardCheck, TrendingUp } from 'lucide-react';
import { loginSchema, type LoginSchema } from '@/lib/validations';
import { signInAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useState } from 'react';

const STATS = [
  { icon: Users,          label: 'Active Students',  value: '2,400+' },
  { icon: BookOpen,       label: 'Courses Offered',  value: '180+'   },
  { icon: ClipboardCheck, label: 'Enrollments',       value: '6,800+' },
  { icon: TrendingUp,     label: 'Pass Rate',         value: '94%'    },
];

export default function LoginPage() {
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
      const formData = new FormData();
      formData.set('email', data.email);
      formData.set('password', data.password);

      const result = await signInAction(null, formData);

      if (result?.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        setIsLoading(false);
        toast.error(error.message);
      } else {
        throw error;
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0c0c0f]">

      {/* ── Left panel ───────────────────────────────────── */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden p-12 lg:flex">

        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#111116] via-[#0f0f14] to-[#0c0c0f]" />
        {/* Decorative circles */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/[0.02] blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[34rem] w-[34rem] rounded-full bg-white/[0.025] blur-3xl" />
        {/* Grid dots */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">UniCMS</span>
          </div>
        </div>

        {/* Centre hero text */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              University Management System
            </p>
            <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Manage your<br />
              campus with<br />
              <span className="text-zinc-400">clarity.</span>
            </h2>
            <p className="max-w-xs text-[14px] leading-relaxed text-zinc-500">
              One platform for courses, enrollments, grades, attendance and announcements — built for modern universities.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors duration-200 hover:border-white/[0.10] hover:bg-white/[0.05]"
              >
                <Icon className="mb-2.5 h-4 w-4 text-zinc-500 transition-colors group-hover:text-zinc-300" />
                <p className="text-xl font-bold tracking-tight text-white">{value}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">{label}</p>
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

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f4f4f6] px-6 py-12">

        {/* Mobile logo – visible only on small screens */}
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <p className="text-[13px] font-bold text-zinc-900">UniCMS</p>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome back</h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              Sign in to your university account to continue.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-medium text-zinc-700">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="border-zinc-200 bg-zinc-50 pl-9 text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="mt-1 w-full bg-zinc-900 text-white hover:bg-zinc-800"
                loading={isLoading}
                disabled={isLoading}
              >
                Sign in
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-[12px] text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-zinc-800 underline-offset-4 hover:underline">
              Register here
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Demo credentials
            </p>
            <div className="space-y-1">
              {[
                { role: 'Super Admin', email: 'superadmin@university.edu' },
                { role: 'Faculty',     email: 'drsmith@university.edu'    },
                { role: 'Student',     email: 'emma@students.university.edu' },
              ].map(({ role, email }) => (
                <div key={role} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-zinc-500">{role}</span>
                  <span className="font-mono text-[10px] text-zinc-400">{email}</span>
                </div>
              ))}
              <p className="mt-2 text-[10px] text-zinc-400">Password: <span className="font-mono">UniPass@2025</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
