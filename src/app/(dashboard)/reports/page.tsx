'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MONTH_NAMES } from '@/lib/constants';
import { toast } from 'sonner';

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [reportType, setReportType] = useState<'MONTHLY' | 'YEARLY' | 'DAILY'>('MONTHLY');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/monthly?year=${currentYear}`);
        const json = await res.json();
        if (res.ok) {
          setMonthlyData(json.months || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [currentYear]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (monthlyData.length === 0) return;
    const headers = [
      'Month',
      'Total Projects',
      'Original Projects',
      'Carry Forward Projects',
      'Delivered',
      'WIP',
      'Cancelled',
      'Overdue',
      'Total Booked Value',
      'Actual Received Revenue',
    ];

    const rows = monthlyData.map((m) => [
      m.name,
      m.totalProjects,
      m.originalProjects,
      m.carryForwardProjects,
      m.deliveredProjects,
      m.wipProjects,
      m.cancelledProjects,
      m.overdueProjects,
      m.totalValue,
      m.actualRevenue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rocky-business-report-${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" />
            Business Reports & Statement Exports
          </h1>
          <p className="text-xs text-muted-foreground">
            Audit-ready business summaries, revenue statements, and monthly project velocity reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </Button>
          <Button size="sm" onClick={handleExportCSV} className="h-8 text-xs gap-1.5 shadow-sm">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <Button
          variant={reportType === 'MONTHLY' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportType('MONTHLY')}
          className="h-8 text-xs"
        >
          Monthly Breakdown ({currentYear})
        </Button>
        <Button
          variant={reportType === 'YEARLY' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportType('YEARLY')}
          className="h-8 text-xs"
        >
          Annual Summary
        </Button>
      </div>

      {/* Report Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">
            {reportType === 'MONTHLY' ? `Monthly Performance Report (${currentYear})` : `Yearly Overview (${currentYear})`}
          </CardTitle>
          <CardDescription className="text-xs">
            Normalized calculations using verified database transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-xs">Total Projects</TableHead>
                <TableHead className="text-xs">Original / CF</TableHead>
                <TableHead className="text-xs">Delivered</TableHead>
                <TableHead className="text-xs">WIP</TableHead>
                <TableHead className="text-xs">Booked Value</TableHead>
                <TableHead className="text-xs">Cleared Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : (
                monthlyData.map((m) => (
                  <TableRow key={m.month} className="hover:bg-muted/40 transition-colors text-xs">
                    <TableCell className="font-semibold text-foreground">{m.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {m.totalProjects}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px]">
                      {m.originalProjects} orig / {m.carryForwardProjects} cf
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {m.deliveredProjects}
                    </TableCell>
                    <TableCell className="text-amber-600 font-medium">{m.wipProjects}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatCurrency(m.totalValue, 'USD')}
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {formatCurrency(m.actualRevenue, 'USD')}
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
