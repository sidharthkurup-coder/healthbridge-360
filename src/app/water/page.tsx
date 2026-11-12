'use client';

import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Activity,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Plus,
  Filter,
  BarChart,
  Shield,
  HelpCircle,
  Phone,
  FileText,
  AlertCircle,
  Sliders,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { AnimatedCounter, ScrollReveal } from '@/components/ui/Motion';

export default function WaterPage() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'sections' | 'quality' | 'complaints'>('comparison');
  const [sections, setSections] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [sectionAnalyses, setSectionAnalyses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [qualityReports, setQualityReports] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modals
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logSectionId, setLogSectionId] = useState(1);
  const [logDate, setLogDate] = useState('2026-11-12');
  const [logStart, setLogStart] = useState('06:00');
  const [logEnd, setLogEnd] = useState('08:30');
  const [logDuration, setLogDuration] = useState('150');
  const [logQty, setLogQty] = useState('75.0');
  const [logFlow, setLogFlow] = useState('520');
  const [logPressure, setLogPressure] = useState('2.1');
  const [logInterrupted, setLogInterrupted] = useState(false);
  const [logReason, setLogReason] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Quality Report Modal
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [qSectionId, setQSectionId] = useState(1);
  const [qTestDate, setQTestDate] = useState('2026-11-12');
  const [qLocation, setQLocation] = useState('Public Standpost #3, Main Road');
  const [qLab, setQLab] = useState('District Water Quality Testing Laboratory, Guntur');
  const [qTestedBy, setQTestedBy] = useState('Sri P. Rama Krishna (Senior Chemist)');
  const [qSodium, setQSodium] = useState('70');
  const [qFluoride, setQFluoride] = useState('0.8');
  const [qPh, setQPh] = useState('7.4');
  const [qTds, setQTds] = useState('310');
  const [qColiform, setQColiform] = useState('0');
  const [qReportFileUrl, setQReportFileUrl] = useState('');
  const [qReportFileName, setQReportFileName] = useState('');
  const [qSubmitting, setQSubmitting] = useState(false);

  // Schedule Configurator Modal
  const [schedModalOpen, setSchedModalOpen] = useState(false);
  const [schedSectionId, setSchedSectionId] = useState(1);
  const [schedStart, setSchedStart] = useState('06:00');
  const [schedEnd, setSchedEnd] = useState('08:30');
  const [schedTargetKL, setSchedTargetKL] = useState('80');
  const [schedActive, setSchedActive] = useState(true);
  const [schedSaving, setSchedSaving] = useState(false);

  // Complaint status loading
  const [complaintActionId, setComplaintActionId] = useState<string | null>(null);

  // Complaint Modal
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [cSectionId, setCSectionId] = useState(1);
  const [cType, setCType] = useState('LOW_PRESSURE');
  const [cDesc, setCDesc] = useState('');
  const [cHouseholds, setCHouseholds] = useState('4');
  const [cSubmitting, setCSubmitting] = useState(false);

  useEffect(() => {
    fetchWaterData();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setCurrentUser(d.user));
  }, []);

  const fetchWaterData = async () => {
    setLoading(true);
    try {
      const [recordsRes, reportsRes, complaintsRes] = await Promise.all([
        fetch('/api/water/records').then((r) => r.json()),
        fetch('/api/water/reports').then((r) => r.json()),
        fetch('/api/water/complaints').then((r) => r.json()),
      ]);

      if (recordsRes) {
        setSections(recordsRes.sections || []);
        setSchedules(recordsRes.schedules || []);
        setSectionAnalyses(recordsRes.sectionAnalyses || []);
        setRecords(recordsRes.records || []);
      }
      if (reportsRes) setQualityReports(reportsRes.reports || []);
      if (complaintsRes) setComplaints(complaintsRes.complaints || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogSubmitting(true);
    try {
      const res = await fetch('/api/water/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: Number(logSectionId),
          supplyDate: logDate,
          actualStartTime: logStart,
          actualEndTime: logEnd,
          actualDurationMinutes: Number(logDuration),
          quantitySuppliedKL: Number(logQty),
          flowRateLpm: logFlow ? Number(logFlow) : null,
          pressureBar: logPressure ? Number(logPressure) : null,
          interruptionOccurred: logInterrupted,
          interruptionReason: logInterrupted ? logReason : null,
          status: logInterrupted ? 'PARTIAL' : 'COMPLETED',
        }),
      });

      if (!res.ok) throw new Error('Failed to record supply');
      setLogModalOpen(false);
      fetchWaterData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLogSubmitting(false);
    }
  };

  const handleAddQualityReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setQSubmitting(true);
    try {
      const res = await fetch('/api/water/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: Number(qSectionId),
          testDate: qTestDate,
          sampleLocation: qLocation,
          labName: qLab,
          testedBy: qTestedBy,
          sodiumMgL: qSodium ? Number(qSodium) : null,
          fluorideMgL: qFluoride ? Number(qFluoride) : null,
          phValue: qPh ? Number(qPh) : null,
          tdsPpm: qTds ? Number(qTds) : null,
          microbialColiformColonies: qColiform ? Number(qColiform) : null,
          labReportFileUrl: qReportFileUrl || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to upload report');
      setQualityModalOpen(false);
      setQReportFileUrl('');
      setQReportFileName('');
      fetchWaterData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setQSubmitting(false);
    }
  };

  const handleVerifyReport = async (reportId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/water/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, verificationStatus: status }),
      });
      if (!res.ok) throw new Error('Verification action failed');
      fetchWaterData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCSubmitting(true);
    try {
      const res = await fetch('/api/water/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: Number(cSectionId),
          issueType: cType,
          description: cDesc,
          affectedHouseholds: Number(cHouseholds),
        }),
      });
      if (!res.ok) throw new Error('Failed to file water complaint');
      setComplaintModalOpen(false);
      setCDesc('');
      fetchWaterData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCSubmitting(false);
    }
  };

  const isOfficer =
    currentUser && (currentUser.role === 'WATER_SANITATION_OFFICER' || currentUser.role === 'ADMIN');

  const handleOpenEditSchedule = (sectionId: number) => {
    const existing = schedules.find((s) => s.sectionId === sectionId);
    setSchedSectionId(sectionId);
    setSchedStart(existing?.scheduledStartTime || '06:00');
    setSchedEnd(existing?.scheduledEndTime || '08:30');
    setSchedTargetKL(String(existing?.targetQuantityKL || 80));
    setSchedActive(existing?.isActive !== false);
    setSchedModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedSaving(true);
    try {
      const res = await fetch('/api/water/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: schedSectionId,
          scheduledStartTime: schedStart,
          scheduledEndTime: schedEnd,
          targetQuantityKL: Number(schedTargetKL),
          isActive: schedActive,
        }),
      });
      if (!res.ok) throw new Error('Failed to save schedule');
      setSchedModalOpen(false);
      fetchWaterData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSchedSaving(false);
    }
  };

  const handleUpdateComplaintStatus = async (id: string, status: 'IN_PROGRESS' | 'RESOLVED') => {
    setComplaintActionId(id);
    try {
      const res = await fetch('/api/water/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          adminNotes: status === 'RESOLVED' ? 'Field pressure restored and line inspected by Kantheru Water Works' : 'Line technician dispatched to inspect valve pressure',
        }),
      });
      if (res.ok) fetchWaterData();
    } finally {
      setComplaintActionId(null);
    }
  };

  const handleLabFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1500000) {
      alert('Please attach a document/image under 1.5 MB.');
      return;
    }
    setQReportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setQReportFileUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-navy-950 font-display">Water Management</h1>
                <Badge variant="teal">Module 4</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kantheru Gram Panchayat • 5-Section Distribution, Flow Rate & Pressure, BIS 10500 Laboratory Quality Standards
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'comparison' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            5-Section Comparison
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sections' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Schedules & Supply Logs ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'quality' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lab Water Quality ({qualityReports.length})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'complaints' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interruption Reports ({complaints.length})
          </button>
        </div>
      </div>

      {/* Non-inferential strict standard banner */}
      <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-teal-950">Scientific Quality Assurance Protocol:</p>
          <p className="mt-0.5 text-teal-800 leading-relaxed">
            HEALTHBRIDGE 360 strictly adheres to non-inferential water data standards. Sodium and Fluoride concentrations are NEVER inferred from TDS. Water is NEVER declared potable from incomplete testing data. All 5 parameters (Sodium, Fluoride, pH, TDS, Microbial Coliform) must be verified before safe drinking status is certified.
          </p>
        </div>
      </div>

      {/* TAB 1: 5-SECTION COMPARISON DASHBOARD */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                Five-Section Water Distribution Comparison
              </h2>
              <p className="text-xs text-slate-500">
                Calculated strictly from real telemetry records using the Water Distribution Analysis Algorithm
              </p>
            </div>
            {isOfficer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLogModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Log Supply Record
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {sections.map((sec) => {
              const analysis = sectionAnalyses.find((a) => a.sectionId === sec.id);
              return (
                <ScrollReveal key={sec.id} delayMs={sec.id * 55}>
                  <Card className="border-slate-200 hover:border-teal-400 transition-all flex flex-col justify-between h-full">
                  <CardHeader
                    title={`Section ${sec.id}`}
                    subtitle={sec.name.split(' - ')[1] || sec.name}
                    className="p-4"
                  />
                  <CardContent className="p-4 space-y-3 pt-0 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Volume:</span>
                        <strong className="text-navy-950 font-mono">
                          {analysis?.totalMeasuredVolumeKL || 0} KL
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Duration:</span>
                        <span className="font-semibold text-slate-800">
                          {analysis?.averageSupplyDurationMinutes !== null
                            ? `${analysis.averageSupplyDurationMinutes} mins`
                            : 'No Data'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Flow Rate:</span>
                        <span className="font-mono text-teal-700 font-semibold">
                          {analysis?.averageFlowRateLpm !== null
                            ? `${analysis.averageFlowRateLpm} L/min`
                            : 'Sensor Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Pressure:</span>
                        <span className="font-mono text-slate-700">
                          {analysis?.averagePressureBar !== null
                            ? `${analysis.averagePressureBar} Bar`
                            : 'Gauge Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Interruptions:</span>
                        <Badge
                          variant={analysis?.interruptionCount > 0 ? 'amber' : 'emerald'}
                          size="sm"
                        >
                          {analysis?.interruptionCount || 0} Logs
                        </Badge>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">Last Supply:</span>
                        <span className="font-semibold text-slate-800">
                          {analysis?.daysSinceLastRecordedSupply !== null
                            ? `${analysis.daysSinceLastRecordedSupply}d ago`
                            : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>Households: <strong>{sec.householdsCount}</strong></p>
                      <p>Tank: <strong>{(sec.tankCapacityLiters / 1000).toFixed(0)} KL</strong></p>
                      <p className="truncate">Operator: {sec.pumpOperatorName}</p>
                    </div>
                  </CardContent>
                  </Card>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Comparative Volume Bar Visualization */}
          {sectionAnalyses.length > 0 && (
            <Card>
              <CardHeader
                title="5-Section Cumulative Supplied Volume Comparison (KL)"
                subtitle="Proportional distribution equity across Sections 1–5 from real pumping records"
                action={<BarChart className="w-4 h-4 text-teal-600" />}
              />
              <CardContent className="space-y-3">
                {(() => {
                  const maxVol = Math.max(1, ...sectionAnalyses.map((s) => s.totalMeasuredVolumeKL || 0));
                  return sectionAnalyses.map((a) => {
                    const sec = sections.find((s) => s.id === a.sectionId);
                    const pct = Math.round(((a.totalMeasuredVolumeKL || 0) / maxVol) * 100);
                    return (
                      <div key={a.sectionId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-navy-950">
                            Section {a.sectionId} • {sec?.name?.split(' - ')[1] || ''}
                          </span>
                          <span className="font-mono font-bold text-teal-700">
                            <AnimatedCounter value={Math.round(a.totalMeasuredVolumeKL || 0)} suffix=" KL" />
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-navy-800 to-teal-500 transition-all duration-1000"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          )}

          {/* Comparative Analytical Table */}
          <Card>
            <CardHeader
              title="Verified Cross-Section Metrics Table"
              subtitle="Explicitly identifies uninstalled sensors separately from zero measurement values"
            />
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Section Zone</th>
                    <th className="py-3 px-4">Households</th>
                    <th className="py-3 px-4">Total Supplied Volume</th>
                    <th className="py-3 px-4">Avg Duration</th>
                    <th className="py-3 px-4">Avg Flow Rate (Lpm)</th>
                    <th className="py-3 px-4">Avg Pressure (Bar)</th>
                    <th className="py-3 px-4">Interruption Rate</th>
                    <th className="py-3 px-4">Telemetry Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sectionAnalyses.map((a) => {
                    const sec = sections.find((s) => s.id === a.sectionId);
                    return (
                      <tr key={a.sectionId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <strong className="text-navy-950">Section {a.sectionId}</strong>
                          <p className="text-[11px] text-slate-500">{sec?.name.split(' - ')[1]}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{sec?.householdsCount}</td>
                        <td className="py-3 px-4 font-mono font-bold text-navy-950">
                          {a.totalMeasuredVolumeKL} KL
                        </td>
                        <td className="py-3 px-4">
                          {a.averageSupplyDurationMinutes !== null
                            ? `${a.averageSupplyDurationMinutes} mins`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {a.averageFlowRateLpm !== null ? (
                            <span className="text-teal-700 font-semibold">{a.averageFlowRateLpm} L/min</span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                              Sensor Missing
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {a.averagePressureBar !== null ? (
                            <span>{a.averagePressureBar} Bar</span>
                          ) : (
                            <span className="text-slate-400 italic">Unrecorded</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={a.interruptionRatePercentage > 0 ? 'amber' : 'emerald'} size="sm">
                            {a.interruptionRatePercentage}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {a.hasMissingMeasurements ? (
                            <span className="text-[11px] text-amber-700 font-medium">Partial Sensors</span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Fully Metered
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SCHEDULES & RECENT LOGS */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* 5-Section Configured Daily Schedules Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                Configured Section Supply Timetables (Sections 1–5)
              </h2>
              <span className="text-xs text-slate-500">Daily Overhead Tank Release Windows</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {sections.map((sec) => {
                const sch = schedules.find((s) => s.sectionId === sec.id);
                return (
                  <Card key={sec.id} className="border-slate-200 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-navy-950">Section {sec.id}</span>
                      <Badge variant={sch?.isActive !== false ? 'emerald' : 'amber'} size="sm">
                        {sch?.isActive !== false ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{sec.name.split(' - ')[1] || sec.name}</p>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono text-navy-950">
                      <p className="font-bold">
                        {sch ? `${sch.scheduledStartTime} – ${sch.scheduledEndTime}` : '06:00 – 08:00'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {sch ? `${sch.durationMinutes} min • Target ${sch.targetQuantityKL} KL` : 'Default Window'}
                      </p>
                    </div>
                    {isOfficer && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenEditSchedule(sec.id)}
                        icon={<Sliders className="w-3 h-3" />}
                      >
                        Edit Schedule
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              Water Pumping & Supply Records Log
            </h2>
            {isOfficer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLogModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Log Supply Operation
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Supply Window</th>
                    <th className="py-3 px-4">Supplied KL</th>
                    <th className="py-3 px-4">Flow & Pressure</th>
                    <th className="py-3 px-4">Interruption</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{r.supplyDate}</td>
                      <td className="py-3 px-4 font-bold text-navy-950">Section {r.sectionId}</td>
                      <td className="py-3 px-4 font-mono">
                        {r.actualStartTime} - {r.actualEndTime} ({r.actualDurationMinutes}m)
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-800">{r.quantitySuppliedKL} KL</td>
                      <td className="py-3 px-4 font-mono">
                        {r.flowRateLpm ? `${r.flowRateLpm} Lpm` : '—'} / {r.pressureBar ? `${r.pressureBar} Bar` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {r.interruptionOccurred ? (
                          <span className="text-amber-800 font-semibold text-[11px] block">
                            ⚠️ {r.interruptionReason || 'Interrupted'}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px]">Uninterrupted</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={r.status === 'COMPLETED' ? 'emerald' : 'amber'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.recordedByUser?.name || 'Water Operator'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: WATER QUALITY LAB TESTING */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                Laboratory Water Quality Testing & Potability Certification
              </h2>
              <p className="text-xs text-slate-500">
                Individual chemical & microbial testing matrix evaluated against BIS 10500:2012 permissible standards
              </p>
            </div>
            {isOfficer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setQualityModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Upload Lab Test Report
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {qualityReports.map((r) => {
              const assessment = r.assessment;
              return (
                <Card key={r.id} className="border-slate-200">
                  <CardHeader
                    title={`Section ${r.sectionId} — ${r.sampleLocation}`}
                    subtitle={`Tested on ${r.testDate} by ${r.testedBy} (${r.labName})`}
                    action={
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            r.verificationStatus === 'VERIFIED'
                              ? 'emerald'
                              : r.verificationStatus === 'PENDING_VERIFICATION'
                              ? 'amber'
                              : 'rose'
                          }
                        >
                          {r.verificationStatus}
                        </Badge>
                        <Badge
                          variant={
                            assessment?.overallPotabilityStatus === 'POTABLE_CONFIRMED'
                              ? 'emerald'
                              : assessment?.overallPotabilityStatus === 'NON_COMPLIANT'
                              ? 'rose'
                              : 'amber'
                          }
                        >
                          {assessment?.overallPotabilityStatus?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    }
                  />
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <strong className="text-slate-800">Quality Assessment Result:</strong>{' '}
                      <span className="text-slate-700">{assessment?.assessmentSummary}</span>
                    </div>

                    {/* 5 Required Parameters Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                      {/* pH */}
                      <div className="p-3 rounded-lg border bg-white border-slate-200">
                        <p className="text-slate-500 font-semibold">pH Value</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.phValue !== null ? r.phValue : 'Not Tested'}
                        </p>
                        <p className="text-[10px] text-slate-400">Spec: 6.5 - 8.5</p>
                        <Badge
                          variant={assessment?.parameters?.ph?.isSafe ? 'emerald' : 'amber'}
                          size="sm"
                          className="mt-1"
                        >
                          {assessment?.parameters?.ph?.statusText}
                        </Badge>
                      </div>

                      {/* TDS */}
                      <div className="p-3 rounded-lg border bg-white border-slate-200">
                        <p className="text-slate-500 font-semibold">TDS (ppm)</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.tdsPpm !== null ? `${r.tdsPpm} ppm` : 'Not Tested'}
                        </p>
                        <p className="text-[10px] text-slate-400">Spec: ≤ 500 ppm</p>
                        <Badge
                          variant={assessment?.parameters?.tds?.isSafe ? 'emerald' : 'amber'}
                          size="sm"
                          className="mt-1"
                        >
                          {assessment?.parameters?.tds?.statusText}
                        </Badge>
                      </div>

                      {/* Fluoride */}
                      <div className="p-3 rounded-lg border bg-white border-slate-200">
                        <p className="text-slate-500 font-semibold">Fluoride (mg/L)</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.fluorideMgL !== null ? `${r.fluorideMgL} mg/L` : 'Not Tested'}
                        </p>
                        <p className="text-[10px] text-slate-400">Spec: ≤ 1.0 mg/L</p>
                        <Badge
                          variant={assessment?.parameters?.fluoride?.isSafe ? 'emerald' : 'rose'}
                          size="sm"
                          className="mt-1"
                        >
                          {assessment?.parameters?.fluoride?.statusText}
                        </Badge>
                      </div>

                      {/* Sodium */}
                      <div className="p-3 rounded-lg border bg-white border-slate-200">
                        <p className="text-slate-500 font-semibold">Sodium (mg/L)</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.sodiumMgL !== null ? `${r.sodiumMgL} mg/L` : 'Not Tested'}
                        </p>
                        <p className="text-[10px] text-slate-400">Spec: ≤ 200 mg/L</p>
                        <Badge
                          variant={assessment?.parameters?.sodium?.isSafe ? 'emerald' : 'amber'}
                          size="sm"
                          className="mt-1"
                        >
                          {assessment?.parameters?.sodium?.statusText}
                        </Badge>
                      </div>

                      {/* Microbial Coliform */}
                      <div className="p-3 rounded-lg border bg-white border-slate-200">
                        <p className="text-slate-500 font-semibold">Microbial Coliform</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.microbialColiformColonies !== null
                            ? `${r.microbialColiformColonies} CFU/100ml`
                            : 'Not Tested'}
                        </p>
                        <p className="text-[10px] text-slate-400">Spec: 0 CFU/100ml</p>
                        <Badge
                          variant={assessment?.parameters?.microbial?.isSafe ? 'emerald' : 'rose'}
                          size="sm"
                          className="mt-1"
                        >
                          {assessment?.parameters?.microbial?.statusText}
                        </Badge>
                      </div>
                    </div>

                    {r.labReportFileUrl && (
                      <div className="flex items-center gap-2 text-xs pt-1">
                        <a
                          href={r.labReportFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-semibold hover:bg-teal-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Attached Laboratory Document
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {isOfficer && r.verificationStatus === 'PENDING_VERIFICATION' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 mr-2">Officer Action:</span>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleVerifyReport(r.id, 'VERIFIED')}
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                        >
                          Certify & Verify Lab Report
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleVerifyReport(r.id, 'REJECTED')}
                        >
                          Reject Report
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: INTERRUPTION REPORTS & COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              Household Water Supply & Pressure Complaints
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setComplaintModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Report Supply Interruption
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {complaints.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Issue Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Affected Families</th>
                      <th className="py-3 px-4">Status</th>
                      {isOfficer && <th className="py-3 px-4 text-right">Officer Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-navy-950">Section {c.sectionId}</td>
                        <td className="py-3 px-4">
                          <Badge variant="amber" size="sm">
                            {c.issueType.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <p>{c.description}</p>
                          {c.adminNotes && (
                            <p className="text-[11px] text-teal-700 font-medium mt-0.5">Note: {c.adminNotes}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{c.affectedHouseholds}</td>
                        <td className="py-3 px-4">
                          <Badge variant={c.status === 'RESOLVED' ? 'emerald' : c.status === 'IN_PROGRESS' ? 'teal' : 'amber'}>
                            {c.status}
                          </Badge>
                        </td>
                        {isOfficer && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {c.status !== 'IN_PROGRESS' && c.status !== 'RESOLVED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  isLoading={complaintActionId === c.id}
                                  onClick={() => handleUpdateComplaintStatus(c.id, 'IN_PROGRESS')}
                                >
                                  Dispatch Crew
                                </Button>
                              )}
                              {c.status !== 'RESOLVED' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  isLoading={complaintActionId === c.id}
                                  onClick={() => handleUpdateComplaintStatus(c.id, 'RESOLVED')}
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-8 text-center text-xs text-slate-500">No active water supply complaints logged.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: LOG SUPPLY OPERATION */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Log Section Water Supply Record"
        subtitle="Records actual pumping duration, quantity, and telemetry"
      >
        <form onSubmit={handleLogSupply} className="space-y-4">
          <Select
            label="Kantheru Section"
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={logSectionId}
            onChange={(e) => setLogSectionId(Number(e.target.value))}
          />

          <Input
            label="Supply Date"
            type="date"
            required
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              required
              value={logStart}
              onChange={(e) => setLogStart(e.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              required
              value={logEnd}
              onChange={(e) => setLogEnd(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Actual Duration (Minutes)"
              type="number"
              required
              value={logDuration}
              onChange={(e) => setLogDuration(e.target.value)}
            />
            <Input
              label="Quantity Supplied (KiloLiters)"
              type="number"
              step="0.1"
              required
              value={logQty}
              onChange={(e) => setLogQty(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Flow Rate (Liters / Minute)"
              type="number"
              value={logFlow}
              onChange={(e) => setLogFlow(e.target.value)}
              placeholder="Leave blank if sensor missing"
            />
            <Input
              label="Pressure (Bar)"
              type="number"
              step="0.1"
              value={logPressure}
              onChange={(e) => setLogPressure(e.target.value)}
              placeholder="Leave blank if gauge missing"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={logInterrupted}
              onChange={(e) => setLogInterrupted(e.target.checked)}
            />
            <span>Pumping Interruption Occurred during this shift</span>
          </label>

          {logInterrupted && (
            <Input
              label="Interruption Reason"
              required
              value={logReason}
              onChange={(e) => setLogReason(e.target.value)}
              placeholder="e.g. 3-phase power tripping, motor coil overheating, pipeline fracture..."
            />
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={logSubmitting}>
              Save Supply Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: UPLOAD LAB REPORT */}
      <Modal
        isOpen={qualityModalOpen}
        onClose={() => setQualityModalOpen(false)}
        title="Upload Laboratory Water Test Report"
        subtitle="Mandatory 5-parameter chemical and biological testing results"
      >
        <form onSubmit={handleAddQualityReport} className="space-y-4">
          <Select
            label="Section Zone"
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={qSectionId}
            onChange={(e) => setQSectionId(Number(e.target.value))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sample Collection Date"
              type="date"
              required
              value={qTestDate}
              onChange={(e) => setQTestDate(e.target.value)}
            />
            <Input
              label="Sample Point Location"
              required
              value={qLocation}
              onChange={(e) => setQLocation(e.target.value)}
            />
          </div>

          <Input
            label="Testing Laboratory Name"
            required
            value={qLab}
            onChange={(e) => setQLab(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="pH (6.5 - 8.5)"
              type="number"
              step="0.01"
              value={qPh}
              onChange={(e) => setQPh(e.target.value)}
            />
            <Input
              label="TDS (≤ 500 ppm)"
              type="number"
              value={qTds}
              onChange={(e) => setQTds(e.target.value)}
            />
            <Input
              label="Fluoride (≤ 1.0 mg/L)"
              type="number"
              step="0.01"
              value={qFluoride}
              onChange={(e) => setQFluoride(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="Sodium (≤ 200 mg/L)"
              type="number"
              step="0.1"
              value={qSodium}
              onChange={(e) => setQSodium(e.target.value)}
            />
            <Input
              label="Coliform (0 CFU/100ml)"
              type="number"
              value={qColiform}
              onChange={(e) => setQColiform(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Attach Lab Certificate Scan / Document (Optional)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                {qReportFileName || 'Choose File (PDF/Image)'}
                <input type="file" accept="image/*,.pdf" onChange={handleLabFileSelect} className="hidden" />
              </label>
              {qReportFileUrl && <Badge variant="emerald" size="sm">Attached</Badge>}
            </div>
            <Input
              label="Or Direct Lab Report Document URL"
              type="url"
              value={qReportFileUrl.startsWith('data:') ? '' : qReportFileUrl}
              onChange={(e) => {
                setQReportFileName('');
                setQReportFileUrl(e.target.value);
              }}
              placeholder="https://..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setQualityModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={qSubmitting}>
              Submit Lab Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: EDIT SECTION SCHEDULE */}
      <Modal
        isOpen={schedModalOpen}
        onClose={() => setSchedModalOpen(false)}
        title={`Configure Section ${schedSectionId} Supply Schedule`}
        subtitle="Updates official Kantheru Panchayat pumping schedule & target quota"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scheduled Start Time (HH:MM)"
              type="time"
              required
              value={schedStart}
              onChange={(e) => setSchedStart(e.target.value)}
            />
            <Input
              label="Scheduled End Time (HH:MM)"
              type="time"
              required
              value={schedEnd}
              onChange={(e) => setSchedEnd(e.target.value)}
            />
          </div>

          <Input
            label="Target Supply Volume (KL)"
            type="number"
            min="5"
            step="1"
            required
            value={schedTargetKL}
            onChange={(e) => setSchedTargetKL(e.target.value)}
          />

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={schedActive}
              onChange={(e) => setSchedActive(e.target.checked)}
              className="rounded text-teal-600"
            />
            <span>Schedule is currently active for Section {schedSectionId}</span>
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSchedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={schedSaving}>
              Save Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: FILE WATER COMPLAINT */}
      <Modal
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        title="Report Water Supply Issue"
        subtitle="Direct notice to Section Pump Operator & Panchayat Water Officer"
      >
        <form onSubmit={handleFileComplaint} className="space-y-4">
          <Select
            label="Affected Kantheru Section"
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={cSectionId}
            onChange={(e) => setCSectionId(Number(e.target.value))}
          />

          <Select
            label="Type of Interruption"
            options={[
              { value: 'LOW_PRESSURE', label: 'Extremely Low Pressure (Tail-end starvation)' },
              { value: 'SUPPLY_INTERRUPTION', label: 'Complete Supply Outage / No Water' },
              { value: 'CONTAMINATED_WATER', label: 'Muddy / Discolored Water' },
              { value: 'ODOR_TASTE', label: 'Peculiar Chemical / Organic Odor' },
              { value: 'PIPELINE_LEAKAGE', label: 'Bursted / Leaking Distribution Main' },
            ]}
            value={cType}
            onChange={(e) => setCType(e.target.value)}
          />

          <Input
            label="Number of Affected Households"
            type="number"
            min="1"
            value={cHouseholds}
            onChange={(e) => setCHouseholds(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Specific Street & Issue Description
            </label>
            <textarea
              required
              rows={3}
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              placeholder="e.g. Water tap has only been dripping for the past 2 days in BC Colony lane 3..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setComplaintModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={cSubmitting}>
              Submit Complaint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
