'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  AlertTriangle,
  Building2,
  Ambulance,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Compass,
  FileText,
  UserCheck,
  ChevronRight,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/ui/Motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const EMERGENCY_STAGES = [
  { key: 'SUBMITTED', en: 'Submitted', te: 'నమోదు' },
  { key: 'ACKNOWLEDGED', en: 'Acknowledged', te: 'స్వీకరించబడింది' },
  { key: 'CONTACTED', en: 'Contacted', te: 'సంప్రదించబడింది' },
  { key: 'DISPATCHED', en: 'Dispatched', te: 'పంపబడింది' },
  { key: 'RESOLVED', en: 'Resolved', te: 'పరిష్కరించబడింది' },
];

export default function EmergencyPage() {
  const { lang, t, tx, ts } = useLanguage();
  const [activeTab, setActiveTab] = useState<'request' | 'directory' | 'facilities' | 'ambulances' | 'coordinator'>('request');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [locationDesc, setLocationDesc] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationConsent, setLocationConsent] = useState(false);
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<any>(null);

  // Coordinator Status Update Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<any>('ACKNOWLEDGED');
  const [responderNotes, setResponderNotes] = useState('');
  const [assignedAmbulanceId, setAssignedAmbulanceId] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Response History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [updatingAmbId, setUpdatingAmbId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmergencyData();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setCurrentUser(d.user);
          setCallerName(d.user.name || '');
          setCallerPhone(d.user.phone || '');
        }
      });
  }, []);

  const fetchEmergencyData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emergency/requests');
      const data = await res.json();
      if (data) {
        setRequests(data.requests || []);
        setFacilities(data.facilities || []);
        setAmbulances(data.ambulances || []);
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus(tx('Geolocation not supported by this browser.', 'ఈ బ్రౌజర్‌లో జియోలొకేషన్ మద్దతు లేదు.'));
      return;
    }

    setGpsLocating(true);
    setGpsStatus(tx('Acquiring high-accuracy coordinates...', 'అధిక-ఖచ్చితత్వ కోఆర్డినేట్‌లను పొందుతోంది...'));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationConsent(true);
        setGpsLocating(false);
        setGpsStatus(
          tx(
            `Lat: ${pos.coords.latitude.toFixed(5)}, Lon: ${pos.coords.longitude.toFixed(5)} (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`,
            `అక్షాంశం: ${pos.coords.latitude.toFixed(5)}, రేఖాంశం: ${pos.coords.longitude.toFixed(5)} (ఖచ్చితత్వం: ±${Math.round(pos.coords.accuracy)}మీ)`
          )
        );
      },
      (err) => {
        setGpsLocating(false);
        setGpsStatus(
          tx(
            `GPS error: ${err.message}. Please describe your location manually below.`,
            `GPS లోపం: ${err.message}. దయచేసి దిగువన మీ చిరునామాను నమోదు చేయండి.`
          )
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReq(true);
    setRequestSuccess(null);

    try {
      const res = await fetch('/api/emergency/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerName,
          callerPhone,
          patientCondition,
          locationDescription: locationDesc,
          latitude,
          longitude,
          locationConsentGiven: locationConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit emergency ticket');

      setRequestSuccess(data);
      fetchEmergencyData();
      setPatientCondition('');
      setLocationDesc('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);

    try {
      const res = await fetch('/api/emergency/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedReq.id,
          status: targetStatus,
          responderNotes,
          assignedAmbulanceId: assignedAmbulanceId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setUpdateModalOpen(false);
      fetchEmergencyData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isCoordinator =
    currentUser && (currentUser.role === 'EMERGENCY_COORDINATOR' || currentUser.role === 'ADMIN');

  const handleToggleAmbulanceStatus = async (
    ambulanceId: string,
    status: 'AVAILABLE' | 'ON_DUTY' | 'MAINTENANCE' | 'OFFLINE'
  ) => {
    setUpdatingAmbId(ambulanceId);
    try {
      const res = await fetch('/api/emergency/ambulances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambulanceId, status }),
      });
      if (res.ok) fetchEmergencyData();
    } finally {
      setUpdatingAmbId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-glow-rose">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 key={lang} className="text-2xl font-extrabold text-navy-950 font-display animate-lang-swap">
                  {t('page.emergency.title')}
                </h1>
                <Badge variant="rose">{t('mod3.badge')}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t('page.emergency.sub')}</p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'request' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx('Submit Request', 'అభ్యర్థన పంపండి')}
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'facilities' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx(`Hospitals & ICU (${facilities.length})`, `ఆసుపత్రులు & ICU (${facilities.length})`)}
          </button>
          <button
            onClick={() => setActiveTab('ambulances')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ambulances' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx(`Ambulances (${ambulances.length})`, `అంబులెన్సులు (${ambulances.length})`)}
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'directory' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx('Hotlines', 'హాట్‌లైన్లు')}
          </button>
          {isCoordinator && (
            <button
              onClick={() => setActiveTab('coordinator')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'coordinator'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:text-rose-900 font-bold'
              }`}
            >
              {tx(`Coordinator Desk (${requests.length})`, `కోఆర్డినేటర్ డెస్క్ (${requests.length})`)}
            </button>
          )}
        </div>
      </div>

      {/* CRITICAL CALLING BANNER */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                {tx('CRITICAL LIFE-THREATENING CRISIS? DIAL DIRECTLY NOW', 'ప్రాణాపాయ అత్యవసర పరిస్థితి? వెంటనే డైరెక్ట్‌గా కాల్ చేయండి')}
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                {tx(
                  'A web form submission does not replace direct telephone dispatch. Always call toll-free numbers first for immediate voice dispatch!',
                  'వెబ్ ఫారమ్ సమర్పణ నేరుగా ఫోన్ డిస్పాచ్‌కు ప్రత్యామ్నాయం కాదు. తక్షణ సహాయం కోసం ముందుగా టోల్-ఫ్రీ నంబర్లకు కాల్ చేయండి!'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:108"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <PhoneCall className="w-4 h-4" /> {tx('DIAL 108 (AMBULANCE)', '108 కు కాల్ చేయండి (అంబులెన్స్)')}
            </a>
            <a
              href="tel:08632234101"
              className="px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
            >
              {tx('PHC 24/7 Desk: +91 863 2234101', 'PHC 24/7 డెస్క్: +91 863 2234101')}
            </a>
            <a
              href="tel:104"
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
            >
              {tx('104 Health Helpline', '104 ఆరోగ్య హెల్ప్‌లైన్')}
            </a>
          </div>
        </div>
      </div>

      {/* TAB 1: SUBMIT EMERGENCY REQUEST */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-tab-switch">
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader
                title={tx('Log Emergency Assistance Request', 'అత్యవసర సహాయ అభ్యర్థన నమోదు చేయండి')}
                subtitle={tx('Creates a tracked incident ticket on the Kantheru 108 Coordinator Dashboard', 'కాంతేరు 108 కోఆర్డినేటర్ డ్యాష్‌బోర్డ్‌లో ట్రాక్ చేయబడే టికెట్‌ను సృష్టిస్తుంది')}
              />
              <CardContent className="space-y-4">
                {requestSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">{tx('Emergency Request Ticket Recorded', 'అత్యవసర అభ్యర్థన టికెట్ నమోదు చేయబడింది')}</span>
                    </div>
                    <p>{requestSuccess.notice}</p>
                    <p className="font-mono text-[11px] text-emerald-700">
                      {tx('Ticket ID:', 'టికెట్ ID:')} {requestSuccess.request?.id} • {tx('Status:', 'స్థితి:')} {ts('SUBMITTED')}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={tx('Caller / Attendant Name', 'కాలర్ / సహాయకుని పేరు')}
                      required
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      placeholder={tx('Your full name', 'మీ పూర్తి పేరు')}
                    />

                    <Input
                      label={tx('Caller Phone Number (10 Digits)', 'ఫోన్ నంబర్ (10 అంకెలు)')}
                      type="tel"
                      required
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      placeholder="9848012345"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      {tx('Patient Condition & Nature of Emergency', 'రోగి పరిస్థితి & అత్యవసర స్వభావం')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={patientCondition}
                      onChange={(e) => setPatientCondition(e.target.value)}
                      placeholder={tx(
                        'e.g. Elderly person experiencing severe chest pain, shortness of breath, collapse, road traffic trauma, acute maternal labour...',
                        'ఉదా. వృద్ధునికి తీవ్రమైన ఛాతీ నొప్పి, శ్వాస ఆడకపోవడం, రోడ్డు ప్రమాదం, అత్యవసర ప్రసవ నొప్పులు...'
                      )}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <Input
                    label={tx('Specific Street, Landmark & Kantheru Section', 'వీధి, గుర్తు & కాంతేరు విభాగం')}
                    required
                    value={locationDesc}
                    onChange={(e) => setLocationDesc(e.target.value)}
                    placeholder={tx('e.g. Door No. 3-48, Near Ramalayam Temple, Section 2', 'ఉదా. ఇంటి నం. 3-48, రామాలయం దగ్గర, విభాగం 2')}
                  />

                  {/* Optional Geolocation with Explicit Consent */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-800">
                          {tx('Optional Location Sharing with Consent', 'సమ్మతితో ఐచ్ఛిక లొకేషన్ భాగస్వామ్యం')}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCaptureGPS}
                        isLoading={gpsLocating}
                      >
                        {tx('Acquire Current GPS', 'ప్రస్తుత GPS పొందండి')}
                      </Button>
                    </div>

                    {gpsStatus && (
                      <p className="text-[11px] font-mono text-teal-800 bg-teal-50 p-2 rounded border border-teal-200">
                        {gpsStatus}
                      </p>
                    )}

                    <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={locationConsent}
                        onChange={(e) => setLocationConsent(e.target.checked)}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>
                        {tx(
                          'I explicitly consent to share device coordinates with the 108 Emergency Coordinator for ambulance route optimization.',
                          'అంబులెన్స్ మార్గ నిర్దేశం కోసం 108 అత్యవసర కోఆర్డినేటర్‌తో పరికర కోఆర్డినేట్‌లను పంచుకోవడానికి నేను సమ్మతిస్తున్నాను.'
                        )}
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="danger"
                    size="md"
                    className="w-full"
                    isLoading={submittingReq}
                    icon={<PhoneCall className="w-4 h-4" />}
                  >
                    {tx('Submit Emergency Incident Ticket', 'అత్యవసర ఘటన టికెట్‌ను సమర్పించండి')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Quick Status Stepper Guide */}
            <Card>
              <CardHeader
                title={tx('Response Workflow Milestones', 'స్పందన దశల మైలురాళ్ళు')}
                subtitle={tx('Kantheru 108 Dispatch SLA & State Progression', 'కాంతేరు 108 డిస్పాచ్ SLA & దశల పురోగతి')}
              />
              <CardContent className="space-y-3">
                {[
                  {
                    step: tx('1. SUBMITTED', '1. నమోదు'),
                    desc: tx('Incident logged; coordinator alert sounds.', 'ఘటన నమోదైంది; కోఆర్డినేటర్ అలర్ట్ వెళ్ళింది.'),
                    color: 'text-amber-600',
                  },
                  {
                    step: tx('2. ACKNOWLEDGED', '2. స్వీకరించబడింది'),
                    desc: tx('Coordinator picks up ticket; telephone triage begins.', 'కోఆర్డినేటర్ టికెట్ తీసుకున్నారు; ఫోన్ ట్రయాజ్ ప్రారంభం.'),
                    color: 'text-sky-600',
                  },
                  {
                    step: tx('3. CONTACTED', '3. సంప్రదించబడింది'),
                    desc: tx('Attendant spoken with; first-aid advice provided.', 'సహాయకుడితో మాట్లాడారు; ప్రథమ చికిత్స సలహా ఇచ్చారు.'),
                    color: 'text-teal-600',
                  },
                  {
                    step: tx('4. DISPATCHED', '4. పంపబడింది'),
                    desc: tx('Specific ambulance vehicle & EMT rolling out.', 'అంబులెన్స్ వాహనం & EMT బయలుదేరాయి.'),
                    color: 'text-rose-600',
                  },
                  {
                    step: tx('5. RESOLVED', '5. పరిష్కరించబడింది'),
                    desc: tx('Patient safely handed over to facility casualty.', 'రోగిని సురక్షితంగా ఆసుపత్రి క్యాజువాలిటీకి అప్పగించారు.'),
                    color: 'text-emerald-600',
                  },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-2.5 text-xs">
                    <span className={`font-bold font-mono ${s.color}`}>{s.step}:</span>
                    <span className="text-slate-600">{s.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* My Active Emergency Tickets */}
            <Card>
              <CardHeader title={tx('My Emergency Tickets', 'నా అత్యవసర టికెట్లు')} subtitle={tx('Live response progress', 'ప్రత్యక్ష స్పందన పురోగతి')} />
              <CardContent className="p-0">
                {requests.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {requests.slice(0, 3).map((r) => {
                      const stageIdx = EMERGENCY_STAGES.findIndex((s) => s.key === r.status);
                      return (
                        <div key={r.id} className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-navy-950">
                              {r.patientCondition.slice(0, 35)}...
                            </span>
                            <Badge
                              variant={
                                r.status === 'RESOLVED'
                                  ? 'emerald'
                                  : r.status === 'DISPATCHED'
                                  ? 'rose'
                                  : 'amber'
                              }
                            >
                              {ts(r.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">{r.locationDescription}</p>

                          {/* 5-Stage Visual Dispatch Progress Stepper */}
                          {stageIdx >= 0 && (
                            <div className="flex items-center justify-between gap-1 pt-1">
                              {EMERGENCY_STAGES.map((st, sIdx) => {
                                const done = sIdx <= stageIdx;
                                const active = sIdx === stageIdx;
                                return (
                                  <div key={st.key} className="flex-1 flex flex-col items-center gap-0.5">
                                    <div
                                      className={`w-full h-1.5 rounded-full transition-colors ${
                                        done
                                          ? st.key === 'RESOLVED'
                                            ? 'bg-emerald-500'
                                            : 'bg-rose-500'
                                          : 'bg-slate-200'
                                      }`}
                                    />
                                    <span
                                      className={`text-[9px] truncate ${
                                        active ? 'font-bold text-navy-950' : done ? 'text-rose-700 font-semibold' : 'text-slate-400'
                                      }`}
                                    >
                                      {lang === 'te' ? st.te : st.en}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {r.assignedAmbulance && (
                            <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700">
                              <strong>{tx('Assigned Ambulance:', 'కేటాయించిన అంబులెన్స్:')}</strong> {r.assignedAmbulance.vehicleNumber} (
                              {r.assignedAmbulance.driverName} - {r.assignedAmbulance.contactNumber})
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{new Date(r.submittedAt).toLocaleTimeString()}</span>
                            <button
                              onClick={() => {
                                setSelectedReq(r);
                                setHistoryModalOpen(true);
                              }}
                              className="text-teal-700 font-semibold hover:underline"
                            >
                              {tx('View Response History', 'స్పందన చరిత్ర చూడండి')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="p-6 text-center text-xs text-slate-500">{tx('No active tickets logged.', 'ప్రస్తుతం సక్రియ టికెట్లు లేవు.')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITALS & ICU BEDS */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-tab-switch">
          {facilities.map((fac, idx) => {
            const availRatio = fac.totalIcuBeds > 0 ? Math.round((fac.icuBedsAvailable / fac.totalIcuBeds) * 100) : 0;
            return (
              <ScrollReveal key={fac.id} delayMs={idx * 50}>
                <Card className="border-slate-200 h-full">
                  <CardHeader
                    title={fac.name}
                    subtitle={fac.address}
                    action={
                      <span className="text-xs font-bold text-teal-700 font-mono">
                        {fac.distanceKm} {tx('km away', 'కి.మీ దూరంలో')}
                      </span>
                    }
                  />
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[11px] text-slate-500">{tx('ICU Beds Free', 'ఖాళీ ICU పడకలు')}</p>
                        <p className="text-base font-bold text-navy-950 mt-0.5">
                          {fac.icuBedsAvailable} / {fac.totalIcuBeds}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[11px] text-slate-500">{tx('Oxygen', 'ఆక్సిజన్')}</p>
                        <p className="text-base font-bold text-emerald-700 mt-0.5">
                          {fac.oxygenAvailable ? tx('Available', 'లభ్యం') : tx('Limited', 'పరిమితం')}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[11px] text-slate-500">{tx('Blood Bank', 'రక్త నిధి')}</p>
                        <p className="text-base font-bold text-slate-800 mt-0.5">
                          {fac.bloodBankAvailable ? tx('24x7 Ready', '24x7 సిద్ధం') : tx('Referral', 'రిఫరల్')}
                        </p>
                      </div>
                    </div>

                    {fac.totalIcuBeds > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>{tx('ICU Vacancy Capacity', 'ICU ఖాళీ సామర్థ్యం')}</span>
                          <span className="font-mono font-semibold text-navy-950">{availRatio}% {tx('Open', 'ఖాళీ')}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${availRatio > 25 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.max(4, availRatio)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500 mr-1.5">{tx('Emergency Desk:', 'అత్యవసర డెస్క్:')}</span>
                        <a href={`tel:${fac.emergencyDeskPhone}`} className="font-semibold text-rose-600">
                          {fac.emergencyDeskPhone}
                        </a>
                      </div>
                      {fac.lastUpdated && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tx('Verified:', 'ధృవీకరించబడింది:')} {new Date(fac.lastUpdated).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* TAB 3: AMBULANCE FLEET */}
      {activeTab === 'ambulances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-tab-switch">
          {ambulances.map((amb, idx) => (
            <ScrollReveal key={amb.id} delayMs={idx * 50}>
              <Card className="border-slate-200 h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-navy-950">{amb.vehicleNumber}</span>
                    <Badge
                      variant={
                        amb.status === 'AVAILABLE'
                          ? 'emerald'
                          : amb.status === 'ON_DUTY'
                          ? 'amber'
                          : 'rose'
                      }
                    >
                      {ts(amb.status)}
                    </Badge>
                  </div>

                  <p className="text-xs text-teal-700 font-semibold">{amb.serviceType.replace(/_/g, ' ')}</p>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>{tx('Base Node:', 'బేస్ కేంద్రం:')}</span>
                      <strong className="text-slate-800">{amb.baseLocation}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{tx('Pilot / Driver:', 'డ్రైవర్:')}</span>
                      <strong className="text-slate-800">{amb.driverName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{tx('Contact:', 'సంప్రదింపు:')}</span>
                      <a href={`tel:${amb.contactNumber}`} className="font-semibold text-teal-700">
                        {amb.contactNumber}
                      </a>
                    </div>
                    {amb.lastStatusUpdate && (
                      <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                        <span>{tx('Last Verified:', 'చివరి ధృవీకరణ:')}</span>
                        <span className="font-mono">{new Date(amb.lastStatusUpdate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {isCoordinator && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {tx('Coordinator Fleet Status Toggle', 'కోఆర్డినేటర్ వాహన స్థితి మార్పు')}
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['AVAILABLE', 'ON_DUTY', 'MAINTENANCE'] as const).map((st) => (
                          <Button
                            key={st}
                            variant={amb.status === st ? 'primary' : 'outline'}
                            size="sm"
                            disabled={amb.status === st}
                            isLoading={updatingAmbId === amb.id}
                            onClick={() => handleToggleAmbulanceStatus(amb.id, st)}
                            className="text-[10px] px-1.5"
                          >
                            {ts(st)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* TAB 4: DIRECTORY HOTLINES */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-tab-switch">
          {contacts.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-navy-950">{c.name}</h4>
                  <p className="text-xs text-teal-700 font-semibold">{c.serviceType.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{c.location}</p>
                </div>
                <div className="text-right">
                  <a
                    href={`tel:${c.phone}`}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> {tx('Call', 'కాల్')} {c.phone}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 5: EMERGENCY COORDINATOR DESK */}
      {activeTab === 'coordinator' && isCoordinator && (
        <div className="space-y-4 animate-tab-switch">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              {tx('108 Emergency Incident Queue & Status Stepper', '108 అత్యవసర ఘటనల క్యూ & స్థితి దశలు')}
            </h2>
            <Badge variant="rose">{tx('Coordinator Console', 'కోఆర్డినేటర్ కన్సోల్')}</Badge>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{tx('Caller & Contact', 'కాలర్ & ఫోన్')}</th>
                    <th className="py-3 px-4">{tx('Condition', 'పరిస్థితి')}</th>
                    <th className="py-3 px-4">{tx('Location & Coordinates', 'స్థలం & కోఆర్డినేట్లు')}</th>
                    <th className="py-3 px-4">{tx('Current Status', 'ప్రస్తుత స్థితి')}</th>
                    <th className="py-3 px-4">{tx('Assigned Vehicle', 'కేటాయించిన వాహనం')}</th>
                    <th className="py-3 px-4 text-right">{tx('Actions', 'చర్యలు')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{r.callerName}</p>
                        <a href={`tel:${r.callerPhone}`} className="text-teal-700 font-semibold">
                          {r.callerPhone}
                        </a>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-rose-900 line-clamp-2">{r.patientCondition}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-800 line-clamp-1">{r.locationDescription}</p>
                        {r.locationConsentGiven && r.latitude && (
                          <p className="text-[10px] font-mono text-teal-700">
                            GPS: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            r.status === 'RESOLVED'
                              ? 'emerald'
                              : r.status === 'DISPATCHED'
                              ? 'rose'
                              : r.status === 'CONTACTED'
                              ? 'teal'
                              : 'amber'
                          }
                        >
                          {ts(r.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {r.assignedAmbulance ? (
                          <span className="font-mono font-semibold text-slate-800">
                            {r.assignedAmbulance.vehicleNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">{tx('None assigned', 'కేటాయించబడలేదు')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedReq(r);
                              setTargetStatus(
                                r.status === 'SUBMITTED'
                                  ? 'ACKNOWLEDGED'
                                  : r.status === 'ACKNOWLEDGED'
                                  ? 'CONTACTED'
                                  : r.status === 'CONTACTED'
                                  ? 'DISPATCHED'
                                  : 'RESOLVED'
                              );
                              setResponderNotes(r.responderNotes || '');
                              setAssignedAmbulanceId(r.assignedAmbulanceId || ambulances[0]?.id || '');
                              setUpdateModalOpen(true);
                            }}
                          >
                            {tx('Step Status', 'స్థితి మార్చు')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReq(r);
                              setHistoryModalOpen(true);
                            }}
                          >
                            {tx('Log', 'లాగ్')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: STATUS STEPPER MODAL */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title={tx('Emergency Dispatch Status Stepper', 'అత్యవసర డిస్పాచ్ స్థితి స్టెప్పర్')}
        subtitle={selectedReq ? `${tx('Caller:', 'కాలర్:')} ${selectedReq.callerName} (${selectedReq.callerPhone})` : ''}
      >
        <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
          <Select
            label={tx('Next Status Step', 'తదుపరి స్థితి దశ')}
            options={[
              { value: 'ACKNOWLEDGED', label: tx('ACKNOWLEDGED (Triage Initiated)', 'స్వీకరించబడింది (ట్రయాజ్ ప్రారంభం)') },
              { value: 'CONTACTED', label: tx('CONTACTED (Caller Advised by Phone)', 'సంప్రదించబడింది (ఫోన్‌లో సలహా)') },
              { value: 'DISPATCHED', label: tx('DISPATCHED (Ambulance Rolling Out)', 'పంపబడింది (అంబులెన్స్ బయలుదేరింది)') },
              { value: 'RESOLVED', label: tx('RESOLVED (Delivered to Hospital Casualty)', 'పరిష్కరించబడింది (ఆసుపత్రికి చేర్చారు)') },
              { value: 'UNAVAILABLE', label: tx('UNAVAILABLE (Referred to Regional Base)', 'లభ్యం లేదు (ప్రాంతీయ బేస్‌కు రిఫర్)') },
              { value: 'CANCELLED', label: tx('CANCELLED (Call Cancelled / Resolved by Attendant)', 'రద్దు చేయబడింది (సహాయకుడు రద్దు చేశారు)') },
            ]}
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
          />

          <Select
            label={tx('Assign Ambulance Vehicle', 'అంబులెన్స్ వాహనాన్ని కేటాయించండి')}
            options={[
              { value: '', label: tx('-- Select Ambulance --', '-- అంబులెన్స్ ఎంచుకోండి --') },
              ...ambulances.map((a) => ({
                value: a.id,
                label: `${a.vehicleNumber} (${a.serviceType}) - ${ts(a.status)}`,
              })),
            ]}
            value={assignedAmbulanceId}
            onChange={(e) => setAssignedAmbulanceId(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              {tx('Responder Action Log & Clinical Notes', 'రెస్పాండర్ చర్య లాగ్ & క్లినికల్ నోట్స్')} <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={responderNotes}
              onChange={(e) => setResponderNotes(e.target.value)}
              placeholder={tx(
                'e.g. Telephonic triage performed; instructed caller to keep patient sitting upright; Ambulance AP 07 TX 1081 rolling with EMT Paramedic...',
                'ఉదా. ఫోన్ ట్రయాజ్ నిర్వహించబడింది; రోగిని కూర్చోబెట్టాలని సూచించబడింది; అంబులెన్స్ AP 07 TX 1081 EMTతో బయలుదేరింది...'
              )}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setUpdateModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={updatingStatus}>
              {tx('Commit Status Progression', 'స్థితి పురోగతిని నమోదు చేయండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RESPONSE HISTORY LOG */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={tx('Emergency Incident Milestones Log', 'అత్యవసర ఘటన మైలురాళ్ళ లాగ్')}
        subtitle={selectedReq ? `${tx('Incident:', 'ఘటన:')} ${selectedReq.patientCondition.slice(0, 40)}...` : ''}
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100">
            {(() => {
              let logs = [];
              try {
                logs = JSON.parse(selectedReq?.responseLog || '[]');
              } catch {
                logs = [];
              }
              return logs.length > 0 ? (
                logs.map((log: any, idx: number) => (
                  <div key={idx} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="teal" size="sm">
                        {ts(log.status)}
                      </Badge>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{log.note}</p>
                    {log.officer && (
                      <p className="text-[10px] text-slate-400">{tx('Logged by:', 'నమోదు చేసినవారు:')} {log.officer}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-3">{tx('No history entries logged.', 'చరిత్ర ఎంట్రీలు లేవు.')}</p>
              );
            })()}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
              {tx('Close', 'మూసివేయండి')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
