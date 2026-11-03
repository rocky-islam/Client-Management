import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logActivity({
        userId: user.id,
        actionType: 'LOGOUT',
        entityType: 'AUTH',
        entityId: user.id,
        description: `User ${user.email} logged out`,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
