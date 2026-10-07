import { describe, it, expect, beforeEach } from 'vitest';
import { SuperAdminManager } from '../src/domain/admin/super-admin-manager';
import type { ProvisionTenantPayload } from '../src/domain/admin/types';

describe('Super Administrator Console (PRD §11, §18, §83)', () => {
  beforeEach(() => {
    SuperAdminManager._clearAll();
  });

  it('provisions a customer tenant with sovereign data residency and license tier', () => {
    const payload: ProvisionTenantPayload = {
      name: 'St. Jude University',
      slug: 'st-jude-uni',
      sector: 'school',
      dataResidencyRegion: 'eu-west',
      licenseTier: 'ENTERPRISE',
      isHealthDataEnabled: true,
      minCohortSize: 10,
    };

    const result = SuperAdminManager.provisionTenant(
      'SUPER_ADMIN',
      'super-user-001',
      payload
    );

    expect(result.tenantId).toBeTruthy();
    expect(result.slug).toBe('st-jude-uni');
    expect(result.dataResidencyRegion).toBe('eu-west');
    expect(result.licenseTier).toBe('ENTERPRISE');
    expect(result.isHealthDataEnabled).toBe(true);
  });

  it('rejects provisioning attempt from non-SUPER_ADMIN role', () => {
    const payload: ProvisionTenantPayload = {
      name: 'Acme Corp',
      slug: 'acme-corp',
      sector: 'corporate',
      dataResidencyRegion: 'us-east',
      licenseTier: 'PROFESSIONAL',
    };

    expect(() =>
      SuperAdminManager.provisionTenant('ORG_ADMIN', 'user-org-admin', payload)
    ).toThrow(/Role "ORG_ADMIN" is not authorized/i);
  });

  it('rejects duplicate tenant slugs', () => {
    const payload: ProvisionTenantPayload = {
      name: 'Acme Corp',
      slug: 'acme-corp',
      sector: 'corporate',
      dataResidencyRegion: 'us-east',
      licenseTier: 'PROFESSIONAL',
    };

    SuperAdminManager.provisionTenant('SUPER_ADMIN', 'super-user-001', payload);

    expect(() =>
      SuperAdminManager.provisionTenant('SUPER_ADMIN', 'super-user-001', payload)
    ).toThrow(/already registered/i);
  });

  it('lists global assessment template catalog items', () => {
    const templates = SuperAdminManager.listGlobalTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);
    const corporateTpl = templates.find((t) => t.sector === 'corporate');
    expect(corporateTpl).toBeDefined();
    expect(corporateTpl?.isCertified).toBe(true);
  });

  it('allows super admin to register custom global assessment templates', () => {
    SuperAdminManager.registerGlobalTemplate('SUPER_ADMIN', {
      templateId: 'tpl-executive-coaching-v1',
      title: 'Executive Stamina & Cognitive Agility',
      sector: 'training',
      version: '1.0.0',
      isCertified: true,
      domains: ['Stamina', 'Focus', 'Renewal'],
    });

    const templates = SuperAdminManager.listGlobalTemplates();
    const trainingTpl = templates.find((t) => t.templateId === 'tpl-executive-coaching-v1');
    expect(trainingTpl).toBeDefined();
  });
});
