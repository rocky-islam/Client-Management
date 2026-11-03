'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Calendar,
  Loader2,
  PieChart as PieIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics?range=THIS_YEAR');
        const json = await res.json();
        if (res.ok) setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { kpis, charts } = data;

  // Best platform by revenue
  const bestPlatform = [...charts.sourcePerformance].sort((a, b) => b.totalValue - a.totalValue)[0];
  const repeatRate =
    kpis.totalProjects > 0
      ? Math.round(
          ((charts.newVsRepeat.find((x: any) => x.name === 'Repeat Orders')?.value || 0) /
            kpis.totalProjects) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Business Analytics & Intelligence
        </h1>
        <p className="text-xs text-muted-foreground">
          Platform performance metrics, repeat customer rates, conversion pipelines, and revenue velocity
        </p>
      </div>

      {/* Strategic KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Top Sales Platform</p>
              <p className="text-xl font-bold text-foreground">{bestPlatform?.source || 'Fiverr'}</p>
              <p className="text-[10px] text-muted-foreground">
                {bestPlatform ? formatCurrency(bestPlatform.totalValue, 'USD') : '$0'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Repeat Order Rate</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {repeatRate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Returning clients share</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Average Order Value</p>
              <p className="text-xl font-bold text-foreground">
                {kpis.totalProjects > 0
                  ? formatCurrency(kpis.totalProjectValue / kpis.totalProjects, 'USD')
                  : '$0'}
              </p>
              <p className="text-[10px] text-muted-foreground">Per booked project</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Delivery Completion</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {kpis.totalProjects > 0
                  ? Math.round((kpis.deliveredProjects / kpis.totalProjects) * 100)
                  : 0}
                %
              </p>
              <p className="text-[10px] text-muted-foreground">Total orders delivered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Velocity Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">2026 Monthly Cashflow & Revenue</CardTitle>
          <CardDescription className="text-xs">
            Tracking actual payments cleared versus contracts booked
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(val, 'USD')}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="bookedValue" name="Booked Contract Value" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Cleared Revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Source Performance & New vs Repeat Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Table & Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Channel & Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {charts.sourcePerformance.map((src: any, idx: number) => {
                const pct =
                  kpis.totalProjectValue > 0
                    ? Math.round((src.totalValue / kpis.totalProjectValue) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">{src.source}</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(src.totalValue, 'USD')} ({pct}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>{src.count} orders</span>
                      <span>Avg order: {formatCurrency(src.avgValue, 'USD')}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pipeline Health Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {charts.statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
