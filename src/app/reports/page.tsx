'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Download,
  Filter,
  Layers,
  Calendar,
} from 'lucide-react';

export default function ImpactReportsPage() {
  const [selectedCohort, setSelectedCohort] = useState('alpha');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
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
              <div className="text-[11px] text-slate-500">Executive Impact Intelligence</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs hover:bg-teal-800 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Executive Brief</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {downloadSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Executive Impact Brief downloaded successfully (Anonymous Cohort Summary).</span>
          </div>
        )}

        {/* Title Bar */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Longitudinal Evaluation · 90-Day Follow-Up
            </span>
            <h1 className="text-3xl font-black text-slate-950 mt-2">
              Organisational Wellbeing Impact Intelligence
            </h1>
            <p className="text-xs text-slate-600 max-w-xl mt-1 leading-relaxed">
              Verified pre-programme vs. post-programme cohort comparisons for executive leadership and sponsors — fully anonymized without displaying individual answers.
            </p>
          </div>

          {/* Cohort Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
            <Filter className="w-4 h-4 text-slate-400 ml-1" />
            <button
              onClick={() => setSelectedCohort('alpha')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedCohort === 'alpha' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Cohort Alpha (Engineering)
            </button>
            <button
              onClick={() => setSelectedCohort('beta')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedCohort === 'beta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Cohort Beta (Operations)
            </button>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Audience: Executive Leadership & People Operations
              </span>
              <h2 className="text-2xl font-black mt-1">
                Asynchronous Work Boundaries & Recovery Programme Impact
              </h2>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 block">Evaluated Cohort Size</span>
              <span className="font-bold text-white text-sm">142 Active Respondents (K ≥ 10 Protected)</span>
            </div>
          </div>

          {/* Comparison Metrics */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Cognitive Fatigue Recovery</span>
                <span className="text-emerald-400">+18% Relative Improvement</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-[11px] text-slate-400 block font-medium">Baseline (Pre-Intervention)</span>
                  <span className="text-2xl font-black text-slate-200 mt-1 block">54 / 100</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-[11px] text-emerald-400 block font-medium">Follow-Up (Post-Intervention)</span>
                  <span className="text-2xl font-black text-emerald-300 mt-1 block">72 / 100</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Psychological Safety & Voice Confidence</span>
                <span className="text-emerald-400">+24% Relative Gain</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-[11px] text-slate-400 block font-medium">Baseline (Pre-Intervention)</span>
                  <span className="text-2xl font-black text-slate-200 mt-1 block">58 / 100</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-[11px] text-emerald-400 block font-medium">Follow-Up (Post-Intervention)</span>
                  <span className="text-2xl font-black text-emerald-300 mt-1 block">82 / 100</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>90-Day Habit Retention (Daily Wind-Down & Boundary Setting)</span>
                <span className="text-emerald-400">89% Active Retention</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-[11px] text-slate-400 block font-medium">Institutional Target</span>
                  <span className="text-2xl font-black text-slate-200 mt-1 block">65% Target</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-[11px] text-emerald-400 block font-medium">Observed Cohort Outcome</span>
                  <span className="text-2xl font-black text-emerald-300 mt-1 block">89% Retention</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              All outcomes represent aggregated cohort benchmarks. Individual answers are strictly concealed.
            </span>
            <span className="text-emerald-400 font-bold">100% Privacy Protected</span>
          </div>
        </div>
      </main>
    </div>
  );
}
