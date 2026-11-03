import prisma from './prisma';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'WARNING' | 'DEADLINE' | 'PAYMENT' | 'OVERDUE' = 'INFO',
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

