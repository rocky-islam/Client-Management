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
  Calendar,
  Layers,
  Award,
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
  scope?: string;
  year: number;
  month: number;
  quarter?: number;
  monthName: string;
  scopeTitle?: string;
  scopeSubtitle?: string;
  targetAmount: number;
  achievedAmount: number;
  deliveredValue: number;
  bookedValue: number;
  receivedRevenue: number;
  remaining: number;
  percentage: number;
  hasCustomTarget: boolean;
  currency: string;
  daysLeft?: number;
  daysLeftInMonth?: number;
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
  const [scope, setScope] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [targetInput, setTargetInput] = useState<string>('5000');
  const [saving, setSaving] = useState(false);

  const fetchGoal = async (targetScope: 'monthly' | 'quarterly' | 'yearly' = scope) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (year) q.set('year', year.toString());
      if (month) q.set('month', month.toString());
      q.set('scope', targetScope);

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
    fetchGoal(scope);
  }, [year, month, scope]);

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
          quarter: goal?.quarter,
          scope,
          targetAmount: amount,
          currency: goal?.currency || 'USD',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save goal');
      }

      toast.success(
        scope === 'quarterly'
          ? `Q${goal?.quarter} ${goal?.year} Quarterly Goal updated!`
          : scope === 'yearly'
          ? `${goal?.year} Annual Revenue Goal updated!`
          : `${goal?.monthName} ${goal?.year} Revenue Goal updated!`
      );
      setEditOpen(false);
      fetchGoal(scope);
      onTargetUpdated?.();
    } catch (e: any) {
      toast.error(e.message || 'Error updating goal');
    } finally {
      setSaving(false);
    }
  };

  const setPreset = (amt: number) => {
    setTargetInput(amt.toString());
  };

  if (loading && !goal) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium">
            Loading revenue targets & achievements...
          </span>
        </div>
      </div>
    );
  }

  if (!goal) return null;

  const pct = Math.min(100, Math.max(0, goal.percentage));
  const isSmashed = goal.percentage >= 100;
  const isClose = goal.percentage >= 80 && goal.percentage < 100;

  // Dynamic gradient based on achievement tier
  let progressGradient = 'from-violet-600 via-indigo-600 to-primary';
  if (isSmashed) {
    progressGradient = 'from-emerald-500 via-teal-500 to-green-600';
  } else if (isClose) {
    progressGradient = 'from-amber-500 via-orange-500 to-rose-500';
  }

  const daysRemaining = goal.daysLeft ?? goal.daysLeftInMonth ?? 0;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        {/* Soft background ambient glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        {isSmashed && (
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        )}

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Line: Header, Scope Toggle Buttons & Quick Edit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
                {isSmashed ? (
                  <Trophy className="h-5 w-5 text-amber-500 animate-bounce" />
                ) : scope === 'quarterly' ? (
                  <Layers className="h-5 w-5 text-primary" />
                ) : scope === 'yearly' ? (
                  <Award className="h-5 w-5 text-primary" />
                ) : (
                  <Target className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    {goal.scopeTitle || `${goal.monthName} ${goal.year} Revenue Goal`}
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
                  {goal.scopeSubtitle || 'Track booked deliveries & completed client payments towards your business targets'}
                </p>
              </div>
            </div>

            {/* Scope Switcher [ Monthly | Quarterly | Yearly ] & Edit Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-border/80 bg-muted/60 p-0.5 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScope('monthly')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    scope === 'monthly'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setScope('quarterly')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    scope === 'quarterly'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Quarterly (3M)
                </button>
                <button
                  type="button"
                  onClick={() => setScope('yearly')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    scope === 'yearly'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                </button>
              </div>

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

            {/* 4. Days Left */}
            <div className="rounded-xl bg-card/60 border border-border/50 p-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">
                {scope === 'quarterly' ? 'Quarter Time Left' : scope === 'yearly' ? 'Year Time Left' : 'Time in Month'}
              </p>
              <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{daysRemaining} day{daysRemaining === 1 ? '' : 's'} left</span>
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
                <span>
                  Set {scope === 'quarterly' ? `Q${goal.quarter} ${goal.year} Quarterly` : scope === 'yearly' ? `${goal.year} Annual` : `${goal.monthName} ${goal.year}`} Revenue Goal
                </span>
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
                    min="0"
                    step="any"
                    required
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="pl-7 h-9 text-sm font-semibold"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Quick Benchmark Chips tailored to scope */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Quick Benchmarks:</label>
                <div className="flex flex-wrap gap-1.5">
                  {(scope === 'yearly'
                    ? [15000, 25000, 35000, 50000, 75000, 100000]
                    : scope === 'quarterly'
                    ? [3000, 6000, 9000, 12000, 15000, 20000]
                    : [1000, 2000, 3000, 5000, 8000, 10000]
                  ).map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreset(amt)}
                      className={`h-7 text-xs px-2.5 rounded-full ${
                        targetInput === amt.toString() ? 'border-primary bg-primary/10 text-primary font-bold' : ''
                      }`}
                    >
                      ${amt.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1 border border-border/50">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Target Planning Pro-Tip:
                </p>
                <p>
                  {scope === 'quarterly'
                    ? 'Quarterly revenue goals span 3 months and encourage sustainable project pipeline development.'
                    : scope === 'yearly'
                    ? 'Annual revenue milestones help you track your macro freelancing growth and business scale.'
                    : 'Setting realistic monthly revenue goals keeps your project pipeline on schedule and triggers live milestone achievements.'}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="h-8 text-xs">
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  'Save Goal'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
