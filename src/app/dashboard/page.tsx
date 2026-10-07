'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HeartPulse,
  TrendingUp,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Activity,
  Layers,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function ParticipantDashboardPage() {
  const [habits, setHabits] = useState([
    { id: 'h1', title: '15-min asynchronous boundary window', completed: true },
    { id: 'h2', title: 'Mid-day cognitive recharge walk', completed: true },
    { id: 'h3', title: 'Digital sunset 45 mins before sleep', completed: false },
  ]);

  const toggleHabit = (id: string) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  };

  const completedCount = habits.filter(h => h.completed).length;

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
              <div className="text-[11px] text-slate-500">Personal Wellbeing Space</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Private to You · Non-Surveillance Guaranteed
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Participant Profile · Cohort Alpha
            </span>
            <h1 className="text-3xl font-black text-slate-950 mt-2">
              Welcome to Your Personal Growth Space, Alex
            </h1>
            <p className="text-xs text-slate-600 max-w-xl mt-1 leading-relaxed">
              Track your wellbeing progress, active programmes, and daily resilience habits. 
              Neither your manager nor your colleagues can view your personal responses.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-teal-900 text-xs text-right">
            <div className="text-[11px] text-teal-700 font-medium">Last pulse check-in</div>
            <div className="font-extrabold text-sm">3 days ago</div>
            <div className="text-[10px] text-teal-600 mt-0.5">Next scheduled in 11 days</div>
          </div>
        </div>

        {/* 3 Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Trajectory */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Wellbeing Trajectory</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-black text-slate-900">78</span>
              <span className="text-xs font-bold text-emerald-600">+10 pts from baseline</span>
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Baseline Check-In:</span>
                <span className="font-bold">68 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Mid-Programme Pulse:</span>
                <span className="font-bold">73 / 100</span>
              </div>
              <div className="flex justify-between text-teal-800 font-bold">
                <span>Current Standing:</span>
                <span>78 / 100</span>
              </div>
            </div>
          </div>

          {/* Active Programme */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Enrolled Programme</span>
              <CalendarCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 leading-snug">
              Workplace Recovery & Boundary Masterclass
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Session Attendance (3 of 4)</span>
                <span className="text-teal-700 font-bold">75%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full" style={{ width: '75%' }} />
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Next session: Thursday at 2:00 PM</span>
              </div>
            </div>
          </div>

          {/* Daily Habit Checklist */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>My Resilience Habits</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="space-y-2.5 text-xs">
              {habits.map(h => (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className={h.completed ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                    {h.title}
                  </span>
                  {h.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-teal-700 font-bold">
              {completedCount} of {habits.length} habits completed today
            </div>
          </div>
        </div>

        {/* Domain Health Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Domain Health Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Calculated objective indicators from your latest confidential check-in
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              Standardised Scoring
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Workload Manageability</span>
                <span className="text-teal-700 font-black">74%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full" style={{ width: '74%' }} />
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Improved by +14% after implementing asynchronous communication blocks.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Psychological Safety & Belonging</span>
                <span className="text-teal-700 font-black">82%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '82%' }} />
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Consistently high across team reflection check-ins.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Daily Recovery & Energy</span>
                <span className="text-teal-700 font-black">78%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }} />
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Steady recovery trend observed over the past 3 weeks.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
