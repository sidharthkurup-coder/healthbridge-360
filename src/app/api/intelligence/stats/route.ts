import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { computeResolutionAnalytics, ComplaintTimeRecord } from '@/lib/algorithms/resolution-analytics';
import { calculateMedicineStock, BatchItem } from '@/lib/algorithms/medicine-inventory';
import { analyzeSectionWaterSupply, WaterRecordInput } from '@/lib/algorithms/water-distribution';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionParam = searchParams.get('sectionId');
    const sectionId = sectionParam && sectionParam !== 'ALL' ? Number(sectionParam) : undefined;

    // 1. Fetch complaints & run Resolution Analytics algorithm
    const complaints = await prisma.sanitationComplaint.findMany({
      where: sectionId ? { sectionId } : {},
      orderBy: { submittedAt: 'desc' },
    });

    const complaintTimeRecords: ComplaintTimeRecord[] = complaints.map((c) => ({
      id: c.id,
      category: c.category,
      status: c.status,
      submittedAt: c.submittedAt,
      acknowledgedAt: c.acknowledgedAt,
      assignedAt: c.assignedAt,
      resolvedAt: c.resolvedAt,
      reopenCount: c.reopenCount,
    }));

    const resolutionAnalytics = computeResolutionAnalytics(complaintTimeRecords, new Date());

    // 2. Fetch appointments
    const appointments = await prisma.appointment.findMany({
      include: { doctor: true, healthCenter: true },
      orderBy: { appointmentDate: 'desc' },
    });

    const appointmentStats = {
      total: appointments.length,
      approved: appointments.filter((a) => a.status === 'APPROVED').length,
      pending: appointments.filter((a) => a.status === 'PENDING').length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'REJECTED').length,
      priorityBreakdown: {
        normal: appointments.filter((a) => a.priority === 'NORMAL').length,
        urgent: appointments.filter((a) => a.priority === 'URGENT').length,
        senior: appointments.filter((a) => a.priority === 'SENIOR_CITIZEN').length,
        maternal: appointments.filter((a) => a.priority === 'MATERNAL').length,
      },
    };

    // 3. Fetch emergency records
    const emergencies = await prisma.emergencyRequest.findMany({
      orderBy: { submittedAt: 'desc' },
    });

    const emergencyStats = {
      total: emergencies.length,
      active: emergencies.filter((e) => ['SUBMITTED', 'ACKNOWLEDGED', 'CONTACTED', 'DISPATCHED'].includes(e.status)).length,
      resolved: emergencies.filter((e) => e.status === 'RESOLVED').length,
      dispatched: emergencies.filter((e) => e.status === 'DISPATCHED').length,
    };

    // 4. Fetch medicine inventory & run Medicine Inventory algorithm
    const medicines = await prisma.medicine.findMany({
      include: { batches: true },
    });

    let totalAvailableUnits = 0;
    let totalExpiredUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const med of medicines) {
      const batchItems: BatchItem[] = med.batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        currentQuantity: b.currentQuantity,
        expiryDate: b.expiryDate,
        isQuarantined: b.isQuarantined,
      }));

      const stock = calculateMedicineStock(batchItems, med.minThreshold, new Date());
      totalAvailableUnits += stock.totalAvailableStock;
      totalExpiredUnits += stock.totalExpiredStock;
      if (stock.isLowStock) lowStockCount++;
      if (stock.isOutOfStock) outOfStockCount++;
    }

    const medicineStats = {
      totalFormulations: medicines.length,
      totalAvailableUnits,
      totalExpiredUnits,
      lowStockCount,
      outOfStockCount,
    };

    // 5. Fetch water sections & records & run 5-section analysis
    const [sections, waterRecords] = await Promise.all([
      prisma.waterSection.findMany({
        where: sectionId ? { id: sectionId } : {},
        orderBy: { id: 'asc' },
      }),
      prisma.waterSupplyRecord.findMany({
        where: sectionId ? { sectionId } : {},
        orderBy: { supplyDate: 'desc' },
      }),
    ]);

    const waterRecordInputs: WaterRecordInput[] = waterRecords.map((r) => ({
      id: r.id,
      sectionId: r.sectionId,
      supplyDate: r.supplyDate,
      actualDurationMinutes: r.actualDurationMinutes,
      quantitySuppliedKL: r.quantitySuppliedKL,
      flowRateLpm: r.flowRateLpm,
      pressureBar: r.pressureBar,
      interruptionOccurred: r.interruptionOccurred,
      interruptionReason: r.interruptionReason,
      status: r.status,
    }));

    const sectionAnalyses = sections.map((sec) =>
      analyzeSectionWaterSupply(sec.id, waterRecordInputs, new Date())
    );

    const totalWaterSuppliedKL = waterRecords.reduce((acc, curr) => acc + curr.quantitySuppliedKL, 0);

    const waterStats = {
      totalSectionsMonitored: sections.length,
      totalWaterSuppliedKL: Number(totalWaterSuppliedKL.toFixed(2)),
      totalSupplyLogs: waterRecords.length,
      totalInterruptions: waterRecords.filter((r) => r.interruptionOccurred).length,
      sectionAnalyses,
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      sectionFilter: sectionId || 'ALL',
      resolutionAnalytics,
      appointmentStats,
      emergencyStats,
      medicineStats,
      waterStats,
    });
  } catch (error) {
    console.error('Error generating intelligence stats:', error);
    return NextResponse.json({ error: 'Failed to generate community intelligence' }, { status: 500 });
  }
}
