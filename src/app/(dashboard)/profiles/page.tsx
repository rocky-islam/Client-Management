'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  ExternalLink,
  Loader2,
  DollarSign,
  FolderKanban,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Globe,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Fiverr');
  const [description, setDescription] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [color, setColor] = useState('#4F46E5');

  // Editing State
  const [editingProfile, setEditingProfile] = useState<any>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profiles');
      const data = await res.json();
      if (res.ok) {
        setProfiles(data.profiles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleOpenAdd = () => {
    setEditingProfile(null);
    setName('');
    setPlatform('Fiverr');
    setDescription('');
    setProfileLink('');
    setColor('#4F46E5');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProfile(p);
    setName(p.name);
    setPlatform(p.platform || 'Freelance');
    setDescription(p.description || '');
    setProfileLink(p.profileLink || '');
    setColor(p.color || '#4F46E5');
    setModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Profile name is required');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingProfile ? `/api/profiles/${editingProfile.id}` : '/api/profiles';
      const method = editingProfile ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          platform: platform.trim(),
          description: description.trim() || undefined,
          profileLink: profileLink.trim() || undefined,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      toast.success(editingProfile ? 'Profile updated successfully!' : 'New profile created successfully!');
      setModalOpen(false);
      fetchProfiles();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProfile = async (id: string, profileName: string) => {
    if (!confirm(`Are you sure you want to remove profile "${profileName}"?`)) return;

    try {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete profile');
      toast.success('Profile removed');
      fetchProfiles();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Filtered profiles
  const filteredProfiles = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.platform?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  // Summary Metrics
  const totalProfilesCount = profiles.length;
  const totalValueSum = profiles.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalReceivedSum = profiles.reduce((sum, p) => sum + (p.totalReceived || 0), 0);
  const totalOutstandingSum = profiles.reduce((sum, p) => sum + (p.outstanding || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Freelance Profiles & Sales Channels
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage all your freelance accounts, sales channels, order acquisition profiles, and channel performance
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleOpenAdd} className="shadow-sm gap-2 text-xs">
              <Plus className="h-4 w-4" />
              <span>+ Add Profile</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                {editingProfile ? 'Edit Freelance Profile' : 'Add New Freelance Profile'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveProfile} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Profile Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Upwork Agency, Fiverr Pro, Direct Contracts"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Platform / Channel Type</Label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Fiverr">Fiverr</option>
                  <option value="Upwork">Upwork</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Direct Client">Direct Client</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Personal Website">Personal Website</option>
                  <option value="Contra">Contra</option>
                  <option value="Other">Other Custom Channel</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Store / Profile URL (Optional)</Label>
                <Input
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  placeholder="https://www.upwork.com/freelancers/..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description / Notes</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Primary agency account for enterprise Next.js contracts"
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : editingProfile ? (
                    'Update Profile'
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Profiles</p>
              <p className="text-lg font-bold text-foreground">{totalProfilesCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Value Generated</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalValueSum, 'USD')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Received Revenue</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalReceivedSum, 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Outstanding Balances</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalOutstandingSum, 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profiles Search and Table */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search profiles by name, platform, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table className="w-full min-w-[960px] text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[180px]">Profile Name</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[130px]">Platform</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[100px] text-center">Projects</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[100px] text-center">Active WIP</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[100px] text-center">Delivered</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[120px] text-right">Total Value</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[120px] text-right">Received</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[120px] text-right">Outstanding</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[120px] text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                    No profiles found. Click "+ Add Profile" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40 transition-colors text-xs">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs whitespace-nowrap">{p.name}</span>
                        {p.isDefault && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                            Default
                          </Badge>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                          {p.description}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 whitespace-nowrap">
                      <Badge variant="secondary" className="text-[11px] py-0.5">
                        {p.platform || 'Freelance'}
                      </Badge>
                      {p.profileLink && (
                        <a
                          href={p.profileLink}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1.5 text-muted-foreground hover:text-primary inline-flex items-center"
                          title="Open Profile URL"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>

                    <TableCell className="text-center font-semibold py-3 whitespace-nowrap">
                      {p.totalProjects}
                    </TableCell>

                    <TableCell className="text-center py-3 whitespace-nowrap">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{p.activeProjects}</span>
                    </TableCell>

                    <TableCell className="text-center py-3 whitespace-nowrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{p.deliveredProjects}</span>
                    </TableCell>

                    <TableCell className="font-semibold text-right py-3 whitespace-nowrap">
                      {formatCurrency(p.totalValue, 'USD')}
                    </TableCell>

                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 text-right py-3 whitespace-nowrap">
                      {formatCurrency(p.totalReceived, 'USD')}
                    </TableCell>

                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400 text-right py-3 whitespace-nowrap">
                      {formatCurrency(p.outstanding, 'USD')}
                    </TableCell>

                    <TableCell className="text-right py-3 pr-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/projects?profile=${encodeURIComponent(p.name)}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1 text-primary">
                            <span>Projects</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProfile(p.id, p.name)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Delete Profile"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

