'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  Activity,
  ArrowRight,
  PhoneCall,
  AlertTriangle,
} from 'lucide-react';

export default function CareTeamPortalPage() {
  const [activePersona, setActivePersona] = useState<'professional' | 'hr'>('professional');
  const [caseNotes, setCaseNotes] = useState([
    {
      id: 'note-1',
      author: 'Dr. E. Adebayo',
      role: 'Wellbeing Professional',
      time: '2 hours ago',
      content:
        'Completed confidential triage. Participant experiencing acute cognitive fatigue from consecutive shift demands. Recommended workload pause and specialized counseling referral.',
    },
    {
      id: 'note-2',
      author: 'Dr. E. Adebayo',
      role: 'Wellbeing Professional',
      time: '25 mins ago',
      content:
        'Outreach completed. Participant consented to external specialist connection. Scheduled weekly resilience check-ins.',
    },
  ]);
  const [newNote, setNewNote] = useState('');
  const [referralStage, setReferralStage] = useState(2);
  const [auditCount, setAuditCount] = useState(19);

  const stages = [
    { label: 'Intake & Triage', status: 'Stage 1' },
    { label: 'Specialist Assigned', status: 'Stage 2' },
    { label: 'In-Progress Sessions', status: 'Stage 3' },
    { label: 'External Care Provider Referral', status: 'Stage 4' },
    { label: 'Completed & Discharged', status: 'Stage 5' },
  ];

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setCaseNotes(prev => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        author: 'Dr. E. Adebayo',
        role: 'Wellbeing Professional',
        time: 'Just now',
        content: newNote.trim(),
      },
    ]);
    setNewNote('');
    setAuditCount(c => c + 1);
  };

  const advanceStage = () => {
    setReferralStage(s => (s < stages.length - 1 ? s + 1 : 0));
    setAuditCount(c => c + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mr-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Link>
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-extrabold text-sm">
              S
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">SWEEP Care AI</div>
              <div className="text-[11px] text-slate-500">Care Team & Clinical Portal</div>
            </div>
          </div>

          {/* Persona Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setActivePersona('professional')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activePersona === 'professional' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Wellbeing Specialist</span>
            </button>
            <button
              onClick={() => setActivePersona('hr')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activePersona === 'hr' ? 'bg-rose-50 text-rose-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>People Manager (Restricted)</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {activePersona === 'professional' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Case Header & Pipeline */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Active Case · #SC-2026-089
                  </span>
                  <h1 className="text-xl font-black text-slate-900 mt-2">
                    Acute Workload Stress & Fatigue
                  </h1>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ELEVATED
                </span>
              </div>

              {/* Case Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Participant</span>
                  <span className="font-bold text-slate-800">Sarah M. (Cohort Alpha)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Privacy Classification</span>
                  <span className="font-bold text-teal-700">Confidential Care Record</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Lead Specialist</span>
                  <span className="font-bold text-slate-800">Dr. E. Adebayo</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-700">ACTIVE SUPPORT</span>
                </div>
              </div>

              {/* Referral Pipeline */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    Referral Pipeline Lifecycle
                  </span>
                  <button
                    onClick={advanceStage}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                  >
                    Advance Stage ➔
                  </button>
                </div>

                <div className="space-y-2">
                  {stages.map((stage, idx) => {
                    const isPassed = idx < referralStage;
                    const isCurrent = idx === referralStage;
                    return (
                      <div
                        key={stage.label}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          isCurrent
                            ? 'bg-teal-50/80 border-teal-300 text-teal-900 shadow-xs'
                            : isPassed
                            ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-teal-600 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                          )}
                          <span>{stage.label}</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">{stage.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verified Audit Counter */}
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit Trail: <strong>{auditCount} verified events</strong></span>
                </div>
                <span className="text-emerald-400 font-semibold text-[10px]">VERIFIED SECURE</span>
              </div>
            </div>

            {/* Right 7 Cols: Notes Feed */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Confidential Clinical Case Notes
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Encrypted at rest · Visible exclusively to authorized wellbeing professionals
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Confidential Lock Active
                </span>
              </div>

              {/* Note Feed */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {caseNotes.map(n => (
                  <div key={n.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900">{n.author}</span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold">
                          {n.role}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{n.content}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add encrypted case note (e.g. Session milestone, referral status update)..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-700 text-white shadow-xs hover:bg-teal-800 transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Add Note</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>All note authoring creates an immutable, verifiable audit record.</span>
                  <span className="text-teal-700 font-semibold">Strict Privacy Standards</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Restricted HR View */
          <div className="bg-white rounded-3xl p-10 border border-rose-200 shadow-xs text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wide">
                Protected Boundary — Confidential Records Restricted
              </span>
              <h2 className="text-2xl font-black text-slate-950 mt-3 tracking-tight">
                Managerial Surveillance Strictly Blocked by Design
              </h2>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">
                People Managers and HR Leaders are strictly barred from viewing individual participant case notes, counselling records, or personal health responses.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs text-slate-600 max-w-md mx-auto">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dedicated system-level data boundaries reject unauthorized queries.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>No surveillance allowed: Zero facial, keyboard, or voice monitoring.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Aggregated cohort trends only once 10 or more people participate.</span>
              </div>
            </div>

            <button
              onClick={() => setActivePersona('professional')}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              Switch Back to Specialist View
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
