'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  Layers,
  ArrowRightLeft,
  DollarSign,
  Loader2,
  CheckCircle,
  FileText,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/activity?limit=100');
        const json = await res.json();
        if (res.ok) setLogs(json.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Audit & Activity Timeline
        </h1>
        <p className="text-xs text-muted-foreground">
          Immutable event log of project creations, carry-forwards, status transitions, and payments
        </p>
      </div>

      {/* Activity Timeline Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No activity recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 border-l space-y-6 text-xs">
              {logs.map((log) => {
                const isCF = log.actionType.includes('CARRIED');
                const isPay = log.actionType.includes('PAYMENT');
                const isStatus = log.actionType.includes('STATUS');

                return (
                  <div key={log.id} className="relative">
                    {/* Timeline bullet icon */}
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {log.actionType}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-foreground text-sm">{log.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

