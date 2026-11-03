import prisma from './prisma';

export interface LogActivityParams {
  userId: string;
  actionType: string;
  entityType: 'PROJECT' | 'CLIENT' | 'PAYMENT' | 'EXPENSE' | 'INVOICE' | 'TARGET' | 'TASK' | 'AUTH' | 'SETTINGS' | 'PROFILE';
  entityId: string;
  description: string;
  oldValues?: any;
  newValues?: any;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

