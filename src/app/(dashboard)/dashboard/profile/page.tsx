'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStudentGPA, useUpdateUser } from '@/hooks/useData';
import { uploadAvatar } from '@/lib/api/users';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, TrendingUp } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS, formatDate, cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileData } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const updateUser = useUpdateUser();
  const { data: gpa } = useStudentGPA(profile?.role === 'student' ? profile?.id : undefined);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    values: profile
      ? {
          full_name: profile.full_name,
          phone: profile.phone ?? '',
          department: profile.department ?? '',
          bio: profile.bio ?? '',
        }
      : undefined,
  });

  const onSubmit = async (data: UpdateProfileData) => {
    if (!profile) return;
    await updateUser.mutateAsync({ id: profile.id, ...data });
    await refreshProfile();
    toast.success('Profile updated');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);
    try {
      await uploadAvatar(createClient() as any, profile.id, file);
      await refreshProfile();
      toast.success('Avatar updated');
    } catch {
      toast.error('Avatar upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Update your personal information and preferences."
        icon={<User className="h-6 w-6" />}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Avatar + summary */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-2xl">{profile.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                  title="Change avatar"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <Badge className={cn('text-xs', ROLE_COLORS[profile.role])}>
                {ROLE_LABELS[profile.role]}
              </Badge>
              <Badge variant={profile.is_active ? 'success' : 'destructive'}>
                {profile.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>

          {/* Read-only info */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Account Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span>{formatDate(profile.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>{ROLE_LABELS[profile.role]}</span>
              </div>
              {profile.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{profile.department}</span>
                </div>
              )}
              {profile.role === 'student' && gpa !== null && gpa !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />GPA
                  </span>
                  <span className="font-bold text-lg">{gpa.gpa.toFixed(2)}</span>
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
                  <Label>Full Name *</Label>
                  <Input {...register('full_name')} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input {...register('phone')} placeholder="+1 234 567 890" />
                </div>
                <div className="space-y-1">
                  <Label>Department</Label>
                  <Input {...register('department')} placeholder="e.g. Computer Science" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label>Bio</Label>
                  <Textarea {...register('bio')} rows={5} placeholder="Tell us a bit about yourself…" />
                  {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
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
