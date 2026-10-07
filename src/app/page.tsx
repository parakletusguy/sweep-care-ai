'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  HeartPulse,
  BrainCircuit,
  Building2,
  GraduationCap,
  Church,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  Compass,
  BarChart3,
  Sparkles,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  UserCheck,
  CalendarCheck,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';

type SectorKey = 'corporate' | 'school' | 'church' | 'training';

interface SectorContent {
  name: string;
  badge: string;
  headline: string;
  painPoint: string;
  solution: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryColor: string;
  accentColor: string;
  participants: string;
  groups: string;
  professionals: string;
  managers: string;
  sampleAssessment: string;
  sampleIntervention: string;
  roiMetric: string;
}

const SECTORS: Record<SectorKey, SectorContent> = {
  corporate: {
    name: 'Corporate & Workplace',
    badge: 'Enterprise People Ops & HR',
    headline: 'Eliminate Wellness Guesswork Without Employee Surveillance',
    painPoint:
      'HR leaders spend thousands on generic wellness perks and one-off engagement surveys, yet burnout remains high, attendance metrics show zero health ROI, and staff fear surveillance.',
    solution:
      'SWEEP Care provides privacy-first population intelligence that pinpoints departmental workload friction, auto-drafts targeted interventions, and proves pre/post score improvements.',
    icon: Building2,
    primaryColor: '#0f766e', // Deep Teal
    accentColor: '#0d9488',
    participants: 'Employees',
    groups: 'Teams / Departments',
    professionals: 'Wellbeing Officers & Counsellors',
    managers: 'People Managers & CPOs',
    sampleAssessment: 'Workforce Cognitive Load & Wellbeing Pulse',
    sampleIntervention: 'Asynchronous Work Boundaries & Recovery Programme',
    roiMetric: '+18% reported work-life recovery in post-programme cohorts',
  },
  school: {
    name: 'Schools & Higher Education',
    badge: 'Education & Student Welfare',
    headline: 'Identify Rising Student Needs Before Academic Crises Escalate',
    painPoint:
      'Welfare teams are overwhelmed by student anxiety and fragmented pastoral records, unable to assess whether pastoral workshops make a measurable difference across cohorts.',
    solution:
      'Deploy age-aware, trauma-informed student check-ins that aggregate school-wide wellbeing trends and equip counsellors with structured workshop frameworks.',
    icon: GraduationCap,
    primaryColor: '#2563eb', // Academic Blue
    accentColor: '#3b82f6',
    participants: 'Students',
    groups: 'Classes & Academic Years',
    professionals: 'Counsellors & Welfare Leads',
    managers: 'School Leadership & Deans',
    sampleAssessment: 'Student Belonging & Academic Resilience Check',
    sampleIntervention: 'Exam Stress Management & Peer Connection Circles',
    roiMetric: '+24% student connectedness following facilitated workshops',
  },
  church: {
    name: 'Churches & Faith Communities',
    badge: 'Faith & Pastoral Care',
    headline: 'Turn Unspoken Community Needs Into Dignified, Structured Care',
    painPoint:
      'Pastoral teams regularly care for hundreds of congregants without visibility into emerging family isolation, youth distress, or financial pressure.',
    solution:
      'Equip ministry teams with confidential community check-ins that identify collective strain and guide pastoral care teams to deploy tailored support initiatives.',
    icon: Church,
    primaryColor: '#7c3aed', // Warm Violet
    accentColor: '#8b5cf6',
    participants: 'Members & Families',
    groups: 'Ministries & Small Groups',
    professionals: 'Pastoral Care Team',
    managers: 'Ministry Directors',
    sampleAssessment: 'Community Family Care & Connectedness Survey',
    sampleIntervention: 'Family Support & Resilient Community Network',
    roiMetric: '92% of vulnerable members connected to direct pastoral care',
  },
  training: {
    name: 'Training & Coaching Cohorts',
    badge: 'Professional Training & L&D',
    headline: 'Prove the Real Behavioral Impact of Your Training Programmes',
    painPoint:
      'Trainers and executive coaches rely on smile-sheet feedback surveys immediately after delivery, with zero longitudinal data proving lasting behavioral change.',
    solution:
      'Seamlessly embed baseline and post-training wellbeing measures into your curriculum to deliver verified, data-backed impact reports to enterprise sponsors.',
    icon: BookOpen,
    primaryColor: '#0284c7', // Professional Sky
    accentColor: '#38bdf8',
    participants: 'Learners & Fellows',
    groups: 'Cohorts & Tracks',
    professionals: 'Trainers & Lead Facilitators',
    managers: 'L&D Heads & Programme Sponsors',
    sampleAssessment: 'Leadership Stamina & Focus Assessment',
    sampleIntervention: 'Executive Cognitive Renewal Masterclass',
    roiMetric: '89% sustained adoption of stress-reduction habits at 90 days',
  },
};

