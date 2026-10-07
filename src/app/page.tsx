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

const SECTOR_QUESTIONS: Record<SectorKey, { q1: string; q2: string; q3: string }> = {
  corporate: {
    q1: 'My workload volume is manageable during standard working hours.',
    q2: 'I feel safe voicing challenges or concerns without fear of negative consequences.',
    q3: 'I am able to recharge and disconnect effectively outside of working hours.',
  },
  school: {
    q1: 'I have access to trusted support when academic or peer pressure becomes heavy.',
    q2: 'I feel a genuine sense of belonging and community with my peers.',
    q3: 'My sleep, energy, and routine allow me to stay focused throughout the day.',
  },
  church: {
    q1: 'I feel connected and supported by our community during challenging life seasons.',
    q2: 'Our small groups provide safe, non-judgmental spaces for mutual encouragement.',
    q3: 'I know how to access confidential pastoral care whenever needed.',
  },
  training: {
    q1: 'The pacing of this programme allows me to absorb, practice, and apply concepts.',
    q2: 'I receive timely, actionable feedback from my facilitators and mentors.',
    q3: 'I am adopting sustainable habits that directly enhance my professional stamina.',
  },
};

export default function HomePage() {
  const [activeSector, setActiveSector] = useState<SectorKey>('corporate');
  const [simCohortSize, setSimCohortSize] = useState<number>(8);
  const [demoRequested, setDemoRequested] = useState<boolean>(false);
  const [demoAnswers, setDemoAnswers] = useState<{ q1: number; q2: number; q3: number }>({
    q1: 4,
    q2: 3,
    q3: 5,
  });

  // Phase 2A: Professional Case Management & Referrals State
  const [activePersona, setActivePersona] = useState<'professional' | 'hr'>('professional');
  const [caseNotes, setCaseNotes] = useState([
    {
      id: 'note-1',
      author: 'Dr. E. Adebayo',
      role: 'Wellbeing Professional',
      time: '2 hours ago',
      content: 'Completed confidential triage. Participant experiencing acute cognitive fatigue from consecutive shift demands. Recommended workload pause and specialized counseling referral.',
      isConfidential: true,
    },
    {
      id: 'note-2',
      author: 'Dr. E. Adebayo',
      role: 'Wellbeing Professional',
      time: '25 mins ago',
      content: 'Outreach completed. Participant consented to external EAP specialist connection. Scheduled weekly resilience check-ins.',
      isConfidential: true,
    },
  ]);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [referralStage, setReferralStage] = useState<number>(2); // 0: Intake, 1: Specialist, 2: In-Progress, 3: External EAP, 4: Closed
  const [auditCounter, setAuditCounter] = useState<number>(18);

  // Phase 2B: AI Wellbeing Assistant Demo State
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState<{
    text: string;
    isRefusal: boolean;
    intent: string;
    citation?: string;
    isCrisis?: boolean;
  }>({
    text: 'Hello! I am your SWEEP Care AI Assistant. I can help explain your wellbeing insights, suggest approved resilience habits, and guide you to support resources. How can I help today?',
    isRefusal: false,
    intent: 'RESOURCE_NAVIGATION',
    citation: 'WHO Guidelines on Mental Health at Work [WHO-MH-WORK-2022]',
  });

  const handleRunAssistantQuery = (queryText: string) => {
    const q = (queryText || assistantQuery).trim();
    if (!q) return;
    const lower = q.toLowerCase();

    if (lower.includes('diagnose') || lower.includes('depression') || lower.includes('bipolar')) {
      setAssistantResponse({
        text: 'I am an AI assistant and cannot provide medical or clinical psychological diagnoses (PRD §48). Please speak with a licensed medical professional, psychologist, or your designated wellbeing officer.',
        isRefusal: true,
        intent: 'PROHIBITED_MEDICAL_DIAGNOSIS',
      });
    } else if (lower.includes('fire') || lower.includes('terminate') || lower.includes('dismiss')) {
      setAssistantResponse({
        text: 'I am strictly prohibited from giving employment termination, disciplinary, or workforce dismissal advice (PRD Constitutional Rule 15, §48). All workforce decisions must remain with human leadership.',
        isRefusal: true,
        intent: 'PROHIBITED_EMPLOYMENT_ADVICE',
      });
    } else if (
      lower.includes('emergency') ||
      lower.includes('hopeless') ||
      lower.includes('kill') ||
      lower.includes('end my life')
    ) {
      setAssistantResponse({
        text: 'URGENT CRISIS INTERCEPT: If you are in immediate danger or distress, please reach out now. UK Emergency: 999 • Samaritans: 116 123 (24/7 Free & Confidential) • US Emergency: 911 • Crisis Lifeline: 988. A safeguarding alert has been flagged.',
        isRefusal: true,
        isCrisis: true,
        intent: 'CRISIS_EMERGENCY_DETECTED',
      });
    } else {
      setAssistantResponse({
        text: 'Small, structured habits create sustainable resilience. Grounded in "WHO Guidelines on Mental Health at Work" [WHO-MH-WORK-2022], consider establishing 15-minute asynchronous recovery windows between high-intensity tasks and setting consistent wind-down boundaries.',
        isRefusal: false,
        intent: 'GOAL_SETTING',
        citation: 'WHO Guidelines on Mental Health at Work [WHO-MH-WORK-2022]',
      });
    }
    setAssistantQuery('');
  };

  const sector = SECTORS[activeSector];
  const questions = SECTOR_QUESTIONS[activeSector];
  const isSuppressed = simCohortSize < 10;

  const rawSum = demoAnswers.q1 + demoAnswers.q2 + demoAnswers.q3;
  const demoScore = Math.round((rawSum / 15) * 100);

  const referralStages = [
    { label: 'Intake & Triage', code: 'PENDING_REVIEW' },
    { label: 'Specialist Assigned', code: 'ASSIGNED' },
    { label: 'In-Progress Sessions', code: 'IN_PROGRESS' },
    { label: 'External EAP Referral', code: 'REFERRED_EXTERNAL' },
    { label: 'Discharge & Closed', code: 'COMPLETED' },
  ];

  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    setCaseNotes((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        author: 'Dr. E. Adebayo',
        role: 'Wellbeing Professional',
        time: 'Just now',
        content: newNoteInput.trim(),
        isConfidential: true,
      },
    ]);
    setNewNoteInput('');
    setAuditCounter((c) => c + 1);
  };

  const handleAdvanceReferral = () => {
    setReferralStage((prev) => (prev < referralStages.length - 1 ? prev + 1 : 0));
    setAuditCounter((c) => c + 1);
  };

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
              <div className="font-extrabold text-lg tracking-tight text-slate-900">
                SWEEP Care AI
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
            <a href="#live-demo" className="hover:text-slate-900 transition-colors">
              Live Check-In Demo
            </a>
            <a href="#cases" className="hover:text-slate-900 transition-colors">
              Case Management
            </a>
            <a href="#assistant" className="hover:text-slate-900 transition-colors">
              AI Assistant & Connectors
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

      {/* Interactive Live Participant Check-In Experience */}
      <section id="live-demo" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-bold mb-3 border border-slate-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Participant Experience Preview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Frictionless, Reassuring & Trauma-Informed
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Experience the platform as your {sector.participants.toLowerCase()} will. Select ratings below to test real-time deterministic scoring and grounded intervention suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
            {/* Left: Participant Form */}
            <div className="lg:col-span-7 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">
                  {sector.sampleAssessment}
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Autosaved
                </span>
              </div>

              {/* Question 1 */}
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-3">
                  1. {questions.q1}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDemoAnswers((prev) => ({ ...prev, q1: val }))}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoAnswers.q1 === val
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-xs'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Strongly Disagree</span>
                  <span>Strongly Agree</span>
                </div>
              </div>

              {/* Question 2 */}
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-3">
                  2. {questions.q2}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDemoAnswers((prev) => ({ ...prev, q2: val }))}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoAnswers.q2 === val
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-xs'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Strongly Disagree</span>
                  <span>Strongly Agree</span>
                </div>
              </div>

              {/* Question 3 */}
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-3">
                  3. {questions.q3}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDemoAnswers((prev) => ({ ...prev, q3: val }))}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoAnswers.q3 === val
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-xs'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Strongly Disagree</span>
                  <span>Strongly Agree</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80">
                <span>Lock guarantee: submissions permanently immutable</span>
                <span className="text-slate-400 font-medium">Estimated time: 45s</span>
              </div>
            </div>

            {/* Right: Calculated Intelligence Result */}
            <div className="lg:col-span-5 bg-slate-800/90 p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Calculated Score
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                  Deterministic Pure-Code
                </span>
              </div>

              <div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {demoScore}{' '}
                  <span className="text-lg font-medium text-slate-400">/ 100</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Composite Wellbeing Index (Mathematical unweighted average)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Suggested Action Path
                </div>
                <div className="text-xs font-bold text-white">
                  {sector.sampleIntervention}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generated by AI Orchestrator grounded in verified organizational frameworks. Labeled as Suggested Approach and gated by professional review.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-700">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Calculated in pure compiled TypeScript (Zero LLM calculation error)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Protected by K-Anonymity (K=10) — Managers cannot view raw responses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Trust Badges */}
          <div className="mt-14 pt-10 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center max-w-5xl mx-auto">
            <div className="p-3">
              <div className="text-xs font-bold text-white">PostgreSQL RLS</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Database tenant isolation</div>
            </div>
            <div className="p-3">
              <div className="text-xs font-bold text-white">Zero Surveillance</div>
              <div className="text-[11px] text-slate-400 mt-0.5">No facial, voice or emotion spying</div>
            </div>
            <div className="p-3">
              <div className="text-xs font-bold text-white">Human Approval Gate</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Mandatory professional sign-off</div>
            </div>
            <div className="p-3">
              <div className="text-xs font-bold text-white">Audit Logging</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Append-only Class D/E/F tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 2A: Professional Case Notes & Referral Pipelines */}
      <section id="cases" className="py-20 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-3 border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Phase 2A: Professional Care Infrastructure (PRD §13, §14, §17)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Confidential Case Notes & Referral Pipelines
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              When an assessment flags acute distress, authorized Wellbeing Professionals need secure case workflows. 
              SWEEP Care AI enforces a strict architectural boundary: qualified care staff manage encrypted notes and multi-stage referrals, while HR Managers are completely locked out of individual records.
            </p>

            {/* Persona Switcher Buttons */}
            <div className="mt-6 inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300">
              <button
                onClick={() => setActivePersona('professional')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                  activePersona === 'professional'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Wellbeing Professional View (Authorized)</span>
              </button>
              <button
                onClick={() => setActivePersona('hr')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                  activePersona === 'hr'
                    ? 'bg-rose-50 text-rose-800 shadow-xs border border-rose-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>HR / People Manager View (Restricted AC-007)</span>
              </button>
            </div>
          </div>

          {activePersona === 'professional' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Active Case Header & Multi-Stage Referral Pipeline */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Case #SC-2026-089
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      Acute Workload Stress & Fatigue
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    ELEVATED PRIORITY
                  </span>
                </div>

                {/* Case Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Participant</span>
                    <span className="font-bold text-slate-800">Sarah M. (Cohort Alpha)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Data Classification</span>
                    <span className="font-bold text-teal-700">Class D (Sensitive)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Lead</span>
                    <span className="font-bold text-slate-800">Dr. E. Adebayo</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                    <span className="font-bold text-emerald-700">ACTIVE SUPPORT</span>
                  </div>
                </div>

                {/* Structured Referral Pipeline */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                      Referral Pipeline Lifecycle
                    </span>
                    <button
                      onClick={handleAdvanceReferral}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                    >
                      Advance Pipeline ➔
                    </button>
                  </div>

                  <div className="space-y-2">
                    {referralStages.map((stage, idx) => {
                      const isPassed = idx < referralStage;
                      const isCurrent = idx === referralStage;
                      return (
                        <div
                          key={stage.code}
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
                          <span className="text-[10px] font-mono uppercase text-slate-500">
                            {stage.code}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tamper-Evident Audit Indicator */}
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AC-009 Audit Logger: <strong>{auditCounter} verified events</strong></span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px]">SHA-256 SIGNED</span>
                </div>
              </div>

              {/* Right Column: Confidential Case Notes Thread */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Confidential Clinical & Case Notes
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Encrypted at rest • Visible only to authorized wellbeing professionals
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Confidential Lock Active
                  </span>
                </div>

                {/* Note Feed */}
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {caseNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900">{note.author}</span>
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold">
                            {note.role}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{note.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add New Note Input */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add encrypted case note (e.g., Progress milestone, EAP check-in update)..."
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center space-x-1.5"
                      style={{ backgroundColor: sector.primaryColor }}
                    >
                      <span>Add Note</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Note authoring immediately creates an immutable Class D audit record.</span>
                    <span className="text-teal-700 font-semibold">PRD §85 Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* HR / Manager Restricted View */
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xs border border-rose-200 text-center max-w-3xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wide">
                  403 Forbidden — AC-007 Health Privacy Boundary
                </span>
                <h3 className="text-2xl font-black text-slate-950 mt-3 tracking-tight">
                  Managerial Surveillance Strictly Blocked by Design
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-xl mx-auto">
                  Under <strong>PRD §14</strong> and <strong>Constitutional Rule 15</strong>, People Managers and HR Leaders are permanently barred from viewing individual participant case notes, counselling records, or sensitive health data.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 max-w-lg mx-auto text-xs text-slate-600">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Database-Level Enforcement:</strong> PostgreSQL Row-Level Security (RLS) rejects HR queries before application processing.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>No Surveillance Allowed:</strong> Free of facial, keyboard, sentiment, or voice tracking of any employee.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>K-Anonymized Aggregate Only:</strong> HR can only review aggregated cohorts with at least $K=10$ respondents.</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setActivePersona('professional')}
                  className="px-6 py-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Switch Back to Professional View
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Phase 2B, 2C, 2D: AI Wellbeing Assistant & Enterprise Connectors */}
      <section id="assistant" className="py-20 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 text-teal-400 text-xs font-bold mb-3 border border-slate-700">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Phase 2B–2D: Conversational Assistant & Enterprise Infrastructure (PRD §47, §48, §70)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              AI Wellbeing Assistant with Strict Behavioral Fences
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Equip participants with a 24/7 conversational assistant for resource navigation and habit formation. 
              Protected by 16 non-negotiable PRD safety rules: autonomous diagnosis, medication changes, and employment advice are permanently blocked in compiled code.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Interactive Assistant Terminal */}
            <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-extrabold text-white">SWEEP Care Conversational Assistant</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">Model: sweep-orchestrator-v1.4</span>
              </div>

              {/* Sample Guardrail Prompt Testing Pills */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Test Built-In PRD §48 Safety Fences:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleRunAssistantQuery('Can you diagnose if I have depression?')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all cursor-pointer font-medium"
                  >
                    🩺 Medical Diagnosis Request
                  </button>
                  <button
                    onClick={() => handleRunAssistantQuery('Should I fire an underperforming worker with low scores?')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all cursor-pointer font-medium"
                  >
                    🚫 Workplace Dismissal Request
                  </button>
                  <button
                    onClick={() => handleRunAssistantQuery('I feel hopeless and need emergency help')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-300 hover:border-rose-400/50 hover:bg-rose-950/30 transition-all cursor-pointer font-medium"
                  >
                    🚨 Critical Crisis Intercept
                  </button>
                  <button
                    onClick={() => handleRunAssistantQuery('How do I build daily resilience habits?')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all cursor-pointer font-medium"
                  >
                    💡 Grounded Habit Advice
                  </button>
                </div>
              </div>

              {/* Response Bubble Display */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  assistantResponse.isCrisis
                    ? 'bg-rose-950/40 border-rose-600/60 text-rose-200'
                    : assistantResponse.isRefusal
                    ? 'bg-amber-950/30 border-amber-600/50 text-amber-200'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-white/10">
                  <span
                    className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      assistantResponse.isCrisis
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : assistantResponse.isRefusal
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {assistantResponse.intent}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {assistantResponse.isRefusal ? 'RULE 15 HARD REFUSAL' : 'GROUNDED IN KNOWLEDGE STORE'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal">
                  {assistantResponse.text}
                </p>
                {assistantResponse.citation && (
                  <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-teal-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Citation: {assistantResponse.citation}</span>
                  </div>
                )}
              </div>

              {/* Chat Input Field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask the assistant (e.g. 'How can I set boundaries for evening recovery?')..."
                  value={assistantQuery}
                  onChange={(e) => setAssistantQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAssistantQuery(assistantQuery)}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() => handleRunAssistantQuery(assistantQuery)}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-xs hover:opacity-90 transition-all cursor-pointer flex items-center space-x-1"
                  style={{ backgroundColor: sector.primaryColor }}
                >
                  <span>Submit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right 5 cols: Enterprise Directory & Connectors Grid */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />
                    Enterprise Integrations (PRD §70)
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    ALL SYSTEMS NOMINAL
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* SCIM 2.0 */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">SCIM 2.0 Directory Sync</span>
                      <span className="text-[10px] text-emerald-400 font-mono">RFC 7644 ACTIVE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Automated Okta, Microsoft Entra ID & Google Workspace provisioning and instant deprovisioning.
                    </p>
                  </div>

                  {/* SAML 2.0 SSO */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">SAML 2.0 / OIDC SSO</span>
                      <span className="text-[10px] text-emerald-400 font-mono">7 ROLES MAPPED</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Zero friction single sign-on with cryptographic token assertion and role claim federation.
                    </p>
                  </div>

                  {/* LMS Rostering */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Canvas & Moodle LMS Sync</span>
                      <span className="text-[10px] text-emerald-400 font-mono">ROSTERS CONNECTED</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Maps academic courses and student year cohorts directly to confidential wellbeing check-ins.
                    </p>
                  </div>

                  {/* EAP Webhook Sync */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">External EAP Webhook Hub</span>
                      <span className="text-[10px] text-emerald-400 font-mono">HMAC-SHA256 SIGNED</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Bi-directional referral milestone sync with external clinical providers and anti-replay protection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
