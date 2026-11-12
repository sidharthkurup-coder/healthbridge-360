import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const registrationSchema = z.object({
  campId: z.string().min(1),
  attendeeName: z.string().min(2),
  phone: z.string().min(10),
  age: z.coerce.number().min(1).max(120),
  gender: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter valid attendee registration details' }, { status: 400 });
    }

    const { campId, attendeeName, phone, age, gender } = parsed.data;

    const camp = await prisma.healthCamp.findUnique({
      where: { id: campId },
    });

    if (!camp) {
      return NextResponse.json({ error: 'Health camp not found' }, { status: 404 });
    }

    const registration = await prisma.healthCampRegistration.create({
      data: {
        campId,
        residentId: user.id,
        attendeeName,
        phone,
        age,
        gender,
      },
    });

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error('Camp registration error:', error);
    return NextResponse.json({ error: 'Failed to complete registration' }, { status: 500 });
  }
}
