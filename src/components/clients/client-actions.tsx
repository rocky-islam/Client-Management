'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ClientActionsProps {
  client: {
    id: string;
    name: string;
    companyName?: string | null;
    email?: string | null;
    country?: string | null;
    contactInfo?: string | null;
    profileLink?: string | null;
    clientStatus?: string | null;
    notes?: string | null;
  };
}

export function ClientActions({ client }: ClientActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [name, setName] = useState(client.name || '');
  const [companyName, setCompanyName] = useState(client.companyName || '');
  const [email, setEmail] = useState(client.email || '');
  const [country, setCountry] = useState(client.country || '');
  const [contactInfo, setContactInfo] = useState(client.contactInfo || '');
  const [profileLink, setProfileLink] = useState(client.profileLink || '');
  const [clientStatus, setClientStatus] = useState(client.clientStatus || 'ACTIVE');
  const [notes, setNotes] = useState(client.notes || '');

  const handleOpenEdit = () => {
    setName(client.name || '');
    setCompanyName(client.companyName || '');
    setEmail(client.email || '');
    setCountry(client.country || '');
    setContactInfo(client.contactInfo || '');
    setProfileLink(client.profileLink || '');
    setClientStatus(client.clientStatus || 'ACTIVE');
    setNotes(client.notes || '');
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Client name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
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
      if (!res.ok) throw new Error(data.error || 'Failed to update client');

      toast.success(`Client "${data.client.name}" updated successfully`);
      setEditOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete client "${client.name}"? This will move the client to trash.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete client');

      toast.success(`Client "${client.name}" deleted successfully`);
      router.push('/clients');
    } catch (e: any) {
      toast.error(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenEdit}
        className="h-8 text-xs gap-1.5 shadow-2xs"
      >
        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Edit Client</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30 shadow-2xs"
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        <span>Delete Client</span>
      </Button>

      {/* Edit Client Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Edit Client Details</span>
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
                    placeholder="alex@example.com"
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
                  placeholder="Preferences, timezone, notes..."
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
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
