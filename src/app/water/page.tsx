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
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function WaterPage() {
  const { lang, t, tx, ts } = useLanguage();
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
      alert(tx('Please attach a document/image under 1.5 MB.', 'దయచేసి 1.5 MB కంటే తక్కువ డాక్యుమెంట్/చిత్రాన్ని జత చేయండి.'));
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
                <h1 key={lang} className="text-2xl font-extrabold text-navy-950 font-display animate-lang-swap">
                  {t('page.water.title')}
                </h1>
                <Badge variant="teal">{t('mod4.badge')}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t('page.water.sub')}</p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'comparison' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx('5-Section Comparison', '5-విభాగాల పోలిక')}
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sections' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx(`Schedules & Supply Logs (${records.length})`, `షెడ్యూళ్ళు & సరఫరా లాగ్‌లు (${records.length})`)}
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'quality' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx(`Lab Water Quality (${qualityReports.length})`, `ల్యాబ్ నీటి నాణ్యత (${qualityReports.length})`)}
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'complaints' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx(`Interruption Reports (${complaints.length})`, `సరఫరా అంతరాయ ఫిర్యాదులు (${complaints.length})`)}
          </button>
        </div>
      </div>

      {/* Non-inferential strict standard banner */}
      <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-teal-950">{tx('Scientific Quality Assurance Protocol:', 'శాస్త్రీయ నాణ్యతా హామీ నిబంధన:')}</p>
          <p className="mt-0.5 text-teal-800 leading-relaxed">
            {tx(
              'HEALTHBRIDGE 360 strictly adheres to non-inferential water data standards. Sodium and Fluoride concentrations are NEVER inferred from TDS. Water is NEVER declared potable from incomplete testing data. All 5 parameters (Sodium, Fluoride, pH, TDS, Microbial Coliform) must be verified before safe drinking status is certified.',
              'HEALTHBRIDGE 360 ఖచ్చితమైన శాస్త్రీయ నీటి పరీక్షా ప్రమాణాలను పాటిస్తుంది. సోడియం మరియు ఫ్లోరైడ్ స్థాయిలను TDS నుండి ఎన్నడూ అంచనా వేయబడదు. 5 పారామీటర్లు (సోడియం, ఫ్లోరైడ్, pH, TDS, కోలిఫామ్) నిర్ధారించబడిన తర్వాతే తాగునీటి సురక్షిత సర్టిఫికెట్ ఇవ్వబడుతుంది.'
            )}
          </p>
        </div>
      </div>

      {/* TAB 1: 5-SECTION COMPARISON DASHBOARD */}
      {activeTab === 'comparison' && (
        <div className="space-y-6 animate-tab-switch">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                {tx('Five-Section Water Distribution Comparison', 'ఐదు విభాగాల నీటి పంపిణీ పోలిక')}
              </h2>
              <p className="text-xs text-slate-500">
                {tx(
                  'Calculated strictly from real telemetry records using the Water Distribution Analysis Algorithm',
                  'వాస్తవ టెలిమెట్రీ రికార్డుల ఆధారంగా నీటి పంపిణీ విశ్లేషణ అల్గారిథమ్ ద్వారా లెక్కించబడింది'
                )}
              </p>
            </div>
            {isOfficer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLogModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {tx('Log Supply Record', 'సరఫరా రికార్డు నమోదు')}
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
                    title={tx(`Section ${sec.id}`, `విభాగం ${sec.id}`)}
                    subtitle={sec.name.split(' - ')[1] || sec.name}
                    className="p-4"
                  />
                  <CardContent className="p-4 space-y-3 pt-0 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Total Volume:', 'మొత్తం పరిమాణం:')}</span>
                        <strong className="text-navy-950 font-mono">
                          {analysis?.totalMeasuredVolumeKL || 0} KL
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Avg Duration:', 'సగటు వ్యవధి:')}</span>
                        <span className="font-semibold text-slate-800">
                          {analysis?.averageSupplyDurationMinutes !== null
                            ? `${analysis.averageSupplyDurationMinutes} ${tx('mins', 'నిమి')}`
                            : tx('No Data', 'డేటా లేదు')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Avg Flow Rate:', 'సగటు ప్రవాహం:')}</span>
                        <span className="font-mono text-teal-700 font-semibold">
                          {analysis?.averageFlowRateLpm !== null
                            ? `${analysis.averageFlowRateLpm} L/min`
                            : tx('Sensor Missing', 'సెన్సార్ లేదు')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Avg Pressure:', 'సగటు ఒత్తిడి:')}</span>
                        <span className="font-mono text-slate-700">
                          {analysis?.averagePressureBar !== null
                            ? `${analysis.averagePressureBar} Bar`
                            : tx('Gauge Missing', 'గేజ్ లేదు')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Interruptions:', 'అంతరాయాలు:')}</span>
                        <Badge
                          variant={analysis?.interruptionCount > 0 ? 'amber' : 'emerald'}
                          size="sm"
                        >
                          {analysis?.interruptionCount || 0} {tx('Logs', 'లాగ్‌లు')}
                        </Badge>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">{tx('Last Supply:', 'చివరి సరఫరా:')}</span>
                        <span className="font-semibold text-slate-800">
                          {analysis?.daysSinceLastRecordedSupply !== null
                            ? `${analysis.daysSinceLastRecordedSupply}${tx('d ago', 'రో. క్రితం')}`
                            : tx('Pending', 'పెండింగ్')}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>{tx('Households:', 'కుటుంబాలు:')} <strong>{sec.householdsCount}</strong></p>
                      <p>{tx('Tank:', 'ట్యాంక్:')} <strong>{(sec.tankCapacityLiters / 1000).toFixed(0)} KL</strong></p>
                      <p className="truncate">{tx('Operator:', 'ఆపరేటర్:')} {sec.pumpOperatorName}</p>
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
                title={tx('5-Section Cumulative Supplied Volume Comparison (KL)', '5-విభాగాల మొత్తం సరఫరా పరిమాణం పోలిక (KL)')}
                subtitle={tx('Proportional distribution equity across Sections 1–5 from real pumping records', 'వాస్తవ పంపింగ్ రికార్డుల నుండి 1–5 విభాగాలలో సమాన నీటి పంపిణీ')}
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
                            {tx(`Section ${a.sectionId}`, `విభాగం ${a.sectionId}`)} • {sec?.name?.split(' - ')[1] || ''}
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
              title={tx('Verified Cross-Section Metrics Table', 'ధృవీకరించబడిన విభాగాల వారీ మెట్రిక్స్ పట్టిక')}
              subtitle={tx('Explicitly identifies uninstalled sensors separately from zero measurement values', 'అమర్చని సెన్సార్లను సున్నా విలువల నుండి స్పష్టంగా వేరు చేస్తుంది')}
            />
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{tx('Section Zone', 'విభాగం జోన్')}</th>
                    <th className="py-3 px-4">{tx('Households', 'కుటుంబాలు')}</th>
                    <th className="py-3 px-4">{tx('Total Supplied Volume', 'మొత్తం సరఫరా (KL)')}</th>
                    <th className="py-3 px-4">{tx('Avg Duration', 'సగటు వ్యవధి')}</th>
                    <th className="py-3 px-4">{tx('Avg Flow Rate (Lpm)', 'సగటు ప్రవాహం (Lpm)')}</th>
                    <th className="py-3 px-4">{tx('Avg Pressure (Bar)', 'సగటు ఒత్తిడి (Bar)')}</th>
                    <th className="py-3 px-4">{tx('Interruption Rate', 'అంతరాయ రేటు')}</th>
                    <th className="py-3 px-4">{tx('Telemetry Quality', 'టెలిమెట్రీ నాణ్యత')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sectionAnalyses.map((a) => {
                    const sec = sections.find((s) => s.id === a.sectionId);
                    return (
                      <tr key={a.sectionId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <strong className="text-navy-950">{tx(`Section ${a.sectionId}`, `విభాగం ${a.sectionId}`)}</strong>
                          <p className="text-[11px] text-slate-500">{sec?.name.split(' - ')[1]}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{sec?.householdsCount}</td>
                        <td className="py-3 px-4 font-mono font-bold text-navy-950">
                          {a.totalMeasuredVolumeKL} KL
                        </td>
                        <td className="py-3 px-4">
                          {a.averageSupplyDurationMinutes !== null
                            ? `${a.averageSupplyDurationMinutes} ${tx('mins', 'నిమి')}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {a.averageFlowRateLpm !== null ? (
                            <span className="text-teal-700 font-semibold">{a.averageFlowRateLpm} L/min</span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                              {tx('Sensor Missing', 'సెన్సార్ లేదు')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {a.averagePressureBar !== null ? (
                            <span>{a.averagePressureBar} Bar</span>
                          ) : (
                            <span className="text-slate-400 italic">{tx('Unrecorded', 'నమోదు కాలేదు')}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={a.interruptionRatePercentage > 0 ? 'amber' : 'emerald'} size="sm">
                            {a.interruptionRatePercentage}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {a.hasMissingMeasurements ? (
                            <span className="text-[11px] text-amber-700 font-medium">{tx('Partial Sensors', 'పాక్షిక సెన్సార్లు')}</span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {tx('Fully Metered', 'పూర్తిగా మీటర్ చేయబడింది')}
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
        <div className="space-y-6 animate-tab-switch">
          {/* 5-Section Configured Daily Schedules Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                {tx('Configured Section Supply Timetables (Sections 1–5)', 'నిర్ణయించిన విభాగాల నీటి సరఫరా సమయాలు (విభాగాలు 1–5)')}
              </h2>
              <span className="text-xs text-slate-500">{tx('Daily Overhead Tank Release Windows', 'రోజువారీ ఓవర్‌హెడ్ ట్యాంక్ విడుదల సమయాలు')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {sections.map((sec) => {
                const sch = schedules.find((s) => s.sectionId === sec.id);
                return (
                  <Card key={sec.id} className="border-slate-200 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-navy-950">{tx(`Section ${sec.id}`, `విభాగం ${sec.id}`)}</span>
                      <Badge variant={sch?.isActive !== false ? 'emerald' : 'amber'} size="sm">
                        {sch?.isActive !== false ? tx('Active', 'సక్రియం') : tx('Paused', 'నిలిపివేత')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{sec.name.split(' - ')[1] || sec.name}</p>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono text-navy-950">
                      <p className="font-bold">
                        {sch ? `${sch.scheduledStartTime} – ${sch.scheduledEndTime}` : '06:00 – 08:00'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {sch ? `${sch.durationMinutes} ${tx('min • Target', 'నిమి • లక్ష్యం')} ${sch.targetQuantityKL} KL` : tx('Default Window', 'సాధారణ సమయం')}
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
                        {tx('Edit Schedule', 'షెడ్యూల్ మార్చండి')}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              {tx('Water Pumping & Supply Records Log', 'నీటి పంపింగ్ & సరఫరా రికార్డుల లాగ్')}
            </h2>
            {isOfficer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLogModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {tx('Log Supply Operation', 'సరఫరా నమోదు చేయండి')}
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{tx('Date', 'తేదీ')}</th>
                    <th className="py-3 px-4">{tx('Section', 'విభాగం')}</th>
                    <th className="py-3 px-4">{tx('Supply Window', 'సరఫరా సమయం')}</th>
                    <th className="py-3 px-4">{tx('Supplied KL', 'సరఫరా (KL)')}</th>
                    <th className="py-3 px-4">{tx('Flow & Pressure', 'ప్రవాహం & ఒత్తిడి')}</th>
                    <th className="py-3 px-4">{tx('Interruption', 'అంతరాయం')}</th>
                    <th className="py-3 px-4">{tx('Status', 'స్థితి')}</th>
                    <th className="py-3 px-4">{tx('Logged By', 'నమోదు చేసినవారు')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{r.supplyDate}</td>
                      <td className="py-3 px-4 font-bold text-navy-950">{tx(`Section ${r.sectionId}`, `విభాగం ${r.sectionId}`)}</td>
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
                            ⚠️ {r.interruptionReason || tx('Interrupted', 'అంతరాయం')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px]">{tx('Uninterrupted', 'నిరంతరాయం')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={r.status === 'COMPLETED' ? 'emerald' : 'amber'}>
                          {ts(r.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.recordedByUser?.name || tx('Water Operator', 'వాటర్ ఆపరేటర్')}</td>
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
        <div className="space-y-6 animate-tab-switch">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                {tx('Laboratory Water Quality Testing & Potability Certification', 'ప్రయోగశాల నీటి నాణ్యత పరీక్ష & త్రాగునీటి ధృవీకరణ')}
              </h2>
              <p className="text-xs text-slate-500">
                {tx(
                  'Individual chemical & microbial testing matrix evaluated against BIS 10500:2012 permissible standards',
                  'BIS 10500:2012 ప్రమాణాల ప్రకారం రసాయన & సూక్ష్మజీవ పరీక్షా ఫలితాలు'
                )}
              </p>
            </div>
            {isOfficer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setQualityModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {tx('Upload Lab Test Report', 'ల్యాబ్ పరీక్ష నివేదిక అప్‌లోడ్')}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {qualityReports.map((r) => {
              const assessment = r.assessment;
              return (
                <Card key={r.id} className="border-slate-200">
                  <CardHeader
                    title={`${tx(`Section ${r.sectionId}`, `విభాగం ${r.sectionId}`)} — ${r.sampleLocation}`}
                    subtitle={`${tx('Tested on', 'పరీక్ష తేదీ')} ${r.testDate} ${tx('by', 'ద్వారా')} ${r.testedBy} (${r.labName})`}
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
                          {ts(r.verificationStatus)}
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
                          {ts(assessment?.overallPotabilityStatus || '')}
                        </Badge>
                      </div>
                    }
                  />
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <strong className="text-slate-800">{tx('Quality Assessment Result:', 'నాణ్యతా అంచనా ఫలితం:')}</strong>{' '}
                      <span className="text-slate-700">{assessment?.assessmentSummary}</span>
                    </div>

                    {/* 5 Required Parameters Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                      {/* pH */}
                      <div className="p-3 rounded-lg border bg-white border-slate-200">
                        <p className="text-slate-500 font-semibold">{tx('pH Value', 'pH విలువ')}</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.phValue !== null ? r.phValue : tx('Not Tested', 'పరీక్షించబడలేదు')}
                        </p>
                        <p className="text-[10px] text-slate-400">{tx('Spec:', 'ప్రమాణం:')} 6.5 - 8.5</p>
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
                          {r.tdsPpm !== null ? `${r.tdsPpm} ppm` : tx('Not Tested', 'పరీక్షించబడలేదు')}
                        </p>
                        <p className="text-[10px] text-slate-400">{tx('Spec:', 'ప్రమాణం:')} ≤ 500 ppm</p>
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
                        <p className="text-slate-500 font-semibold">{tx('Fluoride (mg/L)', 'ఫ్లోరైడ్ (mg/L)')}</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.fluorideMgL !== null ? `${r.fluorideMgL} mg/L` : tx('Not Tested', 'పరీక్షించబడలేదు')}
                        </p>
                        <p className="text-[10px] text-slate-400">{tx('Spec:', 'ప్రమాణం:')} ≤ 1.0 mg/L</p>
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
                        <p className="text-slate-500 font-semibold">{tx('Sodium (mg/L)', 'సోడియం (mg/L)')}</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.sodiumMgL !== null ? `${r.sodiumMgL} mg/L` : tx('Not Tested', 'పరీక్షించబడలేదు')}
                        </p>
                        <p className="text-[10px] text-slate-400">{tx('Spec:', 'ప్రమాణం:')} ≤ 200 mg/L</p>
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
                        <p className="text-slate-500 font-semibold">{tx('Microbial Coliform', 'కోలిఫామ్ బ్యాక్టీరియా')}</p>
                        <p className="text-lg font-bold text-navy-950 mt-1">
                          {r.microbialColiformColonies !== null
                            ? `${r.microbialColiformColonies} CFU/100ml`
                            : tx('Not Tested', 'పరీక్షించబడలేదు')}
                        </p>
                        <p className="text-[10px] text-slate-400">{tx('Spec:', 'ప్రమాణం:')} 0 CFU/100ml</p>
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
                          {tx('View Attached Laboratory Document', 'జతచేసిన ల్యాబ్ డాక్యుమెంట్ చూడండి')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {isOfficer && r.verificationStatus === 'PENDING_VERIFICATION' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 mr-2">{tx('Officer Action:', 'అధికారి చర్య:')}</span>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleVerifyReport(r.id, 'VERIFIED')}
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                        >
                          {tx('Certify & Verify Lab Report', 'ధృవీకరించండి')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleVerifyReport(r.id, 'REJECTED')}
                        >
                          {tx('Reject Report', 'తిరస్కరించండి')}
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
        <div className="space-y-6 animate-tab-switch">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              {tx('Household Water Supply & Pressure Complaints', 'గృహ నీటి సరఫరా & ఒత్తిడి ఫిర్యాదులు')}
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setComplaintModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              {tx('Report Supply Interruption', 'సరఫరా అంతరాయాన్ని నివేదించండి')}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {complaints.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">{tx('Date', 'తేదీ')}</th>
                      <th className="py-3 px-4">{tx('Section', 'విభాగం')}</th>
                      <th className="py-3 px-4">{tx('Issue Type', 'సమస్య రకం')}</th>
                      <th className="py-3 px-4">{tx('Description', 'వివరణ')}</th>
                      <th className="py-3 px-4">{tx('Affected Families', 'ప్రభావిత కుటుంబాలు')}</th>
                      <th className="py-3 px-4">{tx('Status', 'స్థితి')}</th>
                      {isOfficer && <th className="py-3 px-4 text-right">{tx('Officer Actions', 'అధికారి చర్యలు')}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-navy-950">{tx(`Section ${c.sectionId}`, `విభాగం ${c.sectionId}`)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="amber" size="sm">
                            {c.issueType.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <p>{c.description}</p>
                          {c.adminNotes && (
                            <p className="text-[11px] text-teal-700 font-medium mt-0.5">{tx('Note:', 'గమనిక:')} {c.adminNotes}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{c.affectedHouseholds}</td>
                        <td className="py-3 px-4">
                          <Badge variant={c.status === 'RESOLVED' ? 'emerald' : c.status === 'IN_PROGRESS' ? 'teal' : 'amber'}>
                            {ts(c.status)}
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
                                  {tx('Dispatch Crew', 'సిబ్బందిని పంపండి')}
                                </Button>
                              )}
                              {c.status !== 'RESOLVED' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  isLoading={complaintActionId === c.id}
                                  onClick={() => handleUpdateComplaintStatus(c.id, 'RESOLVED')}
                                >
                                  {tx('Resolve', 'పరిష్కరించండి')}
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
                <p className="p-8 text-center text-xs text-slate-500">{tx('No active water supply complaints logged.', 'సక్రియ నీటి సరఫరా ఫిర్యాదులు లేవు.')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: LOG SUPPLY OPERATION */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={tx('Log Section Water Supply Record', 'విభాగం నీటి సరఫరా రికార్డు నమోదు')}
        subtitle={tx('Records actual pumping duration, quantity, and telemetry', 'వాస్తవ పంపింగ్ సమయం, పరిమాణం మరియు టెలిమెట్రీ నమోదు చేస్తుంది')}
      >
        <form onSubmit={handleLogSupply} className="space-y-4">
          <Select
            label={tx('Kantheru Section', 'కాంతేరు విభాగం')}
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={logSectionId}
            onChange={(e) => setLogSectionId(Number(e.target.value))}
          />

          <Input
            label={tx('Supply Date', 'సరఫరా తేదీ')}
            type="date"
            required
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tx('Start Time', 'ప్రారంభ సమయం')}
              type="time"
              required
              value={logStart}
              onChange={(e) => setLogStart(e.target.value)}
            />
            <Input
              label={tx('End Time', 'ముగింపు సమయం')}
              type="time"
              required
              value={logEnd}
              onChange={(e) => setLogEnd(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tx('Actual Duration (Minutes)', 'వ్యవధి (నిమిషాలు)')}
              type="number"
              required
              value={logDuration}
              onChange={(e) => setLogDuration(e.target.value)}
            />
            <Input
              label={tx('Quantity Supplied (KiloLiters)', 'సరఫరా పరిమాణం (KL)')}
              type="number"
              step="0.1"
              required
              value={logQty}
              onChange={(e) => setLogQty(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tx('Flow Rate (Liters / Minute)', 'ప్రవాహ రేటు (LPM)')}
              type="number"
              value={logFlow}
              onChange={(e) => setLogFlow(e.target.value)}
              placeholder={tx('Leave blank if sensor missing', 'సెన్సార్ లేకుంటే ఖాళీగా ఉంచండి')}
            />
            <Input
              label={tx('Pressure (Bar)', 'ఒత్తిడి (Bar)')}
              type="number"
              step="0.1"
              value={logPressure}
              onChange={(e) => setLogPressure(e.target.value)}
              placeholder={tx('Leave blank if gauge missing', 'గేజ్ లేకుంటే ఖాళీగా ఉంచండి')}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={logInterrupted}
              onChange={(e) => setLogInterrupted(e.target.checked)}
            />
            <span>{tx('Pumping Interruption Occurred during this shift', 'ఈ షిఫ్ట్‌లో పంపింగ్ అంతరాయం ఏర్పడింది')}</span>
          </label>

          {logInterrupted && (
            <Input
              label={tx('Interruption Reason', 'అంతరాయానికి కారణం')}
              required
              value={logReason}
              onChange={(e) => setLogReason(e.target.value)}
              placeholder={tx('e.g. 3-phase power tripping, motor coil overheating, pipeline fracture...', 'ఉదా. పవర్ కట్, మోటార్ సమస్య, పైప్‌లైన్ లీకేజీ...')}
            />
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setLogModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={logSubmitting}>
              {tx('Save Supply Record', 'సరఫరా రికార్డు సేవ్ చేయండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: UPLOAD LAB REPORT */}
      <Modal
        isOpen={qualityModalOpen}
        onClose={() => setQualityModalOpen(false)}
        title={tx('Upload Laboratory Water Test Report', 'ల్యాబ్ నీటి పరీక్ష నివేదిక అప్‌లోడ్')}
        subtitle={tx('Mandatory 5-parameter chemical and biological testing results', 'తప్పనిసరి 5-పారామీటర్ల రసాయన & జీవ పరీక్ష ఫలితాలు')}
      >
        <form onSubmit={handleAddQualityReport} className="space-y-4">
          <Select
            label={tx('Section Zone', 'విభాగం జోన్')}
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={qSectionId}
            onChange={(e) => setQSectionId(Number(e.target.value))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tx('Sample Collection Date', 'నమూనా సేకరణ తేదీ')}
              type="date"
              required
              value={qTestDate}
              onChange={(e) => setQTestDate(e.target.value)}
            />
            <Input
              label={tx('Sample Point Location', 'నమూనా సేకరణ స్థలం')}
              required
              value={qLocation}
              onChange={(e) => setQLocation(e.target.value)}
            />
          </div>

          <Input
            label={tx('Testing Laboratory Name', 'పరీక్షా ప్రయోగశాల పేరు')}
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
              label={tx('Fluoride (≤ 1.0 mg/L)', 'ఫ్లోరైడ్ (≤ 1.0 mg/L)')}
              type="number"
              step="0.01"
              value={qFluoride}
              onChange={(e) => setQFluoride(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label={tx('Sodium (≤ 200 mg/L)', 'సోడియం (≤ 200 mg/L)')}
              type="number"
              step="0.1"
              value={qSodium}
              onChange={(e) => setQSodium(e.target.value)}
            />
            <Input
              label={tx('Coliform (0 CFU/100ml)', 'కోలిఫామ్ (0 CFU/100ml)')}
              type="number"
              value={qColiform}
              onChange={(e) => setQColiform(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              {tx('Attach Lab Certificate Scan / Document (Optional)', 'ల్యాబ్ సర్టిఫికెట్ స్కాన్ జతచేయండి (ఐచ్ఛికం)')}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                {qReportFileName || tx('Choose File (PDF/Image)', 'ఫైల్ ఎంచుకోండి (PDF/Image)')}
                <input type="file" accept="image/*,.pdf" onChange={handleLabFileSelect} className="hidden" />
              </label>
              {qReportFileUrl && <Badge variant="emerald" size="sm">{tx('Attached', 'జతచేయబడింది')}</Badge>}
            </div>
            <Input
              label={tx('Or Direct Lab Report Document URL', 'లేదా ల్యాబ్ నివేదిక URL')}
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
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={qSubmitting}>
              {tx('Submit Lab Report', 'నివేదికను సమర్పించండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: EDIT SECTION SCHEDULE */}
      <Modal
        isOpen={schedModalOpen}
        onClose={() => setSchedModalOpen(false)}
        title={tx(`Configure Section ${schedSectionId} Supply Schedule`, `విభాగం ${schedSectionId} సరఫరా షెడ్యూల్ సవరణ`)}
        subtitle={tx('Updates official Kantheru Panchayat pumping schedule & target quota', 'అధికారిక కాంతేరు పంచాయతీ పంపింగ్ షెడ్యూల్‌ను అప్‌డేట్ చేస్తుంది')}
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tx('Scheduled Start Time (HH:MM)', 'ప్రారంభ సమయం (HH:MM)')}
              type="time"
              required
              value={schedStart}
              onChange={(e) => setSchedStart(e.target.value)}
            />
            <Input
              label={tx('Scheduled End Time (HH:MM)', 'ముగింపు సమయం (HH:MM)')}
              type="time"
              required
              value={schedEnd}
              onChange={(e) => setSchedEnd(e.target.value)}
            />
          </div>

          <Input
            label={tx('Target Supply Volume (KL)', 'లక్ష్య సరఫరా పరిమాణం (KL)')}
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
            <span>{tx(`Schedule is currently active for Section ${schedSectionId}`, `విభాగం ${schedSectionId} కోసం ప్రస్తుతం షెడ్యూల్ సక్రియంగా ఉంది`)}</span>
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSchedModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={schedSaving}>
              {tx('Save Schedule', 'షెడ్యూల్ సేవ్ చేయండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: FILE WATER COMPLAINT */}
      <Modal
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        title={tx('Report Water Supply Issue', 'నీటి సరఫరా సమస్యను నివేదించండి')}
        subtitle={tx('Direct notice to Section Pump Operator & Panchayat Water Officer', 'విభాగం పంప్ ఆపరేటర్ & పంచాయతీ నీటి అధికారికి ప్రత్యక్ష నోటీసు')}
      >
        <form onSubmit={handleFileComplaint} className="space-y-4">
          <Select
            label={tx('Affected Kantheru Section', 'ప్రభావిత కాంతేరు విభాగం')}
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={cSectionId}
            onChange={(e) => setCSectionId(Number(e.target.value))}
          />

          <Select
            label={tx('Type of Interruption', 'అంతరాయ రకం')}
            options={[
              { value: 'LOW_PRESSURE', label: tx('Extremely Low Pressure (Tail-end starvation)', 'చాలా తక్కువ నీటి ఒత్తిడి') },
              { value: 'SUPPLY_INTERRUPTION', label: tx('Complete Supply Outage / No Water', 'సరఫరా పూర్తిగా నిలిచిపోయింది') },
              { value: 'CONTAMINATED_WATER', label: tx('Muddy / Discolored Water', 'మట్టి / కలుషిత నీరు') },
              { value: 'ODOR_TASTE', label: tx('Peculiar Chemical / Organic Odor', 'దుర్వాసన / రుచి మార్పు') },
              { value: 'PIPELINE_LEAKAGE', label: tx('Bursted / Leaking Distribution Main', 'పైప్‌లైన్ లీకేజీ / పగులు') },
            ]}
            value={cType}
            onChange={(e) => setCType(e.target.value)}
          />

          <Input
            label={tx('Number of Affected Households', 'ప్రభావిత కుటుంబాల సంఖ్య')}
            type="number"
            min="1"
            value={cHouseholds}
            onChange={(e) => setCHouseholds(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              {tx('Specific Street & Issue Description', 'వీధి & సమస్య వివరణ')}
            </label>
            <textarea
              required
              rows={3}
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              placeholder={tx('e.g. Water tap has only been dripping for the past 2 days in BC Colony lane 3...', 'ఉదా. గత 2 రోజులుగా BC కాలనీ వీధి 3లో కుళాయిలో నీరు చుక్కలు చుక్కలుగా మాత్రమే వస్తోంది...')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setComplaintModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={cSubmitting}>
              {tx('Submit Complaint', 'ఫిర్యాదు సమర్పించండి')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
