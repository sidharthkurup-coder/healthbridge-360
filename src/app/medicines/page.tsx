'use client';

import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  Calendar,
  Layers,
  History,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { AnimatedCounter, ScrollReveal } from '@/components/ui/Motion';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeView, setActiveView] = useState<'inventory' | 'history'>('inventory');

  // Modals
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [dispenseQty, setDispenseQty] = useState('10');
  const [dispenseReason, setDispenseReason] = useState('Dispensed against verified PHC OPD doctor prescription');
  const [dispensingLoading, setDispensingLoading] = useState(false);
  const [dispenseFeedback, setDispenseFeedback] = useState<any>(null);

  const [addBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [batchQty, setBatchQty] = useState('100');
  const [batchMfd, setBatchMfd] = useState('2026-09-01');
  const [batchExp, setBatchExp] = useState('2028-08-31');
  const [batchSupplier, setBatchSupplier] = useState('APMSIDC Central Medical Warehouse, Guntur');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');

  const [batchDetailsModalOpen, setBatchDetailsModalOpen] = useState(false);
  const [quarantineLoadingId, setQuarantineLoadingId] = useState<string | null>(null);

  // Add New Medicine Modal
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medCategory, setMedCategory] = useState('Antibiotic');
  const [medForm, setMedForm] = useState('Tablet');
  const [medStrength, setMedStrength] = useState('500mg');
  const [medUnit, setMedUnit] = useState('Tablets');
  const [medThreshold, setMedThreshold] = useState('50');
  const [medStorage, setMedStorage] = useState('Store below 25°C in dry dispensary rack');
  const [addingMed, setAddingMed] = useState(false);
  const [addMedError, setAddMedError] = useState('');

  useEffect(() => {
    fetchMedicines();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setCurrentUser(d.user));
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/medicines');
      const data = await res.json();
      if (data?.medicines) {
        setMedicines(data.medicines);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispense = (med: any) => {
    setSelectedMedicine(med);
    setDispenseQty('10');
    setDispenseFeedback(null);
    setDispenseModalOpen(true);
  };

  const handleOpenAddBatch = (med: any) => {
    setSelectedMedicine(med);
    setBatchNumber(`BTH-${Date.now().toString().slice(-6)}`);
    setBatchQty('100');
    setBatchError('');
    setAddBatchModalOpen(true);
  };

  const handleOpenBatchDetails = (med: any) => {
    setSelectedMedicine(med);
    setBatchDetailsModalOpen(true);
  };

  const handleDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispensingLoading(true);
    setDispenseFeedback(null);

    try {
      const res = await fetch('/api/medicines/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: selectedMedicine.id,
          quantity: Number(dispenseQty),
          reason: dispenseReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispense failed');

      setDispenseFeedback({
        success: true,
        message: `Successfully dispensed ${dispenseQty} units via FEFO!`,
        allocations: data.allocations,
      });

      setTimeout(() => {
        fetchMedicines();
      }, 500);
    } catch (err: any) {
      setDispenseFeedback({
        success: false,
        message: err.message,
      });
    } finally {
      setDispensingLoading(false);
    }
  };

  const handleAddBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchLoading(true);
    setBatchError('');

    try {
      const res = await fetch('/api/medicines/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: selectedMedicine.id,
          batchNumber,
          initialQuantity: Number(batchQty),
          manufacturingDate: batchMfd,
          expiryDate: batchExp,
          supplier: batchSupplier,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add batch');

      setAddBatchModalOpen(false);
      fetchMedicines();
    } catch (err: any) {
      setBatchError(err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  // Categorize
  const categories = Array.from(new Set(medicines.map((m) => m.category)));

  // Filter
  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.strength.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'LOW_STOCK') matchesStatus = m.stockSummary?.isLowStock;
    if (statusFilter === 'OUT_OF_STOCK') matchesStatus = m.stockSummary?.isOutOfStock;
    if (statusFilter === 'ADEQUATE') matchesStatus = m.stockSummary?.stockStatus === 'ADEQUATE';
    if (statusFilter === 'EXPIRED') matchesStatus = (m.stockSummary?.totalExpiredStock || 0) > 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate totals
  const totalAvailableStockAll = medicines.reduce(
    (acc, m) => acc + (m.stockSummary?.totalAvailableStock || 0),
    0
  );
  const totalExpiredStockAll = medicines.reduce(
    (acc, m) => acc + (m.stockSummary?.totalExpiredStock || 0),
    0
  );
  const lowStockCount = medicines.filter((m) => m.stockSummary?.isLowStock).length;

  const isStaff = currentUser && (currentUser.role === 'MEDICINE_STAFF' || currentUser.role === 'ADMIN');

  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMed(true);
    setAddMedError('');
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: medName,
          genericName: medGeneric,
          category: medCategory,
          form: medForm,
          strength: medStrength,
          unit: medUnit,
          minThreshold: Number(medThreshold),
          storageConditions: medStorage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register medicine');
      setAddMedModalOpen(false);
      setMedName('');
      setMedGeneric('');
      fetchMedicines();
    } catch (err: any) {
      setAddMedError(err.message);
    } finally {
      setAddingMed(false);
    }
  };

  const handleToggleQuarantine = async (batchId: string, nextQuarantine: boolean) => {
    setQuarantineLoadingId(batchId);
    try {
      const res = await fetch('/api/medicines/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          isQuarantined: nextQuarantine,
          reason: nextQuarantine ? 'Pharmacist manual quarantine hold' : 'Cleared back to usable dispensary stock',
        }),
      });
      if (res.ok) {
        const listRes = await fetch('/api/medicines');
        const listData = await listRes.json();
        if (listData?.medicines) {
          setMedicines(listData.medicines);
          if (selectedMedicine) {
            const refreshed = listData.medicines.find((m: any) => m.id === selectedMedicine.id);
            if (refreshed) setSelectedMedicine(refreshed);
          }
        }
      }
    } finally {
      setQuarantineLoadingId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Medicine Name',
      'Generic Name',
      'Category',
      'Form',
      'Strength',
      'Unit',
      'Available Stock',
      'Min Threshold',
      'Expired Stock',
      'Status',
      'Nearest Expiry',
    ];
    const rows = medicines.map((m) => [
      `"${m.name}"`,
      `"${m.genericName}"`,
      `"${m.category}"`,
      `"${m.form}"`,
      `"${m.strength}"`,
      `"${m.unit}"`,
      m.stockSummary?.totalAvailableStock ?? 0,
      m.minThreshold,
      m.stockSummary?.totalExpiredStock ?? 0,
      `"${m.stockSummary?.stockStatus || 'UNKNOWN'}"`,
      `"${m.stockSummary?.nearestExpiryDate || 'N/A'}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kantheru-phc-medicines-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Collect all transactions for history view
  const allTransactions = medicines
    .flatMap((m) =>
      (m.transactions || []).map((t: any) => ({
        ...t,
        medicineName: m.name,
        unit: m.unit,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-sm">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-navy-950 font-display">Medicine Inventory</h1>
                <Badge variant="amber">Module 2</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kantheru PHC Dispensary • Batch Tracking, FEFO Algorithm, Safety Thresholds & Transaction Ledger
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isStaff && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAddMedError('');
                setAddMedModalOpen(true);
              }}
              icon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Add Medicine
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={medicines.length === 0}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveView('inventory')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'inventory' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Formulary Stock ({medicines.length})
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'history' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transaction Ledger ({allTransactions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Strict Regulatory Notice */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Non-Automated Clinical Policy:</strong> HEALTHBRIDGE 360 is strictly an inventory, transaction, and threshold tracking system. It never generates automated prescriptions, medical diagnostics, or dosage recommendations. All dispensations require verified physician oversight.
        </p>
      </div>

      {/* KPI Alert Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScrollReveal delayMs={40}>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Usable Stock</span>
              <Badge variant="teal">Verified Unexpired</Badge>
            </div>
            <p className="text-2xl font-bold text-navy-950 mt-1">
              <AnimatedCounter value={totalAvailableStockAll} />
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Units ready across all active batches</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={100}>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Low Stock Warnings</span>
              <Badge variant={lowStockCount > 0 ? 'amber' : 'emerald'}>
                {lowStockCount > 0 ? `${lowStockCount} Flagged` : 'All Stocked'}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              <AnimatedCounter value={lowStockCount} suffix=" Medicines" />
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Below configured minimum threshold</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={160}>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Quarantined Expired Units</span>
              <Badge variant={totalExpiredStockAll > 0 ? 'rose' : 'slate'}>Isolated</Badge>
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              <AnimatedCounter value={totalExpiredStockAll} />
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Zero tolerance: Never counted in usable stock</p>
          </div>
        </ScrollReveal>
      </div>

      {/* VIEW 1: INVENTORY TABLE */}
      {activeView === 'inventory' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by brand, generic name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ADEQUATE">Adequate Stock</option>
                <option value="LOW_STOCK">Low Stock (Alert)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="EXPIRED">Has Expired Batches</option>
              </select>
            </div>
          </div>

          {/* Medicines Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {filteredMedicines.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Medicine & Form</th>
                      <th className="py-3 px-4">Strength & Unit</th>
                      <th className="py-3 px-4">Available Stock</th>
                      <th className="py-3 px-4">Threshold</th>
                      <th className="py-3 px-4">Batches</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMedicines.map((med) => {
                      const summary = med.stockSummary;
                      const hasExpired = (summary?.totalExpiredStock || 0) > 0;
                      return (
                        <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-navy-950 text-xs">{med.name}</span>
                              {med.isEssential && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                                  EDL
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{med.genericName}</p>
                            <p className="text-[10px] text-slate-400">Category: {med.category}</p>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800">{med.strength}</p>
                            <p className="text-[11px] text-slate-500">
                              {med.form} • {med.unit}
                            </p>
                          </td>

                          <td className="py-3 px-4 min-w-[140px]">
                            <p className="text-sm font-bold text-navy-950">
                              {summary?.totalAvailableStock?.toLocaleString()}
                            </p>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  summary?.isOutOfStock
                                    ? 'bg-rose-500'
                                    : summary?.isLowStock
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round(((summary?.totalAvailableStock || 0) / Math.max(1, med.minThreshold * 2)) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                            {hasExpired && (
                              <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                +{summary?.totalExpiredStock} Expired (Quarantined)
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-medium text-slate-700">{med.minThreshold}</span>
                            <span className="text-[10px] text-slate-400 block">Min Threshold</span>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleOpenBatchDetails(med)}
                              className="text-teal-700 hover:text-teal-800 font-semibold text-xs flex items-center gap-1"
                            >
                              <Layers className="w-3 h-3" />
                              {med.batches?.length || 0} Batches
                            </button>
                            {summary?.nearestExpiryDate && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Nearest Expiry: {summary.nearestExpiryDate}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                summary?.isOutOfStock
                                  ? 'rose'
                                  : summary?.isLowStock
                                  ? 'amber'
                                  : 'emerald'
                              }
                            >
                              {summary?.stockStatus?.replace(/_/g, ' ')}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isStaff && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenDispense(med)}
                                    disabled={summary?.isOutOfStock}
                                    icon={<MinusCircle className="w-3.5 h-3.5" />}
                                  >
                                    Dispense
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenAddBatch(med)}
                                    icon={<PlusCircle className="w-3.5 h-3.5" />}
                                  >
                                    Add Batch
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenBatchDetails(med)}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Pill className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs">No matching medicines found in catalog.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 2: TRANSACTION LEDGER */}
      {activeView === 'history' && (
        <Card>
          <CardHeader
            title="Stock Movement & Transaction Ledger"
            subtitle="Immutable audit log of all stock receipts, dispensations, and inventory adjustments"
          />
          <CardContent className="p-0 overflow-x-auto">
            {allTransactions.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Previous → New</th>
                    <th className="py-3 px-4">Reason & Reference</th>
                    <th className="py-3 px-4">Dispensed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-navy-950">{tx.medicineName}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            tx.type === 'PURCHASE_RECEIPT'
                              ? 'emerald'
                              : tx.type === 'DISPENSED'
                              ? 'amber'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {tx.type === 'DISPENSED' ? `-${tx.quantity}` : `+${tx.quantity}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {tx.previousQuantity} → {tx.newQuantity}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-1 text-slate-800">{tx.reason}</p>
                        {tx.referenceNote && (
                          <p className="text-[10px] text-slate-400">{tx.referenceNote}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {tx.performedByUser?.name || 'Staff Pharmacist'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500">No transaction logs recorded.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: ATOMIC FEFO DISPENSE MODAL */}
      <Modal
        isOpen={dispenseModalOpen}
        onClose={() => setDispenseModalOpen(false)}
        title="Dispense Stock (FEFO Atomic Deduction)"
        subtitle={selectedMedicine ? `${selectedMedicine.name} (${selectedMedicine.strength}) • Available: ${selectedMedicine.stockSummary?.totalAvailableStock}` : ''}
      >
        <form onSubmit={handleDispenseSubmit} className="space-y-4">
          {dispenseFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                dispenseFeedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <p className="font-semibold">{dispenseFeedback.message}</p>
              {dispenseFeedback.allocations && (
                <div className="mt-2 text-[11px] space-y-1">
                  <p className="font-semibold text-emerald-800">FEFO Automated Allocations:</p>
                  {dispenseFeedback.allocations.map((a: any) => (
                    <div key={a.batchId} className="flex justify-between border-t border-emerald-200/50 pt-1">
                      <span>Batch {a.batchNumber}:</span>
                      <span>
                        Deducted {a.deductedQuantity} (Remaining: {a.remainingBatchQuantity})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-900">
            <p className="font-semibold">First-Expired-First-Out (FEFO) Guarantee:</p>
            <p className="mt-0.5 text-teal-800">
              The system automatically pulls from batches closest to expiry while strictly quarantining any already-expired stock. Stock can never turn negative.
            </p>
          </div>

          <Input
            label="Quantity to Dispense"
            type="number"
            min="1"
            max={selectedMedicine?.stockSummary?.totalAvailableStock || 1000}
            required
            value={dispenseQty}
            onChange={(e) => setDispenseQty(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Dispensation Reason / Patient Ticket <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={dispenseReason}
              onChange={(e) => setDispenseReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDispenseModalOpen(false)}>
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={dispensingLoading}
              disabled={Number(dispenseQty) <= 0 || Number(dispenseQty) > (selectedMedicine?.stockSummary?.totalAvailableStock || 0)}
            >
              Confirm FEFO Deduction
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD NEW BATCH */}
      <Modal
        isOpen={addBatchModalOpen}
        onClose={() => setAddBatchModalOpen(false)}
        title="Add Incoming Medicine Batch"
        subtitle={selectedMedicine ? `${selectedMedicine.name} (${selectedMedicine.strength})` : ''}
      >
        <form onSubmit={handleAddBatchSubmit} className="space-y-4">
          {batchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
              {batchError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Batch Number"
              required
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />

            <Input
              label="Quantity Received"
              type="number"
              min="1"
              required
              value={batchQty}
              onChange={(e) => setBatchQty(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Manufacturing Date"
              type="date"
              required
              value={batchMfd}
              onChange={(e) => setBatchMfd(e.target.value)}
            />

            <Input
              label="Expiry Date"
              type="date"
              required
              min="2026-11-13"
              value={batchExp}
              onChange={(e) => setBatchExp(e.target.value)}
            />
          </div>

          <Input
            label="Supplier / Consignment Source"
            required
            value={batchSupplier}
            onChange={(e) => setBatchSupplier(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={batchLoading}>
              Receive & Register Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: BATCH BREAKDOWN DETAILS */}
      <Modal
        isOpen={batchDetailsModalOpen}
        onClose={() => setBatchDetailsModalOpen(false)}
        title="Batch-by-Batch Stock Breakdown"
        subtitle={selectedMedicine ? `${selectedMedicine.name} (${selectedMedicine.genericName})` : ''}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Available</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Days Remaining</th>
                  <th className="py-2.5 px-3">Status</th>
                  {isStaff && <th className="py-2.5 px-3 text-right">Batch Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedMedicine?.batches?.map((b: any) => {
                  const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                  const isExp = daysLeft <= 0;
                  const isQuaran = b.isQuarantined;
                  return (
                    <tr key={b.id} className={isExp || isQuaran ? 'bg-rose-50/50' : ''}>
                      <td className="py-2.5 px-3 font-mono font-bold text-navy-950">{b.batchNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{b.currentQuantity}</td>
                      <td className="py-2.5 px-3">{b.expiryDate}</td>
                      <td className="py-2.5 px-3">
                        {isExp ? (
                          <span className="text-rose-600 font-bold">Expired ({Math.abs(daysLeft)}d ago)</span>
                        ) : daysLeft <= 60 ? (
                          <span className="text-amber-700 font-bold">{daysLeft} days left (Expiring Soon)</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">{daysLeft} days left</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={isExp || isQuaran ? 'rose' : 'emerald'} size="sm">
                          {isExp ? 'EXPIRED' : isQuaran ? 'QUARANTINED' : 'ACTIVE'}
                        </Badge>
                      </td>
                      {isStaff && (
                        <td className="py-2.5 px-3 text-right">
                          {!isExp && (
                            <Button
                              variant={isQuaran ? 'outline' : 'ghost'}
                              size="sm"
                              isLoading={quarantineLoadingId === b.id}
                              onClick={() => handleToggleQuarantine(b.id, !isQuaran)}
                              icon={
                                isQuaran ? (
                                  <RotateCcw className="w-3 h-3" />
                                ) : (
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                )
                              }
                            >
                              {isQuaran ? 'Release' : 'Quarantine'}
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setBatchDetailsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: ADD NEW FORMULARY MEDICINE */}
      <Modal
        isOpen={addMedModalOpen}
        onClose={() => setAddMedModalOpen(false)}
        title="Register New Medicine in Formulary"
        subtitle="Adds a new catalog entry to Kantheru PHC dispensary (batches added separately)"
      >
        <form onSubmit={handleAddMedicineSubmit} className="space-y-4">
          {addMedError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {addMedError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Brand / Catalog Name"
              required
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="e.g. ORS Electrolytes Sachet"
            />
            <Input
              label="Generic Name"
              required
              value={medGeneric}
              onChange={(e) => setMedGeneric(e.target.value)}
              placeholder="e.g. Oral Rehydration Salts"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              label="Category"
              options={[
                { value: 'Antibiotic', label: 'Antibiotic' },
                { value: 'Analgesic', label: 'Analgesic' },
                { value: 'Antidiabetic', label: 'Antidiabetic' },
                { value: 'Antihypertensive', label: 'Antihypertensive' },
                { value: 'Electrolytes', label: 'Electrolytes' },
                { value: 'Maternal / Pediatric', label: 'Maternal / Pediatric' },
              ]}
              value={medCategory}
              onChange={(e) => setMedCategory(e.target.value)}
            />
            <Select
              label="Form"
              options={[
                { value: 'Tablet', label: 'Tablet' },
                { value: 'Capsule', label: 'Capsule' },
                { value: 'Syrup', label: 'Syrup' },
                { value: 'Injection', label: 'Injection' },
                { value: 'Sachet', label: 'Sachet' },
              ]}
              value={medForm}
              onChange={(e) => setMedForm(e.target.value)}
            />
            <Input
              label="Strength"
              required
              value={medStrength}
              onChange={(e) => setMedStrength(e.target.value)}
              placeholder="500mg"
            />
            <Input
              label="Unit"
              required
              value={medUnit}
              onChange={(e) => setMedUnit(e.target.value)}
              placeholder="Tablets"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Minimum Safe Threshold"
              type="number"
              min="1"
              required
              value={medThreshold}
              onChange={(e) => setMedThreshold(e.target.value)}
            />
            <Input
              label="Storage Conditions"
              value={medStorage}
              onChange={(e) => setMedStorage(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddMedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={addingMed}>
              Save to Formulary
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
