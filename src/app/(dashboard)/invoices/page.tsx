'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Download,
  DollarSign,
  Loader2,
  Trash2,
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
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Payment due within 14 days. Thank you for your business!');
  const [items, setItems] = useState([
    { description: 'Web Application Development Services', quantity: 1, unitPrice: 1200 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, cliRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/clients'),
      ]);
      const invJson = await invRes.json();
      const cliJson = await cliRes.json();

      if (invRes.ok) setInvoices(invJson.invoices || []);
      if (cliRes.ok) {
        setClients(cliJson.clients || []);
        if (cliJson.clients?.length > 0 && !clientId) {
          setClientId(cliJson.clients[0].id);
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

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const totalCalculated = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          invoiceNumber,
          issueDate,
          dueDate,
          notes,
          items,
          currency: 'USD',
          paymentStatus: 'UNPAID',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      toast.success(`Invoice ${data.invoice.invoiceNumber} created successfully`);
      setModalOpen(false);
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (inv: any) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Client Invoice Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Generate formal PDF-ready invoices, track payment status, and manage client billings
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 text-xs gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Generate Invoice</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateInvoice}>
              <DialogHeader>
                <DialogTitle className="text-base">Generate Professional Invoice</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Client *</Label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Invoice Number *</Label>
                    <Input
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Issue Date *</Label>
                    <Input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Due Date *</Label>
                    <Input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Invoice Line Items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="h-7 text-xs"
                    >
                      + Add Item
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Service description"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="flex-1 text-xs h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 text-xs h-8"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 text-xs h-8"
                        />
                        <span className="w-20 text-right font-semibold text-xs">
                          {formatCurrency((item.quantity || 0) * (item.unitPrice || 0), 'USD')}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2 text-sm font-bold text-foreground">
                    Total: {formatCurrency(totalCalculated, 'USD')}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t">
                  <Label className="text-xs font-semibold">Notes / Terms</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Generating...' : 'Save & Issue Invoice'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-hidden">
          <Table className="w-full min-w-[860px] text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[130px]">Invoice #</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[180px]">Client</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[110px]">Issue Date</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[110px]">Due Date</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[120px] text-right">Total Amount</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[110px] text-center">Payment Status</TableHead>
                <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[90px] text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    No invoices generated yet. Click "Generate Invoice" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/40 transition-colors text-xs">
                    <TableCell className="font-mono font-semibold text-primary whitespace-nowrap py-3">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="font-semibold text-foreground whitespace-nowrap">{inv.client?.name}</div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {inv.client?.companyName || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap py-3">
                      {formatDate(inv.issueDate)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground whitespace-nowrap py-3">
                      {formatDate(inv.dueDate)}
                    </TableCell>
                    <TableCell className="font-bold text-foreground text-right whitespace-nowrap py-3">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </TableCell>
                    <TableCell className="text-center py-3 whitespace-nowrap">
                      <Badge
                        variant={inv.paymentStatus === 'PAID' ? 'success' : 'outline'}
                        className="text-[10px]"
                      >
                        {inv.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3 pr-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(inv)}
                        className="h-7 text-xs gap-1"
                        title="Print / Save as PDF"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print</span>
                      </Button>
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

