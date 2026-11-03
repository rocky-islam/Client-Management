import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const payload = await request.json();

    if (!payload || !payload.data) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    const { clients = [], projects = [], payments = [], expenses = [] } = payload.data;

    let importedClients = 0;
    let skippedClients = 0;
    let importedProjects = 0;
    let skippedProjects = 0;
    let importedPayments = 0;
    let importedExpenses = 0;

    // Map old client IDs to new client IDs
    const clientIdMap = new Map<string, string>();

    // 1. Process Clients with duplicate check
    for (const c of clients) {
      const existing = await prisma.client.findFirst({
        where: {
          userId: user.id,
          name: c.name,
        },
      });

      if (existing) {
        clientIdMap.set(c.id, existing.id);
        skippedClients++;
      } else {
        const created = await prisma.client.create({
          data: {
            userId: user.id,
            name: c.name,
            companyName: c.companyName || null,
            email: c.email || null,
            country: c.country || null,
            contactInfo: c.contactInfo || null,
            profileLink: c.profileLink || null,
            clientStatus: c.clientStatus || 'ACTIVE',
            notes: c.notes || null,
          },
        });
        clientIdMap.set(c.id, created.id);
        importedClients++;
      }
    }

    // Map old project IDs to new project IDs
    const projectIdMap = new Map<string, string>();

    // 2. Process Projects with duplicate check by orderId
    for (const prj of projects) {
      const existing = await prisma.project.findFirst({
        where: {
          userId: user.id,
          orderId: prj.orderId,
        },
      });

      if (existing) {
        projectIdMap.set(prj.id, existing.id);
        skippedProjects++;
      } else {
        const newClientId = clientIdMap.get(prj.clientId);
        if (!newClientId) {
          skippedProjects++;
          continue;
        }

        const created = await prisma.project.create({
          data: {
            userId: user.id,
            clientId: newClientId,
            name: prj.name,
            orderId: prj.orderId,
            projectDate: new Date(prj.projectDate),
            category: prj.category || 'Web Development',
            profileName: prj.profileName || 'Direct Client',
            projectSource: prj.projectSource || 'Other',
            description: prj.description || null,
            value: prj.value,
            currency: prj.currency || 'USD',
            advancePayment: prj.advancePayment || 0,
            startDate: new Date(prj.startDate),
            deadline: new Date(prj.deadline),
            deliveryStatementDate: prj.deliveryStatementDate ? new Date(prj.deliveryStatementDate) : null,
            actualDeliveryDate: prj.actualDeliveryDate ? new Date(prj.actualDeliveryDate) : null,
            salesType: prj.salesType || 'NEW_ORDER',
            orderStatus: prj.orderStatus || 'NEW',
            priority: prj.priority || 'MEDIUM',
            progressPercentage: prj.progressPercentage || 0,
            remark: prj.remark || null,
          },
        });
        projectIdMap.set(prj.id, created.id);
        importedProjects++;
      }
    }

    // 3. Process Payments
    for (const p of payments) {
      const newProjectId = projectIdMap.get(p.projectId);
      const newClientId = clientIdMap.get(p.clientId);

      if (newProjectId && newClientId) {
        await prisma.payment.create({
          data: {
            userId: user.id,
            projectId: newProjectId,
            clientId: newClientId,
            amount: p.amount,
            currency: p.currency || 'USD',
            paymentDate: new Date(p.paymentDate),
            paymentMethod: p.paymentMethod || 'OTHER',
            transactionRef: p.transactionRef || null,
            status: p.status || 'COMPLETED',
            remark: p.remark || null,
          },
        });
        importedPayments++;
      }
    }

    // 4. Process Expenses
    for (const e of expenses) {
      await prisma.expense.create({
        data: {
          userId: user.id,
          title: e.title,
          category: e.category || 'OTHER',
          amount: e.amount,
          currency: e.currency || 'USD',
          expenseDate: new Date(e.expenseDate),
          paymentMethod: e.paymentMethod || 'OTHER',
          remark: e.remark || null,
        },
      });
      importedExpenses++;
    }

    await logActivity({
      userId: user.id,
      actionType: 'DATA_RESTORED',
      entityType: 'PROJECT',
      entityId: user.id,
      description: `Restored backup data: ${importedClients} clients, ${importedProjects} projects, ${importedPayments} payments imported (${skippedProjects} projects skipped as duplicates)`,
    });

    return NextResponse.json({
      success: true,
      summary: {
        importedClients,
        skippedClients,
        importedProjects,
        skippedProjects,
        importedPayments,
        importedExpenses,
      },
    });
  } catch (error: any) {
    console.error('Backup import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore backup' }, { status: 500 });
  }
}

