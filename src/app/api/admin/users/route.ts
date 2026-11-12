import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([
    'RESIDENT',
    'HEALTHCARE_STAFF',
    'MEDICINE_STAFF',
    'EMERGENCY_COORDINATOR',
    'WATER_SANITATION_OFFICER',
    'ADMIN',
  ]),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }

  try {
    const [users, auditLogs] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          sectionId: true,
          address: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, role: true } } },
      }),
    ]);

    return NextResponse.json({ users, auditLogs });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin data' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid role update payload' }, { status: 400 });
    }

    const { userId, role } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_ROLE_CHANGED',
        entityType: 'User',
        entityId: userId,
        details: JSON.stringify({
          targetUserEmail: targetUser.email,
          previousRole: targetUser.role,
          newRole: role,
        }),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
