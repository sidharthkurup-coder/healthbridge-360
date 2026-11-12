import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { calculateMedicineStock, BatchItem } from '@/lib/algorithms/medicine-inventory';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const createMedicineSchema = z.object({
  name: z.string().min(2),
  genericName: z.string().min(2),
  category: z.string().min(2),
  form: z.string().min(2),
  strength: z.string().min(1),
  unit: z.string().min(1),
  minThreshold: z.coerce.number().min(1).default(50),
  storageConditions: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const medicines = await prisma.medicine.findMany({
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
        transactions: {
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: { performedByUser: { select: { name: true, role: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const refDate = new Date();

    // Enrich every medicine with real algorithm calculations
    const enriched = medicines.map((med) => {
      const batchItems: BatchItem[] = med.batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        currentQuantity: b.currentQuantity,
        expiryDate: b.expiryDate,
        isQuarantined: b.isQuarantined,
      }));

      const stockSummary = calculateMedicineStock(batchItems, med.minThreshold, refDate);

      return {
        ...med,
        stockSummary,
      };
    });

    return NextResponse.json({ medicines: enriched });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json({ error: 'Failed to retrieve medicine inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'MEDICINE_STAFF' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Pharmacist or Admin authorization required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createMedicineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid medicine data' }, { status: 400 });
    }

    const newMed = await prisma.medicine.create({
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MEDICINE_CREATED',
        entityType: 'Medicine',
        entityId: newMed.id,
        details: JSON.stringify({ name: newMed.name, generic: newMed.genericName, threshold: newMed.minThreshold }),
      },
    });

    return NextResponse.json({ success: true, medicine: newMed });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return NextResponse.json({ error: 'Failed to create medicine entry' }, { status: 500 });
  }
}
