import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { planStockDeductionFEFO, calculateMedicineStock, BatchItem } from '@/lib/algorithms/medicine-inventory';

const dispenseSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantity to deduct must be a positive integer'),
  reason: z.string().min(3, 'Dispensing reason required'),
  referenceNote: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'MEDICINE_STAFF' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Only Pharmacy Staff or Admins can deduct stock' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = dispenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid dispensation request' }, { status: 400 });
    }

    const { medicineId, quantity, reason, referenceNote } = parsed.data;

    // Fetch medicine and active batches
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
      include: { batches: true },
    });

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    const batchItems: BatchItem[] = medicine.batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      currentQuantity: b.currentQuantity,
      expiryDate: b.expiryDate,
      isQuarantined: b.isQuarantined,
    }));

    // Plan FEFO deduction
    const deductionPlan = planStockDeductionFEFO(batchItems, quantity, new Date());

    if (!deductionPlan.success) {
      return NextResponse.json({ error: deductionPlan.errorMessage || 'Cannot deduct requested stock' }, { status: 400 });
    }

    // Execute atomic transactional updates
    const result = await prisma.$transaction(async (tx) => {
      const transactionRecords = [];

      for (const alloc of deductionPlan.allocations) {
        const batch = medicine.batches.find((b) => b.id === alloc.batchId);
        if (!batch) throw new Error(`Batch ${alloc.batchId} missing`);

        // Update batch quantity
        const updatedBatch = await tx.medicineBatch.update({
          where: { id: alloc.batchId },
          data: {
            currentQuantity: alloc.remainingBatchQuantity,
          },
        });

        // Record stock movement transaction
        const stockTx = await tx.stockTransaction.create({
          data: {
            medicineId,
            batchId: alloc.batchId,
            type: 'DISPENSED',
            quantity: alloc.deductedQuantity,
            previousQuantity: batch.currentQuantity,
            newQuantity: alloc.remainingBatchQuantity,
            reason,
            referenceNote: referenceNote || `Auto FEFO allocation for ${alloc.batchNumber}`,
            performedByUserId: user.id,
          },
        });

        transactionRecords.push(stockTx);
      }

      // Re-fetch remaining batches to check threshold alert
      const remainingBatches = await tx.medicineBatch.findMany({
        where: { medicineId },
      });

      const newBatchItems: BatchItem[] = remainingBatches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        currentQuantity: b.currentQuantity,
        expiryDate: b.expiryDate,
        isQuarantined: b.isQuarantined,
      }));

      const newStockSummary = calculateMedicineStock(newBatchItems, medicine.minThreshold, new Date());

      // If low stock triggered, notify pharmacy staff
      if (newStockSummary.isLowStock || newStockSummary.isOutOfStock) {
        await tx.notification.create({
          data: {
            userId: user.id,
            title: `Low Stock Alert: ${medicine.name}`,
            message: `Available stock for ${medicine.name} is now ${newStockSummary.totalAvailableStock} ${medicine.unit} (Threshold: ${medicine.minThreshold}). Replenishment requisition required.`,
            category: 'MEDICINE',
            link: '/medicines',
          },
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'MEDICINE_DISPENSED_FEFO',
          entityType: 'Medicine',
          entityId: medicineId,
          details: JSON.stringify({
            deducted: quantity,
            remainingStock: newStockSummary.totalAvailableStock,
            reason,
          }),
        },
      });

      return {
        transactionRecords,
        newStockSummary,
      };
    });

    return NextResponse.json({
      success: true,
      deductedQuantity: quantity,
      allocations: deductionPlan.allocations,
      newStockSummary: result.newStockSummary,
    });
  } catch (error: any) {
    console.error('Error during stock dispensation:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}
