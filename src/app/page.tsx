import React from 'react';
import Link from 'next/link';
import {
  HeartPulse,
  Pill,
  PhoneCall,
  Droplets,
  Recycle,
  BarChart3,
  Shield,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Activity,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollReveal, AnimatedCounter, LiveEcgWave } from '@/components/ui/Motion';

export const revalidate = 0; // Dynamic server component

export default async function HomePage() {
  // Fetch real database records for live overview
  const [
    centersCount,
    doctorsCount,
    upcomingCamps,
    medicines,
    waterSections,
    recentSupply,
    ambulances,
    recentSanitation,
  ] = await Promise.all([
    prisma.healthCenter.count(),
    prisma.doctor.count(),
    prisma.healthCamp.findMany({
      where: { status: 'UPCOMING' },
      take: 2,
    }),
    prisma.medicine.findMany({
      include: { batches: true },
    }),
    prisma.waterSection.findMany({
      include: {
        schedules: { take: 1 },
      },
    }),
    prisma.waterSupplyRecord.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { section: true },
    }),
    prisma.ambulanceService.findMany({
      where: { status: 'AVAILABLE' },
    }),
    prisma.sanitationComplaint.findMany({
      take: 3,
      orderBy: { submittedAt: 'desc' },
    }),
  ]);

  // Quick live metrics
  const totalStockUnits = medicines.reduce((acc, med) => {
    const valid = med.batches.filter((b) => b.expiryDate > '2026-11-12' && !b.isQuarantined);
    return acc + valid.reduce((sum, b) => sum + b.currentQuantity, 0);
  }, 0);

  const lowStockCount = medicines.filter((m) => {
    const validTotal = m.batches
      .filter((b) => b.expiryDate > '2026-11-12' && !b.isQuarantined)
      .reduce((sum, b) => sum + b.currentQuantity, 0);
    return validTotal > 0 && validTotal <= m.minThreshold;
  }).length;

  return (
    <div className="space-y-14 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-navy-mesh text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 border-b border-navy-800">
        {/* Subtle technical grid overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px]" />
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -bottom-24 left-10 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          {/* Competition & Location tag */}
          <div className="flex flex-wrap items-center gap-2.5 mb-7 animate-fade-up">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Socialthon 2026 • Round 3
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-medium backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-teal-400" /> Kantheru, Guntur District, AP
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs">
              Team: <strong className="text-teal-300 font-bold ml-1.5">Ctrl Alt Defeat</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 animate-fade-up delay-75">
              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight text-white font-display leading-[1.12]">
                Integrated Community{' '}
                <span className="bg-gradient-to-r from-teal-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                  Healthcare & Civic
                </span>{' '}
                Command Platform
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                HEALTHBRIDGE 360 unifies Kantheru Gram Panchayat’s primary clinical care, FEFO rational medicine
                inventory, 108 emergency coordination, 5-section water distribution, and deterministic civic
                sanitation into one real-time operational system.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/dashboard"
                  className="group px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-950 font-extrabold text-sm shadow-glow-teal hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  Launch Operations Portal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/emergency"
                  className="group px-5 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-glow-rose hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                  Emergency Response & 108
                </Link>
                <Link
                  href="/login?demo=true"
                  className="px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold backdrop-blur-xs hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-teal-300" />
                  Switch Role (6 Personas)
                </Link>
              </div>

              {/* Micro trust bar */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>6 Live Service Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>BIS 10500 Lab Standards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>FEFO Atomic Stock</span>
                </div>
              </div>
            </div>

            {/* Quick Live Snapshot Card */}
            <div className="lg:col-span-5 animate-fade-up delay-150">
              <div className="dark-glass-panel rounded-2xl p-6 shadow-2xl space-y-5 border border-teal-500/20 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-sky-400 to-emerald-400" />
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Kantheru Live Telemetry
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LiveEcgWave className="w-20 h-5 hidden sm:block" />
                    <span className="text-[11px] px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 font-mono border border-teal-500/30">
                      SQLite • Sync
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-left">
                  <Link
                    href="/healthcare"
                    className="group p-3.5 rounded-xl bg-navy-950/80 hover:bg-navy-950 border border-slate-800 hover:border-sky-500/50 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 font-medium">Doctors On Roster</p>
                      <HeartPulse className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-extrabold text-white mt-1 font-display">
                      <AnimatedCounter value={doctorsCount} suffix=" Active" />
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full animate-grow-width" style={{ width: '100%' }} />
                    </div>
                    <p className="text-[10px] text-sky-300 mt-1.5">Kantheru PHC & Tadikonda CHC</p>
                  </Link>

                  <Link
                    href="/emergency"
                    className="group p-3.5 rounded-xl bg-navy-950/80 hover:bg-navy-950 border border-slate-800 hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 font-medium">108 Fleet Ready</p>
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-display">
                      <AnimatedCounter value={ambulances.length} suffix=" Units" />
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full animate-grow-width"
                        style={{ width: '85%' }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">ALS & BLS GPS Tracked</p>
                  </Link>

                  <Link
                    href="/water"
                    className="group p-3.5 rounded-xl bg-navy-950/80 hover:bg-navy-950 border border-slate-800 hover:border-teal-500/50 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 font-medium">Water Distribution</p>
                      <Droplets className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-extrabold text-teal-300 mt-1 font-display">
                      <AnimatedCounter value={5} suffix=" Zones" />
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full animate-grow-width" style={{ width: '92%' }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">1,910 Connected Households</p>
                  </Link>

                  <Link
                    href="/medicines"
                    className="group p-3.5 rounded-xl bg-navy-950/80 hover:bg-navy-950 border border-slate-800 hover:border-amber-500/50 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 font-medium">Valid Stock Units</p>
                      <Pill className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-extrabold text-white mt-1 font-display">
                      <AnimatedCounter value={totalStockUnits} />
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full animate-grow-width" style={{ width: '78%' }} />
                    </div>
                    <p className="text-[10px] text-amber-300 font-semibold mt-1.5">
                      {lowStockCount} item below threshold
                    </p>
                  </Link>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                  <span>Panchayat Secretary: Smt. K. Bhavani</span>
                  <Link
                    href="/intelligence"
                    className="text-teal-300 hover:text-teal-200 font-bold flex items-center gap-1 group"
                  >
                    Command Analytics
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROMINENT DIRECT EMERGENCY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 animate-fade-up delay-200">
        <div className="bg-white rounded-2xl border-2 border-rose-500/30 p-5 sm:p-6 shadow-elevated bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-rose-400 opacity-30" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white flex items-center justify-center shrink-0 shadow-glow-rose">
                <PhoneCall className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-navy-950 font-display">
                  Direct Emergency Calling & Triage Protocol
                </h3>
                <Badge variant="rose">LIVE 24x7 DISPATCH</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                A website request never replaces direct emergency voice dispatch. For cardiac, trauma, snakebite, or
                maternal emergencies, dial immediately:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <a
              href="tel:108"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs shadow-sm hover:shadow-glow-rose active:scale-95 flex items-center gap-1.5 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" /> DIAL 108 AMBULANCE
            </a>
            <a
              href="tel:08632234101"
              className="px-3.5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs active:scale-95 flex items-center gap-1.5 transition-all"
            >
              PHC Casualty: +91 863 2234101
            </a>
            <a
              href="tel:104"
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 active:scale-95 transition-all"
            >
              104 Medical Helpline
            </a>
          </div>
        </div>
      </section>

      {/* 3. THE SIX INTERCONNECTED MODULES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5 text-teal-600" /> Unified Platform Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight font-display">
              Six Interconnected Community Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Built as one cohesive civic-health system. Every appointment, batch deduction, water lab test, and
              sanitation escalation updates the community intelligence graph in real time.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="group text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 px-4 py-2.5 rounded-xl border border-teal-200 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            Open Role Workspace
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Module 1: Healthcare */}
          <ScrollReveal direction="up" delayMs={0}>
            <Card hoverEffect className="h-full border-t-4 border-t-sky-500 flex flex-col justify-between group">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <Badge variant="sky">MODULE 01</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-950 font-display group-hover:text-sky-700 transition-colors">
                    Healthcare Access & OPD
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Doctor profiles, live OPD schedules, resident appointment booking, clinical approval workflow, and
                    health camp registrations.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medical Facilities:</span>
                    <span className="font-bold text-slate-800">{centersCount} (PHC & CHC)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rostered Doctors:</span>
                    <span className="font-bold text-slate-800">{doctorsCount} Specialists</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Upcoming Health Camps:</span>
                    <span className="font-bold text-sky-700">{upcomingCamps.length} Active</span>
                  </div>
                </div>

                <Link
                  href="/healthcare"
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-800 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  Open Healthcare Access <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Module 2: Medicine Inventory */}
          <ScrollReveal direction="up" delayMs={65}>
            <Card hoverEffect className="h-full border-t-4 border-t-amber-500 flex flex-col justify-between group">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Pill className="w-5 h-5" />
                  </div>
                  <Badge variant="amber">MODULE 02</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-950 font-display group-hover:text-amber-700 transition-colors">
                    Medicine Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Multi-batch inventory, atomic FEFO dispensing algorithm, automatic expiry quarantine, and configurable
                    low-stock threshold alerts.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Essential Formulary:</span>
                    <span className="font-bold text-slate-800">{medicines.length} Formulations</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available Unexpired Stock:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      <AnimatedCounter value={totalStockUnits} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Low-Stock Alerts:</span>
                    <span className={`font-bold ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {lowStockCount} Flagged
                    </span>
                  </div>
                </div>

                <Link
                  href="/medicines"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  Inspect Medicine Inventory <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Module 3: Emergency Assistance */}
          <ScrollReveal direction="up" delayMs={130}>
            <Card hoverEffect className="h-full border-t-4 border-t-rose-500 flex flex-col justify-between group">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <Badge variant="rose">MODULE 03</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-950 font-display group-hover:text-rose-700 transition-colors">
                    Emergency Assistance
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Direct 108/104 hotlines, hospital ICU & oxygen capacity directory, consent-based GPS sharing, and
                    5-stage coordinator triage.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">108 Ambulance Fleet:</span>
                    <span className="font-bold text-emerald-700">{ambulances.length} Units Standby</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Regional Trauma Hubs:</span>
                    <span className="font-bold text-slate-800">GGH & AIIMS Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dispatch Tracking:</span>
                    <span className="font-bold text-rose-700">5-Stage Verified</span>
                  </div>
                </div>

                <Link
                  href="/emergency"
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  Open Emergency Command <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Module 4: Water Management */}
          <ScrollReveal direction="up" delayMs={195}>
            <Card hoverEffect className="h-full border-t-4 border-t-teal-500 flex flex-col justify-between group">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <Badge variant="teal">MODULE 04</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-950 font-display group-hover:text-teal-700 transition-colors">
                    5-Section Water Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Section-wise pumping logs, flow & pressure telemetry, interruption reporting, and 5-parameter BIS
                    10500 laboratory verification.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Village Distribution:</span>
                    <span className="font-bold text-slate-800">Sections 1 to 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latest Supply Log:</span>
                    <span className="font-bold text-teal-700 font-mono">{recentSupply[0]?.supplyDate || 'Today'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lab Parameters:</span>
                    <span className="font-bold text-slate-800">Na, F, pH, TDS, Coliform</span>
                  </div>
                </div>

                <Link
                  href="/water"
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  Explore 5-Section Water Hub <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Module 5: Sanitation Management */}
          <ScrollReveal direction="up" delayMs={260}>
            <Card hoverEffect className="h-full border-t-4 border-t-emerald-500 flex flex-col justify-between group">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Recycle className="w-5 h-5" />
                  </div>
                  <Badge variant="emerald">MODULE 05</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-950 font-display group-hover:text-emerald-700 transition-colors">
                    Sanitation & Priority Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Geo-tagged civic hazard reporting, explainable 0–100 priority scoring, authority assignment, proof of
                    resolution, and ticket reopening.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scoring Algorithm:</span>
                    <span className="font-bold text-emerald-700">Deterministic (0–100)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contamination Risk:</span>
                    <span className="font-bold text-rose-700">Auto-Critical Override</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reopen Escalation:</span>
                    <span className="font-bold text-slate-800">+15 Priority Boost</span>
                  </div>
                </div>

                <Link
                  href="/sanitation"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  Open Sanitation Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Module 6: Community Intelligence */}
          <ScrollReveal direction="up" delayMs={325}>
            <Card hoverEffect className="h-full border-t-4 border-t-purple-500 flex flex-col justify-between group">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <Badge variant="purple">MODULE 06</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-950 font-display group-hover:text-purple-700 transition-colors">
                    Community Intelligence
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Executive decision-support dashboard aggregating live SQL records across all five operational modules
                    with turnaround SLA analytics.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data Integrity:</span>
                    <span className="font-bold text-purple-700">100% Live DB Queries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zone Benchmarking:</span>
                    <span className="font-bold text-slate-800">5-Section Matrix</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Turnaround SLA:</span>
                    <span className="font-bold text-slate-800">Mean & Median Hours</span>
                  </div>
                </div>

                <Link
                  href="/intelligence"
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  Open Intelligence Command <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. TODAY'S 5-SECTION WATER STATUS SNAPSHOT */}
      <ScrollReveal direction="up" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-extrabold text-navy-950 font-display">
                  Kantheru 5-Section Water Distribution Telemetry
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live pumping schedules, household coverage, and overhead reservoir capacity across all 5 Panchayat zones
              </p>
            </div>
            <Link
              href="/water"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3.5 py-2 rounded-xl border border-teal-200 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              Full 5-Section Comparison <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {waterSections.map((sec, idx) => {
              const latestLog = recentSupply.find((r) => r.sectionId === sec.id);
              const sched = sec.schedules[0];
              const isCompleted = latestLog?.status === 'COMPLETED';
              const fillPercent = Math.min(
                100,
                Math.round(
                  (((latestLog?.quantitySuppliedKL ? latestLog.quantitySuppliedKL * 1000 : sec.tankCapacityLiters * 0.85)) /
                    sec.tankCapacityLiters) *
                    100
                )
              );

              return (
                <ScrollReveal key={sec.id} direction="scale" delayMs={idx * 65}>
                  <Link
                    href="/water"
                    className="block group p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-teal-400 hover:shadow-elevated hover:-translate-y-1.5 transition-all duration-300 text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-navy-950 text-sm font-display group-hover:text-teal-700 transition-colors">
                        Section {sec.id}
                      </span>
                      <Badge variant={isCompleted ? 'emerald' : 'amber'} size="sm">
                        {latestLog?.status || 'SCHEDULED'}
                      </Badge>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 line-clamp-1">
                      {sec.name.split(' - ')[1] || sec.name}
                    </p>

                    {/* Visual capacity bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Volume Index</span>
                        <span className="font-mono font-bold text-slate-700">
                          <AnimatedCounter value={fillPercent} suffix="%" />
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full animate-grow-width ${
                            isCompleted ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Window:</span>
                        <span className="font-mono text-slate-800 font-semibold">
                          {sched ? `${sched.scheduledStartTime}-${sched.scheduledEndTime}` : '06:00-08:30'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Households:</span>
                        <span className="font-bold text-slate-800">
                          <AnimatedCounter value={sec.householdsCount} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reservoir:</span>
                        <span className="font-mono font-semibold text-teal-700">
                          {(sec.tankCapacityLiters / 1000).toFixed(0)} KL
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* 5. UPCOMING HEALTH CAMPS & COMMUNITY NOTICE */}
      <ScrollReveal direction="up" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Health Camp Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-navy-950 font-display">
                  Upcoming Free Community Health Camps
                </h3>
              </div>
              <Link href="/healthcare" className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1">
                Register Online <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingCamps.length > 0 ? (
              <div className="space-y-3">
                {upcomingCamps.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-sky-50/60 to-white border border-sky-100 hover:border-sky-300 transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-extrabold text-navy-950">{camp.title}</h4>
                      <Badge variant="sky">{camp.campDate}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{camp.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        {camp.location}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {camp.startTime} – {camp.endTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No health camps scheduled this week.</p>
            )}
          </div>

          {/* Verified Standards Guarantee */}
          <div className="lg:col-span-5 bg-navy-mesh text-white rounded-2xl p-6 shadow-elevated border border-navy-800 flex flex-col justify-between space-y-5 relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/15 border border-teal-400/30 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Shield className="w-3.5 h-3.5" /> Algorithmic Integrity Guarantee
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight font-display">
                Zero Synthetic Guesses. 100% Explainable Logic.
              </h3>
              <ul className="mt-4 space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">FEFO Medicine Engine:</strong> Available stock never becomes
                    negative; expired batches are excluded and quarantined automatically.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Strict BIS 10500 Water Safety:</strong> Never infers Sodium or
                    Fluoride from TDS. Incomplete lab tests are flagged as Pending Verification.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Deterministic Sanitation Priority:</strong> Transparent 0–100 score
                    combining category risk, location sensitivity, and age boost.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Team Ctrl Alt Defeat • 2026</span>
              <Link
                href="/login?demo=true"
                className="text-teal-300 hover:text-white font-bold flex items-center gap-1 transition-colors"
              >
                Test All 6 Roles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
