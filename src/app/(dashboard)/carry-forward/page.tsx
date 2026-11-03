'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRightLeft,
  Calendar,
  Layers,
  History,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MONTH_NAMES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function CarryForwardPage() {
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [projects, setProjects] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId || '');
  const [fromMonth, setFromMonth] = useState<number>(currentMonth > 1 ? currentMonth - 1 : 12);
  const [fromYear, setFromYear] = useState<number>(currentMonth > 1 ? currentYear : currentYear - 1);
  const [toMonth, setToMonth] = useState<number>(currentMonth);
  const [toYear, setToYear] = useState<number>(currentYear);
  const [reason, setReason] = useState<string>('Additional requirements requested by client');
  const [remark, setRemark] = useState<string>('Carried forward for continued sprint development');

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, histRes] = await Promise.all([
        fetch('/api/projects?status=WIP'),
        fetch('/api/carry-forward'),
      ]);
      const projData = await projRes.json();
      const histData = await histRes.json();

      if (projRes.ok) setProjects(projData.projects || []);
      if (histRes.ok) setHistory(histData.history || []);

      if (preselectedProjectId) {
        setSelectedProjectId(preselectedProjectId);
      } else if (projData.projects?.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projData.projects[0].id);
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

  const handleCarryForwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error('Please select a project to carry forward');
      return;
    }

    if (fromMonth === toMonth && fromYear === toYear) {
      toast.error('Source month and destination month cannot be identical');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/carry-forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          fromMonth,
          fromYear,
          toMonth,
          toYear,
          reason,
          remark,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to carry forward project');

      toast.success(
        `Project successfully carried forward to ${MONTH_NAMES[toMonth - 1]} ${toYear}!`
      );
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, monthName: string, yearVal: number) => {
    if (!confirm(`Remove this project assignment from ${monthName} ${yearVal}? The original project will NOT be deleted.`)) return;

    try {
      const res = await fetch(`/api/carry-forward/${assignmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove assignment');

      toast.success(data.message || 'Assignment removed successfully');
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6 text-primary" />
          Carry Forward Management
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Carry incomplete projects forward between planning months without creating duplicate project records.
        </p>
      </div>

      {/* Carry Forward Explanation Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-primary">How the Carry-Forward Engine Works</p>
          <p className="leading-relaxed">
            In Rocky Business Manager, projects assigned across multiple months (e.g., January → February → March) retain a single canonical record in the database. Carry-forward creates a distinct monthly assignment pointer, preserving historical analytics, remarks, and delivered statuses without duplicating financials.
          </p>
        </div>
      </div>

      {/* Grid: Operation Form + History Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Carry Forward Action Form (1 col) */}
        <Card className="shadow-sm h-fit">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Perform Carry Forward
            </CardTitle>
            <CardDescription className="text-xs">
              Assign an existing project into a new month cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCarryForwardSubmit} className="space-y-4 text-xs">
              {/* Project Select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Project *</Label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="" disabled>
                    Choose project to carry forward
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.orderId}) - ${p.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Month & Year */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-semibold">From Month</Label>
                  <select
                    value={fromMonth}
                    onChange={(e) => setFromMonth(parseInt(e.target.value))}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-semibold">From Year</Label>
                  <Input
                    type="number"
                    value={fromYear}
                    onChange={(e) => setFromYear(parseInt(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* To Month & Year */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-primary font-semibold">To Month (Target)</Label>
                  <select
                    value={toMonth}
                    onChange={(e) => setToMonth(parseInt(e.target.value))}
                    className="flex h-8 w-full rounded-md border border-primary/50 bg-transparent px-2 py-1 text-xs font-semibold"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-primary font-semibold">To Year</Label>
                  <Input
                    type="number"
                    value={toYear}
                    onChange={(e) => setToYear(parseInt(e.target.value))}
                    className="h-8 text-xs font-semibold border-primary/50"
                  />
                </div>
              </div>

              {/* Carry Forward Reason */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Carry Forward Reason *</Label>
                <Input
                  required
                  placeholder="e.g. Client requested extra milestone scope"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Remark */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Monthly Remark</Label>
                <Input
                  placeholder="Optional monthly note"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="h-9"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-9 font-medium shadow-sm gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Carry Forward to {MONTH_NAMES[toMonth - 1]}</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Carry Forward History (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Carry-Forward Audit History
                </CardTitle>
                <CardDescription className="text-xs">
                  All active carry-forward operations across projects
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {history.length} records
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  No projects have been carried forward yet. Use the form on the left to carry forward an active project.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/projects/${h.project.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors"
                          >
                            {h.project.name}
                          </Link>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {h.project.orderId}
                          </Badge>
                          <Badge variant="warning" className="text-[10px]">
                            Carry Forward
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                          <span>
                            From: {MONTH_NAMES[(h.fromMonth || 1) - 1]} {h.fromYear}
                          </span>
                          <span>→</span>
                          <span className="font-semibold text-primary">
                            To: {MONTH_NAMES[h.month - 1]} {h.year}
                          </span>
                          {h.carryForwardDate && (
                            <span>• Executed: {formatDate(h.carryForwardDate)}</span>
                          )}
                        </div>

                        {h.carryForwardReason && (
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="font-medium">Reason:</span> {h.carryForwardReason}
                          </p>
                        )}
                        {h.remark && (
                          <p className="text-[11px] text-muted-foreground italic">Note: {h.remark}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Link href={`/projects/${h.project.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(h.id, MONTH_NAMES[h.month - 1], h.year)}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          title="Remove assignment from this month (leaves original project intact)"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
