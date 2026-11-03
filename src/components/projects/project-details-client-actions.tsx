'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Copy, Archive, Trash2, Plus, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProjectDetailsClientActions({ project }: { project: any }) {
  const router = useRouter();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentRemark, setPaymentRemark] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          amount: parseFloat(amount),
          currency: project.currency,
          paymentDate,
          paymentMethod,
          transactionRef: transactionRef || undefined,
          remark: paymentRemark || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      toast.success('Payment recorded successfully');
      setPaymentModalOpen(false);
      setAmount('');
      setTransactionRef('');
      setPaymentRemark('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate');
      const data = await res.json();
      toast.success('Project duplicated');
      router.push(`/projects/${data.project.id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/archive`, { method: 'POST' });
      const data = await res.json();
      toast.success(data.isArchived ? 'Project archived' : 'Project unarchived');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Project moved to trash');
      router.push('/projects');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      {/* Record Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Record Payment</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleAddPayment}>
            <DialogHeader>
              <DialogTitle className="text-base">Record Payment for {project.orderId}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount ({project.currency}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="250.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Payment Date *</Label>
                <Input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Payment Method *</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Transaction Reference</Label>
                <Input
                  placeholder="e.g. TXN-99881 or Wise Transfer ID"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Payment Remark</Label>
                <Input
                  placeholder="e.g. Milestone 2 release payment"
                  value={paymentRemark}
                  onChange={(e) => setPaymentRemark(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={savingPayment}>
                {savingPayment ? 'Saving...' : 'Add Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={handleDuplicate}
        title="Duplicate Project"
      >
        <Copy className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Duplicate</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={handleArchive}
        title={project.isArchived ? 'Unarchive' : 'Archive'}
      >
        <Archive className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{project.isArchived ? 'Unarchive' : 'Archive'}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDelete}
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </>
  );
}

