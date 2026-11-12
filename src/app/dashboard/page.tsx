import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  HeartPulse,
  Pill,
  PhoneCall,
  Droplets,
  Recycle,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  UserCheck,
  Stethoscope,
  ChevronRight,
  PlusCircle,
  FileText,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isTe = cookies().get('hb360_lang')?.value === 'te';
  const tx = (en: string, te: string) => (isTe ? te : en);

  if (!user) {
    redirect('/login?demo=true');
  }

  // Fetch contextual user-specific records
  const [
    myAppointments,
    mySanitationComplaints,
    myEmergencyRequests,
    userSection,
    pendingAppointmentsCount,
    lowStockMedicines,
    activeEmergencyRequests,
    unassignedComplaintsCount,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: user.role === 'RESIDENT' ? { residentId: user.id } : {},
      include: { doctor: true, healthCenter: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.sanitationComplaint.findMany({
      where: user.role === 'RESIDENT' ? { residentId: user.id } : {},
      orderBy: { submittedAt: 'desc' },
      take: 5,
    }),
    prisma.emergencyRequest.findMany({
      where: user.role === 'RESIDENT' ? { residentId: user.id } : {},
      orderBy: { submittedAt: 'desc' },
      take: 3,
    }),
    user.sectionId
      ? prisma.waterSection.findUnique({
          where: { id: user.sectionId },
          include: {
            schedules: { take: 1 },
            supplyRecords: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        })
      : null,
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.medicine.findMany({
      include: { batches: true },
    }),
    prisma.emergencyRequest.findMany({
      where: { status: { in: ['SUBMITTED', 'ACKNOWLEDGED', 'CONTACTED', 'DISPATCHED'] } },
      take: 4,
    }),
    prisma.sanitationComplaint.count({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
    }),
  ]);

  const lowStockCount = lowStockMedicines.filter((m) => {
    const valid = m.batches
      .filter((b) => b.expiryDate > '2026-11-12' && !b.isQuarantined)
      .reduce((s, b) => s + b.currentQuantity, 0);
    return valid > 0 && valid <= m.minThreshold;
  }).length;

  const isStaffOrAdmin = user.role !== 'RESIDENT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up">
      {/* 1. Header Profile Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-navy-900 via-teal-500 to-sky-500" />
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-900 to-teal-700 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 font-display">{user.name}</h1>
              <Badge
                variant={
                  user.role === 'ADMIN'
                    ? 'purple'
                    : user.role === 'RESIDENT'
                    ? 'emerald'
                    : user.role === 'HEALTHCARE_STAFF'
                    ? 'sky'
                    : user.role === 'MEDICINE_STAFF'
                    ? 'amber'
                    : user.role === 'EMERGENCY_COORDINATOR'
                    ? 'rose'
                    : 'teal'
                }
              >
                {user.role.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>{user.email}</span>
              <span>•</span>
              <span>{user.phone}</span>
              {user.sectionId && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-teal-700">
                    {tx(`Kantheru Section ${user.sectionId}`, `కంతేరు విభాగం ${user.sectionId}`)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {tx('Panchayat Administration', 'పంచాయతీ పరిపాలన')}
            </Link>
          )}
          <Link
            href="/intelligence"
            className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {tx('Operational Intelligence', 'కార్యకలాపాల సమాచారం')}
          </Link>
          <Link
            href="/login?demo=true"
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            {tx('Switch Role', 'పాత్ర మార్చండి')}
          </Link>
        </div>
      </div>

      {/* 2. Authority Action Banners (Visible to Staff & Admins) */}
      {isStaffOrAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-600" />
              {tx('Administrative & Operational Queue', 'పరిపాలన & కార్యకలాపాల క్యూ')}
            </h2>
            <span className="text-xs text-slate-500">{tx('Live system status across all modules', 'అన్ని విభాగాల లైవ్ స్థితి')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action 1: Pending Appointments */}
            <Link
              href="/healthcare"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{tx('Pending Appointments', 'పెండింగ్ అపాయింట్‌మెంట్లు')}</span>
                <Badge variant={pendingAppointmentsCount > 0 ? 'amber' : 'slate'}>
                  {pendingAppointmentsCount} {tx('Requests', 'అభ్యర్థనలు')}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-navy-950 mt-2">{pendingAppointmentsCount}</p>
              <p className="text-[11px] text-sky-700 mt-1 flex items-center gap-1">
                {tx('Review & Approve OPD Slots', 'OPD స్లాట్లను పరిశీలించండి')} <ArrowRight className="w-3 h-3" />
              </p>
            </Link>

            {/* Action 2: Low Stock Medicines */}
            <Link
              href="/medicines"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{tx('Medicine Stock Alerts', 'మందుల నిల్వ హెచ్చరికలు')}</span>
                <Badge variant={lowStockCount > 0 ? 'rose' : 'emerald'}>
                  {lowStockCount > 0 ? `${lowStockCount} ${tx('Low', 'తక్కువ')}` : tx('Normal', 'సాధారణం')}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-navy-950 mt-2">{lowStockCount}</p>
              <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                {tx('Manage FEFO Batches', 'FEFO బ్యాచ్‌లను నిర్వహించండి')} <ArrowRight className="w-3 h-3" />
              </p>
            </Link>

            {/* Action 3: Active Emergency Requests */}
            <Link
              href="/emergency"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{tx('Active Emergencies', 'యాక్టివ్ అత్యవసరాలు')}</span>
                <Badge variant={activeEmergencyRequests.length > 0 ? 'rose' : 'slate'}>
                  {activeEmergencyRequests.length} {tx('Active', 'యాక్టివ్')}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-rose-600 mt-2">{activeEmergencyRequests.length}</p>
              <p className="text-[11px] text-rose-700 mt-1 flex items-center gap-1">
                {tx('Ambulance Dispatch Desk', 'అంబులెన్స్ డిస్పాచ్ డెస్క్')} <ArrowRight className="w-3 h-3" />
              </p>
            </Link>

            {/* Action 4: Unassigned Sanitation Complaints */}
            <Link
              href="/sanitation"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{tx('Sanitation Complaints', 'పారిశుధ్య ఫిర్యాదులు')}</span>
                <Badge variant={unassignedComplaintsCount > 0 ? 'amber' : 'emerald'}>
                  {unassignedComplaintsCount} {tx('Pending', 'పెండింగ్')}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-navy-950 mt-2">{unassignedComplaintsCount}</p>
              <p className="text-[11px] text-teal-700 mt-1 flex items-center gap-1">
                {tx('Assign Sanitation Squads', 'పారిశుధ్య బృందాలను పంపండి')} <ArrowRight className="w-3 h-3" />
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* 3. Section Water Status (Tailored to Resident's Ward) */}
      {userSection && (
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50/50 via-white to-sky-50/50">
          <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-navy-950">
                    {tx('Your Water Supply Zone: Section', 'మీ త్రాగునీటి విభాగం: సెక్షన్')} {userSection.id} ({userSection.name.split(' - ')[1] || userSection.name})
                  </h3>
                  <Badge variant="teal">{tx('Connected', 'అనుసంధానితమైంది')}</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {tx('Scheduled Daily Timing:', 'రోజువారీ నీటి సమయం:')}{' '}
                  <strong>
                    {userSection.schedules[0]
                      ? `${userSection.schedules[0].scheduledStartTime} - ${userSection.schedules[0].scheduledEndTime}`
                      : '06:00 - 08:30'}
                  </strong>{' '}
                  • {tx('Pump Operator:', 'పంప్ ఆపరేటర్:')} {userSection.pumpOperatorName} ({userSection.pumpOperatorPhone})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/water"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center gap-1"
              >
                {tx('Water Schedules & Lab Reports', 'నీటి సమయాలు & ల్యాబ్ నివేదికలు')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Resident Quick Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/healthcare"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{tx('Book Doctor OPD', 'డాక్టర్ OPD బుక్ చేయండి')}</h4>
            <p className="text-[11px] text-slate-500">{tx('Kantheru PHC & CHC', 'కంతేరు PHC & CHC')}</p>
          </div>
        </Link>

        <Link
          href="/sanitation"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{tx('Report Sanitation Issue', 'పారిశుధ్య సమస్య నివేదించండి')}</h4>
            <p className="text-[11px] text-slate-500">{tx('Drainage, Sewage, Waste', 'డ్రైనేజీ, మురుగు, చెత్త')}</p>
          </div>
        </Link>

        <Link
          href="/emergency"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{tx('Request Emergency Triage', 'అత్యవసర 108 సహాయం కోరండి')}</h4>
            <p className="text-[11px] text-slate-500">{tx('Location-aided 108 ticket', 'లొకేషన్ ఆధారిత 108 టికెట్')}</p>
          </div>
        </Link>

        <Link
          href="/medicines"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{tx('Search Available Medicines', 'అందుబాటులో ఉన్న మందులు వెతకండి')}</h4>
            <p className="text-[11px] text-slate-500">{tx('Verified PHC stock availability', 'PHC మందుల నిల్వ వివరాలు')}</p>
          </div>
        </Link>
      </div>

      {/* 5. Two-column detailed tracking tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: My Appointments */}
        <Card>
          <CardHeader
            title={tx('My Healthcare Appointments', 'నా వైద్య అపాయింట్‌మెంట్లు')}
            subtitle={tx('Status of your clinic bookings at Kantheru PHC & CHC', 'కంతేరు PHC & CHC వద్ద మీ క్లినిక్ బుకింగ్‌ల స్థితి')}
            action={
              <Link href="/healthcare" className="text-xs font-semibold text-teal-700 hover:underline">
                {tx('Book New', 'కొత్తది బుక్ చేయండి')}
              </Link>
            }
          />
          <CardContent className="p-0">
            {myAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {myAppointments.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-navy-950">{app.doctor.name}</span>
                        <span className="text-[11px] text-slate-500">({app.doctor.specialization})</span>
                      </div>
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
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">{app.reason}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        {app.appointmentDate} • {app.timeSlot}
                      </span>
                      <span>{app.healthCenter.name.split(' (')[0]}</span>
                    </div>

                    {app.staffNotes && (
                      <p className="text-[11px] text-slate-600 bg-slate-100 p-2 rounded mt-1 border-l-2 border-teal-600">
                        <strong>OPD Note:</strong> {app.staffNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs">{tx('No appointment bookings found.', 'అపాయింట్‌మెంట్ బుకింగ్‌లు కనుగొనబడలేదు.')}</p>
                <Link
                  href="/healthcare"
                  className="inline-block text-xs font-semibold text-teal-700 hover:underline"
                >
                  {tx('Schedule an OPD appointment', 'OPD అపాయింట్‌మెంట్ బుక్ చేయండి')}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: My Sanitation Reports */}
        <Card>
          <CardHeader
            title={tx('My Sanitation Complaints', 'నా పారిశుధ్య ఫిర్యాదులు')}
            subtitle={tx('Real-time status & explainable priority tracking', 'లైవ్ స్థితి & ప్రాధాన్యత ట్రాకింగ్')}
            action={
              <Link href="/sanitation" className="text-xs font-semibold text-teal-700 hover:underline">
                {tx('File Complaint', 'ఫిర్యాదు చేయండి')}
              </Link>
            }
          />
          <CardContent className="p-0">
            {mySanitationComplaints.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {mySanitationComplaints.map((comp) => (
                  <div key={comp.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-navy-950">
                        {comp.category.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            comp.calculatedPriority === 'CRITICAL'
                              ? 'rose'
                              : comp.calculatedPriority === 'HIGH'
                              ? 'amber'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {comp.calculatedPriority}
                        </Badge>
                        <Badge
                          variant={
                            comp.status === 'RESOLVED'
                              ? 'emerald'
                              : comp.status === 'ASSIGNED' || comp.status === 'IN_PROGRESS'
                              ? 'teal'
                              : 'amber'
                          }
                          size="sm"
                        >
                          {comp.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">{comp.description}</p>

                    <div className="p-2 rounded bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
                      <strong className="text-slate-700">Priority Engine:</strong> {comp.priorityReason}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-600" />
                        {comp.location} (Section {comp.sectionId})
                      </span>
                      <span>{new Date(comp.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Recycle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs">{tx('No active sanitation complaints logged.', 'యాక్టివ్ పారిశుధ్య ఫిర్యాదులు లేవు.')}</p>
                <Link
                  href="/sanitation"
                  className="inline-block text-xs font-semibold text-teal-700 hover:underline"
                >
                  {tx('Report a street issue or drainage overflow', 'వీధి సమస్య లేదా డ్రైనేజీ పొంగు నివేదించండి')}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
