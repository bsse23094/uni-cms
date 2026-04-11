'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useUpdateUser, useStudentGPA } from '@/hooks/useData';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, UserCog } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS, formatDate, cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userFormSchema, type UserFormData } from '@/lib/validations';
import type { UserRole } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading } = useUser(id);
  const updateUser = useUpdateUser();
  const { data: gpa } = useStudentGPA(user?.role === 'student' ? id : undefined);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    values: user
      ? {
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department ?? '',
          phone: user.phone ?? '',
          bio: user.bio ?? '',
          is_active: user.is_active,
        }
      : undefined,
  });

  const onSubmit = async (data: UserFormData) => {
    await updateUser.mutateAsync({ id, ...data });
    toast.success('User updated successfully');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">User not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/users"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Details"
        description={`Editing profile for ${user.full_name}`}
        icon={<UserCog className="h-6 w-6" />}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Avatar + summary */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">{user.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-lg">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge className={cn('text-xs', ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role]}
              </Badge>
              <Badge variant={user.is_active ? 'success' : 'destructive'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Account Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(user.updated_at)}</span>
              </div>
              {user.role === 'student' && gpa !== null && gpa !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GPA</span>
                  <span className="font-semibold">{gpa.gpa.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Edit form */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <Label>Full Name</Label>
                  <Input {...register('full_name')} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input {...register('email')} type="email" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Department</Label>
                  <Input {...register('department')} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input {...register('phone')} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label>Bio</Label>
                  <Textarea {...register('bio')} rows={4} />
                </div>
                <div className="space-y-1">
                  <Label>Active Status</Label>
                  <Controller
                    control={control}
                    name="is_active"
                    render={({ field }) => (
                      <Select
                        value={field.value ? 'true' : 'false'}
                        onValueChange={(v) => field.onChange(v === 'true')}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!isDirty} loading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
