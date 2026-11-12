'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  Lock,
  UserCheck,
  Server,
  Settings,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AdminPage() {
  const { tx } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Role Edit Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('RESIDENT');
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      });
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data?.users) {
        setUsers(data.users);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRole(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user role');

      setRoleModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingRole(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'purple';
      case 'EMERGENCY_COORDINATOR':
        return 'rose';
      case 'HEALTHCARE_STAFF':
        return 'sky';
      case 'MEDICINE_STAFF':
        return 'amber';
      case 'WATER_SANITATION_OFFICER':
        return 'teal';
      default:
        return 'emerald';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-navy-950">{tx('Panchayat Administration', 'పంచాయతీ పరిపాలన కన్సోల్')}</h1>
                <Badge variant="purple">{tx('System Governance', 'వ్యవస్థ పర్యవేక్షణ')}</Badge>
              </div>
              <p className="text-xs text-slate-500">
                {tx(
                  'Kantheru Gram Panchayat • Role-Based Access Control, Security Governance & Audit Trail',
                  'కంతేరు గ్రామ పంచాయతీ • పాత్ర-ఆధారిత యాక్సెస్, భద్రతా నియంత్రణ & ఆడిట్ లాగ్'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald">{tx('Audit Logging Active', 'ఆడిట్ లాగింగ్ యాక్టివ్')}</Badge>
          <Badge variant="teal">{tx('Prisma SQLite Enforced', 'SQLite డేటాబేస్ భద్రత')}</Badge>
        </div>
      </div>

      {/* Security & System Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Users className="w-4 h-4 text-purple-600" />
            {tx('Total Registered Users', 'మొత్తం నమోదిత వినియోగదారులు')}
          </div>
          <p className="text-2xl font-bold text-navy-950 mt-1">{users.length} {tx('Accounts', 'ఖాతాలు')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{tx('Across 6 distinct role tiers', '6 విభిన్న పాత్ర విభాగాలు')}</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Lock className="w-4 h-4 text-teal-600" />
            {tx('Authentication Protocol', 'ప్రామాణీకరణ విధానం')}
          </div>
          <p className="text-base font-bold text-slate-800 mt-1">{tx('Bcrypt & Signed Tokens', 'Bcrypt & సంతకం చేసిన టోకెన్లు')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{tx('Server-side verified sessions', 'సర్వర్-వైపు ధృవీకరించబడిన సెషన్లు')}</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Database className="w-4 h-4 text-sky-600" />
            {tx('Data Integrity Guard', 'డేటా సమగ్రత రక్షణ')}
          </div>
          <p className="text-base font-bold text-slate-800 mt-1">{tx('Non-Inferential Rules', 'ఊహించని కచ్చిత నియమాలు')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{tx('Atomic transactions & zero fake stats', 'ఖచ్చితమైన లావాదేవీలు')}</p>
        </div>
      </div>

      {/* USER MANAGEMENT TABLE */}
      <Card>
        <CardHeader
          title={tx('User Accounts & Role Permissions', 'వినియోగదారు ఖాతాలు & అధికారాలు')}
          subtitle={tx('Assign and modify operational authorities across all village modules', 'అన్ని గ్రామ విభాగాల్లో అధికారాలను కేటాయించండి & మార్చండి')}
        />
        <CardContent className="p-0 overflow-x-auto">
          {users.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{tx('User Name', 'వినియోగదారు పేరు')}</th>
                  <th className="py-3 px-4">{tx('Email', 'ఇమెయిల్')}</th>
                  <th className="py-3 px-4">{tx('Phone', 'ఫోన్')}</th>
                  <th className="py-3 px-4">{tx('Section Zone', 'విభాగం')}</th>
                  <th className="py-3 px-4">{tx('Role Tier', 'పాత్ర')}</th>
                  <th className="py-3 px-4 text-right">{tx('Actions', 'చర్యలు')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy-950">{u.name}</td>
                    <td className="py-3 px-4 text-slate-700">{u.email}</td>
                    <td className="py-3 px-4 font-mono">{u.phone}</td>
                    <td className="py-3 px-4">
                      {u.sectionId ? (
                        <span className="font-semibold text-teal-800">{tx('Section', 'విభాగం')} {u.sectionId}</span>
                      ) : (
                        <span className="text-slate-400">{tx('Panchayat HQ', 'పంచాయతీ కేంద్రం')}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {u.role.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                          setRoleModalOpen(true);
                        }}
                      >
                        {tx('Change Role', 'పాత్ర మార్చండి')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-xs text-slate-500">{tx('Loading user accounts...', 'వినియోగదారు ఖాతాలు లోడ్ అవుతున్నాయి...')}</p>
          )}
        </CardContent>
      </Card>

      {/* SYSTEM AUDIT TRAIL LOG */}
      <Card>
        <CardHeader
          title={tx('Sensitive Action Audit Trail', 'ముఖ్య కార్యకలాపాల ఆడిట్ రికార్డు')}
          subtitle={tx('Immutable forensic log of critical operations across the entire application', 'ప్లాట్‌ఫారమ్‌లోని ముఖ్యమైన మార్పుల శాశ్వత రికార్డు')}
        />
        <CardContent className="p-0 overflow-x-auto">
          {auditLogs.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{tx('Timestamp', 'సమయం')}</th>
                  <th className="py-3 px-4">{tx('Officer / User', 'అధికారి / వినియోగదారు')}</th>
                  <th className="py-3 px-4">{tx('Action Code', 'చర్య కోడ్')}</th>
                  <th className="py-3 px-4">{tx('Entity', 'అంశం')}</th>
                  <th className="py-3 px-4">{tx('Details', 'వివరాలు')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.user?.name || 'System / Admin'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="teal" size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="py-3 px-4 max-w-md truncate font-mono text-[11px] text-slate-600">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-xs text-slate-500">No audit logs recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* MODAL: CHANGE ROLE */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={tx('Modify User Role & Operational Permissions', 'వినియోగదారు పాత్ర & అధికారాలను మార్చండి')}
        subtitle={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : ''}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <Select
            label={tx('Select Role Tier', 'పాత్ర స్థాయిని ఎంచుకోండి')}
            options={[
              { value: 'RESIDENT', label: tx('1. Resident (Public Access & Reporting)', '1. నివాసి (సాధారణ సేవలు & ఫిర్యాదులు)') },
              { value: 'HEALTHCARE_STAFF', label: tx('2. Healthcare Staff (Doctor / OPD Management)', '2. ఆరోగ్య సిబ్బంది (డాక్టర్ / OPD నిర్వహణ)') },
              { value: 'MEDICINE_STAFF', label: tx('3. Medicine Staff (Pharmacist / FEFO Inventory)', '3. ఫార్మసిస్ట్ (మందుల నిల్వ)') },
              { value: 'EMERGENCY_COORDINATOR', label: tx('4. Emergency Coordinator (108 Triage & Fleet)', '4. అత్యవసర సమన్వయకర్త (108 వాహనాలు)') },
              { value: 'WATER_SANITATION_OFFICER', label: tx('5. Water & Sanitation Officer (5 Sections & Lab)', '5. నీరు & పారిశుధ్య అధికారి') },
              { value: 'ADMIN', label: tx('6. Administrator (Full System Oversight)', '6. అడ్మినిస్ట్రేటర్ (పూర్తి నియంత్రణ)') },
            ]}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
            <strong>{tx('Security Warning:', 'భద్రతా హెచ్చరిక:')}</strong>{' '}
            {tx(
              "Elevating a user's role grants server-enforced access to sensitive civic infrastructure and medical records. All changes are logged to the Panchayat Audit Trail.",
              'వినియోగదారు పాత్రను పెంచడం వలన సున్నితమైన వైద్య మరియు పౌర రికార్డులకు యాక్సెస్ లభిస్తుంది. అన్ని మార్పులు ఆడిట్ లాగ్‌లో నమోదు చేయబడతాయి.'
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRoleModalOpen(false)}>
              {tx('Cancel', 'రద్దు')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={savingRole}>
              {tx('Update User Role', 'పాత్రను అప్‌డేట్ చేయండి')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
