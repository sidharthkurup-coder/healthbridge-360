'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Wind,
  Flame,
  Droplets,
  ShieldAlert,
  Calculator,
  CheckCircle,
  Plus,
  Activity,
  MapPin,
  AlertTriangle,
  Truck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { AnimatedCounter, ScrollReveal } from '@/components/ui/Motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  calculateCpcbAqi,
  prioritizeAirIncident,
  type AqiCategory,
} from '@/lib/algorithms/air-quality';

interface ReadingItem {
  id: string;
  sectionId: number;
  monitoringPoint: string;
  recordedDate: string;
  pm25UgM3: number | null;
  pm10UgM3: number | null;
  no2UgM3: number | null;
  so2UgM3: number | null;
  coMgM3: number | null;
  calculatedAqi: number | null;
  aqiCategory: AqiCategory;
  dominantPollutant: string | null;
  notes: string | null;
  recordedByUser?: { name: string; role: string };
}

interface IncidentItem {
  id: string;
  sectionId: number;
  category: string;
  location: string;
  description: string;
  affectedHouseholds: number;
  isNearSensitiveFacility: boolean;
  severityScore: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedUnit: string;
  status: 'REPORTED' | 'WATER_SPRINKLER_DISPATCHED' | 'ENFORCEMENT_ACTION' | 'RESOLVED';
  actionNotes: string | null;
  createdAt: string;
  reporter?: { name: string; phone: string | null };
}

interface SectionSummary {
  sectionId: number;
  sectionName: string;
  latestReading: ReadingItem | null;
  assessment: ReturnType<typeof calculateCpcbAqi>;
  activeIncidentsCount: number;
}

const AQI_BADGE_MAP: Record<AqiCategory, 'emerald' | 'teal' | 'amber' | 'rose' | 'purple' | 'slate'> = {
  GOOD: 'emerald',
  SATISFACTORY: 'teal',
  MODERATE: 'amber',
  POOR: 'rose',
  VERY_POOR: 'purple',
  SEVERE: 'rose',
  INCOMPLETE: 'slate',
};

const AQI_BAR_COLOR: Record<AqiCategory, string> = {
  GOOD: 'bg-emerald-500',
  SATISFACTORY: 'bg-teal-500',
  MODERATE: 'bg-amber-500',
  POOR: 'bg-orange-500',
  VERY_POOR: 'bg-rose-600',
  SEVERE: 'bg-purple-700',
  INCOMPLETE: 'bg-slate-400',
};

const PRIORITY_BADGE_MAP: Record<string, 'slate' | 'sky' | 'amber' | 'rose'> = {
  LOW: 'slate',
  MEDIUM: 'sky',
  HIGH: 'amber',
  CRITICAL: 'rose',
};

const STATUS_BADGE_MAP: Record<string, 'amber' | 'sky' | 'purple' | 'emerald'> = {
  REPORTED: 'amber',
  WATER_SPRINKLER_DISPATCHED: 'sky',
  ENFORCEMENT_ACTION: 'purple',
  RESOLVED: 'emerald',
};

