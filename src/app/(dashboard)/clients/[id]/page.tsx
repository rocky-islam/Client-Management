import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTimeLeft } from '@/lib/calculations';
import { PROJECT_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChevronLeft,
  Users,
  DollarSign,
  Briefcase,
  ExternalLink,
  Plus,
  Mail,
  MapPin,
  FileText,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      projects: {
        where: { isDeleted: false },
        include: {
          payments: { where: { status: 'COMPLETED' } },
        },
        orderBy: { projectDate: 'desc' },
      },
      payments: {
        where: { status: 'COMPLETED' },
        orderBy: { paymentDate: 'desc' },
        include: { project: { select: { name: true, orderId: true } } },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const totalOrders = client.projects.length;
  const totalValue = client.projects.reduce((s, p) => s + Number(p.value || 0), 0);
  const totalReceived = client.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const outstanding = Math.max(0, totalValue - totalReceived);
  const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{client.name}</h1>
              {totalOrders > 1 && (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  Repeat Client ({totalOrders} orders)
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {client.companyName ? `${client.companyName} • ` : ''}
              {client.country || 'Global Client'} • Client since {formatDate(client.createdAt)}
            </p>
          </div>
        </div>

        <Link href="/projects/new">
          <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>New Project for Client</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Lifetime Contract Value</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(totalValue, 'USD')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Total ordered across projects</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Paid Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalReceived, 'USD')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Received & cleared</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Outstanding Balance</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(outstanding, 'USD')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Remaining payment due</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Average Order Value</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatCurrency(avgOrderValue, 'USD')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{totalOrders} total contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Information and Order History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Profile Details (1 col) */}
        <Card className="shadow-sm h-fit">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Client Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            {client.companyName && (
              <div>
                <span className="text-muted-foreground">Company:</span>
                <p className="font-semibold text-foreground">{client.companyName}</p>
              </div>
            )}
            {client.email && (
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium text-foreground">{client.email}</p>
              </div>
            )}
            {client.country && (
              <div>
                <span className="text-muted-foreground">Country:</span>
                <p className="font-medium text-foreground">{client.country}</p>
              </div>
            )}
            {client.contactInfo && (
              <div>
                <span className="text-muted-foreground">Contact:</span>
                <p className="font-medium text-foreground">{client.contactInfo}</p>
              </div>
            )}
            {client.profileLink && (
              <div>
                <span className="text-muted-foreground">Platform Profile:</span>
                <p>
                  <a
                    href={client.profileLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Client Notes:</span>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Projects List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Client Project History ({client.projects.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  All contracts commissioned by {client.name}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {client.projects.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No projects recorded for this client.
                </p>
              ) : (
                <div className="divide-y text-xs">
                  {client.projects.map((p) => {
                    const statusConfig = PROJECT_STATUSES.find((s) => s.value === p.orderStatus);
                    const tl = calculateTimeLeft(p.deadline, p.orderStatus);
                    return (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/projects/${p.id}`}
                              className="font-bold text-foreground hover:text-primary transition-colors text-sm"
                            >
                              {p.name}
                            </Link>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {p.orderId}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                            <span>Ordered: {formatDate(p.projectDate)}</span>
                            <span>• Deadline: {formatDate(p.deadline)}</span>
                            <span>• Profile: {p.profileName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-foreground text-sm">
                              {formatCurrency(p.value, p.currency)}
                            </p>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                statusConfig?.color || 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {statusConfig?.label || p.orderStatus}
                            </span>
                          </div>
                          <Link href={`/projects/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
