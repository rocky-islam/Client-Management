'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  ExternalLink,
  Mail,
  Building,
  DollarSign,
  Briefcase,
  Loader2,
  Edit2,
  Trash2,
  Globe,
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [clientStatus, setClientStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setCountry('');
    setContactInfo('');
    setProfileLink('');
    setClientStatus('ACTIVE');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingClient(c);
    setName(c.name || '');
    setCompanyName(c.companyName || '');
    setEmail(c.email || '');
    setCountry(c.country || '');
    setContactInfo(c.contactInfo || '');
    setProfileLink(c.profileLink || '');
    setClientStatus(c.clientStatus || 'ACTIVE');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Client name is required');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim() || undefined,
          email: email.trim() || undefined,
          country: country.trim() || undefined,
          contactInfo: contactInfo.trim() || undefined,
          profileLink: profileLink.trim() || undefined,
          clientStatus: clientStatus || 'ACTIVE',
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save client');

      toast.success(
        editingClient
          ? `Client "${data.client?.name || name}" updated successfully!`
          : `Client "${data.client?.name || name}" created successfully!`
      );
      setModalOpen(false);
      fetchClients();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
      toast.success(`Client "${clientName}" deleted successfully`);
      fetchClients();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalClients = clients.length;
  const repeatClients = clients.filter((c) => c.isRepeatClient).length;
  const totalLifetimeValue = clients.reduce((s, c) => s + (c.totalValue || 0), 0);
  const totalOutstanding = clients.reduce((s, c) => s + (c.outstanding || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Client Directory & Portfolio
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage freelance clients, lifetime values, order history, and contact coordinates
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleOpenAdd} className="h-9 text-xs gap-1.5 shadow-sm">
              <UserPlus className="h-4 w-4" />
              <span>Add Client</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveClient}>
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{editingClient ? 'Edit Client Details' : 'Add New Client'}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Client Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Company Name</Label>
                    <Input
                      placeholder="e.g. Apex Tech Solutions"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Country</Label>
                    <Input
                      placeholder="e.g. United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="alex@apextech.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Client Status</Label>
                    <select
                      value={clientStatus}
                      onChange={(e) => setClientStatus(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="LEAD">Lead</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Phone / WhatsApp</Label>
                    <Input
                      placeholder="+1 (555) 234-5678"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Profile URL</Label>
                    <Input
                      placeholder="https://upwork.com"
                      value={profileLink}
                      onChange={(e) => setProfileLink(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Internal Notes</Label>
                  <Input
                    placeholder="Preferences, preferred tech stack, timezone..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingClient ? 'Update Client' : 'Save Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Clients</p>
              <p className="text-lg font-bold text-foreground">{totalClients}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Repeat Clients</p>
              <p className="text-lg font-bold text-foreground">{repeatClients}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Lifetime Value</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(totalLifetimeValue, 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Outstanding Balances</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(totalOutstanding, 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, company, email, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table className="w-full min-w-[960px] text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[180px]">Client</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[150px]">Company / Country</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[110px]">Orders</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[110px] text-right">Total Value</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[110px] text-right">Received</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[110px] text-right">Outstanding</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[100px] text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[100px] text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    No clients found. Click "Add Client" to register one.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40 transition-colors text-xs">
                    <TableCell className="py-3">
                      <Link
                        href={`/clients/${c.id}`}
                        className="font-semibold text-primary hover:underline block whitespace-nowrap"
                      >
                        {c.name}
                      </Link>
                      {c.email && (
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{c.email}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-xs text-foreground font-medium whitespace-nowrap">{c.companyName || '-'}</div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{c.country || '-'}</span>
                    </TableCell>
                    <TableCell className="py-3 whitespace-nowrap">
                      <Badge variant="secondary" className="text-[11px] py-0.5">
                        {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                      </Badge>
                      {c.isRepeatClient && (
                        <span className="ml-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          Repeat
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-right py-3 whitespace-nowrap">
                      {formatCurrency(c.totalValue, 'USD')}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 text-right py-3 whitespace-nowrap">
                      {formatCurrency(c.totalReceived, 'USD')}
                    </TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400 text-right py-3 whitespace-nowrap">
                      {formatCurrency(c.outstanding, 'USD')}
                    </TableCell>
                    <TableCell className="text-center py-3 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px]">
                        {c.clientStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3 pr-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/clients/${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(c)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit Client"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClient(c.id, c.name)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Delete Client"
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