export default function AirQualityPage() {
  const { t, tx, ts } = useLanguage();

  const categoryOptions = useMemo(
    () => [
      { value: 'GARBAGE_PLASTIC_BURNING', label: tx('Garbage / Plastic Burning', 'చెత్త / ప్లాస్టిక్ దహనం') },
      { value: 'STUBBLE_CROP_BURNING', label: tx('Agricultural Stubble Burning', 'పంట వ్యర్థాల దహనం') },
      { value: 'INDUSTRIAL_BRICK_KILN_SMOKE', label: tx('Brick Kiln / Industrial Smoke', 'ఇటుక బట్టీ / పరిశ్రమల పొగ') },
      { value: 'CONSTRUCTION_ROAD_DUST', label: tx('Construction & Unpaved Road Dust', 'నిర్మాణ & రహదారి దుమ్ము') },
      { value: 'VEHICULAR_CONGESTION', label: tx('Heavy Lorry / NH-16 Exhaust', 'NH-16 భారీ వాహనాల పొగ') },
    ],
    [tx]
  );

  const sectionOptions = useMemo(
    () => [
      { value: 1, label: tx('Section 1 — Old Village & Market', 'విభాగం 1 — పాత గ్రామం & మార్కెట్') },
      { value: 2, label: tx('Section 2 — Ramalayam Temple Ward', 'విభాగం 2 — రామాలయం వార్డు') },
      { value: 3, label: tx('Section 3 — ZP High School & SC Colony', 'విభాగం 3 — ZP హైస్కూల్ & SC కాలనీ') },
      { value: 4, label: tx('Section 4 — NH-16 Bypass & Kiln Corridor', 'విభాగం 4 — NH-16 బైపాస్ & బట్టీల ప్రాంతం') },
      { value: 5, label: tx('Section 5 — Kantheru PHC & GP Campus', 'విభాగం 5 — కంతేరు PHC & పంచాయతీ') },
    ],
    [tx]
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'incidents'>('overview');
  const [sectionSummaries, setSectionSummaries] = useState<SectionSummary[]>([]);
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [villageAverageAqi, setVillageAverageAqi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Interactive CPCB Calculator & Officer Reading Logger state
  const [calcPm25, setCalcPm25] = useState('56');
  const [calcPm10, setCalcPm10] = useState('138');
  const [calcNo2, setCalcNo2] = useState('32');
  const [calcSo2, setCalcSo2] = useState('14');
  const [calcCo, setCalcCo] = useState('1.2');
  const [logSectionId, setLogSectionId] = useState('3');
  const [logPoint, setLogPoint] = useState('ZP High School & SC Colony Gate');
  const [logDate, setLogDate] = useState('2026-11-13');
  const [logNotes, setLogNotes] = useState('');
  const [submittingReading, setSubmittingReading] = useState(false);

  // Incident report form state
  const [incSectionId, setIncSectionId] = useState('4');
  const [incCategory, setIncCategory] = useState('CONSTRUCTION_ROAD_DUST');
  const [incLocation, setIncLocation] = useState('');
  const [incDescription, setIncDescription] = useState('');
  const [incHouseholds, setIncHouseholds] = useState('12');
  const [incNearSensitive, setIncNearSensitive] = useState(false);
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [actionNotesMap, setActionNotesMap] = useState<Record<string, string>>({});
  const [updatingIncidentId, setUpdatingIncidentId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/air-quality');
      if (res.ok) {
        const data = await res.json();
        setSectionSummaries(data.sectionSummaries || []);
        setReadings(data.readings || []);
        setIncidents(data.incidents || []);
        setVillageAverageAqi(data.villageAverageAqi ?? null);
      }
    } catch {
      // handled silently in UI empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, []);

  const parseOptNum = (val: string): number | null => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const liveCalc = useMemo(
    () =>
      calculateCpcbAqi({
        pm25UgM3: parseOptNum(calcPm25),
        pm10UgM3: parseOptNum(calcPm10),
        no2UgM3: parseOptNum(calcNo2),
        so2UgM3: parseOptNum(calcSo2),
        coMgM3: parseOptNum(calcCo),
      }),
    [calcPm25, calcPm10, calcNo2, calcSo2, calcCo]
  );

  const livePriorityPreview = useMemo(
    () =>
      prioritizeAirIncident({
        category: incCategory,
        affectedHouseholds: Math.max(1, Number(incHouseholds) || 1),
        isNearSensitiveFacility: incNearSensitive,
      }),
    [incCategory, incHouseholds, incNearSensitive]
  );

  const isOfficer = currentUser?.role === 'WATER_SANITATION_OFFICER' || currentUser?.role === 'ADMIN';
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const highestAqiSection = sectionSummaries.reduce<SectionSummary | null>((best, curr) => {
    if (curr.assessment.aqi === null) return best;
    if (!best || (best.assessment.aqi ?? -1) < curr.assessment.aqi) return curr;
    return best;
  }, null);

  const applyPreset = (preset: 'clean' | 'dust' | 'kiln') => {
    if (preset === 'clean') {
      setCalcPm25('22');
      setCalcPm10('44');
      setCalcNo2('15');
      setCalcSo2('7');
      setCalcCo('0.4');
    } else if (preset === 'dust') {
      setCalcPm25('82');
      setCalcPm10('245');
      setCalcNo2('52');
      setCalcSo2('18');
      setCalcCo('1.8');
    } else {
      setCalcPm25('138');
      setCalcPm10('320');
      setCalcNo2('96');
      setCalcSo2('44');
      setCalcCo('3.1');
    }
  };

  const handleSaveReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmittingReading(true);
    try {
      const res = await fetch('/api/air-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'READING',
          sectionId: Number(logSectionId),
          monitoringPoint: logPoint,
          recordedDate: logDate,
          pm25UgM3: parseOptNum(calcPm25),
          pm10UgM3: parseOptNum(calcPm10),
          no2UgM3: parseOptNum(calcNo2),
          so2UgM3: parseOptNum(calcSo2),
          coMgM3: parseOptNum(calcCo),
          notes: logNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to save sensor reading.' });
      } else {
        setFeedback({
          type: 'success',
          text: `Saved Section ${logSectionId} air sample (CPCB AQI ${data.assessment?.aqi ?? 'Incomplete'} - ${data.assessment?.category}).`,
        });
        setLogNotes('');
        await loadData();
        setActiveTab('overview');
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error saving air reading.' });
    } finally {
      setSubmittingReading(false);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmittingIncident(true);
    try {
      const res = await fetch('/api/air-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INCIDENT',
          sectionId: Number(incSectionId),
          category: incCategory,
          location: incLocation,
          description: incDescription,
          affectedHouseholds: Math.max(1, Number(incHouseholds) || 1),
          isNearSensitiveFacility: incNearSensitive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to submit air pollution report.' });
      } else {
        setFeedback({
          type: 'success',
          text: `Reported ${data.incident?.priority} priority pollution alert. Dispatched notification to Sanitation Officers (${data.incident?.recommendedUnit}).`,
        });
        setIncLocation('');
        setIncDescription('');
        await loadData();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error submitting pollution report.' });
    } finally {
      setSubmittingIncident(false);
    }
  };

  const handleUpdateIncidentStatus = async (
    id: string,
    status: 'WATER_SPRINKLER_DISPATCHED' | 'ENFORCEMENT_ACTION' | 'RESOLVED'
  ) => {
    setFeedback(null);
    setUpdatingIncidentId(id);
    try {
      const res = await fetch('/api/air-quality', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          actionNotes: actionNotesMap[id] || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to update mitigation status.' });
      } else {
        setFeedback({ type: 'success', text: `Incident updated to ${status.replace(/_/g, ' ')}.` });
        await loadData();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error updating incident.' });
    } finally {
      setUpdatingIncidentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2744] via-[#13355E] to-[#0D5257] text-white border-b border-slate-800">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl animate-orb-drift pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-teal-200 text-xs font-semibold mb-3">
                <Wind className="w-3.5 h-3.5" />
                <span>{tx('CPCB India NAQI • Clean Air Action Hub', 'CPCB ఇండియా NAQI • స్వచ్ఛ వాయు కార్యాచరణ కేంద్రం')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t('page.airQuality.title')}
              </h1>
              <p className="mt-2 text-slate-200 max-w-2xl text-sm sm:text-base">
                {t('page.airQuality.sub')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={loadData}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {tx('Refresh Sensors', 'సెన్సార్లు రీఫ్రెష్ చేయండి')}
              </Button>
              <Button
                variant="primary"
                onClick={() => setActiveTab('incidents')}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold btn-sheen"
              >
                <Flame className="w-4 h-4 mr-1.5" />
                {tx('Report Smoke / Dust', 'పొగ / దుమ్ము ఫిర్యాదు')}
              </Button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                {tx('Kantheru Mean AQI', 'కంతేరు సగటు AQI')}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {villageAverageAqi !== null ? <AnimatedCounter value={villageAverageAqi} /> : '—'}
                </span>
                <span className="text-xs text-slate-300">CPCB NAQI</span>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                {tx('Monitored Zones', 'పర్యవేక్షణ విభాగాలు')}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  <AnimatedCounter value={sectionSummaries.filter((s) => s.latestReading).length} />
                </span>
                <span className="text-xs text-slate-300">{tx('/ 5 Village Sections', '/ 5 గ్రామ విభాగాలు')}</span>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                {tx('Active Dust & Smoke Alerts', 'యాక్టివ్ పొగ & దుమ్ము హెచ్చరికలు')}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-300">
                  <AnimatedCounter value={activeIncidentsCount} />
                </span>
                <span className="text-xs text-slate-300">{tx('Open Mitigation Tickets', 'పెండింగ్ నివారణ టికెట్లు')}</span>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-200">
                {tx('Hotspot Corridor', 'అధిక కాలుష్య ప్రాంతం')}
              </p>
              <p className="mt-1 text-base font-bold text-white truncate">
                {highestAqiSection
                  ? `${tx('Section', 'విభాగం')} ${highestAqiSection.sectionId} (AQI ${highestAqiSection.assessment.aqi})`
                  : tx('No active hotspot', 'తీవ్ర ప్రాంతాలు లేవు')}
              </p>
              <p className="text-xs text-slate-300 truncate">
                {highestAqiSection?.latestReading?.monitoringPoint || tx('Awaiting readings', 'రీడింగ్స్ కోసం వేచి ఉంది')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {feedback && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
            >
              {tx('Dismiss', 'మూసివేయండి')}
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#0F2744] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            {tx('5-Section Live AQI & Mitigation Hub', '5-విభాగాల లైవ్ AQI & నివారణ కేంద్రం')}
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'calculator'
                ? 'bg-[#0F2744] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4" />
            {tx('CPCB AQI Calculator & Sensor Logger', 'CPCB AQI కాలిక్యులేటర్ & సెన్సార్ లాగ్')}
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'incidents'
                ? 'bg-[#0F2744] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            {tx('Pollution Source Reporting & Sprinkler Queue', 'కాలుష్య ఫిర్యాదు & స్ప్రింక్లర్ క్యూ')}
            {activeIncidentsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[11px] rounded-full bg-rose-500 text-white">
                {activeIncidentsCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-tab-switch">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-56 rounded-xl bg-white border border-slate-200 animate-pulse p-5" />
                ))}
              </div>
            ) : (
              <>
                {/* 5-Section Cards */}
                <ScrollReveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sectionSummaries.map((sec) => {
                      const cat = sec.assessment.category;
                      const latest = sec.latestReading;
                      return (
                        <Card key={sec.sectionId} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardHeader
                            className="pb-3"
                            title={
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                                  {tx('Section', 'విభాగం')} {sec.sectionId}
                                </p>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                                  {sec.sectionName}
                                </span>
                              </div>
                            }
                            subtitle={
                              <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {latest?.monitoringPoint || tx('No sensor station assigned', 'సెన్సార్ కేంద్రం లేదు')}
                              </span>
                            }
                            action={<Badge variant={AQI_BADGE_MAP[cat]}>{ts(cat)}</Badge>}
                          />

                          <CardContent className="pt-4 space-y-4">
                            <div className="flex items-end justify-between">
                              <div>
                                <span className="text-xs font-medium text-slate-500 block">
                                  {tx('CPCB NAQI Score', 'CPCB NAQI స్కోరు')}
                                </span>
                                <span className="text-3xl font-black text-[#0F2744]">
                                  {sec.assessment.aqi ?? tx('Incomplete', 'అసంపూర్ణం')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-medium text-slate-500 block">
                                  {tx('Dominant Pollutant', 'ప్రధాన కాలుష్య కారకం')}
                                </span>
                                <span className="text-sm font-bold text-slate-800">
                                  {sec.assessment.dominantPollutant || tx('N/A', 'వర్తించదు')}
                                </span>
                              </div>
                            </div>

                            {/* Individual parameters - strictly non-inferential */}
                            <div className="grid grid-cols-5 gap-1.5 text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <div>
                                <span className="block text-[10px] font-semibold text-slate-500">PM2.5</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {latest?.pm25UgM3 ?? '—'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-semibold text-slate-500">PM10</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {latest?.pm10UgM3 ?? '—'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-semibold text-slate-500">NO2</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {latest?.no2UgM3 ?? '—'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-semibold text-slate-500">SO2</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {latest?.so2UgM3 ?? '—'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-semibold text-slate-500">CO</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {latest?.coMgM3 ?? '—'}
                                </span>
                              </div>
                            </div>

                            <div className="rounded-lg bg-teal-50/70 border border-teal-100 p-2.5 text-xs text-slate-700">
                              <span className="font-bold text-teal-900">{tx('Panchayat Action:', 'పంచాయతీ చర్య:')} </span>
                              {sec.assessment.panchayatAction}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                              <span>{tx('Recorded:', 'నమోదు తేదీ:')} {latest?.recordedDate || 'N/A'}</span>
                              <span>
                                {tx('Open alerts:', 'యాక్టివ్ హెచ్చరికలు:')}{' '}
                                <strong className={sec.activeIncidentsCount > 0 ? 'text-rose-600' : 'text-slate-700'}>
                                  {sec.activeIncidentsCount}
                                </strong>
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollReveal>

                {/* Comparative AQI Bar Chart & Panchayat Mitigation Playbook */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader
                      title={tx('5-Section Comparative CPCB AQI Profile', '5-విభాగాల తులనాత్మక CPCB AQI చిత్రణ')}
                      subtitle={tx(
                        'Calculated strictly from measured pollutant concentrations (0–500 CPCB NAQI scale). Unmeasured parameters are never inferred.',
                        'కొలిచిన కాలుష్య కారకాల ఆధారంగా మాత్రమే లెక్కించబడుతుంది (0–500 CPCB ప్రమాణం). కొలవని విలువలను ఎప్పుడూ ఊహించదు.'
                      )}
                    />
                    <CardContent className="space-y-4">
                      {sectionSummaries.map((sec) => {
                        const aqiVal = sec.assessment.aqi ?? 0;
                        const pct = Math.min(100, Math.max(4, Math.round((aqiVal / 350) * 100)));
                        const cat = sec.assessment.category;
                        return (
                          <div key={sec.sectionId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-800">
                                {tx('Sec', 'విభాగం')} {sec.sectionId}: {sec.latestReading?.monitoringPoint || sec.sectionName}
                              </span>
                              <span className="text-slate-900 font-bold">
                                {sec.assessment.aqi !== null ? `AQI ${sec.assessment.aqi} (${ts(cat)})` : ts('INCOMPLETE')}
                              </span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${AQI_BAR_COLOR[cat]}`}
                                style={{ width: sec.assessment.aqi !== null ? `${pct}%` : '4%' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader
                      title={
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-teal-600" />
                          {tx('Kantheru Clean Air Playbook', 'కంతేరు స్వచ్ఛ వాయు కార్యాచరణ')}
                        </span>
                      }
                    />
                    <CardContent className="space-y-3 text-sm text-slate-700">
                      <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
                        <p className="font-bold text-sky-900 flex items-center gap-1.5">
                          <Droplets className="w-4 h-4 text-sky-600" />
                          {tx('1. Targeted Water-Mist Suppression', '1. నీటి తుంపర్ల ద్వారా దుమ్ము నియంత్రణ')}
                        </p>
                        <p className="text-xs mt-1 text-slate-600">
                          {tx(
                            'When PM10 spikes above 100 µg/m³ on NH-16 service lanes or gravel roads, dispatch the 5,000L treated greywater tanker for dust wetting.',
                            'NH-16 సర్వీస్ రోడ్లలో PM10 100 µg/m³ దాటినప్పుడు దుమ్ము అణచివేతకు 5,000 లీటర్ల వాటర్ స్ప్రింక్లర్ ట్యాంకర్‌ను పంపుతారు.'
                          )}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-600" />
                          {tx('2. Zero Open-Burning Patrol', '2. బహిరంగ చెత్త దహన నిరోధక దళం')}
                        </p>
                        <p className="text-xs mt-1 text-slate-600">
                          {tx(
                            'Any plastic or dry waste fire within 200m of ZP High School, Anganwadis, or Kantheru PHC triggers CRITICAL dispatch priority.',
                            'ZP హైస్కూల్, అంగన్‌వాడీ లేదా PHC పరిధిలోని 200 మీటర్లలోపు ప్లాస్టిక్/చెత్త మంటలకు అత్యవసర ప్రాధాన్యత ఇవ్వబడుతుంది.'
                          )}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                        <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-emerald-600" />
                          {tx('3. School & PHC Exposure Safeguard', '3. పాఠశాల & PHC ఆరోగ్య రక్షణ')}
                        </p>
                        <p className="text-xs mt-1 text-slate-600">
                          {tx(
                            'Citizens with respiratory sensitivity are advised to avoid outdoor exertion when CPCB AQI reaches POOR (>200).',
                            'CPCB AQI 200 దాటినప్పుడు శ్వాసకోశ సమస్యలు ఉన్నవారు బహిరంగ శ్రమను తగ్గించాలని సూచించబడుతుంది.'
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: CALCULATOR & OFFICER SENSOR LOGGER */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-tab-switch">
            <Card className="lg:col-span-7">
              <CardHeader
                title={tx('CPCB India NAQI Sub-Index Calculator', 'CPCB ఇండియా NAQI సబ్-ఇండెక్స్ కాలిక్యులేటర్')}
                subtitle={tx(
                  'Enter any measured pollutant concentrations. Leave unmeasured fields blank — missing parameters are never estimated.',
                  'కొలిచిన కాలుష్య కారకాల విలువలను నమోదు చేయండి. కొలవని వాటిని ఖాళీగా ఉంచండి — అవి ఎప్పుడూ అంచనా వేయబడవు.'
                )}
                action={
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => applyPreset('clean')}>
                      {tx('Clean Morning', 'స్వచ్ఛమైన ఉదయం')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => applyPreset('dust')}>
                      {tx('Road Dust', 'రహదారి దుమ్ము')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => applyPreset('kiln')}>
                      {tx('Heavy Smoke', 'తీవ్ర పొగ')}
                    </Button>
                  </div>
                }
              />

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="PM2.5 (µg/m³)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={calcPm25}
                    onChange={(e) => setCalcPm25(e.target.value)}
                    placeholder="e.g. 56"
                  />
                  <Input
                    label="PM10 (µg/m³)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={calcPm10}
                    onChange={(e) => setCalcPm10(e.target.value)}
                    placeholder="e.g. 138"
                  />
                  <Input
                    label="NO2 (µg/m³)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={calcNo2}
                    onChange={(e) => setCalcNo2(e.target.value)}
                    placeholder="e.g. 32"
                  />
                  <Input
                    label="SO2 (µg/m³)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={calcSo2}
                    onChange={(e) => setCalcSo2(e.target.value)}
                    placeholder="e.g. 14"
                  />
                  <Input
                    label="CO (mg/m³)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={calcCo}
                    onChange={(e) => setCalcCo(e.target.value)}
                    placeholder="e.g. 1.2"
                  />
                </div>

                {/* Live Sub-Index Result */}
                <div className="rounded-xl bg-slate-900 text-white p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-teal-300 font-semibold">
                        {tx('Computed Overall AQI', 'లెక్కించబడిన మొత్తం AQI')}
                      </span>
                      <div className="text-4xl font-black mt-0.5">
                        {liveCalc.aqi !== null ? liveCalc.aqi : ts('INCOMPLETE DATA')}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={AQI_BADGE_MAP[liveCalc.category]}>
                        {ts(liveCalc.category)}
                      </Badge>
                      <p className="text-xs text-slate-300">
                        {tx('Dominant:', 'ప్రధానం:')} <strong>{liveCalc.dominantPollutant || tx('None', 'ఏదీ లేదు')}</strong> ({liveCalc.measuredParametersCount} {tx('metrics measured', 'కొలిచినవి')})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/10">
                    {liveCalc.subIndices.map((sub) => (
                      <div key={sub.parameter} className="rounded-lg bg-white/10 p-2 text-center">
                        <span className="block text-[11px] text-slate-300 font-semibold">{sub.parameter}</span>
                        <span className="block text-sm font-bold text-white">
                          {sub.subIndex !== null ? `SI ${sub.subIndex}` : tx('Unmeasured', 'కొలవలేదు')}
                        </span>
                        <span className="block text-[10px] text-teal-200">
                          {sub.value !== null ? `${sub.value} ${sub.unit}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-200 pt-1">
                    <p>
                      <strong className="text-teal-300">{tx('Citizen Advisory:', 'పౌరులకు సూచన:')}</strong> {liveCalc.citizenAdvisory}
                    </p>
                    <p>
                      <strong className="text-amber-300">{tx('Recommended Panchayat Action:', 'పంచాయతీ చర్య:')}</strong>{' '}
                      {liveCalc.panchayatAction}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Officer Sensor Logger */}
            <Card className="lg:col-span-5">
              <CardHeader
                title={tx('Log Field Reading to Kantheru DB', 'కంతేరు డేటాబేస్‌కు ఫీల్డ్ రీడింగ్ నమోదు')}
                subtitle={tx(
                  'Uses the pollutant measurements on the left to publish an official section station record.',
                  'ఎడమవైపు ఉన్న విలువలతో అధికారిక విభాగం సెన్సార్ రికార్డును ప్రచురించండి.'
                )}
              />
              <CardContent>
                {!isOfficer ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 space-y-3">
                    <p className="font-semibold">
                      {tx('Sanitation Officer or Admin Sign-In Required', 'పారిశుధ్య అధికారి లేదా అడ్మిన్ లాగిన్ అవసరం')}
                    </p>
                    <p className="text-xs text-amber-800">
                      {tx(
                        'Anyone can use the CPCB AQI calculator on the left. Publishing official monitoring logs to the 5-section Panchayat database is restricted to Sanitation Officers & Admins.',
                        'CPCB AQI కాలిక్యులేటర్‌ను ఎవరైనా ఉపయోగించవచ్చు. 5-విభాగాల పంచాయతీ డేటాబేస్‌లో అధికారిక లాగ్‌లను నమోదు చేయడానికి అధికారి/అడ్మిన్ లాగిన్ అవసరం.'
                      )}
                    </p>
                    {!currentUser && (
                      <Link href="/login">
                        <Button size="sm" variant="primary" className="mt-2">
                          {tx('Sign In to Officer Account', 'అధికారి ఖాతాలో లాగిన్ అవ్వండి')}
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveReading} className="space-y-4">
                    <Select
                      label={tx('Kantheru Section', 'కంతేరు విభాగం')}
                      value={logSectionId}
                      onChange={(e) => setLogSectionId(e.target.value)}
                      options={sectionOptions}
                    />
                    <Input
                      label={tx('Monitoring Station / Landmark', 'పర్యవేక్షణ కేంద్రం / ప్రదేశం')}
                      required
                      value={logPoint}
                      onChange={(e) => setLogPoint(e.target.value)}
                      placeholder={tx('e.g. NH-16 Bypass Kiln Road', 'ఉదా: NH-16 బైపాస్ రోడ్డు')}
                    />
                    <Input
                      label={tx('Recorded Date', 'నమోదు తేదీ')}
                      type="date"
                      required
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                    <Input
                      label={tx('Field Observation Notes', 'ఫీల్డ్ పరిశీలన గమనికలు')}
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder={tx('Wind direction, visible smoke, moisture status...', 'గాలి దిశ, పొగ, తేమ స్థితి...')}
                    />
                    <Button
                      type="submit"
                      disabled={submittingReading}
                      className="w-full btn-sheen"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      {submittingReading
                        ? tx('Saving Reading...', 'సేవ్ అవుతోంది...')
                        : tx('Publish Station Reading', 'స్టేషన్ రీడింగ్ ప్రచురించండి')}
                    </Button>
                  </form>
                )}

                {readings.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      {tx('Recent Official Station Logs', 'ఇటీవలి అధికారిక స్టేషన్ లాగ్స్')}
                    </h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {readings.slice(0, 5).map((r) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-800 truncate">
                              Sec {r.sectionId}: {r.monitoringPoint}
                            </p>
                            <p className="text-[11px] text-slate-500">{r.recordedDate}</p>
                          </div>
                          <Badge variant={AQI_BADGE_MAP[r.aqiCategory]} size="sm">
                            {r.calculatedAqi ?? '—'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: INCIDENTS & MITIGATION QUEUE */}
        {activeTab === 'incidents' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-tab-switch">
            {/* Resident Reporting Form */}
            <Card className="lg:col-span-5 h-fit">
              <CardHeader
                title={tx('Report Localized Air Pollution Source', 'స్థానిక వాయు కాలుష్య ఫిర్యాదు చేయండి')}
                subtitle={tx(
                  'Automatically calculates response priority and notifies Kantheru Sanitation Officers.',
                  'ఆటోమేటిక్‌గా తీవ్రతను లెక్కించి కంతేరు పారిశుధ్య అధికారులకు సమాచారం అందిస్తుంది.'
                )}
              />
              <CardContent>
                {!currentUser ? (
                  <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900 space-y-3">
                    <p className="font-semibold">
                      {tx('Sign in to report smoke or dust incidents', 'పొగ లేదా దుమ్ము సమస్యలు నివేదించడానికి లాగిన్ అవ్వండి')}
                    </p>
                    <p className="text-xs text-sky-800">
                      {tx(
                        'Verified resident login prevents spam and lets you track sprinkler dispatch updates in real time.',
                        'నిజమైన గ్రామస్తుల లాగిన్ ద్వారా మీ స్ప్రింక్లర్ డిస్పాచ్ స్థితిని లైవ్‌లో ట్రాక్ చేయవచ్చు.'
                      )}
                    </p>
                    <Link href="/login">
                      <Button size="sm" variant="primary">
                        {tx('Sign In / Register', 'లాగిన్ / నమోదు')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleReportIncident} className="space-y-4">
                    <Select
                      label={tx('Village Section', 'గ్రామ విభాగం')}
                      value={incSectionId}
                      onChange={(e) => setIncSectionId(e.target.value)}
                      options={sectionOptions}
                    />
                    <Select
                      label={tx('Pollution Source Category', 'కాలుష్య కారక రకం')}
                      value={incCategory}
                      onChange={(e) => setIncCategory(e.target.value)}
                      options={categoryOptions}
                    />
                    <Input
                      label={tx('Exact Spot / Landmark', 'ఖచ్చితమైన ప్రదేశం')}
                      required
                      value={incLocation}
                      onChange={(e) => setIncLocation(e.target.value)}
                      placeholder={tx('e.g. Behind ZP School Compound Wall', 'ఉదా: ZP హైస్కూల్ వెనుక భాగం')}
                    />
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        {tx('Incident Description', 'సమస్య వివరణ')} <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        minLength={8}
                        rows={3}
                        value={incDescription}
                        onChange={(e) => setIncDescription(e.target.value)}
                        placeholder={tx(
                          'Describe smoke color, dust volume, and wind direction...',
                          'పొగ రంగు, దుమ్ము తీవ్రత మరియు గాలి దిశ వివరించండి...'
                        )}
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <Input
                      label={tx('Estimated Affected Households', 'ప్రభావిత కుటుంబాల సంఖ్య')}
                      type="number"
                      min="1"
                      max="500"
                      required
                      value={incHouseholds}
                      onChange={(e) => setIncHouseholds(e.target.value)}
                    />
                    <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incNearSensitive}
                        onChange={(e) => setIncNearSensitive(e.target.checked)}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs text-slate-700">
                        <strong className="block text-slate-900">
                          {tx('Near School, Anganwadi, or Primary Health Centre', 'పాఠశాల, అంగన్‌వాడీ లేదా PHC దగ్గర ఉందా?')}
                        </strong>
                        {tx('Automatically applies +20 sensitive exposure urgency bonus.', 'అదనంగా +20 అత్యవసర ప్రాధాన్యత స్కోరు జతచేయబడుతుంది.')}
                      </span>
                    </label>

                    {/* Live Priority Preview */}
                    <div className="rounded-lg bg-slate-900 text-white p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">{tx('Computed Priority Preview', 'అంచనా ప్రాధాన్యత')}</span>
                        <Badge variant={PRIORITY_BADGE_MAP[livePriorityPreview.priority]} size="sm">
                          {ts(livePriorityPreview.priority)} ({tx('Score', 'స్కోర్')} {livePriorityPreview.severityScore})
                        </Badge>
                      </div>
                      <p className="text-teal-300 font-medium">
                        {tx('Unit:', 'బృందం:')} {livePriorityPreview.recommendedUnit}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submittingIncident}
                      className="w-full btn-sheen"
                    >
                      <Flame className="w-4 h-4 mr-1.5" />
                      {submittingIncident
                        ? tx('Submitting Report...', 'సమర్పించబడుతోంది...')
                        : tx('Submit Air Pollution Alert', 'కాలుష్య హెచ్చరిక పంపండి')}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Live Mitigation Queue */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {tx('Live Panchayat Mitigation & Sprinkler Queue', 'లైవ్ పంచాయతీ నివారణ & స్ప్రింక్లర్ క్యూ')} ({incidents.length})
                </h2>
                <span className="text-xs text-slate-500">{tx('Ordered by Severity Score', 'తీవ్రత స్కోర్ ప్రకారం')}</span>
              </div>

              {incidents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-slate-500">
                    <Wind className="w-10 h-10 mx-auto text-teal-500 mb-2" />
                    <p className="font-semibold text-slate-700">{tx('No active air pollution incidents', 'యాక్టివ్ కాలుష్య ఫిర్యాదులు లేవు')}</p>
                    <p className="text-xs mt-1">{tx('All 5 sections of Kantheru report clean operating conditions.', 'కంతేరులోని అన్ని 5 విభాగాల్లో స్వచ్ఛమైన పరిస్థితులు ఉన్నాయి.')}</p>
                  </CardContent>
                </Card>
              ) : (
                incidents.map((inc) => (
                  <Card key={inc.id} className="overflow-hidden">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={PRIORITY_BADGE_MAP[inc.priority]}>
                              {ts(inc.priority)} • {inc.severityScore}/100
                            </Badge>
                            <Badge variant={STATUS_BADGE_MAP[inc.status]}>
                              {ts(inc.status)}
                            </Badge>
                            {inc.isNearSensitiveFacility && (
                              <Badge variant="rose" size="sm">
                                {tx('School / PHC Zone', 'స్కూల్ / PHC ప్రాంతం')}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">
                            {tx('Section', 'విభాగం')} {inc.sectionId} — {inc.location}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {inc.affectedHouseholds} {tx('households affected', 'కుటుంబాలు ప్రభావితం')}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700">{inc.description}</p>

                      <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-1">
                        <p className="font-semibold text-slate-800">
                          {tx('Recommended Mitigation Unit:', 'సూచించిన నివారణ బృందం:')}{' '}
                          <span className="text-teal-700">{inc.recommendedUnit}</span>
                        </p>
                        {inc.actionNotes && (
                          <p className="text-slate-600">
                            <strong>{tx('Officer Log:', 'అధికారి గమనిక:')}</strong> {inc.actionNotes}
                          </p>
                        )}
                      </div>

                      {isOfficer && inc.status !== 'RESOLVED' && (
                        <div className="pt-2 border-t border-slate-100 space-y-2.5">
                          <Input
                            placeholder={tx(
                              'Add officer action note (e.g., Tanker AP07-112 dispatched at 10:15 AM)...',
                              'అధికారి చర్య వివరాలు నమోదు చేయండి...'
                            )}
                            value={actionNotesMap[inc.id] || ''}
                            onChange={(e) =>
                              setActionNotesMap((prev) => ({ ...prev, [inc.id]: e.target.value }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            {inc.status === 'REPORTED' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={updatingIncidentId === inc.id}
                                onClick={() =>
                                  handleUpdateIncidentStatus(inc.id, 'WATER_SPRINKLER_DISPATCHED')
                                }
                              >
                                {tx('Dispatch Water Sprinkler', 'వాటర్ స్ప్రింక్లర్ పంపండి')}
                              </Button>
                            )}
                            {inc.status !== 'ENFORCEMENT_ACTION' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingIncidentId === inc.id}
                                onClick={() =>
                                  handleUpdateIncidentStatus(inc.id, 'ENFORCEMENT_ACTION')
                                }
                              >
                                {tx('Log Enforcement Notice', 'నోటీసు జారీ చేయండి')}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={updatingIncidentId === inc.id}
                              onClick={() => handleUpdateIncidentStatus(inc.id, 'RESOLVED')}
                            >
                              {tx('Mark Resolved', 'పరిష్కరించబడింది')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
