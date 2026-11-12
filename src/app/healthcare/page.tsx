'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Stethoscope,
  Building2,
  CalendarCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/ui/Motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateSlotsFromSchedules(schedules: any[]): string[] {
  if (!schedules || schedules.length === 0) {
    return ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '11:00 - 11:30', '12:00 - 12:30'];
  }
  const first = schedules[0];
  const [sh] = (first.startTime || '09:00').split(':').map(Number);
  const [eh] = (first.endTime || '13:00').split(':').map(Number);
  const slots: string[] = [];
  for (let h = sh; h < eh; h++) {
    const pad = (n: number) => String(n).padStart(2, '0');
    slots.push(`${pad(h)}:00 - ${pad(h)}:30`);
    slots.push(`${pad(h)}:30 - ${pad(h + 1)}:00`);
  }
  return slots.length > 0 ? slots : ['09:30 - 10:00'];
}

export default function HealthcarePage() {
  const { lang, t, tx, ts } = useLanguage();
  const [activeTab, setActiveTab] = useState<'doctors' | 'appointments' | 'facilities' | 'camps'>('doctors');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [centers, setCenters] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState('2026-11-16');
  const [bookingSlot, setBookingSlot] = useState('09:30 - 10:00');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingPriority, setBookingPriority] = useState('NORMAL');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Camp Registration Modal
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<any>(null);
  const [campAttendeeName, setCampAttendeeName] = useState('');
  const [campPhone, setCampPhone] = useState('');
  const [campAge, setCampAge] = useState('45');
  const [campGender, setCampGender] = useState('Female');
  const [campSubmitting, setCampSubmitting] = useState(false);
  const [campSuccess, setCampSuccess] = useState('');

  // Staff Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED' | 'RESCHEDULED' | 'COMPLETED'>('APPROVED');
  const [staffNote, setStaffNote] = useState('');
  const [reschedDate, setReschedDate] = useState('');
  const [reschedSlot, setReschedSlot] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Search & filter
  const [doctorSearch, setDoctorSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [userRes, appRes, dirRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/healthcare/appointments').then((r) => (r.ok ? r.json() : { appointments: [] })),
        fetch('/api/healthcare/directory').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (userRes?.user) {
        setCurrentUser(userRes.user);
        setCampAttendeeName(userRes.user.name || '');
        setCampPhone(userRes.user.phone || '');
      }

      setAppointments(appRes.appointments || []);

      if (dirRes) {
        setCenters(
          (dirRes.centers || []).map((c: any) => ({
            ...c,
            hours: c.operatingHours,
            services: c.servicesList || [],
          }))
        );
        setDoctors(
          (dirRes.doctors || []).map((d: any) => {
            const dayLabels =
              d.schedules && d.schedules.length > 0
                ? d.schedules.map((s: any) => DAY_NAMES[s.dayOfWeek] || '').filter(Boolean).join(', ')
                : 'Mon - Sat (PHC Roster)';
            const hoursRange =
              d.schedules && d.schedules.length > 0
                ? `${d.schedules[0].startTime} - ${d.schedules[0].endTime}`
                : '09:00 - 13:00';
            return {
              ...d,
              centerId: d.healthCenterId,
              centerName: d.healthCenter?.name || 'Kantheru PHC',
              experience: `${d.experienceYears} Years Experience`,
              slots: generateSlotsFromSchedules(d.schedules),
              days: `${dayLabels} (${hoursRange})`,
            };
          })
        );
        setCamps(
          (dirRes.camps || []).map((camp: any) => ({
            ...camp,
            date: camp.campDate,
            time: `${camp.startTime} - ${camp.endTime}`,
            doctors: camp.doctorsAttending,
            capacity: `${camp.maxCapacity} Attendees`,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (doc: any) => {
    setSelectedDoctor(doc);
    setBookingSlot(doc.slots[0] || '09:30 - 10:00');
    setBookingReason('');
    setBookingError('');
    setBookingSuccess('');
    setIsBookingOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBooking(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      const res = await fetch('/api/healthcare/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          healthCenterId: selectedDoctor.centerId,
          appointmentDate: bookingDate,
          timeSlot: bookingSlot,
          reason: bookingReason,
          priority: bookingPriority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit appointment request');

      setBookingSuccess('Appointment requested successfully! The PHC OPD staff will review and confirm.');
      setTimeout(() => {
        setIsBookingOpen(false);
        fetchInitialData();
        setActiveTab('appointments');
      }, 1500);
    } catch (err: any) {
      setBookingError(err.message || 'Error occurred while scheduling appointment');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleStaffUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);

    try {
      const res = await fetch('/api/healthcare/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAppointment.id,
          status: reviewStatus,
          staffNotes: staffNote,
          rescheduledDate: reviewStatus === 'RESCHEDULED' ? reschedDate : undefined,
          rescheduledSlot: reviewStatus === 'RESCHEDULED' ? reschedSlot : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update appointment');

      setReviewModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRegisterCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampSubmitting(true);
    try {
      const res = await fetch('/api/healthcare/camps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campId: selectedCamp.id,
          attendeeName: campAttendeeName,
          phone: campPhone,
          age: Number(campAge),
          gender: campGender,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Camp registration failed');

      setCampSuccess(`Registration confirmed for ${campAttendeeName}! Present phone number at registration counter.`);
      setTimeout(() => {
        setIsCampModalOpen(false);
        setCampSuccess('');
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCampSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.bio.toLowerCase().includes(doctorSearch.toLowerCase());
    const matchesSpec = specializationFilter === 'ALL' || doc.specialization === specializationFilter;
    return matchesSearch && matchesSpec;
  });

  const isStaff = currentUser && currentUser.role !== 'RESIDENT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center shadow-sm">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 key={lang} className="text-2xl font-extrabold text-navy-950 font-display animate-lang-swap">
                  {t('page.healthcare.title')}
                </h1>
                <Badge variant="sky">{t('mod1.badge')}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t('page.healthcare.sub')}</p>
            </div>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'doctors' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx('Doctors & OPD', 'వైద్యులు & OPD')}
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'appointments' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx('Appointments', 'అపాయింట్‌మెంట్లు')} ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'facilities' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx('Health Centres', 'వైద్య కేంద్రాలు')}
          </button>
          <button
            onClick={() => setActiveTab('camps')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'camps' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tx('Health Camps', 'ఆరోగ్య శిబిరాలు')} ({camps.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DOCTORS & OPD BOOKING */}
      {activeTab === 'doctors' && (
        <div className="space-y-6 animate-tab-switch">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={tx('Search doctors, specialization...', 'వైద్యులు, విభాగం ద్వారా వెతకండి...')}
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 shrink-0">{tx('Specialization:', 'విభాగం:')}</span>
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">{tx('All Specializations', 'అన్ని విభాగాలు')}</option>
                {Array.from(new Set(doctors.map((d) => d.specialization))).map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDoctors.map((doc, idx) => (
              <ScrollReveal key={doc.id} direction="up" delayMs={idx * 70}>
                <Card hoverEffect className="h-full border-slate-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-navy-950 font-display">{doc.name}</h3>
                          <p className="text-xs font-semibold text-teal-700">{doc.specialization}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.qualification} • {doc.experience}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.isAvailable !== false ? 'emerald' : 'amber'} size="sm">
                        {doc.isAvailable !== false ? tx('ON DUTY', 'విధిలో ఉన్నారు') : tx('OFF SHIFT', 'సెలవులో ఉన్నారు')}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{doc.bio}</p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Facility:', 'ఆసుపత్రి:')}</span>
                        <span className="font-semibold text-slate-800">{doc.centerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('OPD Schedule:', 'OPD వేళలు:')}</span>
                        <span className="font-semibold text-slate-800 text-right">{doc.days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Council Reg:', 'నమోదు సంఖ్య:')}</span>
                        <span className="font-mono text-slate-600">{doc.regNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{tx('Consultation Fee:', 'ఫీజు:')}</span>
                        <span className="font-semibold text-emerald-700">{tx('₹0 (Free Govt Service)', '₹0 (ఉచిత ప్రభుత్వ సేవ)')}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenBooking(doc)}
                        icon={<Calendar className="w-3.5 h-3.5" />}
                      >
                        {tx('Book OPD Consultation', 'OPD అపాయింట్‌మెంట్ బుక్ చేయండి')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS TRACKER & STAFF APPROVALS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4 animate-tab-switch">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                {isStaff
                  ? tx('All Panchayat OPD Requests & Status Management', 'అన్ని పంచాయతీ OPD అభ్యర్థనలు & నిర్వహణ')
                  : tx('My Healthcare Appointments', 'నా వైద్య అపాయింట్‌మెంట్లు')}
              </h2>
              <p className="text-xs text-slate-500">
                {isStaff
                  ? tx(
                      'Healthcare staff dashboard: Review resident submissions, approve slots, reschedule, or complete consultations.',
                      'సిబ్బంది డ్యాష్‌బోర్డ్: రోగుల అభ్యర్థనలను ఆమోదించండి, సమయాన్ని మార్చండి లేదా పూర్తి చేయండి.'
                    )
                  : tx(
                      'Track the real-time approval, rescheduling, or completion status of your clinic appointments.',
                      'మీ క్లినిక్ అపాయింట్‌మెంట్ ఆమోదం మరియు స్థితిని లైవ్‌లో చూడండి.'
                    )}
              </p>
            </div>
            {!isStaff && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('doctors')}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {tx('Schedule Appointment', 'అపాయింట్‌మెంట్ బుక్ చేయండి')}
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {appointments.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">{tx('Patient / Resident', 'రోగి / నివాసి')}</th>
                      <th className="py-3 px-4">{tx('Doctor & Facility', 'వైద్యులు & కేంద్రం')}</th>
                      <th className="py-3 px-4">{tx('Requested Slot', 'కోరిన సమయం')}</th>
                      <th className="py-3 px-4">{tx('Priority / Reason', 'ప్రాధాన్యత / కారణం')}</th>
                      <th className="py-3 px-4">{tx('Status', 'స్థితి')}</th>
                      <th className="py-3 px-4 text-right">{tx('Actions', 'చర్యలు')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{app.resident?.name || 'Resident'}</p>
                          <p className="text-[11px] text-slate-500">{app.resident?.phone || 'Phone verified'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{app.doctor?.name}</p>
                          <p className="text-[11px] text-teal-700">{app.doctor?.specialization}</p>
                          <p className="text-[10px] text-slate-400">{app.healthCenter?.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{app.appointmentDate}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{app.timeSlot}</p>
                          {app.rescheduledDate && (
                            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              Rescheduled: {app.rescheduledDate} ({app.rescheduledSlot})
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <Badge
                            variant={
                              app.priority === 'URGENT'
                                ? 'rose'
                                : app.priority === 'MATERNAL'
                                ? 'purple'
                                : app.priority === 'SENIOR_CITIZEN'
                                ? 'amber'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {app.priority}
                          </Badge>
                          <p className="text-xs text-slate-700 mt-1 line-clamp-1">{app.reason}</p>
                          {app.staffNotes && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">Note: {app.staffNotes}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              app.status === 'APPROVED'
                                ? 'emerald'
                                : app.status === 'PENDING'
                                ? 'amber'
                                : app.status === 'COMPLETED'
                                ? 'teal'
                                : 'rose'
                            }
                          >
                            {ts(app.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isStaff ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAppointment(app);
                                setReviewStatus(app.status === 'PENDING' ? 'APPROVED' : app.status);
                                setStaffNote(app.staffNotes || '');
                                setReschedDate(app.appointmentDate);
                                setReschedSlot(app.timeSlot);
                                setReviewModalOpen(true);
                              }}
                            >
                              {tx('Update Status', 'స్థితిని అప్‌డేట్ చేయండి')}
                            </Button>
                          ) : app.status === 'PENDING' ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={async () => {
                                if (confirm(tx('Are you sure you want to cancel this appointment request?', 'ఈ అపాయింట్‌మెంట్ అభ్యర్థనను రద్దు చేయాలనుకుంటున్నారా?'))) {
                                  await fetch('/api/healthcare/appointments', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: app.id, status: 'CANCELLED' }),
                                  });
                                  fetchInitialData();
                                }
                              }}
                            >
                              {tx('Cancel', 'రద్దు')}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">{tx('Locked', 'లాక్ చేయబడింది')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs">{tx('No appointment records found in database.', 'అపాయింట్‌మెంట్ రికార్డులు కనుగొనబడలేదు.')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: HEALTH CENTRES DIRECTORY */}
      {activeTab === 'facilities' && (
        <div className="space-y-6 animate-tab-switch">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {centers.map((c) => (
              <Card key={c.id} className="border-slate-200">
                <CardHeader
                  title={c.name}
                  subtitle={c.type}
                  action={<Badge variant="teal">{tx('Verified Government Facility', 'ధృవీకరించిన ప్రభుత్వ ఆసుపత్రి')}</Badge>}
                />
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{c.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{tx('Operating Hours:', 'పని వేళలు:')} <strong>{c.hours}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{tx('Regular Desk:', 'సాధారణ డెస్క్:')} <a href={`tel:${c.phone}`} className="text-teal-700 font-semibold">{c.phone}</a></span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-600 font-semibold">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{tx('Emergency 24x7 Line:', '24x7 అత్యవసర లైన్:')} <a href={`tel:${c.emergencyPhone}`}>{c.emergencyPhone}</a></span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{tx('Available Clinical Services:', 'అందుబాటులో ఉన్న వైద్య సేవలు:')}</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {c.services.map((s: string) => (
                        <span key={s} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HEALTH CAMPS */}
      {activeTab === 'camps' && (
        <div className="space-y-6 animate-tab-switch">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {camps.map((camp, idx) => {
              const registeredCount = camp.registeredCount || 0;
              const maxCap = camp.maxCapacity || 150;
              const pct = Math.min(100, Math.round((registeredCount / maxCap) * 100));
              return (
                <ScrollReveal key={camp.id} direction="up" delayMs={idx * 80}>
                  <Card hoverEffect className="h-full border-sky-200 bg-sky-50/20">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-extrabold text-navy-950 font-display">{camp.title}</h3>
                        <Badge variant={camp.isUserRegistered ? 'emerald' : 'sky'}>
                          {camp.isUserRegistered ? tx('Registered', 'నమోదైంది') : camp.status || tx('Scheduled', 'షెడ్యూల్డ్')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{camp.description}</p>
                      <div className="p-3.5 rounded-xl bg-white border border-sky-100 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-sky-600" />
                          <span className="font-semibold text-slate-800">{camp.date}</span>
                          <span className="text-slate-500 font-mono">({camp.time})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-sky-600" />
                          <span className="text-slate-700">{camp.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-sky-600" />
                          <span className="text-slate-700">{camp.doctors}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">{tx('Confirmed Attendees', 'నమోదు చేసుకున్నవారు')}</span>
                            <span className="font-mono font-bold text-sky-800">
                              {registeredCount} / {maxCap}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-teal-500 rounded-full animate-grow-width"
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        variant={camp.isUserRegistered ? 'outline' : 'secondary'}
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedCamp(camp);
                          setIsCampModalOpen(true);
                        }}
                      >
                        {camp.isUserRegistered ? tx('Register Another Family Member', 'మరో కుటుంబ సభ్యుడిని నమోదు చేయండి') : tx('Register Free for Camp', 'శిబిరానికి ఉచితంగా నమోదు చేయండి')}
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: BOOKING MODAL */}
      <Modal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={tx('Request Doctor Appointment', 'డాక్టర్ అపాయింట్‌మెంట్ అభ్యర్థించండి')}
        subtitle={selectedDoctor ? `${selectedDoctor.name} (${selectedDoctor.specialization}) • ${selectedDoctor.centerName}` : ''}
      >
        <form onSubmit={handleSubmitBooking} className="space-y-4">
          {bookingError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {bookingSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bookingSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={tx('Consultation Date', 'సంప్రదింపు తేదీ')}
              type="date"
              required
              min="2026-11-13"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />

            <Select
              label={tx('OPD Time Slot', 'OPD సమయం')}
              options={
                selectedDoctor?.slots.map((s: string) => ({ value: s, label: s })) || [
                  { value: '09:30 - 10:00', label: '09:30 - 10:00' },
                ]
              }
              value={bookingSlot}
              onChange={(e) => setBookingSlot(e.target.value)}
            />
          </div>

          <Select
            label={tx('Patient Priority Category', 'రోగి ప్రాధాన్యత విభాగం')}
            options={[
              { value: 'NORMAL', label: tx('Normal Routine OPD Consultation', 'సాధారణ OPD సంప్రదింపు') },
              { value: 'URGENT', label: tx('Urgent Acute Symptoms (High Fevers, Severe Pain)', 'అత్యవసర లక్షణాలు (తీవ్ర జ్వరం, నొప్పి)') },
              { value: 'SENIOR_CITIZEN', label: tx('Senior Citizen Priority (>60 Years)', 'సీనియర్ సిటిజన్ (>60 ఏళ్లు)') },
              { value: 'MATERNAL', label: tx('Maternal / Antenatal Checkup', 'గర్భవతి / మాతృత్వ తనిఖీ') },
            ]}
            value={bookingPriority}
            onChange={(e) => setBookingPriority(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              {tx('Reason for Visit / Symptoms', 'లక్షణాలు / కారణం')} <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
              placeholder={tx('Describe symptoms, duration, or regular medicine refill requirement...', 'మీ లక్షణాలు లేదా మందుల అవసరాన్ని వివరించండి...')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBookingOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submittingBooking}>
              {tx('Confirm Booking Request', 'అభ్యర్థన పంపండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: STAFF REVIEW MODAL */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={tx('Review & Manage Appointment', 'అపాయింట్‌మెంట్‌ను పరిశీలించండి')}
        subtitle={`${tx('Patient:', 'రోగి:')} ${selectedAppointment?.resident?.name || 'Resident'} • ${tx('Doctor:', 'వైద్యులు:')} ${selectedAppointment?.doctor?.name}`}
      >
        <form onSubmit={handleStaffUpdateAppointment} className="space-y-4">
          <Select
            label={tx('Update Booking Status', 'స్థితిని మార్చండి')}
            options={[
              { value: 'APPROVED', label: tx('Approve Appointment Slot', 'అపాయింట్‌మెంట్ ఆమోదించండి') },
              { value: 'RESCHEDULED', label: tx('Reschedule to Alternate Date/Time', 'మరో తేదీ/సమయానికి మార్చండి') },
              { value: 'COMPLETED', label: tx('Mark Consultation as Completed', 'పరీక్ష పూర్తయినట్లు గుర్తించండి') },
              { value: 'REJECTED', label: tx('Reject / Cancel Request', 'తిరస్కరించు / రద్దు చేయి') },
            ]}
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value as any)}
          />

          {reviewStatus === 'RESCHEDULED' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Input
                label={tx('New Date', 'కొత్త తేదీ')}
                type="date"
                required
                value={reschedDate}
                onChange={(e) => setReschedDate(e.target.value)}
              />
              <Input
                label={tx('New Time Slot', 'కొత్త సమయం')}
                type="text"
                required
                value={reschedSlot}
                onChange={(e) => setReschedSlot(e.target.value)}
                placeholder="11:30 - 12:00"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              {tx('OPD Staff Note / Instructions to Patient', 'రోగికి OPD సిబ్బంది సూచనలు')}
            </label>
            <textarea
              rows={3}
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              placeholder={tx('e.g. Please bring previous lab reports and arrive 15 minutes before scheduled slot.', 'ఉదా: పాత రిపోర్టులతో 15 నిమిషాలు ముందుగా రండి.')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={reviewSubmitting}>
              {tx('Save Status Update', 'మార్పులను సేవ్ చేయండి')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: CAMP REGISTRATION */}
      <Modal
        isOpen={isCampModalOpen}
        onClose={() => setIsCampModalOpen(false)}
        title={tx('Health Camp Registration', 'ఆరోగ్య శిబిర నమోదు')}
        subtitle={selectedCamp?.title}
      >
        <form onSubmit={handleRegisterCamp} className="space-y-4">
          {campSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{campSuccess}</span>
            </div>
          )}

          <Input
            label={tx('Attendee Full Name', 'హాజరయ్యే వారి పూర్తి పేరు')}
            required
            value={campAttendeeName}
            onChange={(e) => setCampAttendeeName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tx('Contact Phone', 'ఫోన్ నంబర్')}
              required
              value={campPhone}
              onChange={(e) => setCampPhone(e.target.value)}
            />

            <Input
              label={tx('Age (Years)', 'వయస్సు (సంవత్సరాలు)')}
              type="number"
              required
              value={campAge}
              onChange={(e) => setCampAge(e.target.value)}
            />
          </div>

          <Select
            label={tx('Gender', 'లింగం')}
            options={[
              { value: 'Female', label: tx('Female', 'స్త్రీ') },
              { value: 'Male', label: tx('Male', 'పురుషుడు') },
              { value: 'Other', label: tx('Other', 'ఇతరులు') },
            ]}
            value={campGender}
            onChange={(e) => setCampGender(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCampModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="secondary" size="sm" isLoading={campSubmitting}>
              {tx('Confirm Camp Registration', 'నమోదు నిర్ధారించండి')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
