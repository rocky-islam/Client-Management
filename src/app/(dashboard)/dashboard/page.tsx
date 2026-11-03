'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Receipt,
  Calendar,
  ArrowRight,
  Plus,
  Loader2,
  Users,
  Target,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTimeLeft } from '@/lib/calculations';
import { PROJECT_STATUSES } from '@/lib/constants';
import { MonthlyGoalBanner } from '@/components/dashboard/monthly-goal-banner';
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
} from 'recharts';

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState('THIS_YEAR');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${filterRange}`);
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
    fetchAnalytics();
  }, [filterRange]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { kpis, charts, recentProjects, upcomingDeadlines, overdueProjects, recentlyDelivered, recentPayments } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Business Intelligence Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time project operations, revenue cashflow, target benchmarks, and delivery radar
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Range */}
          <select
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="THIS_YEAR">This Year (2026)</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="TODAY">Today</option>
            <option value="ALL">All Time</option>
          </select>

          <Link href="/projects/new">
            <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Monthly Revenue Goal Progress Banner */}
      <MonthlyGoalBanner onTargetUpdated={fetchAnalytics} />

      {/* 12 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Projects */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Total Projects</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{kpis.totalProjects}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {kpis.activeProjects} active in pipeline
            </p>
          </CardContent>
        </Card>

        {/* Work in Progress */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Work in Progress</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{kpis.wipProjects}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active development</p>
          </CardContent>
        </Card>

        {/* Delivered Projects */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Delivered Orders</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{kpis.deliveredProjects}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completed successfully</p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Overdue Alerts</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{kpis.overdueProjects}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Past deadline</p>
          </CardContent>
        </Card>

        {/* Contracted Value */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Total Booked Value</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {formatCurrency(kpis.totalProjectValue, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">All project values</p>
          </CardContent>
        </Card>

        {/* Total Received Revenue */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Received Revenue</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {formatCurrency(kpis.totalReceivedRevenue, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cleared payments</p>
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Outstanding Balances</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">
              {formatCurrency(kpis.outstandingPayments, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Unpaid contract balance</p>
          </CardContent>
        </Card>

        {/* Current Month Revenue */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Monthly Revenue</p>
            <p className="text-xl font-bold text-primary mt-0.5">
              {formatCurrency(kpis.monthlyRevenue, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Received this month</p>
          </CardContent>
        </Card>

        {/* Monthly Target */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Monthly Target</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {kpis.monthlyTarget > 0 ? formatCurrency(kpis.monthlyTarget, 'USD') : 'Not Set'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Goal for current month</p>
          </CardContent>
        </Card>

        {/* Target Achievement */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Target Progress</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{kpis.targetAchievement}%</p>
            <Progress value={kpis.targetAchievement} className="h-1.5 mt-1.5" />
          </CardContent>
        </Card>

        {/* Business Expenses */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Business Expenses</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {formatCurrency(kpis.totalExpenses, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Subscriptions & tools</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-border/60">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-medium">Net Profit</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {formatCurrency(kpis.netProfit, 'USD')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Revenue - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section: Monthly Revenue & Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Booked Value Chart (2 cols) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Monthly Revenue & Booked Value (2026)
              </CardTitle>
              <CardDescription className="text-xs">
                Comparison between actual received revenue and contracted project values
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(val, 'USD')}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="bookedValue" name="Booked Value" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="Received Revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Distribution Donut Chart (1 col) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
            <CardDescription className="text-xs">Projects by current lifecycle status</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {charts.statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

      {/* Additional Charts Row: Source Performance & New vs Repeat Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Performance */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Project Source Performance</CardTitle>
            <CardDescription className="text-xs">Contract volume and revenue per sales source</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.sourcePerformance} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="source" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(val, 'USD')}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="totalValue" name="Total Value" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* New vs Repeat Clients */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">New vs Repeat Clients</CardTitle>
            <CardDescription className="text-xs">Customer retention and acquisition balance</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.newVsRepeat}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    <Cell fill="#4F46E5" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadlines Radar & Overdue Alert Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines (within 14 days) */}
        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Upcoming Deadlines (Next 14 Days)
              </CardTitle>
              <CardDescription className="text-xs">Projects due soon for delivery</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {upcomingDeadlines.length}
            </Badge>
          </CardHeader>
          <CardContent className="pt-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No pressing deadlines within the next 14 days.
              </p>
            ) : (
              <div className="divide-y text-xs">
                {upcomingDeadlines.map((p: any) => {
                  const tl = calculateTimeLeft(p.deadline, p.orderStatus);
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors block"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {p.client?.name} • Due: {formatDate(p.deadline)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${tl.badgeColor}`}>
                        {tl.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Projects Alert */}
        <Card className="shadow-sm border-rose-200/50 dark:border-rose-900/30">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                Overdue Projects Alert
              </CardTitle>
              <CardDescription className="text-xs">
                Incomplete projects past their target deadline
              </CardDescription>
            </div>
            <Badge variant="destructive" className="font-mono text-xs">
              {overdueProjects.length}
            </Badge>
          </CardHeader>
          <CardContent className="pt-3">
            {overdueProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                All projects are on schedule. No overdue projects!
              </p>
            ) : (
              <div className="divide-y text-xs">
                {overdueProjects.map((p: any) => {
                  const tl = calculateTimeLeft(p.deadline, p.orderStatus);
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-semibold text-foreground hover:text-rose-600 transition-colors block"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {p.client?.name} • Deadline was {formatDate(p.deadline)}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                        {tl.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Recent Payments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects (2 cols) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                Recently Added Projects
              </CardTitle>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="divide-y text-xs">
              {recentProjects.map((p: any) => {
                const statusConfig = PROJECT_STATUSES.find((s) => s.value === p.orderStatus);
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors block"
                      >
                        {p.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {p.client?.name} • {p.profileName} • {formatDate(p.projectDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(p.value, p.currency)}</p>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${
                          statusConfig?.color || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {statusConfig?.label || p.orderStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments (1 col) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-500" />
                Recent Payments
              </CardTitle>
            </div>
            <Link href="/revenue">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                <span>All Payments</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No recent payments.</p>
            ) : (
              <div className="divide-y text-xs">
                {recentPayments.map((pm: any) => (
                  <div key={pm.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(pm.amount, pm.currency)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {pm.paymentMethod} • {formatDate(pm.paymentDate)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {pm.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

