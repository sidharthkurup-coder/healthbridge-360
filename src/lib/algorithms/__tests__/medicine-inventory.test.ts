import { describe, it, expect } from 'vitest';
import {
  calculateBatchStatus,
  calculateMedicineStock,
  planStockDeductionFEFO,
  BatchItem,
} from '../medicine-inventory';

describe('Medicine Inventory Algorithms', () => {
  const refDate = new Date(Date.UTC(2026, 10, 12)); // Nov 12, 2026

  it('correctly calculates batch status and detects expired batch', () => {
    const expiredBatch: BatchItem = {
      id: 'b1',
      batchNumber: 'EXP-001',
      currentQuantity: 100,
      expiryDate: '2026-10-01', // Already expired in Oct 2026
    };

    const status = calculateBatchStatus(expiredBatch, refDate);
    expect(status.isExpired).toBe(true);
    expect(status.usableQuantity).toBe(0);
    expect(status.expiredQuantity).toBe(100);
    expect(status.status).toBe('EXPIRED');
  });

  it('correctly flags expiring soon batches within 30 days', () => {
    const expiringSoonBatch: BatchItem = {
      id: 'b2',
      batchNumber: 'SOON-002',
      currentQuantity: 50,
      expiryDate: '2026-11-25', // 13 days away
    };

    const status = calculateBatchStatus(expiringSoonBatch, refDate, 30);
    expect(status.isExpired).toBe(false);
    expect(status.isExpiringSoon).toBe(true);
    expect(status.usableQuantity).toBe(50);
    expect(status.status).toBe('EXPIRING_SOON');
  });

  it('never counts expired or quarantined stock in total available stock', () => {
    const batches: BatchItem[] = [
      { id: 'b1', batchNumber: 'B1', currentQuantity: 100, expiryDate: '2026-10-01' }, // expired
      { id: 'b2', batchNumber: 'B2', currentQuantity: 40, expiryDate: '2027-05-01' },  // active
      { id: 'b3', batchNumber: 'B3', currentQuantity: 30, expiryDate: '2027-08-01', isQuarantined: true }, // quarantined
    ];

    const result = calculateMedicineStock(batches, 50, refDate);
    expect(result.totalAvailableStock).toBe(40);
    expect(result.totalExpiredStock).toBe(100);
    expect(result.totalQuarantinedStock).toBe(30);
    expect(result.isLowStock).toBe(true); // 40 <= threshold of 50
    expect(result.isOutOfStock).toBe(false);
    expect(result.stockStatus).toBe('LOW_STOCK');
  });

  it('correctly reports OUT_OF_STOCK when all batches are expired or zero', () => {
    const batches: BatchItem[] = [
      { id: 'b1', batchNumber: 'B1', currentQuantity: 100, expiryDate: '2026-09-01' }, // expired
      { id: 'b2', batchNumber: 'B2', currentQuantity: 0, expiryDate: '2027-01-01' },
    ];

    const result = calculateMedicineStock(batches, 20, refDate);
    expect(result.totalAvailableStock).toBe(0);
    expect(result.isOutOfStock).toBe(true);
    expect(result.stockStatus).toBe('OUT_OF_STOCK');
  });

  it('plans FEFO stock deduction atomically and never allows negative quantity', () => {
    const batches: BatchItem[] = [
      { id: 'b_exp', batchNumber: 'EXP-1', currentQuantity: 200, expiryDate: '2026-08-01' }, // expired! Must not deduct
      { id: 'b_early', batchNumber: 'EARLY-1', currentQuantity: 30, expiryDate: '2026-12-01' }, // expires first
      { id: 'b_late', batchNumber: 'LATE-2', currentQuantity: 100, expiryDate: '2027-06-01' }, // expires later
    ];

    // Request 50 units
    const plan = planStockDeductionFEFO(batches, 50, refDate);
    expect(plan.success).toBe(true);
    expect(plan.totalAvailableStock).toBe(130); // 30 + 100
    expect(plan.allocations).toHaveLength(2);

    // First batch deducted completely (30 units)
    expect(plan.allocations[0].batchId).toBe('b_early');
    expect(plan.allocations[0].deductedQuantity).toBe(30);
    expect(plan.allocations[0].remainingBatchQuantity).toBe(0);

    // Second batch deducted partially (20 units)
    expect(plan.allocations[1].batchId).toBe('b_late');
    expect(plan.allocations[1].deductedQuantity).toBe(20);
    expect(plan.allocations[1].remainingBatchQuantity).toBe(80);
  });

  it('rejects deduction when requested quantity exceeds available unexpired stock', () => {
    const batches: BatchItem[] = [
      { id: 'b1', batchNumber: 'B1', currentQuantity: 20, expiryDate: '2027-01-01' },
    ];

    const plan = planStockDeductionFEFO(batches, 25, refDate);
    expect(plan.success).toBe(false);
    expect(plan.errorMessage).toContain('Insufficient available stock');
  });
});
