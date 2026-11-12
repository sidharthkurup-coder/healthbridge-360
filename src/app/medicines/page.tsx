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
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MedicinesPage() {
  const { lang, t, tx, ts } = useLanguage();
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
                <h1 key={lang} className="text-2xl font-extrabold text-navy-950 font-display animate-lang-swap">
                  {t('page.medicines.title')}
                </h1>
                <Badge variant="amber">{t('mod2.badge')}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t('page.medicines.sub')}</p>
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
              {tx('Add Medicine', 'మందును జోడించండి')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={medicines.length === 0}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            {tx('Export CSV', 'CSV ఎగుమతి')}
          </Button>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveView('inventory')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'inventory' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tx('Formulary Stock', 'మందుల నిల్వ')} ({medicines.length})
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'history' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tx('Transaction Ledger', 'లావాదేవీల రికార్డు')} ({allTransactions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Strict Regulatory Notice */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>{tx('Non-Automated Clinical Policy:', 'క్లినికల్ భద్రతా విధానం:')}</strong>{' '}
          {tx(
            'HEALTHBRIDGE 360 is strictly an inventory, transaction, and threshold tracking system. It never generates automated prescriptions, medical diagnostics, or dosage recommendations. All dispensations require verified physician oversight.',
            'HEALTHBRIDGE 360 కేవలం మందుల నిల్వ & బ్యాచ్ ట్రాకింగ్ కోసం మాత్రమే. ఇది ఎప్పుడూ స్వయంచాలక ప్రిస్క్రిప్షన్లు లేదా మోతాదులను సూచించదు. వైద్యుల పర్యవేక్షణలోనే మందులు పంపిణీ చేయబడతాయి.'
          )}
        </p>
      </div>

      {/* KPI Alert Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScrollReveal delayMs={40}>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{tx('Total Usable Stock', 'మొత్తం వినియోగ నిల్వ')}</span>
              <Badge variant="teal">{tx('Verified Unexpired', 'చెల్లుబాటు అయ్యేది')}</Badge>
            </div>
            <p className="text-2xl font-bold text-navy-950 mt-1">
              <AnimatedCounter value={totalAvailableStockAll} />
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{tx('Units ready across all active batches', 'అన్ని యాక్టివ్ బ్యాచ్‌లలోని యూనిట్లు')}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={100}>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{tx('Low Stock Warnings', 'తక్కువ నిల్వ హెచ్చరికలు')}</span>
              <Badge variant={lowStockCount > 0 ? 'amber' : 'emerald'}>
                {lowStockCount > 0 ? `${lowStockCount} ${tx('Flagged', 'హెచ్చరిక')}` : tx('All Stocked', 'సరిపడా నిల్వ')}
              </Badge>
            </div>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              <AnimatedCounter value={lowStockCount} suffix={tx(' Medicines', ' మందులు')} />
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{tx('Below configured minimum threshold', 'కనీస పరిమితి కంటే తక్కువగా ఉన్నవి')}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={160}>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{tx('Quarantined Expired Units', 'వేరు చేసిన కాలం చెల్లినవి')}</span>
              <Badge variant={totalExpiredStockAll > 0 ? 'rose' : 'slate'}>{tx('Isolated', 'వేరుచేయబడింది')}</Badge>
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              <AnimatedCounter value={totalExpiredStockAll} />
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{tx('Zero tolerance: Never counted in usable stock', 'ఇవి వినియోగ నిల్వలో ఎప్పుడూ లెక్కించబడవు')}</p>
          </div>
        </ScrollReveal>
      </div>

      {/* VIEW 1: INVENTORY TABLE */}
      {activeView === 'inventory' && (
        <div className="space-y-4 animate-tab-switch">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={tx('Search by brand, generic name...', 'మందు పేరు, జెనరిక్ ద్వారా వెతకండి...')}
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
                <option value="ALL">{tx('All Categories', 'అన్ని వర్గాలు')}</option>
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
                <option value="ALL">{tx('All Statuses', 'అన్ని స్థితులు')}</option>
                <option value="ADEQUATE">{tx('Adequate Stock', 'సరిపడా నిల్వ')}</option>
                <option value="LOW_STOCK">{tx('Low Stock (Alert)', 'తక్కువ నిల్వ (హెచ్చరిక)')}</option>
                <option value="OUT_OF_STOCK">{tx('Out of Stock', 'నిల్వ లేదు')}</option>
                <option value="EXPIRED">{tx('Has Expired Batches', 'కాలం చెల్లిన బ్యాచ్‌లు')}</option>
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
                      <th className="py-3 px-4">{tx('Medicine & Form', 'మందు & రూపం')}</th>
                      <th className="py-3 px-4">{tx('Strength & Unit', 'సామర్థ్యం & యూనిట్')}</th>
                      <th className="py-3 px-4">{tx('Available Stock', 'అందుబాటులో ఉన్న నిల్వ')}</th>
                      <th className="py-3 px-4">{tx('Threshold', 'కనీస పరిమితి')}</th>
                      <th className="py-3 px-4">{tx('Batches', 'బ్యాచ్‌లు')}</th>
                      <th className="py-3 px-4">{tx('Status', 'స్థితి')}</th>
                      <th className="py-3 px-4 text-right">{tx('Actions', 'చర్యలు')}</th>
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
                              {ts(summary?.stockStatus || 'ADEQUATE')}
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
                                    {tx('Dispense', 'పంపిణీ')}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenAddBatch(med)}
                                    icon={<PlusCircle className="w-3.5 h-3.5" />}
                                  >
                                    {tx('Add Batch', 'బ్యాచ్ చేర్చు')}
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenBatchDetails(med)}
                              >
                                {tx('View', 'చూడు')}
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
                  <p className="text-xs">{tx('No matching medicines found in catalog.', 'సరిపోయే మందులు కనుగొనబడలేదు.')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 2: TRANSACTION LEDGER */}
      {activeView === 'history' && (
        <Card className="animate-tab-switch">
          <CardHeader
            title={tx('Stock Movement & Transaction Ledger', 'మందుల కదలిక & లావాదేవీల రికార్డు')}
            subtitle={tx('Immutable audit log of all stock receipts, dispensations, and inventory adjustments', 'కొనుగోలు, పంపిణీ మరియు మార్పుల పూర్తి ఆడిట్ లాగ్')}
          />
          <CardContent className="p-0 overflow-x-auto">
            {allTransactions.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{tx('Timestamp', 'సమయం')}</th>
                    <th className="py-3 px-4">{tx('Medicine', 'మందు')}</th>
                    <th className="py-3 px-4">{tx('Type', 'రకం')}</th>
                    <th className="py-3 px-4">{tx('Quantity', 'పరిమాణం')}</th>
                    <th className="py-3 px-4">{tx('Previous → New', 'ముందు → కొత్త')}</th>
                    <th className="py-3 px-4">{tx('Reason & Reference', 'కారణం')}</th>
                    <th className="py-3 px-4">{tx('Dispensed By', 'జారీ చేసినవారు')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTransactions.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {new Date(tr.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-navy-950">{tr.medicineName}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            tr.type === 'PURCHASE_RECEIPT'
                              ? 'emerald'
                              : tr.type === 'DISPENSED'
                              ? 'amber'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {tr.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {tr.type === 'DISPENSED' ? `-${tr.quantity}` : `+${tr.quantity}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {tr.previousQuantity} → {tr.newQuantity}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-1 text-slate-800">{tr.reason}</p>
                        {tr.referenceNote && (
                          <p className="text-[10px] text-slate-400">{tr.referenceNote}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {tr.performedByUser?.name || tx('Staff Pharmacist', 'ఫార్మసిస్ట్')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500">{tx('No transaction logs recorded.', 'లావాదేవీల రికార్డులు లేవు.')}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: ATOMIC FEFO DISPENSE MODAL */}
      <Modal
        isOpen={dispenseModalOpen}
        onClose={() => setDispenseModalOpen(false)}
        title={tx('Dispense Stock (FEFO Atomic Deduction)', 'మందుల పంపిణీ (FEFO కచ్చిత తగ్గింపు)')}
        subtitle={selectedMedicine ? `${selectedMedicine.name} (${selectedMedicine.strength}) • ${tx('Available:', 'అందుబాటులో:')} ${selectedMedicine.stockSummary?.totalAvailableStock}` : ''}
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
                  <p className="font-semibold text-emerald-800">{tx('FEFO Automated Allocations:', 'FEFO బ్యాచ్ కేటాయింపు:')}</p>
                  {dispenseFeedback.allocations.map((a: any) => (
                    <div key={a.batchId} className="flex justify-between border-t border-emerald-200/50 pt-1">
                      <span>{tx('Batch', 'బ్యాచ్')} {a.batchNumber}:</span>
                      <span>
                        {tx('Deducted', 'తగ్గించినవి')} {a.deductedQuantity} ({tx('Remaining:', 'మిగిలినవి:')} {a.remainingBatchQuantity})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-900">
            <p className="font-semibold">{tx('First-Expired-First-Out (FEFO) Guarantee:', 'FEFO నియమం హామీ:')}</p>
            <p className="mt-0.5 text-teal-800">
              {tx(
                'The system automatically pulls from batches closest to expiry while strictly quarantining any already-expired stock. Stock can never turn negative.',
                'ముందుగా గడువు ముగియబోయే బ్యాచ్ నుండి మందులను పంపిణీ చేస్తుంది. కాలం చెల్లినవి ఎప్పుడూ పంపిణీ చేయబడవు.'
              )}
            </p>
          </div>

          <Input
            label={tx('Quantity to Dispense', 'పంపిణీ చేయాల్సిన పరిమాణం')}
            type="number"
            min="1"
            max={selectedMedicine?.stockSummary?.totalAvailableStock || 1000}
            required
            value={dispenseQty}
            onChange={(e) => setDispenseQty(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              {tx('Dispensation Reason / Patient Ticket', 'పంపిణీ కారణం / రోగి వివరాలు')} <span className="text-rose-500">*</span>
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
              {tx('Close', 'మూసివేయండి')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={dispensingLoading}
              disabled={Number(dispenseQty) <= 0 || Number(dispenseQty) > (selectedMedicine?.stockSummary?.totalAvailableStock || 0)}
            >
              {tx('Confirm FEFO Deduction', 'FEFO పంపిణీ నిర్ధారించండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD NEW BATCH */}
      <Modal
        isOpen={addBatchModalOpen}
        onClose={() => setAddBatchModalOpen(false)}
        title={tx('Add Incoming Medicine Batch', 'కొత్త మందుల బ్యాచ్ చేర్చండి')}
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
              label={tx('Batch Number', 'బ్యాచ్ నంబర్')}
              required
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />

            <Input
              label={tx('Quantity Received', 'అందిన పరిమాణం')}
              type="number"
              min="1"
              required
              value={batchQty}
              onChange={(e) => setBatchQty(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tx('Manufacturing Date', 'తయారీ తేదీ')}
              type="date"
              required
              value={batchMfd}
              onChange={(e) => setBatchMfd(e.target.value)}
            />

            <Input
              label={tx('Expiry Date', 'గడువు తేదీ')}
              type="date"
              required
              min="2026-11-13"
              value={batchExp}
              onChange={(e) => setBatchExp(e.target.value)}
            />
          </div>

          <Input
            label={tx('Supplier / Consignment Source', 'సరఫరాదారు')}
            required
            value={batchSupplier}
            onChange={(e) => setBatchSupplier(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddBatchModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={batchLoading}>
              {tx('Receive & Register Batch', 'బ్యాచ్ నమోదు చేయండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: BATCH BREAKDOWN DETAILS */}
      <Modal
        isOpen={batchDetailsModalOpen}
        onClose={() => setBatchDetailsModalOpen(false)}
        title={tx('Batch-by-Batch Stock Breakdown', 'బ్యాచ్ వారీగా నిల్వ వివరాలు')}
        subtitle={selectedMedicine ? `${selectedMedicine.name} (${selectedMedicine.genericName})` : ''}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{tx('Batch Number', 'బ్యాచ్ నంబర్')}</th>
                  <th className="py-2.5 px-3">{tx('Available', 'లభ్యం')}</th>
                  <th className="py-2.5 px-3">{tx('Expiry Date', 'గడువు తేదీ')}</th>
                  <th className="py-2.5 px-3">{tx('Days Remaining', 'మిగిలిన రోజులు')}</th>
                  <th className="py-2.5 px-3">{tx('Status', 'స్థితి')}</th>
                  {isStaff && <th className="py-2.5 px-3 text-right">{tx('Batch Action', 'చర్య')}</th>}
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
                          <span className="text-rose-600 font-bold">{tx('Expired', 'కాలం చెల్లింది')} ({Math.abs(daysLeft)}d)</span>
                        ) : daysLeft <= 60 ? (
                          <span className="text-amber-700 font-bold">{daysLeft} {tx('days left (Expiring Soon)', 'రోజులు మిగిలాయి')}</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">{daysLeft} {tx('days left', 'రోజులు')}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={isExp || isQuaran ? 'rose' : 'emerald'} size="sm">
                          {isExp ? ts('EXPIRED') : isQuaran ? tx('QUARANTINED', 'వేరు చేయబడింది') : tx('ACTIVE', 'యాక్టివ్')}
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
                              {isQuaran ? tx('Release', 'విడుదల') : tx('Quarantine', 'వేరుచేయి')}
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
              {tx('Close', 'మూసివేయండి')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: ADD NEW FORMULARY MEDICINE */}
      <Modal
        isOpen={addMedModalOpen}
        onClose={() => setAddMedModalOpen(false)}
        title={tx('Register New Medicine in Formulary', 'కొత్త మందును జాబితాలో చేర్చండి')}
        subtitle={tx('Adds a new catalog entry to Kantheru PHC dispensary (batches added separately)', 'కంతేరు PHC డిస్పెన్సరీకి కొత్త మందును జోడించండి')}
      >
        <form onSubmit={handleAddMedicineSubmit} className="space-y-4">
          {addMedError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {addMedError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={tx('Brand / Catalog Name', 'బ్రాండ్ / పేరు')}
              required
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="e.g. ORS Electrolytes Sachet"
            />
            <Input
              label={tx('Generic Name', 'జెనరిక్ పేరు')}
              required
              value={medGeneric}
              onChange={(e) => setMedGeneric(e.target.value)}
              placeholder="e.g. Oral Rehydration Salts"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              label={tx('Category', 'వర్గం')}
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
              label={tx('Form', 'రూపం')}
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
              label={tx('Strength', 'సామర్థ్యం')}
              required
              value={medStrength}
              onChange={(e) => setMedStrength(e.target.value)}
              placeholder="500mg"
            />
            <Input
              label={tx('Unit', 'యూనిట్')}
              required
              value={medUnit}
              onChange={(e) => setMedUnit(e.target.value)}
              placeholder="Tablets"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={tx('Minimum Safe Threshold', 'కనీస సురక్షిత నిల్వ')}
              type="number"
              min="1"
              required
              value={medThreshold}
              onChange={(e) => setMedThreshold(e.target.value)}
            />
            <Input
              label={tx('Storage Conditions', 'నిల్వ పరిస్థితులు')}
              value={medStorage}
              onChange={(e) => setMedStorage(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddMedModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={addingMed}>
              {tx('Save to Formulary', 'మందును సేవ్ చేయండి')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
