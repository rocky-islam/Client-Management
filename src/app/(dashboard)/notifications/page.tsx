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
      fetchNotifications();
    } catch (e: any) {
      toast.error('Failed to mark read');
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
          <p className="text-xs text-muted-foreground">
            System notices, delivery alerts, upcoming milestones, and payment confirmations
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="h-8 text-xs gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              You are all caught up! No active alerts at this moment.
            </div>
          ) : (
            <div className="divide-y text-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-3.5 flex items-start justify-between gap-3 ${
                    !n.isRead ? 'bg-primary/5 px-3 rounded-lg' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm">{n.title}</p>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                        )}
                      </div>
                      <p className="text-muted-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground pt-1">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                  </div>

                  {n.link && (
                    <Link href={n.link}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

