import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const addBatchSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().min(2),
  initialQuantity: z.coerce.number().int().positive(),
  manufacturingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  supplier: z.string().min(2),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().split('T')[0]),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'MEDICINE_STAFF' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Only Pharmacy Staff or Admins can register new batches' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = addBatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid batch payload' }, { status: 400 });
    }

    const { medicineId, batchNumber, initialQuantity, manufacturingDate, expiryDate, supplier, receivedDate } = parsed.data;

    // Check duplicate batch for this medicine
    const existing = await prisma.medicineBatch.findUnique({
      where: {
        medicineId_batchNumber: {
          medicineId,
          batchNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: `Batch ${batchNumber} already exists for this medicine` }, { status: 409 });
    }

    const newBatch = await prisma.$transaction(async (tx) => {
      const batch = await tx.medicineBatch.create({
        data: {
          medicineId,
          batchNumber,
          initialQuantity,
          currentQuantity: initialQuantity,
          manufacturingDate,
          expiryDate,
          supplier,
          receivedDate,
          isQuarantined: false,
        },
      });

      // Record transaction
      await tx.stockTransaction.create({
        data: {
          medicineId,
          batchId: batch.id,
          type: 'PURCHASE_RECEIPT',
          quantity: initialQuantity,
          previousQuantity: 0,
          newQuantity: initialQuantity,
          reason: `Stock receipt consignment from ${supplier}`,
          performedByUserId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'MEDICINE_BATCH_RECEIVED',
          entityType: 'MedicineBatch',
          entityId: batch.id,
          details: JSON.stringify({ batchNumber, quantity: initialQuantity, expiryDate, supplier }),
        },
      });

      return batch;
    });

    return NextResponse.json({ success: true, batch: newBatch });
  } catch (error: any) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: error.message || 'Failed to add batch' }, { status: 500 });
  }
}

const updateBatchSchema = z.object({
  batchId: z.string().min(1),
  isQuarantined: z.boolean(),
  reason: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'MEDICINE_STAFF' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Pharmacist or Admin required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid batch update payload' }, { status: 400 });
    }

    const { batchId, isQuarantined, reason } = parsed.data;
    const updated = await prisma.medicineBatch.update({
      where: { id: batchId },
      data: { isQuarantined },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: isQuarantined ? 'MEDICINE_BATCH_QUARANTINED' : 'MEDICINE_BATCH_RELEASED',
        entityType: 'MedicineBatch',
        entityId: batchId,
        details: JSON.stringify({
          batchNumber: updated.batchNumber,
          isQuarantined,
          reason: reason || 'Manual QA inspection update',
        }),
      },
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update batch' }, { status: 500 });
  }
}
