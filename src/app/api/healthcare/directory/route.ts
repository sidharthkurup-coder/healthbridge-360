import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();

    const [centers, doctors, camps] = await Promise.all([
      prisma.healthCenter.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.doctor.findMany({
        include: {
          healthCenter: true,
          schedules: {
            where: { isAvailable: true },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.healthCamp.findMany({
        include: {
          _count: { select: { registrations: true } },
          registrations: user
            ? { where: { residentId: user.id }, select: { id: true } }
            : false,
        },
        orderBy: { campDate: 'asc' },
      }),
    ]);

    const parsedCenters = centers.map((c) => {
      let servicesList: string[] = [];
      try {
        servicesList = JSON.parse(c.services || '[]');
      } catch {
        servicesList = [];
      }
      return {
        ...c,
        servicesList,
      };
    });

    const parsedCamps = camps.map((camp) => {
      let servicesList: string[] = [];
      try {
        servicesList = JSON.parse(camp.servicesOffered || '[]');
      } catch {
        servicesList = [];
      }
      return {
        ...camp,
        servicesList,
        registeredCount: camp._count.registrations,
        isUserRegistered: Array.isArray(camp.registrations) && camp.registrations.length > 0,
      };
    });

    return NextResponse.json({
      centers: parsedCenters,
      doctors,
      camps: parsedCamps,
    });
  } catch (error) {
    console.error('Error fetching healthcare directory:', error);
    return NextResponse.json({ error: 'Failed to load healthcare directory' }, { status: 500 });
  }
}
