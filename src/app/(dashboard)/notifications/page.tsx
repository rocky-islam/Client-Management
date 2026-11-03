'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Loader2,
  CheckCheck,
  Flame,
  AlertCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) setNotifications(data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('All notifications marked as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e: any) {
      toast.error('Failed to mark read');
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed');
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e: any) {
      toast.error('Failed to update notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'OVERDUE':
        return (
          <div className="p-2 rounded-full bg-rose-500/15 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 shrink-0">
            <Flame className="h-4 w-4" />
          </div>
        );
      case 'DEADLINE':
        return (
          <div className="p-2 rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        );
      case 'PAYMENT':
        return (
          <div className="p-2 rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
            <DollarSign className="h-4 w-4" />
          </div>
        );
      case 'WARNING':
        return (
          <div className="p-2 rounded-full bg-orange-500/15 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <Bell className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications & Alerts
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated delivery countdowns, upcoming deadlines (3d, 2d, 1d, today), overdue warnings, and updates
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <CheckCheck className="h-3.5 w-3.5 text-primary" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              You are all caught up! No active alerts at this moment.
            </div>
          ) : (
            <div className="divide-y divide-border/60 text-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg transition-colors ${
                    !n.isRead
                      ? n.type === 'OVERDUE'
                        ? 'bg-rose-500/10 dark:bg-rose-950/20 border-l-4 border-l-rose-500'
                        : n.type === 'DEADLINE'
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 border-l-4 border-l-amber-500'
                        : 'bg-primary/5 border-l-4 border-l-primary'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(n.type)}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground text-sm leading-tight">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 bg-primary/15 text-primary border-none"
                          >
                            New
                          </Badge>
                        )}
                        {n.type === 'OVERDUE' && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300"
                          >
                            Urgent Action
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/80 pt-0.5">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkSingleRead(n.id)}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        <span>Done</span>
                      </Button>
                    )}
                    {n.link && (
                      <Link href={n.link}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1 font-medium shadow-2xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
