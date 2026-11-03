'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Loader2,
  Calendar,
  Building,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';
import { toast } from 'sonner';

export default function RevenuePaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState('');
  const [remark, setRemark] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [payRes, projRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/projects'),
      ]);
      const payJson = await payRes.json();
      const projJson = await projRes.json();

      if (payRes.ok) setPayments(payJson.payments || []);
      if (projRes.ok) {
        setProjects(projJson.projects || []);
        if (projJson.projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projJson.projects[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !amount || parseFloat(amount) <= 0) {
      toast.error('Please select a project and enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          amount: parseFloat(amount),
          paymentDate,
          paymentMethod,
          transactionRef: transactionRef || undefined,
          remark: remark || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record payment');

      toast.success('Payment transaction saved successfully');
      setModalOpen(false);
      setAmount('');
      setTransactionRef('');
      setRemark('');
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalReceived = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const totalBookedValue = projects.reduce((s, p) => s + Number(p.value || 0), 0);
  const totalOutstanding = Math.max(0, totalBookedValue - totalReceived);
  const avgPayment = payments.length > 0 ? totalReceived / payments.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Revenue & Payment Transactions
          </h1>
          <p className="text-xs text-muted-foreground">
            Strict ledger of actual payments received, method allocations, and outstanding receivables
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 text-xs gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Record Payment</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleRecordPayment}>
              <DialogHeader>
                <DialogTitle className="text-base">Record Payment Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Project *</Label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.orderId}) - ${p.value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Amount Received *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      placeholder="500.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Payment Date *</Label>
                    <Input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payment Method *</Label>
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
                  <Label className="text-xs font-semibold">Transaction Reference / ID</Label>
                  <Input
                    placeholder="e.g. WISE-49201 or Payoneer Ref"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Remark</Label>
                  <Input
                    placeholder="Milestone 1, final balance, deposit..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Payment'}
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
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Received Revenue</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalReceived, 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Outstanding Balances</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalOutstanding, 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Transactions</p>
              <p className="text-xl font-bold text-foreground">{payments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Average Transaction</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(avgPayment, 'USD')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Transactions Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Transaction Ledger</CardTitle>
          <CardDescription className="text-xs">
            Chronological record of all client payments and cleared balances
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Project & Client</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs">Reference</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    No payment transactions recorded yet. Click "Record Payment" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40 transition-colors text-xs">
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {p.project?.name || 'Project'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.client?.name} • {p.project?.orderId}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatCurrency(p.amount, p.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {p.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {p.transactionRef || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" className="text-[10px]">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic max-w-xs truncate">
                      {p.remark || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
