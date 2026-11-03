'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MONTH_NAMES } from '@/lib/constants';

export default function CalendarPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const [pRes, payRes] = await Promise.all([
        fetch('/api/projects'),
        fetch(`/api/payments?year=${currentYear}&month=${currentMonth}`),
      ]);
      const pJson = await pRes.json();
      const payJson = await payRes.json();

      const combined: any[] = [];

      // Add project deadlines
      if (pJson.projects) {
        for (const prj of pJson.projects) {
          const d = new Date(prj.deadline);
          if (d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth) {
            combined.push({
              type: 'DEADLINE',
              title: `${prj.name} (Deadline)`,
              orderId: prj.orderId,
              date: d.getDate(),
              projectId: prj.id,
              status: prj.orderStatus,
            });
          }
        }
      }

      // Add payments
      if (payJson.payments) {
        for (const pm of payJson.payments) {
          const d = new Date(pm.paymentDate);
          combined.push({
            type: 'PAYMENT',
            title: `Payment: +${formatCurrency(pm.amount, pm.currency)}`,
            date: d.getDate(),
            projectId: pm.projectId,
          });
        }
      }

      setEvents(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Project & Delivery Calendar
          </h1>
          <p className="text-xs text-muted-foreground">
            Monthly schedule of client project deadlines, milestones, and incoming payment dates
          </p>
        </div>

        {/* Switcher */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-1 font-bold text-sm bg-muted rounded-md text-foreground">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </div>
          <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 px-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCurrentYear(now.getFullYear());
              setCurrentMonth(now.getMonth() + 1);
            }}
            className="h-8 text-xs"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-24 rounded-lg bg-muted/20 border border-transparent" />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                day === now.getDate() &&
                currentMonth === now.getMonth() + 1 &&
                currentYear === now.getFullYear();

              const dayEvents = events.filter((e) => e.date === day);

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-24 p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'border-primary bg-primary/5'
                      : 'border-border/70 bg-card hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center' : 'text-foreground'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{dayEvents.length} events</span>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 mt-1.5 overflow-hidden">
                    {dayEvents.map((ev, evIdx) => (
                      <Link
                        key={evIdx}
                        href={`/projects/${ev.projectId}`}
                        className="block truncate rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: ev.type === 'DEADLINE' ? '#FEE2E2' : '#DCFCE7',
                          color: ev.type === 'DEADLINE' ? '#991B1B' : '#166534',
                        }}
                        title={ev.title}
                      >
                        {ev.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
