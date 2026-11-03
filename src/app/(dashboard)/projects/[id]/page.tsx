import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { calculateTimeLeft, calculateOutstandingAmount } from '@/lib/calculations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PROJECT_STATUSES, MONTH_NAMES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  Edit,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Receipt,
  CheckSquare,
  FileText,
  Copy,
  Archive,
  ExternalLink,
} from 'lucide-react';
import { ProjectDetailsClientActions } from '@/components/projects/project-details-client-actions';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      client: true,
      monthlyAssignments: {
        where: { isActive: true },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const { totalReceived, outstanding, paymentStatus } = calculateOutstandingAmount(
    Number(project.value),
    Number(project.advancePayment),
    project.payments
  );

  const timeLeft = calculateTimeLeft(
    project.deadline,
    project.orderStatus,
    project.actualDeliveryDate
  );

  const statusConfig = PROJECT_STATUSES.find((s) => s.value === project.orderStatus);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {project.orderId}
              </Badge>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                  statusConfig?.color || 'bg-slate-100 text-slate-800'
                }`}
              >
                {statusConfig?.label || project.orderStatus}
              </span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${timeLeft.badgeColor}`}>
                {timeLeft.text}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Category: {project.category} • Profile: {project.profileName} • Source: {project.projectSource}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          </Link>
          <Link href={`/carry-forward?projectId=${project.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
              <span>Carry Forward</span>
            </Button>
          </Link>
          <ProjectDetailsClientActions project={JSON.parse(JSON.stringify(project))} />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Contracted Value</p>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(project.value, project.currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Advance: {formatCurrency(project.advancePayment, project.currency)}
            </p>
          </CardContent>
        </Card>

        {/* Received Revenue */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Total Received</p>
              <Receipt className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalReceived, project.currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Status: <span className="font-semibold">{paymentStatus}</span>
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Amount */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Outstanding Balance</p>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(outstanding, project.currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {outstanding === 0 ? 'Fully Paid' : 'Pending payment clearance'}
            </p>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Progress</p>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-center justify-between mt-1 mb-2">
              <p className="text-2xl font-bold text-foreground">{project.progressPercentage}%</p>
              <span className="text-xs text-muted-foreground">Priority: {project.priority}</span>
            </div>
            <Progress value={project.progressPercentage} />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Details & Monthly Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope, Timeline & Client (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description / Scope */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Project Description & Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs leading-relaxed">
              <p className="text-foreground whitespace-pre-wrap">
                {project.description || 'No detailed scope description provided.'}
              </p>
              {project.remark && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="font-semibold text-foreground mb-0.5">Remark:</p>
                  <p className="text-muted-foreground">{project.remark}</p>
                </div>
              )}
              {project.internalNotes && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                  <p className="font-semibold text-amber-900 dark:text-amber-300 mb-0.5">
                    Internal Notes (Private):
                  </p>
                  <p className="text-amber-800 dark:text-amber-400">{project.internalNotes}</p>
                </div>
              )}
              {project.attachments && (
                <div className="pt-2">
                  <p className="font-semibold text-foreground mb-1">Attachments / Links:</p>
                  <a
                    href={project.attachments.startsWith('http') ? project.attachments : `https://${project.attachments}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span>{project.attachments}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Payment Transactions
                </CardTitle>
                <CardDescription className="text-xs">
                  Recorded payment transactions for this order
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {project.payments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No payment transactions recorded yet.
                </p>
              ) : (
                <div className="divide-y text-xs">
                  {project.payments.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(p.amount, p.currency)} via {p.paymentMethod}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(p.paymentDate)} {p.transactionRef && `• Ref: ${p.transactionRef}`}
                        </p>
                        {p.remark && <p className="text-[11px] text-muted-foreground italic">{p.remark}</p>}
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks & Subtasks */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Project Tasks & Deliverables ({project.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {project.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No tasks added to this project yet.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <div>
                          <p
                            className={`font-medium ${
                              task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {task.name}
                          </p>
                          {task.dueDate && (
                            <p className="text-[10px] text-muted-foreground">Due: {formatDate(task.dueDate)}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline, Client & Monthly Assignment History (1 col) */}
        <div className="space-y-6">
          {/* Client Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs">
              <div>
                <p className="text-[11px] text-muted-foreground">Client Name</p>
                <Link
                  href={`/clients/${project.client.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {project.client.name}
                </Link>
              </div>
              {project.client.companyName && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Company</p>
                  <p className="font-medium text-foreground">{project.client.companyName}</p>
                </div>
              )}
              {project.client.email && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Email</p>
                  <p className="text-foreground">{project.client.email}</p>
                </div>
              )}
              {project.client.country && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Country</p>
                  <p className="text-foreground">{project.client.country}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates & Timeline */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Timeline & Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">{formatDate(project.projectDate)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-medium">{formatDate(project.startDate)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Statement Date:</span>
                <span className="font-medium">{formatDate(project.deliveryStatementDate)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Hard Deadline:</span>
                <span className="font-semibold text-foreground">{formatDate(project.deadline)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Remaining Time:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${timeLeft.badgeColor}`}>
                  {timeLeft.text}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Assignment History (CRITICAL CARRY-FORWARD DISPLAY) */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                Monthly Carry Forward History
              </CardTitle>
              <CardDescription className="text-[11px]">
                Preserved historical timeline across planning months
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {project.monthlyAssignments.length === 0 ? (
                <p className="text-muted-foreground">No monthly assignments.</p>
              ) : (
                project.monthlyAssignments.map((a, idx) => {
                  const isCF = a.assignmentType === 'CARRY_FORWARD';
                  return (
                    <div
                      key={a.id}
                      className="p-3 rounded-lg border bg-muted/20 relative pl-4 border-l-4 border-l-primary space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/monthly/${a.year}/${a.month}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {MONTH_NAMES[a.month - 1]} {a.year}
                        </Link>
                        <Badge
                          variant={isCF ? 'warning' : 'info'}
                          className="text-[10px]"
                        >
                          {isCF ? 'Carry Forward' : 'Original'}
                        </Badge>
                      </div>

                      {isCF && a.fromMonth && (
                        <p className="text-[11px] text-muted-foreground">
                          From: {MONTH_NAMES[a.fromMonth - 1]} {a.fromYear} → To: {MONTH_NAMES[a.month - 1]} {a.year}
                        </p>
                      )}

                      {a.carryForwardReason && (
                        <p className="text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="font-medium">Reason:</span> {a.carryForwardReason}
                        </p>
                      )}

                      {a.remark && <p className="text-[11px] text-muted-foreground italic">{a.remark}</p>}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

