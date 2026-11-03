import React from 'react';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ProjectTable } from '@/components/projects/project-table';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { isOverdue } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; archived?: string };
}) {
  const user = await requireAuth();
  const isArchived = searchParams.archived === 'true';

  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
      isArchived: isArchived,
      isDeleted: false,
    },
    include: {
      client: {
        select: { id: true, name: true, companyName: true },
      },
      payments: {
        where: { status: 'COMPLETED' },
      },
      monthlyAssignments: {
        where: { isActive: true },
      },
    },
    orderBy: { projectDate: 'desc' },
  });

  // Calculate quick stats for header cards
  const total = projects.length;
  const inProgress = projects.filter((p) => p.orderStatus === 'WIP').length;
  const delivered = projects.filter((p) => p.orderStatus === 'DELIVERED').length;
  const overdueCount = projects.filter((p) => isOverdue(p.deadline, p.orderStatus)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FolderKanban className="h-6 w-6 text-primary" />
          {isArchived ? 'Archived Projects' : 'All Projects'}
        </h1>
        <p className="text-xs text-muted-foreground">
          {isArchived
            ? 'Manage completed, paused or archived projects history'
            : 'Track client orders, statuses, deadlines, delivery statement dates, and project progress'}
        </p>
      </div>

      {/* Mini KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Listed</p>
              <p className="text-lg font-bold text-foreground">{total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Work in Progress</p>
              <p className="text-lg font-bold text-foreground">{inProgress}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Delivered</p>
              <p className="text-lg font-bold text-foreground">{delivered}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Overdue</p>
              <p className="text-lg font-bold text-foreground">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TanStack Project Table */}
      <ProjectTable
        data={JSON.parse(JSON.stringify(projects))}
        title={isArchived ? 'Archived Projects' : 'All Projects'}
      />
    </div>
  );
}
