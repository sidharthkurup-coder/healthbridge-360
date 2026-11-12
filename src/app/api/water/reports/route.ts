import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assessWaterQuality, WaterQualityInput } from '@/lib/algorithms/water-distribution';

export const dynamic = 'force-dynamic';

const reportSchema = z.object({
  sectionId: z.coerce.number().min(1).max(5),
  testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sampleLocation: z.string().min(3),
  testedBy: z.string().min(2),
  labName: z.string().min(2),
  labReportFileUrl: z.string().optional().nullable(),
  sodiumMgL: z.coerce.number().nullable().optional(),
  fluorideMgL: z.coerce.number().nullable().optional(),
  phValue: z.coerce.number().nullable().optional(),
  tdsPpm: z.coerce.number().nullable().optional(),
  microbialColiformColonies: z.coerce.number().int().nullable().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const reports = await prisma.waterQualityReport.findMany({
      orderBy: { testDate: 'desc' },
      include: {
        section: true,
        verifiedByUser: { select: { name: true, role: true } },
      },
    });

    // Run strict water safety assessment algorithm on every report
    const assessedReports = reports.map((r) => {
      const input: WaterQualityInput = {
        id: r.id,
        sectionId: r.sectionId,
        testDate: r.testDate,
        verificationStatus: r.verificationStatus,
        sodiumMgL: r.sodiumMgL,
        fluorideMgL: r.fluorideMgL,
        phValue: r.phValue,
        tdsPpm: r.tdsPpm,
        microbialColiformColonies: r.microbialColiformColonies,
      };

      const assessment = assessWaterQuality(input);
      return {
        ...r,
        assessment,
      };
    });

    return NextResponse.json({ reports: assessedReports });
  } catch (error) {
    console.error('Error fetching water quality reports:', error);
    return NextResponse.json({ error: 'Failed to retrieve water quality reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'WATER_SANITATION_OFFICER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Officer or Admin required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid report data' }, { status: 400 });
    }

    const report = await prisma.waterQualityReport.create({
      data: {
        ...parsed.data,
        verificationStatus: 'PENDING_VERIFICATION',
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error creating water report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'WATER_SANITATION_OFFICER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Officer or Admin required to verify lab reports' }, { status: 403 });
  }

  try {
    const { id, verificationStatus, notes } = await req.json();

    const updated = await prisma.waterQualityReport.update({
      where: { id },
      data: {
        verificationStatus,
        notes: notes || undefined,
        verifiedByUserId: user.id,
        verifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `WATER_REPORT_${verificationStatus}`,
        entityType: 'WaterQualityReport',
        entityId: id,
        details: JSON.stringify({ verificationStatus, officer: user.name }),
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error('Error verifying water report:', error);
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
  }
}
