'use client';

import React, { useState, useEffect } from 'react';
import {
  Recycle,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  Layers,
  FileText,
  UserCheck,
  ChevronRight,
  RotateCcw,
  Search,
  Filter,
  Shield,
  Plus,
  AlertCircle,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/ui/Motion';
import { prioritizeComplaint } from '@/lib/algorithms/complaint-prioritization';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const SANITATION_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Review' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
];

export default function SanitationPage() {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'complaints' | 'file'>('complaints');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // New Complaint Form
  const [cat, setCat] = useState('SEWAGE_OVERFLOW');
  const [secId, setSecId] = useState(1);
  const [loc, setLoc] = useState('');
  const [desc, setDesc] = useState('');
  const [households, setHouseholds] = useState('5');
  const [sensitiveNear, setSensitiveNear] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop');
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formFeedback, setFormFeedback] = useState<any>(null);

  // Officer Status Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [nextStatus, setNextStatus] = useState<any>('UNDER_REVIEW');
  const [officerComment, setOfficerComment] = useState('');
  const [assignDept, setAssignDept] = useState('Panchayat Drainage Cleansing Squad');
  const [resEvidenceUrl, setResEvidenceUrl] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Reopen Modal
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopeningLoading, setReopeningLoading] = useState(false);

  // Status History Timeline Modal
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setCurrentUser(d.user));
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sanitation/complaints');
      const data = await res.json();
      if (data?.complaints) {
        setComplaints(data.complaints);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const readImageAsDataUrl = (file: File, onLoaded: (url: string) => void) => {
    if (file.size > 2000000) {
      alert('Please select an image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoaded(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const livePriorityPreview = prioritizeComplaint({
    category: cat,
    affectedHouseholds: Number(households) || 1,
    submittedAt: new Date(),
    isNearSensitiveFacility: sensitiveNear,
  });

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingForm(true);
    setFormFeedback(null);

    try {
      const res = await fetch('/api/sanitation/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat,
          sectionId: Number(secId),
          location: loc,
          description: desc,
          affectedHouseholds: Number(households),
          isNearSensitiveFacility: sensitiveNear,
          photoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit complaint');

      setFormFeedback({
        success: true,
        message: 'Civic complaint submitted and mathematically prioritised!',
        priorityResult: data.priorityResult,
      });

      setTimeout(() => {
        fetchComplaints();
        setActiveTab('complaints');
      }, 1500);
    } catch (err: any) {
      setFormFeedback({ success: false, message: err.message });
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);

    try {
      const res = await fetch('/api/sanitation/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          status: nextStatus,
          comment: officerComment,
          assignedDepartment: nextStatus === 'ASSIGNED' ? assignDept : undefined,
          resolutionEvidenceUrl: nextStatus === 'RESOLVED' ? resEvidenceUrl : undefined,
          resolutionNotes: nextStatus === 'RESOLVED' ? resNotes : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed');

      setStatusModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReopenComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setReopeningLoading(true);

    try {
      const res = await fetch('/api/sanitation/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          status: 'REOPENED',
          comment: reopenReason,
          reopenReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reopen complaint');

      setReopenModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReopeningLoading(false);
    }
  };

  const isStaff = currentUser && currentUser.role !== 'RESIDENT';

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || c.calculatedPriority === priorityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 key={lang} className="text-2xl font-extrabold text-navy-950 font-display animate-lang-swap">
                  {t('page.sanitation.title')}
                </h1>
                <Badge variant="emerald">{t('mod5.badge')}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t('page.sanitation.sub')}</p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'complaints'
                ? 'bg-white text-navy-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Complaints Queue ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'file' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Report Issue
          </button>
        </div>
      </div>

      {/* TAB 1: COMPLAINTS QUEUE */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search street, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Categories</option>
                <option value="SUSPECTED_WATER_CONTAMINATION">Water Contamination</option>
                <option value="SEWAGE_OVERFLOW">Sewage Overflow</option>
                <option value="BLOCKED_DRAINAGE">Blocked Drainage</option>
                <option value="STAGNANT_WASTEWATER">Stagnant Wastewater</option>
                <option value="IMPROPER_WASTE_DISPOSAL">Improper Waste</option>
                <option value="UNHYGIENIC_PUBLIC_AREA">Unhygienic Area</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredComplaints.map((c, idx) => {
              const currentStageIdx = Math.max(
                0,
                SANITATION_STAGES.findIndex((s) => s.key === c.status)
              );
              return (
                <ScrollReveal key={c.id} delayMs={(idx % 4) * 55}>
                  <Card className="border-slate-200 hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-navy-950">
                          {c.category.replace(/_/g, ' ')}
                        </span>
                        {c.reopenCount > 0 && (
                          <Badge variant="rose" size="sm">
                            Reopened {c.reopenCount}x
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        {c.location} • Section {c.sectionId} ({c.affectedHouseholds} families)
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          c.calculatedPriority === 'CRITICAL'
                            ? 'rose'
                            : c.calculatedPriority === 'HIGH'
                            ? 'amber'
                            : 'slate'
                        }
                      >
                        {c.calculatedPriority} ({c.priorityScore})
                      </Badge>
                      <Badge
                        variant={
                          c.status === 'RESOLVED'
                            ? 'emerald'
                            : c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS'
                            ? 'teal'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Photo & Description */}
                  <div className="flex items-start gap-3">
                    {c.photoUrl && (
                      <img
                        src={c.photoUrl}
                        alt="Evidence"
                        className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">{c.description}</p>
                    </div>
                  </div>

                  {/* Deterministic Explainability Breakdown Box */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-teal-600" />
                        Priority Engine Justification:
                      </p>
                      <span className="font-mono font-bold text-navy-950">{c.priorityScore} / 100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          c.calculatedPriority === 'CRITICAL'
                            ? 'bg-rose-500'
                            : c.calculatedPriority === 'HIGH'
                            ? 'bg-amber-500'
                            : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(100, c.priorityScore || 0)}%` }}
                      />
                    </div>
                    <p className="text-slate-600 leading-relaxed">{c.priorityReason}</p>
                  </div>

                  {/* 5-Stage Visual Workflow Stepper */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between gap-1">
                      {SANITATION_STAGES.map((stage, sIdx) => {
                        const completed = sIdx <= currentStageIdx;
                        const active = sIdx === currentStageIdx;
                        return (
                          <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full h-1.5 rounded-full transition-colors ${
                                completed
                                  ? stage.key === 'RESOLVED'
                                    ? 'bg-emerald-500'
                                    : 'bg-teal-600'
                                  : 'bg-slate-200'
                              }`}
                            />
                            <span
                              className={`text-[9px] font-semibold truncate ${
                                active ? 'text-navy-950 font-bold' : completed ? 'text-teal-700' : 'text-slate-400'
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned squad info */}
                  {c.assignedDepartment && (
                    <div className="text-xs text-slate-600 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 flex items-center justify-between">
                      <span>
                        Assigned Unit: <strong>{c.assignedDepartment}</strong>
                      </span>
                      {c.assignedToUser && <span className="text-slate-500">Officer: {c.assignedToUser.name}</span>}
                    </div>
                  )}

                  {/* Resolution Notes & Evidence */}
                  {c.status === 'RESOLVED' && c.resolutionNotes && (
                    <div className="text-xs text-emerald-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 space-y-1">
                      <p className="font-semibold">Resolution Summary:</p>
                      <p>{c.resolutionNotes}</p>
                      {c.resolutionEvidenceUrl && (
                        <a
                          href={c.resolutionEvidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 hover:underline"
                        >
                          View Completion Inspection Evidence <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setTimelineModalOpen(true);
                      }}
                      className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Status History ({c.statusLogs?.length || 1})
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Resident Reopen Button */}
                      {c.status === 'RESOLVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(c);
                            setReopenReason('');
                            setReopenModalOpen(true);
                          }}
                          icon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                        >
                          Reopen Issue
                        </Button>
                      )}

                      {/* Staff Progress Action */}
                      {isStaff && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(c);
                            setNextStatus(
                              c.status === 'SUBMITTED'
                                ? 'UNDER_REVIEW'
                                : c.status === 'UNDER_REVIEW'
                                ? 'ASSIGNED'
                                : c.status === 'ASSIGNED'
                                ? 'IN_PROGRESS'
                                : 'RESOLVED'
                            );
                            setOfficerComment('');
                            setStatusModalOpen(true);
                          }}
                        >
                          Advance Workflow
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FILE NEW ISSUE */}
      {activeTab === 'file' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader
              title="Report Sanitation / Environmental Hazard"
              subtitle="Every submission is mathematically prioritised for immediate field squad deployment"
            />
            <CardContent className="space-y-4">
              {formFeedback && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    formFeedback.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-semibold">{formFeedback.message}</p>
                  {formFeedback.priorityResult && (
                    <div className="p-2.5 bg-white/80 rounded border border-emerald-300 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Calculated Priority: {formFeedback.priorityResult.priority}</span>
                        <span>Score: {formFeedback.priorityResult.score}/100</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {formFeedback.priorityResult.summaryExplanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateComplaint} className="space-y-4">
                <Select
                  label="Category of Sanitation Hazard"
                  options={[
                    { value: 'SUSPECTED_WATER_CONTAMINATION', label: 'Suspected Water Contamination (CRITICAL - Auto Escalate)' },
                    { value: 'SEWAGE_OVERFLOW', label: 'Sewage Overflow / Broken Drainage Main' },
                    { value: 'BLOCKED_DRAINAGE', label: 'Blocked Drainage Culvert / Silt Chokage' },
                    { value: 'STAGNANT_WASTEWATER', label: 'Stagnant Wastewater Pool (Mosquito Breeding)' },
                    { value: 'IMPROPER_WASTE_DISPOSAL', label: 'Improper Waste Disposal / Garbage Heap' },
                    { value: 'UNHYGIENIC_PUBLIC_AREA', label: 'Unhygienic Public Area / Street Market Filth' },
                  ]}
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Kantheru Section Zone"
                    options={[
                      { value: 1, label: 'Section 1 - North Kantheru (Old Village)' },
                      { value: 2, label: 'Section 2 - South Kantheru (Ramalayam)' },
                      { value: 3, label: 'Section 3 - East Kantheru (SC Colony / ZP School)' },
                      { value: 4, label: 'Section 4 - West Kantheru (Bypass Road)' },
                      { value: 5, label: 'Section 5 - Central Kantheru (Panchayat / PHC)' },
                    ]}
                    value={secId}
                    onChange={(e) => setSecId(Number(e.target.value))}
                  />

                  <Input
                    label="Approximate Households Affected"
                    type="number"
                    min="1"
                    required
                    value={households}
                    onChange={(e) => setHouseholds(e.target.value)}
                  />
                </div>

                <Input
                  label="Specific Street, Door No. or Landmark"
                  required
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  placeholder="e.g. Near Ramalayam Temple Arch, Lane 3"
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Detailed Problem Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe how long the issue has persisted, extent of overflow, odor or contamination..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Upload Hazard Photograph (Camera / Gallery)
                    </span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-navy-950 hover:bg-slate-100 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-teal-600" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) readImageAsDataUrl(file, (url) => setPhotoUrl(url));
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {photoUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={photoUrl}
                        alt="Uploaded hazard preview"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                      />
                      <div className="text-[11px] text-slate-500">
                        <p className="font-semibold text-slate-700">Evidence image attached</p>
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-rose-600 hover:underline mt-0.5"
                        >
                          Remove photo
                        </button>
                      </div>
                    </div>
                  )}
                  <Input
                    label="Or Photograph Proof URL (Optional)"
                    type="text"
                    value={photoUrl.startsWith('data:') ? '' : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={sensitiveNear}
                    onChange={(e) => setSensitiveNear(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600"
                  />
                  <span>
                    Hazard is located adjacent to an <strong>Anganwadi, School, Health Centre, or Community Water Well</strong> (+10 pts Priority Bonus).
                  </span>
                </label>

                {/* Live Deterministic Score Preview */}
                <div className="p-3.5 rounded-xl bg-navy-950 text-white text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-teal-300">Live Deterministic Priority Estimator</span>
                    <Badge
                      variant={
                        livePriorityPreview.priority === 'CRITICAL'
                          ? 'rose'
                          : livePriorityPreview.priority === 'HIGH'
                          ? 'amber'
                          : 'teal'
                      }
                      size="sm"
                    >
                      {livePriorityPreview.priority} • {livePriorityPreview.score}/100
                    </Badge>
                  </div>
                  <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${livePriorityPreview.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Estimated Response Target: <strong>Within {livePriorityPreview.targetResponseHours} hours</strong> — {livePriorityPreview.recommendedAction}
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={submittingForm}
                  icon={<Recycle className="w-4 h-4" />}
                >
                  Submit & Compute Priority Score
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: ADVANCE WORKFLOW STATUS */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Sanitation Workflow Advancement"
        subtitle={selectedComplaint ? `Ticket: ${selectedComplaint.category.replace(/_/g, ' ')} (${selectedComplaint.location})` : ''}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Target Workflow State"
            options={[
              { value: 'UNDER_REVIEW', label: '1. UNDER REVIEW (Verified by Ward Secretary)' },
              { value: 'ASSIGNED', label: '2. ASSIGNED (Dispatched to Cleansing Squad)' },
              { value: 'IN_PROGRESS', label: '3. IN PROGRESS (Machinery / Crew On Site)' },
              { value: 'RESOLVED', label: '4. RESOLVED (Completed & Disinfected)' },
            ]}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
          />

          {nextStatus === 'ASSIGNED' && (
            <Select
              label="Assign Sanitation Squad"
              options={[
                { value: 'Panchayat Drainage Cleansing Squad', label: 'Panchayat Drainage Cleansing Squad' },
                { value: 'Mechanised Suction Tractor Unit', label: 'Mechanised Suction Tractor Unit' },
                { value: 'Solid Waste Collection Tractor Team', label: 'Solid Waste Collection Tractor Team' },
                { value: 'Rapid Decontamination & Lime Powder Crew', label: 'Rapid Decontamination & Lime Powder Crew' },
              ]}
              value={assignDept}
              onChange={(e) => setAssignDept(e.target.value)}
            />
          )}

          {nextStatus === 'RESOLVED' && (
            <div className="space-y-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <Input
                label="Resolution Notes & Remediation Summary"
                required
                value={resNotes}
                onChange={(e) => setResNotes(e.target.value)}
                placeholder="e.g. Silt removed, pipeline cleared, sprinkled 50kg bleaching powder..."
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900">
                    Post-Cleansing Completion Photo (Optional)
                  </span>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-emerald-300 text-[11px] font-semibold text-emerald-900 cursor-pointer hover:bg-emerald-100">
                    <Upload className="w-3 h-3" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) readImageAsDataUrl(file, (url) => setResEvidenceUrl(url));
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <Input
                  label="Or Evidence URL"
                  type="text"
                  value={resEvidenceUrl.startsWith('data:') ? '' : resEvidenceUrl}
                  onChange={(e) => setResEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Officer Audit Comment <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={officerComment}
              onChange={(e) => setOfficerComment(e.target.value)}
              placeholder="e.g. Cleansing team scheduled for early morning shift."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={updatingStatus}>
              Commit Status Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REOPEN COMPLAINT */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title="Reopen Unresolved Sanitation Issue"
        subtitle="Escalates priority and alerts Panchayat Executive Officer"
      >
        <form onSubmit={handleReopenComplaint} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
            <strong>Reopening Escalation Policy:</strong> Reopening a ticket automatically increments the reopen count, applies mathematical penalty points to the priority score, and notifies senior officers of incomplete fieldwork.
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason for Reopening <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Explain why the issue remains unresolved (e.g. Drainage was only partially cleared and backed up again within 24 hours)..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReopenModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={reopeningLoading}>
              Reopen with Reason
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: STATUS HISTORY TIMELINE */}
      <Modal
        isOpen={timelineModalOpen}
        onClose={() => setTimelineModalOpen(false)}
        title="Status History & Audit Trail"
        subtitle={selectedComplaint ? `Ticket ID: ${selectedComplaint.id}` : ''}
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100">
            {selectedComplaint?.statusLogs?.length > 0 ? (
              selectedComplaint.statusLogs.map((log: any) => (
                <div key={log.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="teal" size="sm">
                        {log.toStatus}
                      </Badge>
                      {log.fromStatus !== 'NONE' && (
                        <span className="text-[10px] text-slate-400">from {log.fromStatus}</span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {log.comment && <p className="text-xs text-slate-700">{log.comment}</p>}
                  {log.changedByName && (
                    <p className="text-[10px] text-slate-400">Action by: {log.changedByName}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-3">No status history logs recorded.</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setTimelineModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
