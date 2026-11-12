/**
 * Medicine Inventory Algorithm
 * 
 * Rules:
 * 1. Expired batches cannot be counted as available.
 * 2. Quantity cannot become negative.
 * 3. Stock deduction must be atomic & transactional.
 * 4. Record every transaction.
 * 5. Configurable warning thresholds.
 */

export interface BatchItem {
  id: string;
  batchNumber: string;
  currentQuantity: number;
  expiryDate: string; // YYYY-MM-DD
  isQuarantined?: boolean;
}

export interface BatchCalculationResult {
  id: string;
  batchNumber: string;
  rawQuantity: number;
  usableQuantity: number;
  expiredQuantity: number;
  daysToExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // within 30 days
  status: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE' | 'QUARANTINED';
}

export interface MedicineInventorySummary {
  totalAvailableStock: number;
  totalExpiredStock: number;
  totalQuarantinedStock: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ADEQUATE';
  minThreshold: number;
  batches: BatchCalculationResult[];
  nearestExpiryDate: string | null;
  daysToNearestExpiry: number | null;
}

export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

export function calculateDaysRemaining(expiryDateStr: string, referenceDate: Date = new Date()): number {
  const expiry = parseDateOnly(expiryDateStr);
  const refUTC = new Date(Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0));
  const diffTime = expiry.getTime() - refUTC.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateBatchStatus(
  batch: BatchItem,
  referenceDate: Date = new Date(),
  warningDaysThreshold: number = 30
): BatchCalculationResult {
  const daysToExpiry = calculateDaysRemaining(batch.expiryDate, referenceDate);
  const isExpired = daysToExpiry < 0;
  const isExpiringSoon = !isExpired && daysToExpiry <= warningDaysThreshold;
  const isQuarantined = Boolean(batch.isQuarantined);
  const rawQuantity = Math.max(0, batch.currentQuantity);

  let usableQuantity = 0;
  let expiredQuantity = 0;

  if (isExpired) {
    expiredQuantity = rawQuantity;
    usableQuantity = 0;
  } else if (isQuarantined) {
    usableQuantity = 0;
  } else {
    usableQuantity = rawQuantity;
  }

  let status: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE' | 'QUARANTINED' = 'ACTIVE';
  if (isQuarantined) {
    status = 'QUARANTINED';
  } else if (isExpired) {
    status = 'EXPIRED';
  } else if (isExpiringSoon) {
    status = 'EXPIRING_SOON';
  }

  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    rawQuantity,
    usableQuantity,
    expiredQuantity,
    daysToExpiry,
    isExpired,
    isExpiringSoon,
    status,
  };
}

export function calculateMedicineStock(
  batches: BatchItem[],
  minThreshold: number,
  referenceDate: Date = new Date(),
  warningDaysThreshold: number = 30
): MedicineInventorySummary {
  const batchResults = batches.map(b => calculateBatchStatus(b, referenceDate, warningDaysThreshold));

  const totalAvailableStock = batchResults.reduce((acc, curr) => acc + curr.usableQuantity, 0);
  const totalExpiredStock = batchResults.reduce((acc, curr) => acc + curr.expiredQuantity, 0);
  const totalQuarantinedStock = batches
    .filter(b => b.isQuarantined && calculateDaysRemaining(b.expiryDate, referenceDate) >= 0)
    .reduce((acc, curr) => acc + Math.max(0, curr.currentQuantity), 0);

  const isOutOfStock = totalAvailableStock === 0;
  const isLowStock = !isOutOfStock && totalAvailableStock <= minThreshold;

  let stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ADEQUATE' = 'ADEQUATE';
  if (isOutOfStock) {
    stockStatus = 'OUT_OF_STOCK';
  } else if (isLowStock) {
    stockStatus = 'LOW_STOCK';
  }

  // Find nearest valid batch expiry
  const validBatches = batchResults.filter(b => !b.isExpired && !b.rawQuantity && b.usableQuantity > 0);
  let nearestExpiryDate: string | null = null;
  let daysToNearestExpiry: number | null = null;

  if (validBatches.length > 0) {
    const sorted = [...validBatches].sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    const targetBatch = batches.find(b => b.id === sorted[0].id);
    if (targetBatch) {
      nearestExpiryDate = targetBatch.expiryDate;
      daysToNearestExpiry = sorted[0].daysToExpiry;
    }
  }

  return {
    totalAvailableStock,
    totalExpiredStock,
    totalQuarantinedStock,
    isOutOfStock,
    isLowStock,
    stockStatus,
    minThreshold,
    batches: batchResults,
    nearestExpiryDate,
    daysToNearestExpiry,
  };
}

export interface StockDeductionAllocation {
  batchId: string;
  batchNumber: string;
  deductedQuantity: number;
  remainingBatchQuantity: number;
}

export interface StockDeductionResult {
  success: boolean;
  requestedQuantity: number;
  totalAvailableStock: number;
  allocations: StockDeductionAllocation[];
  errorMessage?: string;
}

/**
 * FEFO (First Expired First Out) stock deduction algorithm
 * Ensures expired batches are never deducted and stock never turns negative.
 */
export function planStockDeductionFEFO(
  batches: BatchItem[],
  quantityToDeduct: number,
  referenceDate: Date = new Date()
): StockDeductionResult {
  if (quantityToDeduct <= 0) {
    return {
      success: false,
      requestedQuantity: quantityToDeduct,
      totalAvailableStock: 0,
      allocations: [],
      errorMessage: 'Deduction quantity must be a positive integer greater than 0',
    };
  }

  // Filter to usable batches only
  const usableBatches = batches
    .map(b => ({
      batch: b,
      status: calculateBatchStatus(b, referenceDate),
    }))
    .filter(item => item.status.usableQuantity > 0)
    .sort((a, b) => a.status.daysToExpiry - b.status.daysToExpiry); // Earliest expiry first

  const totalAvailable = usableBatches.reduce((acc, curr) => acc + curr.status.usableQuantity, 0);

  if (totalAvailable < quantityToDeduct) {
    return {
      success: false,
      requestedQuantity: quantityToDeduct,
      totalAvailableStock: totalAvailable,
      allocations: [],
      errorMessage: `Insufficient available stock. Requested ${quantityToDeduct}, but only ${totalAvailable} units are available in unexpired batches.`,
    };
  }

  let remainingToDeduct = quantityToDeduct;
  const allocations: StockDeductionAllocation[] = [];

  for (const item of usableBatches) {
    if (remainingToDeduct <= 0) break;

    const availableInBatch = item.status.usableQuantity;
    const deductFromThisBatch = Math.min(availableInBatch, remainingToDeduct);

    allocations.push({
      batchId: item.batch.id,
      batchNumber: item.batch.batchNumber,
      deductedQuantity: deductFromThisBatch,
      remainingBatchQuantity: item.batch.currentQuantity - deductFromThisBatch,
    });

    remainingToDeduct -= deductFromThisBatch;
  }

  return {
    success: true,
    requestedQuantity: quantityToDeduct,
    totalAvailableStock: totalAvailable,
    allocations,
  };
}
