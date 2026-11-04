'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  KeyRound,
  ExternalLink,
  Phone,
  Mail,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'MASTER' | 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
  businessName?: string | null;
  createdAt: string;
  _count?: {
    projects: number;
    clients: number;
    invoices: number;
  };
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for Add
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE',
    businessName: '',
  });

  // Form state for Edit
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'USER',
    status: 'ACTIVE',
    businessName: '',
    newPassword: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.status === 403) {
        toast.error('Access denied. Master privileges required.');
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setCurrentUserId(data.currentUserId || '');
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      toast.error('Please enter name, email, and password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      toast.success(`User ${addForm.name} created successfully!`);
      setAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'USER',
        status: 'ACTIVE',
        businessName: '',
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      businessName: user.businessName || '',
      newPassword: '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      toast.success(`User ${selectedUser.name} updated successfully!`);
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error updating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      toast.success(`User ${selectedUser.name} deleted successfully!`);
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting user');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.businessName && u.businessName.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const masterCount = users.filter((u) => u.role === 'MASTER' || u.role === 'ADMIN').length;
  const normalUsersCount = users.filter((u) => u.role === 'USER').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            <span>User & Access Management (Master Control)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supervise registered users, manage permissions (Master / Admin / User), and inspect workspaces
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="h-9 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-9 text-xs gap-1.5 font-semibold shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New User</span>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-card/70 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Users</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">{totalUsers}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Registered accounts in database</p>
        </Card>

        <Card className="p-4 bg-card/70 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Workspaces</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {activeUsers}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Able to log in & manage projects</p>
        </Card>

        <Card className="p-4 bg-card/70 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Normal Users</span>
            <UserCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {normalUsersCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Standard freelance workspaces</p>
        </Card>

        <Card className="p-4 bg-card/70 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Master / Admin</span>
            <Shield className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {masterCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Full master supervisory privileges</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 border-border/80 bg-card/60 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-card px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Roles</option>
                <option value="MASTER">Master Only</option>
                <option value="ADMIN">Admin Only</option>
                <option value="USER">Normal Users</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-card px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">User Details</TableHead>
              <TableHead className="text-xs font-semibold">Contact Info</TableHead>
              <TableHead className="text-xs font-semibold text-center">Role</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold text-center">Projects</TableHead>
              <TableHead className="text-xs font-semibold">Joined Date</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading users from database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  No users found matching your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                const isMaster = user.role === 'MASTER';
                const isAdmin = user.role === 'ADMIN';

                return (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    {/* User name & workspace */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs ${
                            isMaster
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                              : isAdmin
                              ? 'bg-primary text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-foreground">{user.name}</span>
                            {isSelf && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary font-bold">
                                You
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            {user.businessName || 'Workspace'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact (Email + Phone) */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 italic">No phone added</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell className="text-center">
                      {isMaster ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] gap-1 shadow-2xs">
                          <Crown className="h-3 w-3" />
                          MASTER
                        </Badge>
                      ) : isAdmin ? (
                        <Badge className="bg-primary text-white font-bold text-[10px] gap-1 shadow-2xs">
                          <Shield className="h-3 w-3" />
                          ADMIN
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="font-medium text-[10px]">
                          USER
                        </Badge>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="text-center">
                      {user.status === 'ACTIVE' ? (
                        <Badge variant="success" className="font-bold text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-bold text-[10px]">
                          Suspended
                        </Badge>
                      )}
                    </TableCell>

                    {/* Projects Count & Link */}
                    <TableCell className="text-center">
                      <Link
                        href={`/projects?userId=${user.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        title="Click to view all projects created by this user"
                      >
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span>{user._count?.projects ?? 0}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </Link>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenEdit(user)} className="gap-2">
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Edit Role & Info</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="gap-2">
                            <Link href={`/projects?userId=${user.id}`}>
                              <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>View Projects</span>
                            </Link>
                          </DropdownMenuItem>

                          {!isSelf && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteModalOpen(true);
                                }}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete User</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL 1: ADD NEW USER */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Create New User Account</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Alex Johnson"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="name@company.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input
                    type="tel"
                    placeholder="+880 1700-000000"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Initial Password *</Label>
                  <Input
                    required
                    type="password"
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Role</Label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  >
                    <option value="USER">Normal User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MASTER">Master Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={submitting} className="h-8 text-xs font-semibold">
                {submitting ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDIT USER & ROLE */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-primary" />
                <span>Edit User: {selectedUser?.name}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address *</Label>
                <Input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input
                    type="tel"
                    placeholder="+880 1700-000000"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reset Password (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Role</Label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={selectedUser?.id === currentUserId}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium disabled:opacity-60"
                  >
                    <option value="USER">Normal User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MASTER">Master Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    disabled={selectedUser?.id === currentUserId}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium disabled:opacity-60"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {selectedUser?.id === currentUserId && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                  * You cannot demote or suspend your own active Master account.
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={submitting} className="h-8 text-xs font-semibold">
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Delete User Account</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            <p>
              Are you sure you want to permanently delete user{' '}
              <strong className="text-foreground">{selectedUser?.name}</strong> ({selectedUser?.email})?
            </p>
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-[11px] space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Warning:
              </p>
              <p>
                Deleting this user will automatically cascade delete all their projects ({selectedUser?._count?.projects ?? 0}),
                clients, tasks, and financial records. This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteUser}
              disabled={submitting}
              className="h-8 text-xs font-semibold"
            >
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
