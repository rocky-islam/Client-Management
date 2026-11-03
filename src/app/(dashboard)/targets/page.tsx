'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Plus,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { MONTH_NAMES } from '@/lib/constants';
import { toast } from 'sonner';

export default function TargetsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState<number>(currentYear);
  const [targets, setTargets] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [targetType, setTargetType] = useState('MONTHLY_REVENUE');
  const [targetAmount, setTargetAmount] = useState('');
  const [month, setMonth] = useState<number>(currentMonth);
  const [metricType, setMetricType] = useState('RECEIVED_REVENUE');

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([
        fetch(`/api/targets?year=${year}`),
        fetch(`/api/monthly?year=${year}`),
      ]);
      const tJson = await tRes.json();
      const mJson = await mRes.json();

      if (tRes.ok) setTargets(tJson.targets || []);
      if (mRes.ok && mJson.months) {
        const revMap: Record<number, number> = {};
        for (const m of mJson.months) {
          revMap[m.month] = m.actualRevenue;
        }
        setMonthlyRevenue(revMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [year]);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetAmount: parseFloat(targetAmount),
          year,
          month: targetType.startsWith('MONTHLY') ? month : null,
          metricType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save target');

      toast.success('Target successfully established');
      setModalOpen(false);
      setTargetAmount('');
      fetchTargets();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Revenue Targets & Performance Benchmarks
          </h1>
          <p className="text-xs text-muted-foreground">
            Set and track monthly revenue goals, delivery quotas, and achievement milestones for {year}
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 text-xs gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Set Target</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveTarget}>
              <DialogHeader>
                <DialogTitle className="text-base">Configure Business Target</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Target Type</Label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="MONTHLY_REVENUE">Monthly Revenue Target</option>
                    <option value="YEARLY_REVENUE">Yearly Revenue Target</option>
                    <option value="MONTHLY_PROJECTS">Monthly Projects Count</option>
                  </select>
                </div>

                {targetType.startsWith('MONTHLY') && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Target Month</Label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m} {year}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Target Amount / Value *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 3000.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Establish Target'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Target Cards Grid for all 12 months */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTH_NAMES.map((name, index) => {
          const monthNum = index + 1;
          const targetObj = targets.find((t) => t.month === monthNum && t.targetType === 'MONTHLY_REVENUE');
          const targetVal = targetObj ? Number(targetObj.targetAmount) : 0;
          const actualVal = monthlyRevenue[monthNum] || 0;
          const achievement = targetVal > 0 ? Math.min(999, Math.round((actualVal / targetVal) * 100)) : 0;
          const remaining = Math.max(0, targetVal - actualVal);

          return (
            <Card key={name} className="shadow-sm border-border/70 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{name}</CardTitle>
                  <Badge variant={achievement >= 100 ? 'success' : achievement > 0 ? 'warning' : 'outline'}>
                    {achievement}%
                  </Badge>
                </div>
                <CardDescription className="text-[11px]">
                  Target: {targetVal > 0 ? formatCurrency(targetVal, 'USD') : 'Not Configured'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center text-muted-foreground mb-1">
                    <span>Achieved Revenue:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(actualVal, 'USD')}
                    </span>
                  </div>
                  <Progress value={achievement} className="h-2" />
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Remaining to goal:</span>
                  <span className="font-semibold text-foreground">
                    {targetVal > 0 ? formatCurrency(remaining, 'USD') : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
