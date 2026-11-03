import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

async function syncDeadlineNotifications(userId: string) {
  try {
    const today = startOfDay(new Date());

    // Fetch active non-delivered and non-cancelled projects
    const activeProjects = await prisma.project.findMany({
      where: {
        userId,
        isDeleted: false,
        isArchived: false,
        orderStatus: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);

    for (const p of activeProjects) {
      const targetDay = startOfDay(new Date(p.deadline));
      const diffDays = differenceInCalendarDays(targetDay, today);
      const clientName = p.client?.name || 'Client';
      const orderRef = p.orderId || p.name;

      let title = '';
      let message = '';
      let type = 'DEADLINE';

      if (diffDays === 3) {
        title = `⏰ 3 Days Left: ${orderRef}`;
        message = `Project for ${clientName} is due in 3 days. Please review progress and ensure on-time delivery.`;
      } else if (diffDays === 2) {
        title = `⚠️ 2 Days Left: ${orderRef}`;
        message = `Project for ${clientName} is due in 2 days. Finalize your deliverables!`;
      } else if (diffDays === 1) {
        title = `🚨 1 Day Left: ${orderRef}`;
        message = `Critical alert! Project for ${clientName} is due tomorrow. Delivery preparation needed.`;
      } else if (diffDays === 0) {
        title = `🚨 Due Today: ${orderRef}`;
        message = `Project for ${clientName} is due TODAY! Complete and deliver before the deadline.`;
      } else if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        title = `🔥 Overdue (${overdueDays}d): ${orderRef}`;
        message = `Project for ${clientName} is ${overdueDays} day(s) overdue! Immediate attention required.`;
        type = 'OVERDUE';
      } else {
        // Safe (> 3 days)
        continue;
      }

      // Check if duplicate notification exists within last 20 hours
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          link: `/projects/${p.id}`,
          title,
          createdAt: { gte: twentyHoursAgo },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            link: `/projects/${p.id}`,
            isRead: false,
          },
        });
      }
    }
  } catch (err) {
    console.error('Error syncing deadline notifications:', err);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();

    // Automatically check and sync deadline notifications
    await syncDeadlineNotifications(user.id);

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (body.id) {
      await prisma.notification.update({
        where: { id: body.id, userId: user.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update notifications' }, { status: 500 });
  }
}
