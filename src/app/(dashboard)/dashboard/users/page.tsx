'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useUsers, useUpdateUser, useSoftDeleteUser, useCreateUser } from '@/hooks/useData';
import { DataTable } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  MoreHorizontal,
  UserX,
  UserCheck,
  Search,
  Filter,
  Edit,
  UserPlus,
} from 'lucide-react';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  formatDate,
  cn,
} from '@/lib/utils';
import type { Profile, UserRole } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userFormSchema, type UserFormData } from '@/lib/validations';

// Schema for creating a new user (adds required password field)
const createUserSchema = userFormSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type CreateUserFormData = z.infer<typeof createUserSchema>;
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// ---- Create User Dialog ----
function CreateUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createUser = useCreateUser();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'student', is_active: true },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    await createUser.mutateAsync({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: data.role,
      department: data.department || undefined,
      phone: data.phone || undefined,
    });
    toast.success(`User ${data.email} created`);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label>Full Name</Label>
              <Input {...register('full_name')} placeholder="Dr. Jane Smith" />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register('email')} placeholder="user@university.edu" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Password</Label>
              <Input type="password" {...register('password')} placeholder="Minimum 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Input {...register('department')} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...register('phone')} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create User</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Edit User Dialog ----
function EditUserDialog({
  user,
  open,
  onClose,
}: {
  user: Profile;
  open: boolean;
  onClose: () => void;
}) {
  const updateUser = useUpdateUser();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department ?? '',
      phone: user.phone ?? '',
      bio: user.bio ?? '',
      is_active: user.is_active,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    await updateUser.mutateAsync({ id: user.id, ...data });
    toast.success('User updated');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
              <Input {...register('department')} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...register('phone')} placeholder="+1 234 567 890" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Bio</Label>
              <Textarea {...register('bio')} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Page ----
export default function UsersPage() {
  const { profile: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Profile | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Profile | null>(null);

  const softDelete = useSoftDeleteUser();
  const updateUser = useUpdateUser();

  const filters = {
    search: search || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useUsers(filters);

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (u: Profile) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={u.avatar_url ?? undefined} />
            <AvatarFallback>{u.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{u.full_name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (u: Profile) => (
        <Badge className={cn('text-xs', ROLE_COLORS[u.role])}>{ROLE_LABELS[u.role]}</Badge>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (u: Profile) => (
        <span className="text-sm text-muted-foreground">{u.department ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (u: Profile) => (
        <Badge variant={u.is_active ? 'success' : 'destructive'}>
          {u.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (u: Profile) => (
        <span className="text-sm text-muted-foreground">{formatDate(u.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (u: Profile) => {
        if (u.id === currentUser?.id) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditTarget(u)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              {u.is_active ? (
                <DropdownMenuItem
                  onClick={() => setDeactivateTarget(u)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" /> Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setRestoreTarget(u)}>
                  <UserCheck className="mr-2 h-4 w-4" /> Restore
                </DropdownMenuItem>
              )}            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage all registered users across the platform."
        icon={<Users className="h-6 w-6" />}
        actions={
          currentUser && ['super_admin', 'admin'].includes(currentUser.role) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Create User
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as UserRole | 'all'); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v as typeof activeFilter); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        loading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        emptyMessage="No users found."
      />

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {editTarget && (
        <EditUserDialog user={editTarget} open onClose={() => setEditTarget(null)} />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${deactivateTarget?.full_name}? They will lose access to the platform.`}
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={async () => {
          await softDelete.mutateAsync(deactivateTarget!.id);
          toast.success('User deactivated');
          setDeactivateTarget(null);
        }}
        onOpenChange={(v) => { if (!v) setDeactivateTarget(null); }}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        title="Restore User"
        description={`Restore ${restoreTarget?.full_name}? They will regain full access.`}
        confirmLabel="Restore"
        onConfirm={async () => {
          await updateUser.mutateAsync({ id: restoreTarget!.id, is_active: true });
          toast.success('User restored');
          setRestoreTarget(null);
        }}
        onOpenChange={(v) => { if (!v) setRestoreTarget(null); }}
      />
    </div>
  );
}
