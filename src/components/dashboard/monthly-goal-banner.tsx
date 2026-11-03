'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Trophy,
  TrendingUp,
  Clock,
  Sparkles,
  Edit2,
  CheckCircle2,
  Flame,
  Loader2,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface GoalData {
  year: number;
  month: number;
  monthName: string;
  targetAmount: number;
  achievedAmount: number;
  deliveredValue: number;
  bookedValue: number;
  receivedRevenue: number;
  remaining: number;
  percentage: number;
  hasCustomTarget: boolean;
  currency: string;
  daysLeftInMonth: number;
}

export function MonthlyGoalBanner({
  year,
  month,
  onTargetUpdated,
}: {
  year?: number;
  month?: number;
  onTargetUpdated?: () => void;
}) {
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [targetInput, setTargetInput] = useState<string>('5000');
  const [saving, setSaving] = useState(false);

  const fetchGoal = async () => {
    try {
      const q = new URLSearchParams();
      if (year) q.set('year', year.toString());
      if (month) q.set('month', month.toString());

      const res = await fetch(`/api/targets/current-month?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGoal(data);
        setTargetInput(data.targetAmount?.toString() || '5000');
      }
    } catch (e) {
      console.error('Failed to load goal banner:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [year, month]);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(targetInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/targets/current-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: goal?.year,
          month: goal?.month,
          targetAmount: amount,
          currency: goal?.currency || 'USD',
        }),
      });

      if (!res.ok) throw new Error('Failed to save target');

      toast.success(`🎯 Monthly target updated to ${formatCurrency(amount, goal?.currency || 'USD')}`);
      setEditOpen(false);
      fetchGoal();
      onTargetUpdated?.();
    } catch (e: any) {
      toast.error(e.message || 'Error updating target');
    } finally {
      setSaving(false);
    }
  };

  const setPreset = (amt: number) => {
    setTargetInput(amt.toString());
  };

  if (loading && !goal) {
    return (
      <div className="h-24 w-full rounded-2xl border bg-card/60 p-4 animate-pulse flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span className="text-xs text-muted-foreground">Loading monthly revenue goal...</span>
      </div>
    );
  }

  if (!goal) return null;

  const pct = Math.min(100, Math.max(0, goal.percentage));
  const isSmashed = goal.percentage >= 100;
  const isClose = goal.percentage >= 70 && !isSmashed;

  // Dynamic progress gradient color
  const progressGradient = isSmashed
    ? 'from-emerald-500 via-teal-400 to-green-500'
    : isClose
    ? 'from-amber-500 via-orange-500 to-emerald-500'
    : 'from-blue-600 via-indigo-600 to-violet-600';

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-5 shadow-sm">
        {/* Background Ambient Glow */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Line: Header & Quick Edit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-2xs">
                {isSmashed ? (
                  <Trophy className="h-4 w-4 text-amber-500 animate-bounce" />
                ) : (
                  <Target className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    {goal.monthName} {goal.year} Revenue Goal
                  </h3>
                  {isSmashed ? (
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 gap-1 shadow-xs">
                      <Sparkles className="h-3 w-3" />
                      Target Smashed!
                    </Badge>
                  ) : isClose ? (
                    <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/40 text-[10px] px-2 py-0.5 font-bold">
                      <Flame className="h-3 w-3 mr-1" />
                      Almost There!
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
                      In Progress
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Track booked deliveries & completed client payments towards your monthly benchmark
                </p>
              </div>
            </div>

            {/* Edit Goal Button */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="h-7 text-xs gap-1.5 shadow-2xs hover:border-primary font-medium"
              >
                <Edit2 className="h-3 w-3 text-muted-foreground" />
                <span>Adjust Goal</span>
              </Button>
            </div>
          </div>

          {/* Progress Bar with Glow & Metric Label */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span>Progress:</span>
                <span className="text-sm font-bold text-primary">{goal.percentage}%</span>
                {goal.percentage > 100 && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    (+{(goal.percentage - 100).toFixed(1)}% over target!)
                  </span>
                )}
              </span>

              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{formatCurrency(goal.achievedAmount, goal.currency)}</strong> of{' '}
                <span className="font-semibold text-foreground">{formatCurrency(goal.targetAmount, goal.currency)}</span>
              </span>
            </div>

            {/* The Actual Progress Bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/80 shadow-inner">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${progressGradient} transition-all duration-700 ease-out shadow-xs`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Bottom Responsive Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            {/* 1. Earned / Delivered */}
            <div className="rounded-xl bg-card/60 border border-border/50 p-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">Achieved / Delivered</p>
              <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(goal.achievedAmount, goal.currency)}
              </p>
            </div>

            {/* 2. Target Goal */}
            <div className="rounded-xl bg-card/60 border border-border/50 p-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">Target Goal</p>
              <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                {formatCurrency(goal.targetAmount, goal.currency)}
              </p>
            </div>

            {/* 3. Remaining */}
            <div className="rounded-xl bg-card/60 border border-border/50 p-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">
                {goal.remaining === 0 ? 'Surplus Earned' : 'Remaining to Goal'}
              </p>
              <p
                className={`text-sm sm:text-base font-bold mt-0.5 ${
                  goal.remaining === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {goal.remaining === 0
                  ? `+${formatCurrency(goal.achievedAmount - goal.targetAmount, goal.currency)}`
                  : formatCurrency(goal.remaining, goal.currency)}
              </p>
            </div>

            {/* 4. Days Left in Month */}
            <div className="rounded-xl bg-card/60 border border-border/50 p-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">Time in Month</p>
              <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{goal.daysLeftInMonth} day{goal.daysLeftInMonth === 1 ? '' : 's'} left</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Adjust Target Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveTarget}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>Set {goal.monthName} {goal.year} Revenue Goal</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Target Amount ({goal.currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="1"
                    step="100"
                    required
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="pl-7 h-9 text-sm font-semibold"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Quick Benchmark Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Quick Benchmarks:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[2000, 3000, 5000, 8000, 10000, 15000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreset(amt)}
                      className={`h-7 text-xs px-2.5 rounded-full ${
                        targetInput === amt.toString() ? 'border-primary text-primary font-bold bg-primary/10' : ''
                      }`}
                    >
                      ${amt.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/60 text-[11px] text-muted-foreground space-y-1">
                <p>
                  💡 <strong>Pro Tip:</strong> Setting realistic monthly revenue goals keeps your project pipeline on schedule and triggers live milestone achievements.
                </p>
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
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Save Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
