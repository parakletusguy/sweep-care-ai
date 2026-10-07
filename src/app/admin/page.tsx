'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Globe,
  Layers,
  BookOpen,
} from 'lucide-react';
import { SuperAdminManager } from '../../domain/admin/super-admin-manager';
import type { DataResidencyRegion, LicenseTier } from '../../domain/admin/types';

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState([
    {
      id: 't-1',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      sector: 'corporate',
      region: 'eu-west',
      tier: 'ENTERPRISE',
      healthEnabled: true,
    },
    {
      id: 't-2',
      name: 'St. Jude University',
      slug: 'st-jude-uni',
      sector: 'school',
      region: 'eu-west',
      tier: 'ENTERPRISE',
      healthEnabled: true,
    },
    {
      id: 't-3',
      name: 'Grace Community Fellowship',
      slug: 'grace-fellowship',
      sector: 'church',
      region: 'us-east',
      tier: 'PROFESSIONAL',
      healthEnabled: false,
    },
    {
      id: 't-4',
      name: 'Executive Leadership Institute',
      slug: 'executive-institute',
      sector: 'training',
      region: 'gb-lon',
      tier: 'ENTERPRISE',
      healthEnabled: true,
    },
  ]);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    sector: 'corporate' as const,
    region: 'eu-west' as DataResidencyRegion,
    tier: 'ENTERPRISE' as LicenseTier,
    healthEnabled: false,
  });

  const [successMsg, setSuccessMsg] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;

    const newTenant = {
      id: `t-${Date.now()}`,
      name: form.name,
      slug: form.slug,
      sector: form.sector,
      region: form.region,
      tier: form.tier,
      healthEnabled: form.healthEnabled,
    };

    setTenants(prev => [...prev, newTenant]);
    setSuccessMsg(`Successfully provisioned tenant: "${form.name}" in region ${form.region}`);
    setForm({
      name: '',
      slug: '',
      sector: 'corporate',
      region: 'eu-west',
      tier: 'ENTERPRISE',
      healthEnabled: false,
    });
    setTimeout(() => setSuccessMsg(''), 4000);
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
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-extrabold text-sm">
              S
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">SWEEP Care AI</div>
              <div className="text-[11px] text-slate-500">Super Administrator Console</div>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Platform Super Admin
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Cols: Active Customer Tenants */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  Provisioned Customer Tenants
                </h1>
                <p className="text-xs text-slate-500">
                  Active isolated white-label spaces across sovereign data regions
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700">
                {tenants.length} Active Tenants
              </span>
            </div>

            <div className="space-y-3">
              {tenants.map(t => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-slate-900">{t.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 uppercase">
                        {t.sector}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-mono">
                      slug: {t.slug} · region: {t.region}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800">
                      {t.tier}
                    </span>
                    {t.healthEnabled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        HEALTH API
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Provision New Tenant Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                Provision New Tenant
              </h2>
              <p className="text-xs text-slate-500">
                Create an isolated multi-tenant white-label instance
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Hospital Group"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tenant URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g. apex-hospital"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sector</label>
                  <select
                    value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="corporate">Corporate</option>
                    <option value="school">Higher Ed</option>
                    <option value="church">Faith</option>
                    <option value="training">Training</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data Residency</label>
                  <select
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="eu-west">EU (eu-west)</option>
                    <option value="gb-lon">UK (gb-lon)</option>
                    <option value="us-east">US (us-east)</option>
                    <option value="af-south">Africa (af-south)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Licensing Tier</label>
                <select
                  value={form.tier}
                  onChange={e => setForm(f => ({ ...f, tier: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ENTERPRISE">Enterprise</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="STARTER">Starter</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="health"
                  checked={form.healthEnabled}
                  onChange={e => setForm(f => ({ ...f, healthEnabled: e.target.checked }))}
                  className="rounded accent-teal-700"
                />
                <label htmlFor="health" className="text-slate-700 font-semibold cursor-pointer">
                  Enable Optional Health Data Ingestion (Class E)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Provision Isolated Tenant</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
