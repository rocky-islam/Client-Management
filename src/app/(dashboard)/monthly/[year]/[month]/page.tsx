'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Target,
  Plus,
  Loader2,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProjectTable } from '@/components/projects/project-table';
import { formatCurrency } from '@/lib/utils';
import { MONTH_NAMES } from '@/lib/constants';

export default function SingleMonthPage({
  params,
}: {
  params: { year: string; month: string };
}) {
  const router = useRouter();
  const year = parseInt(params.year);
  const month = parseInt(params.month);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monthly/${year}/${month}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [year, month]);

  // Previous and next month calculation
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12">Failed to load month data.</div>;
  }

  const { stats, projects } = data;

  // Filter projects by assignment type or status if toggled
  const filteredProjects = projects.filter((p: any) => {
    if (filterType === 'ORIGINAL') return p.assignmentType === 'ORIGINAL';
    if (filterType === 'CARRY_FORWARD') return p.assignmentType === 'CARRY_FORWARD';
    if (filterType === 'WIP') return p.orderStatus === 'WIP';
    if (filterType === 'DELIVERED') return p.orderStatus === 'DELIVERED';
    if (filterType === 'OVERDUE') return p.isOverdue;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/monthly">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              {data.monthName} {year}
            </h1>
            <p className="text-xs text-muted-foreground">
              {stats.totalProjects} total assigned projects ({stats.originalCount} original, {stats.carryForwardCount} carried forward)
            </p>
          </div>
        </div>

        {/* Previous / Next Month Switcher */}
        <div className="flex items-center gap-2">
          <Link href={`/monthly/${prevYear}/${prevMonth}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{MONTH_NAMES[prevMonth - 1].substring(0, 3)}</span>
            </Button>
          </Link>
          <Link href={`/monthly/${nextYear}/${nextMonth}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <span>{MONTH_NAMES[nextMonth - 1].substring(0, 3)}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/projects/new">
            <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Monthly KPIs: 4 Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Booked Project Value */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Monthly Project Value</p>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(stats.totalProjectValue, 'USD')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {stats.newOrdersCount} New Orders • {stats.repeatOrdersCount} Repeat Orders
            </p>
          </CardContent>
        </Card>

        {/* Actual Received Revenue */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Actual Monthly Revenue</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(stats.actualMonthlyRevenue, 'USD')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Cleared payments in {data.monthName}
            </p>
          </CardContent>
        </Card>

        {/* Monthly Target Progress */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Monthly Target</p>
              <Target className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex items-center justify-between mt-1 mb-2">
              <p className="text-2xl font-bold text-foreground">
                {stats.targetAmount > 0 ? formatCurrency(stats.targetAmount, 'USD') : 'Not Set'}
              </p>
              {stats.targetAmount > 0 && (
                <span className="text-xs font-semibold text-primary">
                  {stats.targetAchievement}%
                </span>
              )}
            </div>
            <Progress value={stats.targetAchievement} />
          </CardContent>
        </Card>

        {/* Project Pipeline Breakdown */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Pipeline Status</p>
              <FolderKanban className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">
                {stats.wipCount} WIP
              </Badge>
              <Badge variant="success" className="text-[10px]">
                {stats.deliveredCount} Delivered
              </Badge>
              {stats.overdueCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {stats.overdueCount} Overdue
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Button
          variant={filterType === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('ALL')}
          className="h-7 text-xs"
        >
          All ({stats.totalProjects})
        </Button>
        <Button
          variant={filterType === 'ORIGINAL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('ORIGINAL')}
          className="h-7 text-xs"
        >
          Original ({stats.originalCount})
        </Button>
        <Button
          variant={filterType === 'CARRY_FORWARD' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('CARRY_FORWARD')}
          className="h-7 text-xs"
        >
          Carry Forward ({stats.carryForwardCount})
        </Button>
        <Button
          variant={filterType === 'WIP' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('WIP')}
          className="h-7 text-xs"
        >
          WIP ({stats.wipCount})
        </Button>
        <Button
          variant={filterType === 'DELIVERED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('DELIVERED')}
          className="h-7 text-xs"
        >
          Delivered ({stats.deliveredCount})
        </Button>
      </div>

      {/* Main Project Table for this Month */}
      <ProjectTable
        data={filteredProjects}
        onRefresh={fetchMonthData}
        title={`${data.monthName} ${year} Projects`}
      />
    </div>
  );
}
