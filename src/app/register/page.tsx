'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    sectionId: 1,
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sectionOptions = [
    { value: 1, label: 'Section 1 - North Kantheru (Old Village & Pedda Bazar)' },
    { value: 2, label: 'Section 2 - South Kantheru (Ramalayam & BC Colony)' },
    { value: 3, label: 'Section 3 - East Kantheru (SC Colony & ZP School)' },
    { value: 4, label: 'Section 4 - West Kantheru (Bypass Road & Extension)' },
    { value: 5, label: 'Section 5 - Central Kantheru (Panchayat & PHC)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating resident account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-navy-950 text-white shadow-md mb-3">
          <Activity className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-navy-950">
          Resident Registration
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Create an official resident profile for healthcare and civic services in Kantheru
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <Card className="shadow-lg border-slate-200">
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Venkata Ramana"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="resident@example.com"
                />

                <Input
                  label="Mobile Number (10 Digits)"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9848012345"
                />
              </div>

              <Select
                label="Kantheru Residential Section"
                options={sectionOptions}
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: Number(e.target.value) })}
              />

              <Input
                label="Street / Door Number / Landmark"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Door No. 3-45, Ramalayam Street"
              />

              <Input
                label="Password (min 6 characters)"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Register & Enter Portal
              </Button>
            </form>

            <div className="text-center pt-2 text-xs text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