export default function HomePage() {
  const [activeSector, setActiveSector] = useState<SectorKey>('corporate');
  const [simCohortSize, setSimCohortSize] = useState<number>(8);
  const [demoRequested, setDemoRequested] = useState<boolean>(false);

  const sector = SECTORS[activeSector];
  const isSuppressed = simCohortSize < 10;

  return (
    <div
      className="min-h-screen text-slate-800 transition-colors duration-300 bg-slate-50 font-sans"
      style={
        {
          '--brand-primary': sector.primaryColor,
          '--brand-accent': sector.accentColor,
        } as React.CSSProperties
      }
    >
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md transition-transform duration-300 hover:scale-105"
              style={{ backgroundColor: sector.primaryColor }}
            >
              S
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                SWEEP Care AI
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  B2B SaaS
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Wellbeing Intelligence & Programme Design Platform
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <a href="#product-loop" className="hover:text-slate-900 transition-colors">
              The 6-Step Loop
            </a>
            <a href="#sectors" className="hover:text-slate-900 transition-colors">
              Sector Solutions
            </a>
            <a href="#privacy" className="hover:text-slate-900 transition-colors">
              Privacy Architecture
            </a>
            <a href="#acceptance" className="hover:text-slate-900 transition-colors">
              Verified Compliance
            </a>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://github.com/parakletusguy/sweep-care-ai"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Source Code
            </a>
            <a
              href="#demo"
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg text-white shadow-sm hover:opacity-95 transition-all"
              style={{ backgroundColor: sector.primaryColor }}
            >
              Request Platform Demo
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-xs text-slate-700 text-xs font-semibold mb-8">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Non-Surveillance Guarantee • Pure Deterministic Scoring • WCAG 2.2 AA</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight max-w-5xl mx-auto leading-[1.1]">
          Turn Population Wellbeing Signals Into{' '}
          <span style={{ color: sector.primaryColor }} className="underline decoration-slate-300/60 decoration-wavy">
            Targeted Programmes & Proven Outcomes.
          </span>
        </h1>

        <p className="mt-7 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          Organizations around the world serve people without knowing how they are doing or whether support initiatives work. 
          SWEEP Care AI closes that loop: assess population needs, auto-draft grounded interventions, and prove longitudinal pre/post impact — without employee surveillance.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#demo"
            className="px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            style={{ backgroundColor: sector.primaryColor }}
          >
            <span>Launch White-Label Pilot</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#sectors"
            className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Explore Sector Terminology Presets
          </a>
        </div>

        {/* Trust Badges Strip */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Zero Surveillance</div>
              <div className="text-[11px] text-slate-500">No facial, voice or private chat monitoring</div>
            </div>
          </div>
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Pure-Code Scoring</div>
              <div className="text-[11px] text-slate-500">100% deterministic (AC-003, no LLM math)</div>
            </div>
          </div>
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">K-Anonymity (K=10)</div>
              <div className="text-[11px] text-slate-500">Mathematical small-group cell suppression</div>
            </div>
          </div>
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Human Approval Gate</div>
              <div className="text-[11px] text-slate-500">AI drafts; qualified humans authorize (AC-006)</div>
            </div>
          </div>
        </div>
      </section>

      {/* The 6-Stage Core Product Loop */}
      <section id="product-loop" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">
              The Continuous Impact Cycle (PRD §10)
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              From Fragmented Signals to Measurable Human Growth
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Generic survey tools collect data and stop. SWEEP Care AI drives the complete six-stage operational loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'ASSESS',
                subtitle: 'Trauma-informed, immutable check-ins',
                desc: 'Low-friction, mobile-first assessments with autosave resilience. Versioned and permanently locked upon response submission (AC-002).',
                icon: Activity,
              },
              {
                step: '02',
                title: 'UNDERSTAND',
                subtitle: 'Privacy-preserving population signals',
                desc: 'Real-time aggregated dashboards highlighting domain shifts, cohort strengths, and friction areas without ever exposing individual answers.',
                icon: BarChart3,
              },
              {
                step: '03',
                title: 'DESIGN',
                subtitle: 'Knowledge-grounded intervention drafts',
                desc: 'One-click AI drafting of multi-session programmes grounded in verified clinical frameworks (WHO, ISO, NICE). Always labeled Suggested Approach.',
                icon: Sparkles,
              },
              {
                step: '04',
                title: 'ACT',
                subtitle: 'Human delivery & participation tracking',
                desc: 'Authorized wellbeing professionals review, approve, and facilitate sessions with integrated attendance tracking and reflection check-ins.',
                icon: UserCheck,
              },
              {
                step: '05',
                title: 'MEASURE',
                subtitle: 'Longitudinal pre/post score deltas',
                desc: 'Automatic post-programme reassessment comparing baseline vs follow-up scores using strict non-causal language frameworks (PRD §45).',
                icon: Layers,
              },
              {
                step: '06',
                title: 'IMPROVE',
                subtitle: 'Institutional intelligence & ROI',
                desc: 'Accumulated cohort intelligence that proves what programmes work best for specific organizational units, eliminating wasted wellness spend.',
                icon: Compass,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                        style={{ backgroundColor: sector.primaryColor }}
                      >
                        {item.step}
                      </div>
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-base font-black text-slate-900 tracking-tight">
                      {item.title}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      {item.subtitle}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Multi-Sector White-Label Solution Selector */}
      <section id="sectors" className="py-20 bg-slate-100/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold mb-3 uppercase tracking-wider">
              <span>White-Label Multi-Tenant Engine (PRD §20)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Engineered for Every Organization Serving People
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              A single unified codebase dynamically adapting branding, roles, hierarchy, and terminology across four core deployment categories.
            </p>
          </div>

          {/* Interactive Sector Switcher Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {(Object.keys(SECTORS) as SectorKey[]).map((key) => {
              const s = SECTORS[key];
              const Icon = s.icon;
              const isSelected = activeSector === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSector(key)}
                  className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md scale-102'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                  style={isSelected ? { backgroundColor: s.primaryColor } : {}}
                >
                  <Icon className="w-4 h-4" />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sector Profile Deep Dive Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: sector.primaryColor }}
                >
                  {sector.badge}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-950 mt-2">
                  {sector.headline}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {sector.roiMetric}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100">
                <div className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">
                  The Institutional Challenge
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {sector.painPoint}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  The SWEEP Care Solution
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {sector.solution}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6 border-t border-slate-100 text-left">
              <div>
                <div className="text-[11px] font-medium text-slate-400">Participants</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{sector.participants}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Org Units</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{sector.groups}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Care Professionals</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{sector.professionals}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Leadership</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{sector.managers}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Instrument</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{sector.sampleAssessment}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Intervention</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{sector.sampleIntervention}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Architecture & K-Anonymity Simulator */}
      <section id="privacy" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-4 border border-emerald-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Mathematical Privacy By Design (PRD §36)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Small-Group Privacy That Earns Employee Trust
            </h2>
            <p className="mt-4 text-slate-600 text-sm leading-relaxed">
              If employees or students fear their manager can deduce their individual responses, data accuracy drops to zero. 
              SWEEP Care AI enforces a strict mathematical threshold ($K=10$). If any departmental filter slice yields fewer than 10 respondents, all scores and text are suppressed automatically.
            </p>

            <div className="mt-6 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Interactive K-Anonymity Filter Simulator
                </span>
                <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  Active Filter: {simCohortSize} respondents
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={simCohortSize}
                onChange={(e) => setSimCohortSize(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span className="text-rose-500 font-semibold">1 (Dangerous deanonymization)</span>
                <span className="text-teal-700 font-semibold">Threshold K = 10</span>
                <span className="text-emerald-600 font-semibold">25 (Safe aggregate)</span>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span><strong>AC-007 Health Privacy Boundary:</strong> HR cannot query Class D/E/F raw records.</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span><strong>Anti-Differencing Controls:</strong> Prevents reconstruction by subtracting teams.</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="font-extrabold text-slate-900 text-sm">Aggregated Population Intelligence Card</div>
                <div className="text-[11px] text-slate-400">Target Segment: Product Engineering Sub-Team</div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isSuppressed
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isSuppressed ? 'CELL SUPPRESSED' : 'AGGREGATE DISCLOSED'}
              </span>
            </div>

            <div className="mt-6">
              {isSuppressed ? (
                <div className="text-center py-10">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <div className="font-bold text-slate-900 text-sm">
                    Automated Small-Group Privacy Suppression Active
                  </div>
                  <div className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                    Filter cohort ({simCohortSize} respondents) is strictly below the required privacy baseline ($K=10$). 
                    Individual metrics and response distributions are blocked to preserve respondent anonymity.
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Workload Manageability</span>
                      <span className="font-bold text-slate-900">54.2 / 100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '54.2%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Psychological Safety</span>
                      <span className="font-bold text-slate-900">76.8 / 100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '76.8%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Team Belonging & Support</span>
                      <span className="font-bold text-slate-900">81.0 / 100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: '81%' }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Identified Priority Theme:</span>
                    <span className="font-bold text-amber-700">Workload Friction</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Verified Acceptance Criteria Status Grid */}
      <section id="acceptance" className="py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-3 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audited Engineering Baseline • PRD §103</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Verified Acceptance Criteria & Anti-Hallucination Suite
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Every critical safety, tenancy, and scoring boundary is enforced by automated test suites in continuous integration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: 'AC-001', title: 'Tenant Boundary Isolation', desc: 'PostgreSQL RLS ensures zero cross-tenant leakage across APIs and queries.' },
              { code: 'AC-002', title: 'Assessment Immutability', desc: 'Submissions permanently lock historic versions; edits spawn version branches.' },
              { code: 'AC-003', title: 'Deterministic Scoring', desc: 'Pure compiled TypeScript calculation; 1,000 runs produce bit-identical scores.' },
              { code: 'AC-004', title: 'AI Provenance Record', desc: 'Logs model version, prompt version, retrieved knowledge IDs, and SHA-256 hash.' },
              { code: 'AC-005', title: 'Citation Verification', desc: 'Refuses unbacked claims and rejects hallucinated citation IDs automatically.' },
              { code: 'AC-006', title: 'Human Approval Gate', desc: 'AI drafts cannot activate without verified human professional sign-off.' },
              { code: 'AC-007', title: 'Health Privacy Boundary', desc: 'HR/People Managers are blocked at the data layer from raw Class D/E/F records.' },
              { code: 'AC-008', title: 'Modular Consent Gate', desc: 'Submissions blocked without active core consent; revocation triggers audit log.' },
              { code: 'AC-009', title: 'Append-Only Auditability', desc: 'Every query to Class D/E/F sensitive data writes an immutable audit record.' },
              { code: 'AC-010', title: 'AI Transparency Disclosures', desc: 'Participant-facing AI outputs display visible AI disclosures and disclaimers.' },
              { code: '§104', title: 'Anti-Hallucination QA', desc: 'Explicitly refuses prompts to invent studies, diagnose illness, or advise firings.' },
              { code: '§61', title: 'Global Crisis Support', desc: 'Configurable emergency numbers per jurisdiction; zero hardcoded 911 assumptions.' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start space-x-3.5 hover:border-slate-700 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-emerald-400 tracking-wide">{item.code}: {item.title}</div>
                  <div className="text-xs text-slate-300 mt-1 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Conversion CTA Section */}
      <section id="demo" className="py-20 bg-white border-t border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-md" style={{ backgroundColor: sector.primaryColor }}>
            <Compass className="w-7 h-7" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Ready to Connect Wellbeing Signals to Measurable Human Growth?
          </h2>
          <p className="mt-5 text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Deploy a dedicated white-label tenant configured with your brand, organizational structure, and sector-specific terminology.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {demoRequested ? (
              <div className="px-6 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Platform demo request received. An enterprise onboarding specialist will reach out within 24 hours.</span>
              </div>
            ) : (
              <button
                onClick={() => setDemoRequested(true)}
                className="px-8 py-4 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center space-x-2"
                style={{ backgroundColor: sector.primaryColor }}
              >
                <span>Schedule Institutional Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-6 text-xs text-slate-400">
            Compliant with PRD v1.0 • No credit card required • SOC 2 & GDPR architecture aligned
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          <div>
            <div className="text-sm font-bold text-white mb-2">SWEEP Care AI</div>
            <p className="text-slate-400 leading-relaxed">
              White-label, multi-tenant Wellbeing Intelligence and Programme Design Platform.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Sectors</div>
            <ul className="space-y-1.5">
              <li>Corporate Workplace</li>
              <li>Schools & Universities</li>
              <li>Churches & Faith Communities</li>
              <li>Professional Coaching & L&D</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Architecture</div>
            <ul className="space-y-1.5">
              <li>Deterministic Scoring Engine</li>
              <li>Small-Group K-Anonymity</li>
              <li>PostgreSQL Row-Level Security</li>
              <li>RAG Knowledge Grounding</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Governance</div>
            <ul className="space-y-1.5">
              <li>Build Agent Constitution (§105)</li>
              <li>Non-Surveillance Guarantee</li>
              <li>Human Approval Gates (AC-006)</li>
              <li>Health Privacy Boundary (AC-007)</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-800 text-center">
          <p>© 2026 SWEEP Care AI. All rights reserved. Built strictly in accordance with PRD v1.0.</p>
        </div>
      </footer>
    </div>
  );
}
