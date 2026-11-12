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

export default function AdminPage() {
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
                <h1 className="text-2xl font-bold text-navy-950">Panchayat Administration</h1>
                <Badge variant="purple">System Governance</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Kantheru Gram Panchayat • Role-Based Access Control, Security Governance & Audit Trail
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald">Audit Logging Active</Badge>
          <Badge variant="teal">Prisma SQLite Enforced</Badge>
        </div>
      </div>

      {/* Security & System Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Users className="w-4 h-4 text-purple-600" />
            Total Registered Users
          </div>
          <p className="text-2xl font-bold text-navy-950 mt-1">{users.length} Accounts</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across 6 distinct role tiers</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Lock className="w-4 h-4 text-teal-600" />
            Authentication Protocol
          </div>
          <p className="text-base font-bold text-slate-800 mt-1">Bcrypt & Signed Tokens</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Server-side verified sessions</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Database className="w-4 h-4 text-sky-600" />
            Data Integrity Guard
          </div>
          <p className="text-base font-bold text-slate-800 mt-1">Non-Inferential Rules</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Atomic transactions & zero fake stats</p>
        </div>
      </div>

      {/* USER MANAGEMENT TABLE */}
      <Card>
        <CardHeader
          title="User Accounts & Role Permissions"
          subtitle="Assign and modify operational authorities across all village modules"
        />
        <CardContent className="p-0 overflow-x-auto">
          {users.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Section Zone</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                        <span className="font-semibold text-teal-800">Section {u.sectionId}</span>
                      ) : (
                        <span className="text-slate-400">Panchayat HQ</span>
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
                        Change Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-xs text-slate-500">Loading user accounts...</p>
          )}
        </CardContent>
      </Card>

      {/* SYSTEM AUDIT TRAIL LOG */}
      <Card>
        <CardHeader
          title="Sensitive Action Audit Trail"
          subtitle="Immutable forensic log of critical operations across the entire application"
        />
        <CardContent className="p-0 overflow-x-auto">
          {auditLogs.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Officer / User</th>
                  <th className="py-3 px-4">Action Code</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
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
        title="Modify User Role & Operational Permissions"
        subtitle={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : ''}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <Select
            label="Select Role Tier"
            options={[
              { value: 'RESIDENT', label: '1. Resident (Public Access & Reporting)' },
              { value: 'HEALTHCARE_STAFF', label: '2. Healthcare Staff (Doctor / OPD Management)' },
              { value: 'MEDICINE_STAFF', label: '3. Medicine Staff (Pharmacist / FEFO Inventory)' },
              { value: 'EMERGENCY_COORDINATOR', label: '4. Emergency Coordinator (108 Triage & Fleet)' },
              { value: 'WATER_SANITATION_OFFICER', label: '5. Water & Sanitation Officer (5 Sections & Lab)' },
              { value: 'ADMIN', label: '6. Administrator (Full System Oversight)' },
            ]}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
            <strong>Security Warning:</strong> Elevating a user's role grants server-enforced access to sensitive civic infrastructure and medical records. All changes are logged to the Panchayat Audit Trail.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={savingRole}>
              Update User Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
