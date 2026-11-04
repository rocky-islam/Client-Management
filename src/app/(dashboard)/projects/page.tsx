import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ProjectTable } from '@/components/projects/project-table';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, Clock, CheckCircle2, AlertTriangle, Flame, Users, Crown, Filter } from 'lucide-react';
import { isOverdue } from '@/lib/calculations';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { MonthlyGoalBanner } from '@/components/dashboard/monthly-goal-banner';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; archived?: string; userId?: string };
}) {
  const user = await requireAuth();
  const isArchived = searchParams.archived === 'true';
  const isMasterOrAdmin = user.role === 'MASTER' || user.role === 'ADMIN';
  const selectedUserId = searchParams.userId;

  const where: any = {
    isArchived: isArchived,
    isDeleted: false,
  };

  // Role-based visibility: Master can see all or filter by user, normal user only sees own
  if (isMasterOrAdmin) {
    if (selectedUserId && selectedUserId !== 'ALL') {
      where.userId = selectedUserId;
    }
  } else {
    where.userId = user.id;
  }

  // If Master, load all users for the Master Workspace filter (sorted with Master at top)
  const allUsers: Array<{ id: string; name: string; email: string; role?: string }> = isMasterOrAdmin
    ? (
        await prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: 'asc' },
        })
      ).sort((a: any, b: any) => (a?.role === 'MASTER' ? -1 : b?.role === 'MASTER' ? 1 : String(a?.name || '').localeCompare(String(b?.name || ''))))
    : [];

  const projects = await prisma.project.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
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
    orderBy: [
      { createdAt: 'desc' },
      { projectDate: 'desc' },
    ],
  });

  // Calculate quick stats for header cards
  const today = startOfDay(new Date());
  const total = projects.length;
  const inProgress = projects.filter((p) => p.orderStatus === 'WIP' || p.orderStatus === 'IN_REVIEW').length;
  const delivered = projects.filter((p) => p.orderStatus === 'DELIVERED').length;

  let urgentCount = 0;
  let overdueCount = 0;

  projects.forEach((p) => {
    if (p.orderStatus !== 'DELIVERED' && p.orderStatus !== 'CANCELLED') {
      const target = startOfDay(new Date(p.deadline));
      const diff = differenceInCalendarDays(target, today);
      if (diff < 0) {
        overdueCount++;
      } else if (diff <= 4) {
        urgentCount++;
      }
    }
  });

  const activeFilteredUser = allUsers.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" />
            <span>{isArchived ? 'Archived Projects' : 'All Projects'}</span>
            {isMasterOrAdmin && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] gap-1 shadow-2xs ml-1">
                <Crown className="h-3 w-3" /> MASTER VIEW
              </Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isArchived
              ? 'Manage completed, paused or archived projects history'
              : 'Track client orders, statuses, deadlines, delivery statement dates, and project progress'}
          </p>
        </div>

        {/* Master Workspace Filter Pill Bar */}
        {isMasterOrAdmin && allUsers.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card border border-border/80 shadow-2xs text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground px-2 flex items-center gap-1">
              <Filter className="h-3 w-3" /> User:
            </span>
            <Link
              href="/projects"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                !selectedUserId || selectedUserId === 'ALL'
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              All Users ({allUsers.length})
            </Link>
            {allUsers.map((u) => (
              <Link
                key={u.id}
                href={`/projects?userId=${u.id}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedUserId === u.id
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {u.name} {u.role === 'MASTER' && '👑'}
              </Link>
            ))}
          </div>
        )}
      </div>

      {activeFilteredUser && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Showing projects for user: <strong className="font-bold text-primary">{activeFilteredUser.name}</strong> ({activeFilteredUser.email})
          </span>
          <Link href="/projects" className="text-primary hover:underline font-semibold text-xs">
            Clear Filter (Show All)
          </Link>
        </div>
      )}

      {/* Monthly Revenue Goal Progress Banner */}
      {!isArchived && <MonthlyGoalBanner userId={selectedUserId} />}

      {/* Mini KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Listed</p>
              <p className="text-lg font-bold text-foreground">{total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">In Progress</p>
              <p className="text-lg font-bold text-foreground">{inProgress}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/60 ${urgentCount > 0 ? 'bg-amber-500/5 border-amber-300 dark:border-amber-800' : ''}`}>
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Due in ≤ 4 Days</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{urgentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/60 ${overdueCount > 0 ? 'bg-rose-500/5 border-rose-300 dark:border-rose-800' : ''}`}>
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Overdue</p>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-400">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Delivered</p>
              <p className="text-lg font-bold text-foreground">{delivered}</p>
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
