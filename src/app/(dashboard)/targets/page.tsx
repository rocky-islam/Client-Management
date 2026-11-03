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
  Layers,
  Award,
  Sparkles,
  ArrowUpRight,
  Edit2,
  Clock,
  ChevronRight,
  Percent,
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

interface QuarterInfo {
  quarter: number;
  name: string;
  months: number[];
  monthNames: string[];
  target: number;
  actual: number;
  achievement: number;
  remaining: number;
  isCurrent: boolean;
  hasCustomTarget: boolean;
}

export default function TargetsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const [year, setYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [targets, setTargets] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Set Target Dialog
  const [targetScope, setTargetScope] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(currentQuarter);

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
      console.error('Failed to fetch targets:', e);
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [year]);

  // Calculations for Quarters (3 months per quarter)
  const quarterDefinitions = [
    { quarter: 1, name: 'Q1 (Jan - Mar)', months: [1, 2, 3], monthNames: ['January', 'February', 'March'] },
    { quarter: 2, name: 'Q2 (Apr - Jun)', months: [4, 5, 6], monthNames: ['April', 'May', 'June'] },
    { quarter: 3, name: 'Q3 (Jul - Sep)', months: [7, 8, 9], monthNames: ['July', 'August', 'September'] },
    { quarter: 4, name: 'Q4 (Oct - Dec)', months: [10, 11, 12], monthNames: ['October', 'November', 'December'] },
  ];

  const quartersData: QuarterInfo[] = quarterDefinitions.map((qd) => {
    // Check if custom quarterly target is set
    const qTargetObj = targets.find((t) => t.targetType === 'QUARTERLY_REVENUE' && t.month === qd.quarter);
    const customTargetVal = qTargetObj ? Number(qTargetObj.targetAmount) : 0;

    // Sum of monthly targets for these 3 months
    const sumMonthlyTargets = qd.months.reduce((sum, mNum) => {
      const mt = targets.find((t) => t.targetType === 'MONTHLY_REVENUE' && t.month === mNum);
      return sum + (mt ? Number(mt.targetAmount) : 0);
    }, 0);

    const targetVal = customTargetVal > 0 ? customTargetVal : sumMonthlyTargets;
    const actualVal = qd.months.reduce((sum, mNum) => sum + (monthlyRevenue[mNum] || 0), 0);
    const achievement = targetVal > 0 ? Math.min(999, Math.round((actualVal / targetVal) * 100)) : 0;
    const remaining = Math.max(0, targetVal - actualVal);

    return {
      quarter: qd.quarter,
      name: qd.name,
      months: qd.months,
      monthNames: qd.monthNames,
      target: targetVal,
      actual: actualVal,
      achievement,
      remaining,
      isCurrent: year === currentYear && qd.quarter === currentQuarter,
      hasCustomTarget: customTargetVal > 0,
    };
  });

  // Yearly Calculations
  const yearlyTargetObj = targets.find((t) => t.targetType === 'YEARLY_REVENUE' && (t.month === 0 || t.month === null));
  const customYearlyTarget = yearlyTargetObj ? Number(yearlyTargetObj.targetAmount) : 0;

  const sumAllMonthlyTargets = targets
    .filter((t) => t.targetType === 'MONTHLY_REVENUE')
    .reduce((sum, t) => sum + Number(t.targetAmount || 0), 0);

  const totalYearTarget = customYearlyTarget > 0 ? customYearlyTarget : sumAllMonthlyTargets;
  const totalYearActual = Object.values(monthlyRevenue).reduce((sum, v) => sum + v, 0);
  const totalYearAchievement =
    totalYearTarget > 0 ? Math.min(999, Math.round((totalYearActual / totalYearTarget) * 100)) : 0;
  const totalYearRemaining = Math.max(0, totalYearTarget - totalYearActual);

  // Current Month Data
  const curMonthTargetObj = targets.find((t) => t.targetType === 'MONTHLY_REVENUE' && t.month === currentMonth);
  const curMonthTarget = curMonthTargetObj ? Number(curMonthTargetObj.targetAmount) : 0;
  const curMonthActual = monthlyRevenue[currentMonth] || 0;
  const curMonthAchievement =
    curMonthTarget > 0 ? Math.min(999, Math.round((curMonthActual / curMonthTarget) * 100)) : 0;
  const curMonthRemaining = Math.max(0, curMonthTarget - curMonthActual);

  // Current Quarter Data
  const curQuarterData = quartersData.find((q) => q.quarter === currentQuarter) || quartersData[3];

  const handleOpenModal = (
    scope: 'monthly' | 'quarterly' | 'yearly',
    m?: number,
    q?: number,
    initialAmount?: number
  ) => {
    setTargetScope(scope);
    if (m !== undefined) setSelectedMonth(m);
    if (q !== undefined) setSelectedQuarter(q);
    setTargetAmount(initialAmount && initialAmount > 0 ? initialAmount.toString() : '');
    setModalOpen(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(targetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid target amount greater than zero');
      return;
    }

    setSubmitting(true);
    try {
      let targetType = 'MONTHLY_REVENUE';
      let monthPayload: number | null = selectedMonth;

      if (targetScope === 'quarterly') {
        targetType = 'QUARTERLY_REVENUE';
        monthPayload = selectedQuarter;
      } else if (targetScope === 'yearly') {
        targetType = 'YEARLY_REVENUE';
        monthPayload = 0;
      }

      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetAmount: parsedAmount,
          year,
          month: monthPayload,
          metricType: 'RECEIVED_REVENUE',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save target');

      toast.success(
        targetScope === 'quarterly'
          ? `Q${selectedQuarter} ${year} Quarterly Target established!`
          : targetScope === 'yearly'
          ? `${year} Annual Target established!`
          : `${MONTH_NAMES[selectedMonth - 1]} ${year} Target established!`
      );

      setModalOpen(false);
      setTargetAmount('');
      fetchTargets();
    } catch (e: any) {
      toast.error(e.message || 'Error establishing target');
    } finally {
      setSubmitting(false);
    }
  };

  const setPreset = (amt: number) => {
    setTargetAmount(amt.toString());
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <span>Revenue Targets & Performance Benchmarks</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor Monthly, Quarterly (3-Month Quotas), and Annual revenue target fill-up rates for {year}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year selector pills */}
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/50 p-0.5 text-xs">
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  year === y
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => handleOpenModal('monthly', currentMonth)}
            className="h-9 text-xs gap-1.5 shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Set Target</span>
          </Button>
        </div>
      </div>

      {/* Top 3 Executive KPI Summary Cards: Monthly, Quarterly & Yearly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Monthly Executive Card */}
        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  {MONTH_NAMES[currentMonth - 1]} {year}
                </CardTitle>
                <CardDescription className="text-[10px]">Monthly Revenue Target</CardDescription>
              </div>
            </div>
            <Badge
              variant={curMonthAchievement >= 100 ? 'success' : curMonthAchievement > 0 ? 'warning' : 'outline'}
              className="font-bold text-[10px]"
            >
              {curMonthAchievement}% Fill-Up
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Earned vs Target:</span>
                <span className="font-bold text-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {formatCurrency(curMonthActual, 'USD')}
                  </span>
                  <span className="text-muted-foreground"> / {formatCurrency(curMonthTarget, 'USD')}</span>
                </span>
              </div>
              <Progress value={Math.min(100, curMonthAchievement)} className="h-2" />
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Remaining:</span>
              <span className="font-semibold text-foreground">
                {curMonthTarget > 0 ? formatCurrency(curMonthRemaining, 'USD') : 'Not Configured'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenModal('monthly', currentMonth, undefined, curMonthTarget)}
                className="h-6 px-2 text-[10px] text-primary hover:text-primary font-medium ml-auto"
              >
                <Edit2 className="h-2.5 w-2.5 mr-1" />
                Adjust
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Quarterly Executive Card (3 Months) */}
        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-indigo-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  {curQuarterData.name} {year}
                </CardTitle>
                <CardDescription className="text-[10px]">Quarterly Target (3 Months)</CardDescription>
              </div>
            </div>
            <Badge
              variant={curQuarterData.achievement >= 100 ? 'success' : curQuarterData.achievement > 0 ? 'warning' : 'outline'}
              className="font-bold text-[10px]"
            >
              {curQuarterData.achievement}% Fill-Up
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Quarter Earned vs Target:</span>
                <span className="font-bold text-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {formatCurrency(curQuarterData.actual, 'USD')}
                  </span>
                  <span className="text-muted-foreground"> / {formatCurrency(curQuarterData.target, 'USD')}</span>
                </span>
              </div>
              <Progress value={Math.min(100, curQuarterData.achievement)} className="h-2" />
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Remaining in Q{currentQuarter}:</span>
              <span className="font-semibold text-foreground">
                {curQuarterData.target > 0 ? formatCurrency(curQuarterData.remaining, 'USD') : 'Not Configured'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenModal('quarterly', undefined, currentQuarter, curQuarterData.target)}
                className="h-6 px-2 text-[10px] text-primary hover:text-primary font-medium ml-auto"
              >
                <Edit2 className="h-2.5 w-2.5 mr-1" />
                Adjust
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. Yearly Executive Card */}
        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-amber-500/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">{year} Annual Milestone</CardTitle>
                <CardDescription className="text-[10px]">Full Year Total Benchmark</CardDescription>
              </div>
            </div>
            <Badge
              variant={totalYearAchievement >= 100 ? 'success' : totalYearAchievement > 0 ? 'warning' : 'outline'}
              className="font-bold text-[10px]"
            >
              {totalYearAchievement}% Fill-Up
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Year Earned vs Target:</span>
                <span className="font-bold text-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {formatCurrency(totalYearActual, 'USD')}
                  </span>
                  <span className="text-muted-foreground"> / {formatCurrency(totalYearTarget, 'USD')}</span>
                </span>
              </div>
              <Progress value={Math.min(100, totalYearAchievement)} className="h-2" />
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Remaining in {year}:</span>
              <span className="font-semibold text-foreground">
                {totalYearTarget > 0 ? formatCurrency(totalYearRemaining, 'USD') : 'Not Configured'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenModal('yearly', undefined, undefined, totalYearTarget)}
                className="h-6 px-2 text-[10px] text-primary hover:text-primary font-medium ml-auto"
              >
                <Edit2 className="h-2.5 w-2.5 mr-1" />
                Adjust
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tab Switcher: [ Monthly Targets | Quarterly Targets (3M) | Yearly Targets ] */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
        <div className="inline-flex rounded-xl border border-border/80 bg-muted/60 p-1 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'monthly'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Monthly Targets (12 Months)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quarterly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'quarterly'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Quarterly Earn (3 মাস = ১ কোয়ার্টার)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'yearly'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Yearly Earn (বাৎসরিক আয়)</span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          {activeTab === 'monthly' && 'Showing individual monthly goals for all 12 calendar months'}
          {activeTab === 'quarterly' && 'Showing 4 business quarters (Q1, Q2, Q3, Q4: 3 months each)'}
          {activeTab === 'yearly' && 'Showing annual macro performance and quarterly contribution'}
        </div>
      </div>

      {/* TAB 1: MONTHLY TARGETS (12 Months Grid) */}
      {activeTab === 'monthly' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {MONTH_NAMES.map((name, index) => {
            const monthNum = index + 1;
            const targetObj = targets.find((t) => t.month === monthNum && t.targetType === 'MONTHLY_REVENUE');
            const targetVal = targetObj ? Number(targetObj.targetAmount) : 0;
            const actualVal = monthlyRevenue[monthNum] || 0;
            const achievement = targetVal > 0 ? Math.min(999, Math.round((actualVal / targetVal) * 100)) : 0;
            const remaining = Math.max(0, targetVal - actualVal);
            const isCurrent = year === currentYear && monthNum === currentMonth;

            return (
              <Card
                key={name}
                className={`shadow-sm border-border/70 hover:shadow-md transition-all ${
                  isCurrent ? 'ring-2 ring-primary/40 bg-primary/[0.02]' : ''
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CardTitle className="text-base font-bold">{name}</CardTitle>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-bold bg-primary/10 text-primary">
                          Current
                        </Badge>
                      )}
                    </div>
                    <Badge variant={achievement >= 100 ? 'success' : achievement > 0 ? 'warning' : 'outline'}>
                      {achievement}%
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] flex items-center justify-between">
                    <span>Target: {targetVal > 0 ? formatCurrency(targetVal, 'USD') : 'Not Set'}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenModal('monthly', monthNum, undefined, targetVal)}
                      className="text-primary hover:underline text-[11px] font-medium flex items-center gap-0.5"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                      {targetVal > 0 ? 'Edit' : 'Set'}
                    </button>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between items-center text-muted-foreground mb-1">
                      <span>Achieved Revenue:</span>
                      <span className="font-bold text-foreground">{formatCurrency(actualVal, 'USD')}</span>
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
      )}

      {/* TAB 2: QUARTERLY TARGETS (4 Quarters - 3 Months Each) */}
      {activeTab === 'quarterly' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quartersData.map((q) => (
              <Card
                key={q.quarter}
                className={`relative overflow-hidden border-border/80 shadow-sm hover:shadow-md transition-all ${
                  q.isCurrent ? 'ring-2 ring-primary/40 bg-primary/[0.02]' : ''
                }`}
              >
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary font-bold text-sm">
                        Q{q.quarter}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-foreground">
                            {q.name} {year}
                          </CardTitle>
                          {q.isCurrent && (
                            <Badge className="bg-primary text-white text-[10px] px-2 py-0.5 font-bold">
                              Active Quarter
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          3 Months: {q.monthNames.join(', ')}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant={q.achievement >= 100 ? 'success' : q.achievement > 0 ? 'warning' : 'outline'}
                        className="text-xs font-bold px-2.5 py-0.5"
                      >
                        {q.achievement}% Fill-Up
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {q.hasCustomTarget ? 'Custom Target' : 'Sum of Months'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 space-y-4 text-xs">
                  {/* Progress Bar & Amounts */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Quarter Progress:</span>
                      <span className="font-bold text-foreground">
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(q.actual, 'USD')}
                        </strong>{' '}
                        of {formatCurrency(q.target, 'USD')}
                      </span>
                    </div>
                    <Progress value={Math.min(100, q.achievement)} className="h-2.5" />
                  </div>

                  {/* 3 Months Contribution Breakdown */}
                  <div className="space-y-1.5 pt-2 border-t">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      3-Month Contribution Breakdown:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {q.months.map((mNum, i) => {
                        const mRev = monthlyRevenue[mNum] || 0;
                        const mTargetObj = targets.find((t) => t.month === mNum && t.targetType === 'MONTHLY_REVENUE');
                        const mTarget = mTargetObj ? Number(mTargetObj.targetAmount) : 0;

                        return (
                          <div
                            key={mNum}
                            className="rounded-lg border border-border/50 bg-muted/40 p-2 text-center"
                          >
                            <p className="text-[10px] font-bold text-muted-foreground">{MONTH_NAMES[mNum - 1]}</p>
                            <p className="text-xs font-bold text-foreground mt-0.5">
                              {formatCurrency(mRev, 'USD')}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {mTarget > 0 ? `Target: $${mTarget}` : 'No target'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Strip: Remaining & Adjust Button */}
                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">Remaining to Q{q.quarter} Target: </span>
                      <strong className="text-foreground">
                        {q.target > 0 ? formatCurrency(q.remaining, 'USD') : 'Not Set'}
                      </strong>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal('quarterly', undefined, q.quarter, q.target)}
                      className="h-7 text-xs gap-1 font-medium hover:border-primary"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{q.hasCustomTarget ? 'Adjust Q' + q.quarter : 'Set Q' + q.quarter + ' Target'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: YEARLY TARGETS & PERFORMANCE (বাৎসরিক আয় ও বিস্তারিত) */}
      {activeTab === 'yearly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Master Annual Hero Card */}
          <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-amber-500/10 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-xl shadow-xs">
                    🏆
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {year} Annual Revenue Goal & Performance
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Full-year macroeconomic target, quarterly progress distribution, and total earn milestones
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <p className="text-[10px] font-medium text-muted-foreground">Total Year Target</p>
                    <p className="text-base font-extrabold text-foreground mt-0.5">
                      {formatCurrency(totalYearTarget, 'USD')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <p className="text-[10px] font-medium text-muted-foreground">Year-to-Date Earned</p>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(totalYearActual, 'USD')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <p className="text-[10px] font-medium text-muted-foreground">Remaining to Goal</p>
                    <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                      {totalYearTarget > 0 ? formatCurrency(totalYearRemaining, 'USD') : '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <p className="text-[10px] font-medium text-muted-foreground">Target Fill-Up</p>
                    <p className="text-base font-extrabold text-primary mt-0.5">
                      {totalYearAchievement}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-xs min-w-[200px]">
                <div className="text-3xl font-black text-primary">{totalYearAchievement}%</div>
                <div className="text-xs text-muted-foreground font-medium mt-1">Overall Completion</div>
                <Progress value={Math.min(100, totalYearAchievement)} className="h-2 w-32 mt-2" />
                <Button
                  size="sm"
                  onClick={() => handleOpenModal('yearly', undefined, undefined, totalYearTarget)}
                  className="h-8 text-xs gap-1.5 mt-3 w-full font-semibold"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Set Annual Goal</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* 4 Quarters Side-by-Side Comparison */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Quarterly Contribution to Annual Goal</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quartersData.map((q) => (
                <div
                  key={q.quarter}
                  className="rounded-xl border border-border/70 bg-card p-4 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Quarter {q.quarter}</span>
                    <Badge variant={q.achievement >= 100 ? 'success' : 'outline'} className="text-[10px]">
                      {q.achievement}%
                    </Badge>
                  </div>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(q.actual, 'USD')}
                  </p>
                  <Progress value={Math.min(100, q.achievement)} className="h-1.5" />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                    <span>Target: ${q.target}</span>
                    <span>{q.monthNames.map((n) => n.substring(0, 3)).join('/')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unified Set Target Modal (Supports Monthly, Quarterly, and Yearly) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveTarget}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Establish Revenue Target</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Scope Selection Pill Toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Scope</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('monthly')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      targetScope === 'monthly'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Monthly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope('quarterly')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      targetScope === 'quarterly'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Quarterly (3M)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope('yearly')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      targetScope === 'yearly'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Yearly</span>
                  </button>
                </div>
              </div>

              {/* Scope Parameters */}
              {targetScope === 'monthly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Select Target Month</Label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m} {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetScope === 'quarterly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Select Business Quarter (3 Months)</Label>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  >
                    <option value={1}>Q1: January, February, March ({year})</option>
                    <option value={2}>Q2: April, May, June ({year})</option>
                    <option value={3}>Q3: July, August, September ({year})</option>
                    <option value={4}>Q4: October, November, December ({year})</option>
                  </select>
                </div>
              )}

              {targetScope === 'yearly' && (
                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 text-xs">
                  <span className="font-semibold text-foreground">Annual Target for Year:</span>{' '}
                  <span className="font-bold text-primary">{year}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    This goal sets the annual benchmark across all 12 calendar months.
                  </p>
                </div>
              )}

              {/* Target Amount Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Amount (USD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 5000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="pl-7 h-9 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Quick Benchmark Chips tailored to scope */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Quick Benchmarks:</label>
                <div className="flex flex-wrap gap-1.5">
                  {(targetScope === 'yearly'
                    ? [15000, 30000, 50000, 75000, 100000, 150000]
                    : targetScope === 'quarterly'
                    ? [3000, 6000, 9000, 12000, 15000, 25000]
                    : [1000, 2000, 3000, 5000, 8000, 10000]
                  ).map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreset(amt)}
                      className={`h-7 text-xs px-2.5 rounded-full ${
                        targetAmount === amt.toString() ? 'border-primary bg-primary/10 text-primary font-bold' : ''
                      }`}
                    >
                      ${amt.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={submitting} className="h-8 text-xs font-semibold">
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  'Establish Target'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
