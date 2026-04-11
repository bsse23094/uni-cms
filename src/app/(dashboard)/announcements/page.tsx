'use client';

import { useState } from 'react';
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Pin, Plus } from 'lucide-react';
import { timeAgo, ROLE_LABELS } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementFormSchema, type AnnouncementFormData } from '@/lib/validations';
import type { AnnouncementAudience, AnnouncementWithAuthor } from '@/types';
import toast from 'react-hot-toast';

// ---- Create Announcement Dialog ----
function CreateAnnouncementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createAnnouncement = useCreateAnnouncement();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormData>({ resolver: zodResolver(announcementFormSchema) });

  const onSubmit = async (data: AnnouncementFormData) => {
    await createAnnouncement.mutateAsync(data);
    toast.success('Announcement posted');
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input {...register('title')} placeholder="Announcement title…" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Content *</Label>
            <Textarea {...register('content')} rows={5} placeholder="Announcement content…" />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Audience</Label>
              <Controller
                control={control}
                name="audience"
                defaultValue="all"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="faculty">Faculty Only</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Pin</Label>
              <Controller
                control={control}
                name="is_pinned"
                defaultValue={false}
                render={({ field }) => (
                  <Select value={field.value ? 'true' : 'false'} onValueChange={(v) => field.onChange(v === 'true')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Not pinned</SelectItem>
                      <SelectItem value="true">Pinned</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Post Announcement</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Announcement Card ----
function AnnouncementCard({ announcement }: { announcement: AnnouncementWithAuthor }) {
  const audienceLabels: Record<AnnouncementAudience, string> = {
    all: 'Everyone',
    students: 'Students',
    faculty: 'Faculty',
    admin: 'Admins',
  };

  return (
    <Card className={announcement.is_pinned ? 'border-primary/40 ring-1 ring-primary/20' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {announcement.is_pinned && <Pin className="h-4 w-4 text-primary shrink-0" />}
            <CardTitle className="text-base truncate">{announcement.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">{audienceLabels[announcement.audience]}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>By {announcement.author?.full_name}</span>
          <span>·</span>
          <span>{timeAgo(announcement.created_at)}</span>
          {announcement.author && (
            <>
              <span>·</span>
              <span>{ROLE_LABELS[announcement.author.role]}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
      </CardContent>
    </Card>
  );
}

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = profile?.role !== 'student';

  // No audience filter — RLS on the server already scopes announcements to
  // what each role is allowed to see, so we just fetch everything visible.
  const { data, isLoading } = useAnnouncements({
    page,
    pageSize: 10,
  });

  const pinned = data?.data.filter((a) => a.is_pinned) ?? [];
  const regular = data?.data.filter((a) => !a.is_pinned) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Important notices and updates from administration."
        icon={<Bell className="h-6 w-6" />}
        actions={
          canCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />New Announcement
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Pin className="h-3 w-3" />Pinned
              </p>
              {pinned.map((a) => <AnnouncementCard key={a.id} announcement={a} />)}
            </>
          )}

          {regular.length > 0 && (
            <>
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6">Recent</p>
              )}
              {regular.map((a) => <AnnouncementCard key={a.id} announcement={a} />)}
            </>
          )}

          {(data?.data.length ?? 0) === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 opacity-30 mb-4" />
              <p>No announcements yet.</p>
            </div>
          )}
        </div>
      )}

      {(data?.count ?? 0) > 10 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <CreateAnnouncementDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
