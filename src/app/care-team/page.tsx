'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  FileText,
  LockKeyhole,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';

type CareRole = 'WELLBEING_PROFESSIONAL' | 'SAFEGUARDING_OFFICER';
type Classification = 'CLASS_D_SENSITIVE_WELLBEING' | 'CLASS_F_SAFEGUARDING';
type CaseStatus = 'OPEN' | 'IN_REVIEW' | 'ACTIVE_SUPPORT' | 'REFERRED' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
type ReferralStatus = 'PENDING_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'REFERRED_EXTERNAL' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';

type Membership = {
  tenant_id: string;
  role: CareRole;
  sweep_tenants: { id: string; name: string; slug: string } | null;
};

type CaseSummary = {
  id: string;
  participant_id: string;
  title: string;
  status: CaseStatus;
  priority: 'ROUTINE' | 'ELEVATED' | 'URGENT' | 'CRISIS';
  classification: Classification;
  assigned_professional_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

type CaseNote = {
  id: string;
  author_id: string;
  content: string;
  classification: Classification;
  created_at: string;
};

type Referral = {
  id: string;
  type: string;
  status: ReferralStatus;
  provider_name: string;
  external_contact_info: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type CaseDetail = {
  case: CaseSummary & { description: string; tenant_id: string };
  notes: CaseNote[];
  referrals: Referral[];
};

const caseStatuses: CaseStatus[] = ['OPEN', 'IN_REVIEW', 'ACTIVE_SUPPORT', 'REFERRED', 'ESCALATED', 'RESOLVED', 'CLOSED'];
const referralStatuses: ReferralStatus[] = ['PENDING_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REFERRED_EXTERNAL', 'COMPLETED', 'DECLINED', 'CANCELLED'];

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function classificationLabel(value: Classification) {
  return value === 'CLASS_F_SAFEGUARDING' ? 'Safeguarding record' : 'Confidential wellbeing record';
}

function statusTone(status: string) {
  if (status === 'CLOSED' || status === 'COMPLETED' || status === 'RESOLVED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'ESCALATED' || status === 'DECLINED' || status === 'CANCELLED') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || 'The secure care workflow is unavailable right now.');
  return payload;
}

export default function CareTeamPortalPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralType, setReferralType] = useState('INTERNAL_SPECIALIST');
  const [providerName, setProviderName] = useState('');
  const [externalContactInfo, setExternalContactInfo] = useState('');
  const [referralReason, setReferralReason] = useState('');

  const selectedMembership = memberships.find((membership) => membership.tenant_id === tenantId);
  const isSafeguardingWorkspace = selectedMembership?.role === 'SAFEGUARDING_OFFICER';

  const loadCases = useCallback(async (activeTenantId: string, resetSelection = true) => {
    setIsLoading(true);
    setError('');
    setNotice('');
    if (resetSelection) {
      setSelectedCaseId(null);
      setCaseDetail(null);
    }
    try {
      const payload = await requestJson<{ cases: CaseSummary[] }>(`/api/cases?tenantId=${encodeURIComponent(activeTenantId)}`, { cache: 'no-store' });
      setCases(payload.cases);
    } catch (requestError) {
      setCases([]);
      setError(requestError instanceof Error ? requestError.message : 'Unable to load care records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCaseDetail = useCallback(async (caseId: string) => {
    setIsLoadingCase(true);
    setError('');
    setNotice('');
    try {
      const payload = await requestJson<CaseDetail>(`/api/cases/${caseId}`, { cache: 'no-store' });
      setSelectedCaseId(caseId);
      setCaseDetail(payload);
    } catch (requestError) {
      setCaseDetail(null);
      setError(requestError instanceof Error ? requestError.message : 'Unable to open this care record.');
    } finally {
      setIsLoadingCase(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    async function loadContext() {
      setIsLoading(true);
      setError('');
      try {
        const payload = await requestJson<{ memberships: Membership[] }>('/api/cases/context', { cache: 'no-store' });
        if (!isCurrent) return;
        setMemberships(payload.memberships);
        const firstTenantId = payload.memberships[0]?.tenant_id ?? '';
        setTenantId(firstTenantId);
        if (!firstTenantId) setIsLoading(false);
      } catch (requestError) {
        if (!isCurrent) return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load your care access.');
        setIsLoading(false);
      }
    }
    void loadContext();
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    if (tenantId) void loadCases(tenantId);
  }, [tenantId, loadCases]);

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCaseId || !newNote.trim()) return;
    setIsSaving(true); setError(''); setNotice('');
    try {
      await requestJson(`/api/cases/${selectedCaseId}/notes`, { method: 'POST', body: JSON.stringify({ content: newNote.trim() }) });
      setNewNote('');
      await loadCaseDetail(selectedCaseId);
      await loadCases(tenantId, false);
      setNotice('The note was added to the immutable case history.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add the case note.');
    } finally { setIsSaving(false); }
  }

  async function updateCaseStatus(status: CaseStatus) {
    if (!selectedCaseId || !caseDetail || status === caseDetail.case.status) return;
    setIsSaving(true); setError(''); setNotice('');
    try {
      await requestJson(`/api/cases/${selectedCaseId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadCaseDetail(selectedCaseId);
      await loadCases(tenantId, false);
      setNotice('Case status updated.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update the case status.');
    } finally { setIsSaving(false); }
  }

  async function createReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCaseId) return;
    setIsSaving(true); setError(''); setNotice('');
    try {
      await requestJson(`/api/cases/${selectedCaseId}/referrals`, {
        method: 'POST',
        body: JSON.stringify({
          type: referralType,
          providerName: providerName.trim(),
          externalContactInfo: externalContactInfo.trim() || undefined,
          reason: referralReason.trim(),
        }),
      });
      setProviderName(''); setExternalContactInfo(''); setReferralReason(''); setShowReferralForm(false);
      await loadCaseDetail(selectedCaseId);
      setNotice('Referral saved to the case workflow. No external provider was contacted automatically.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create this referral.');
    } finally { setIsSaving(false); }
  }

  async function updateReferralStatus(referralId: string, status: ReferralStatus) {
    if (!selectedCaseId) return;
    setIsSaving(true); setError(''); setNotice('');
    try {
      await requestJson(`/api/cases/${selectedCaseId}/referrals/${referralId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadCaseDetail(selectedCaseId);
      setNotice('Referral status updated.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update the referral status.');
    } finally { setIsSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-950"><ArrowLeft className="h-4 w-4" />Home</Link>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div><p className="text-sm font-bold tracking-tight">Care workspace</p><p className="text-xs text-slate-500">SWEEP Care AI</p></div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-600 sm:flex"><ShieldCheck className="h-4 w-4 text-teal-700" />Need-to-know access</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
          <div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-teal-800" />
            <div><h1 className="text-lg font-bold tracking-tight text-slate-950">Confidential care records</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">This workspace only displays records your signed-in care role is permitted to access. Case notes are append-only, and every read or change is recorded for audit.</p></div>
          </div>
        </section>

        {error ? <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p>{error}</p>{error.startsWith('Sign in') ? <Link href="/login" className="mt-2 inline-block font-semibold underline">Go to sign in</Link> : null}</div></div> : null}
        {notice ? <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div> : null}

        {memberships.length > 0 ? <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-semibold text-slate-800" htmlFor="care-organization">Organization</label>
          <div className="flex items-center gap-2"><select id="care-organization" value={tenantId} onChange={(event) => setTenantId(event.target.value)} className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100">
            {memberships.map((membership) => <option key={membership.tenant_id} value={membership.tenant_id}>{membership.sweep_tenants?.name ?? 'Your organization'} · {label(membership.role)}</option>)}
          </select><button type="button" onClick={() => tenantId && void loadCases(tenantId)} disabled={isLoading || !tenantId} className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Refresh cases"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></button></div>
        </div> : null}

        {isLoading && !caseDetail ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading your permitted care workspace…</div> : null}
        {!isLoading && memberships.length === 0 && !error ? <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-7"><LockKeyhole className="h-7 w-7 text-slate-700" /><h2 className="mt-4 text-lg font-bold">No confidential-care access is assigned</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your account does not currently hold a wellbeing-professional or safeguarding-officer role. Individual case records remain unavailable by design.</p></section> : null}

        {!isLoading && memberships.length > 0 ? <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold">Permitted cases</h2><p className="mt-0.5 text-xs text-slate-500">Actual records only</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{cases.length}</span></div>
            <div className="max-h-[38rem] overflow-y-auto p-2">{cases.length === 0 ? <div className="p-4 text-sm leading-6 text-slate-600">No cases are currently available to your role in this organization. New cases will appear here once assigned through the protected workflow.</div> : cases.map((caseRecord) => <button key={caseRecord.id} type="button" onClick={() => void loadCaseDetail(caseRecord.id)} className={`w-full rounded-xl p-3 text-left transition ${selectedCaseId === caseRecord.id ? 'bg-teal-50 ring-1 ring-inset ring-teal-200' : 'hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-3"><p className="line-clamp-2 text-sm font-semibold text-slate-900">{caseRecord.title}</p><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /></div><div className="mt-2 flex flex-wrap gap-1.5"><span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${statusTone(caseRecord.status)}`}>{label(caseRecord.status)}</span><span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{label(caseRecord.priority)}</span></div><p className="mt-2 text-xs text-slate-500">Updated {dateLabel(caseRecord.updated_at)}</p></button>)}</div>
          </aside>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">{isLoadingCase ? <div className="p-8 text-sm text-slate-600">Opening protected record…</div> : caseDetail ? <div>
            <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap gap-2"><span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-900">{classificationLabel(caseDetail.case.classification)}</span><span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">{label(caseDetail.case.priority)} priority</span></div><h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">{caseDetail.case.title}</h2><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{caseDetail.case.description}</p></div><div className="shrink-0"><label className="sr-only" htmlFor="case-status">Case status</label><select id="case-status" value={caseDetail.case.status} disabled={isSaving} onChange={(event) => void updateCaseStatus(event.target.value as CaseStatus)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:opacity-50">{caseStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></div></div><p className="mt-4 text-xs text-slate-500">Last updated {dateLabel(caseDetail.case.updated_at)}.</p></div>

            <div className="grid gap-8 p-5 sm:p-6 xl:grid-cols-2"><div><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Case notes</h3><p className="mt-1 text-xs text-slate-500">Notes are permanent once saved.</p></div><FileText className="h-5 w-5 text-slate-400" /></div><div className="mt-4 space-y-3">{caseDetail.notes.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No case notes have been added.</p> : caseDetail.notes.map((note) => <article key={note.id} className="rounded-xl border border-slate-200 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{note.content}</p><p className="mt-3 text-xs text-slate-500">Added {dateLabel(note.created_at)}</p></article>)}</div><form className="mt-4" onSubmit={addNote}><label className="sr-only" htmlFor="case-note">Add case note</label><textarea id="case-note" rows={4} value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Record a factual care update. Do not include information that is not necessary for this care workflow." className="w-full resize-y rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100" /><button type="submit" disabled={isSaving || !newNote.trim()} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />Add immutable note</button></form></div>

              <div><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Referrals</h3><p className="mt-1 text-xs text-slate-500">Saving a referral does not contact a provider.</p></div><button type="button" onClick={() => setShowReferralForm((isOpen) => !isOpen)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Plus className="h-4 w-4" />New referral</button></div>
                {showReferralForm ? <form onSubmit={createReferral} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><div><label className="block text-xs font-semibold text-slate-700" htmlFor="referral-type">Referral type</label><select id="referral-type" value={referralType} onChange={(event) => setReferralType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="INTERNAL_PROGRAMME">Internal programme</option><option value="INTERNAL_SPECIALIST">Internal specialist</option><option value="EXTERNAL_EAP">External EAP</option><option value="EXTERNAL_CLINICAL">External clinical provider</option><option value="COMMUNITY_SUPPORT">Community support</option></select></div><div><label className="block text-xs font-semibold text-slate-700" htmlFor="provider-name">Provider or destination</label><input id="provider-name" required minLength={2} maxLength={200} value={providerName} onChange={(event) => setProviderName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></div><div><label className="block text-xs font-semibold text-slate-700" htmlFor="referral-contact">Contact reference (optional)</label><input id="referral-contact" maxLength={500} value={externalContactInfo} onChange={(event) => setExternalContactInfo(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></div><div><label className="block text-xs font-semibold text-slate-700" htmlFor="referral-reason">Reason for referral</label><textarea id="referral-reason" required minLength={2} maxLength={6000} rows={3} value={referralReason} onChange={(event) => setReferralReason(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm" /></div><div className="flex gap-2"><button type="submit" disabled={isSaving} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Save referral</button><button type="button" onClick={() => setShowReferralForm(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button></div></form> : null}
                <div className="mt-4 space-y-3">{caseDetail.referrals.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No referrals have been saved for this case.</p> : caseDetail.referrals.map((referral) => <article key={referral.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{referral.provider_name}</p><p className="mt-1 text-xs text-slate-500">{label(referral.type)}</p></div><select value={referral.status} disabled={isSaving} onChange={(event) => void updateReferralStatus(referral.id, event.target.value as ReferralStatus)} className={`rounded-md border px-2 py-1 text-xs font-medium outline-none disabled:opacity-50 ${statusTone(referral.status)}`} aria-label={`Status for referral to ${referral.provider_name}`}>{referralStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{referral.reason}</p>{referral.notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{referral.notes}</p> : null}<p className="mt-3 text-xs text-slate-500">Updated {dateLabel(referral.updated_at)}</p></article>)}</div>
              </div></div>
            {isSafeguardingWorkspace ? <div className="border-t border-amber-100 bg-amber-50/60 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-6">For an immediate safety concern, follow your organization’s safeguarding process or local emergency procedure. This record system does not replace emergency response.</div> : null}
          </div> : <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center"><ShieldCheck className="h-8 w-8 text-teal-700" /><h2 className="mt-4 text-lg font-semibold">Select a permitted case</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Select a case from the protected list to view its confidential workflow, notes, and referrals.</p></div>}</section>
        </div> : null}
      </main>
    </div>
  );
}
