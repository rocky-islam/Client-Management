'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FolderKanban,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { MONTH_NAMES } from '@/lib/constants';

export default function MonthlyOverviewPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const [year, setYear] = useState<number>(currentYear);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonthlyData = async (targetYear: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monthly?year=${targetYear}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.months || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData(year);
  }, [year]);

  // Aggregate year totals
  const totalYearProjects = data.reduce((s, m) => s + m.totalProjects, 0);
  const totalYearDelivered = data.reduce((s, m) => s + m.deliveredProjects, 0);
  const totalYearOriginal = data.reduce((s, m) => s + m.originalProjects, 0);
  const totalYearCarryForward = data.reduce((s, m) => s + m.carryForwardProjects, 0);
  const totalYearValue = data.reduce((s, m) => s + m.totalValue, 0);
  const totalYearRevenue = data.reduce((s, m) => s + m.actualRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header and Year Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Monthly Projects Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Twelve-month strategic planning dashboard, carry-forward tracking, and revenue performance
          </p>
        </div>

        {/* Year Selector Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year - 1)}
            className="h-8 px-2 text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-1 bg-muted rounded-md font-bold text-sm text-foreground">
            {year}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year + 1)}
            className="h-8 px-2 text-xs"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {year !== currentYear && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setYear(currentYear)}
              className="h-8 text-xs font-medium"
            >
              Current Year
            </Button>
          )}
        </div>
      </div>

      {/* Year Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Year Assignments</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{totalYearProjects}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalYearOriginal} Original • {totalYearCarryForward} Carried
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Delivered</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {totalYearDelivered}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completed projects</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Carry Forwards</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {totalYearCarryForward}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Across monthly cycles</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Booked Value</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {formatCurrency(totalYearValue, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sum of assigned value</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Received Revenue</p>
            <p className="text-xl font-bold text-primary mt-0.5">
              {formatCurrency(totalYearRevenue, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Actual cleared payments</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Active Months</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {data.filter((m) => m.totalProjects > 0).length} / 12
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Months with orders</p>
          </CardContent>
        </Card>
      </div>

      {/* 12 Clickable Month Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((m) => {
            const isCurrent = year === currentYear && m.month === currentMonthNum;
            return (
              <Link key={m.month} href={`/monthly/${year}/${m.month}`} className="group">
                <Card
                  className={`h-full transition-all duration-200 hover:shadow-md hover:border-primary/50 relative overflow-hidden ${
                    isCurrent ? 'ring-2 ring-primary border-transparent' : 'border-border/70'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
                      Current Month
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {m.name}
                      </CardTitle>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {m.totalProjects} {m.totalProjects === 1 ? 'Project' : 'Projects'}
                      </Badge>
                    </div>
                    <CardDescription className="text-[11px]">
                      {m.originalProjects} Original • {m.carryForwardProjects} Carry Forward
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    {/* Status Pill Counts */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="p-1.5 rounded bg-muted/50 border">
                        <span className="text-[10px] text-muted-foreground block">WIP</span>
                        <span className="font-bold text-amber-600">{m.wipProjects}</span>
                      </div>
                      <div className="p-1.5 rounded bg-muted/50 border">
                        <span className="text-[10px] text-muted-foreground block">Delivered</span>
                        <span className="font-bold text-emerald-600">{m.deliveredProjects}</span>
                      </div>
                      <div className="p-1.5 rounded bg-muted/50 border">
                        <span className="text-[10px] text-muted-foreground block">Overdue</span>
                        <span className="font-bold text-rose-600">{m.overdueProjects}</span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-2 border-t space-y-1 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Project Value:</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(m.totalValue, 'USD')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Actual Revenue:</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(m.actualRevenue, 'USD')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
