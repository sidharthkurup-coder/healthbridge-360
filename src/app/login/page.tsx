'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Activity,
  ArrowRight,
  AlertCircle,
  Users,
  Stethoscope,
  Pill,
  PhoneCall,
  Droplets,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRoleName, setActiveRoleName] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('demo')) {
      setActiveRoleName('Demo Selector');
    }
  }, [searchParams]);

  const demoAccounts = [
    {
      role: 'ADMIN',
      title: 'Gram Panchayat Admin',
      name: 'Smt. K. Bhavani',
      email: 'admin@healthbridge360.in',
      icon: Shield,
      color: 'purple',
      badge: 'Full Oversight',
    },
    {
      role: 'RESIDENT',
      title: 'Kantheru Resident',
      name: 'Venkata Ramana (Sec 2)',
      email: 'resident@healthbridge360.in',
      icon: Users,
      color: 'emerald',
      badge: 'Public Services',
    },
    {
      role: 'HEALTHCARE_STAFF',
      title: 'Medical Officer (PHC)',
      name: 'Dr. P. Sandeep Kumar',
      email: 'doctor.phc@healthbridge360.in',
      icon: Stethoscope,
      color: 'sky',
      badge: 'OPD & Camps',
    },
    {
      role: 'MEDICINE_STAFF',
      title: 'Senior Pharmacist',
      name: 'M. Lakshmi',
      email: 'medicine.staff@healthbridge360.in',
      icon: Pill,
      color: 'amber',
      badge: 'FEFO Inventory',
    },
    {
      role: 'EMERGENCY_COORDINATOR',
      title: '108 Dispatch Coordinator',
      name: 'K. Rajesh',
      email: 'emergency.coord@healthbridge360.in',
      icon: PhoneCall,
      color: 'rose',
      badge: 'Triage & Fleet',
    },
    {
      role: 'WATER_SANITATION_OFFICER',
      title: 'Water & Sanitation AEE',
      name: 'G. Suresh Babu',
      email: 'water.officer@healthbridge360.in',
      icon: Droplets,
      color: 'teal',
      badge: '5 Sections & Lab',
    },
  ];

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setError('');
    setLoading(true);

    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password || 'Password@123';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, roleTitle: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setActiveRoleName(roleTitle);
    handleLogin(demoEmail, 'Password@123');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-navy-950 text-white shadow-md mb-3">
          <Activity className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-navy-950">
          Sign In to HEALTHBRIDGE 360
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Kantheru Community Healthcare & Essential Services Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="shadow-lg border-slate-200">
          <CardContent className="space-y-6 pt-6">
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick 1-Click Role Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-teal-600" />
                  Instant Role Access Switcher
                </span>
                <span className="text-[11px] text-slate-500">1-click audit & testing</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  const isCurrent = email === account.email;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => handleQuickLogin(account.email, account.title)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                        isCurrent
                          ? 'border-teal-500 bg-teal-50/70 shadow-xs ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="p-1.5 rounded-md bg-white border border-slate-200 text-navy-800 shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{account.title}</p>
                          <Badge variant={account.color as any} size="sm">
                            {account.badge}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{account.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-medium">Or enter credentials</span>
              </div>
            </div>

            {/* Standard Login Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@healthbridge360.in"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Default demo password: Password@123</span>
                <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700">
                  Register as Resident
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-500">
          Secured with encrypted role-based access control • Kantheru Gram Panchayat
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <p className="text-xs text-slate-500">Loading sign in portal...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
