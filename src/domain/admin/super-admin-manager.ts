/**
 * SWEEP Care AI — Super Administrator Console Engine (PRD §11, §18, §83)
 *
 * Enforces:
 * - Only SUPER_ADMIN role can execute platform administration operations
 * - Provisions isolated customer tenants with sovereign data residency region routing
 * - Configures licensing tiers and feature toggles dynamically
 * - Manages global assessment template library
 * - Logs all platform administration actions to the audit ledger
 */

import { randomUUID } from 'crypto';
import { AuditLogger } from '../audit/audit-logger';
import type {
  ProvisionTenantPayload,
  TenantProvisionResult,
  GlobalAssessmentTemplate,
} from './types';

// In-memory tenant store for platform administration
const _provisionedTenants: Map<string, TenantProvisionResult> = new Map();

// Global assessment template catalog (PRD §11)
const _globalTemplates: GlobalAssessmentTemplate[] = [
  {
    templateId: 'tpl-workplace-pulse-v1',
    title: 'Workforce Cognitive Load & Wellbeing Pulse',
    sector: 'corporate',
    version: '1.0.0',
    isCertified: true,
    domains: ['Workload Manageability', 'Psychological Safety', 'Team Support'],
  },
  {
    templateId: 'tpl-student-welfare-v1',
    title: 'Student Belonging & Academic Resilience Check',
    sector: 'school',
    version: '1.0.0',
    isCertified: true,
    domains: ['Belonging', 'Academic Stress', 'Peer Support'],
  },
  {
    templateId: 'tpl-pastoral-care-v1',
    title: 'Community Family Care & Connectedness Survey',
    sector: 'church',
    version: '1.0.0',
    isCertified: true,
    domains: ['Family Care', 'Community Connectedness', 'Pastoral Access'],
  },
];

export class SuperAdminManager {
  /**
   * Verify caller is SUPER_ADMIN before performing platform actions (PRD §11).
   */
  private static assertSuperAdmin(callerRole: string): void {
    if (callerRole !== 'SUPER_ADMIN') {
      throw new Error(
        `Forbidden: Role "${callerRole}" is not authorized for Super Administrator operations (PRD §11).`
      );
    }
  }

  /**
   * Provision a new customer tenant with dedicated residency region and license tier.
   */
  static provisionTenant(
    callerRole: string,
    callerUserId: string,
    payload: ProvisionTenantPayload
  ): TenantProvisionResult {
    this.assertSuperAdmin(callerRole);

    if (!payload.name.trim() || !payload.slug.trim()) {
      throw new Error('Tenant name and slug are required.');
    }

    // Check slug uniqueness
    for (const t of _provisionedTenants.values()) {
      if (t.slug === payload.slug) {
        throw new Error(`Tenant slug "${payload.slug}" is already registered.`);
      }
    }

    const tenantId = randomUUID();
    const result: TenantProvisionResult = {
      tenantId,
      slug: payload.slug,
      name: payload.name,
      sector: payload.sector,
      dataResidencyRegion: payload.dataResidencyRegion,
      licenseTier: payload.licenseTier,
      isHealthDataEnabled: payload.isHealthDataEnabled ?? false,
      minCohortSize: payload.minCohortSize ?? 10,
      provisionedAt: new Date().toISOString(),
    };

    _provisionedTenants.set(tenantId, result);

    AuditLogger.log({
      tenantId,
      userId: callerUserId,
      userRole: 'SUPER_ADMIN',
      action: 'TENANT_PROVISIONED',
      targetEntity: 'tenants',
      targetEntityId: tenantId,
      details: {
        slug: result.slug,
        sector: result.sector,
        dataResidencyRegion: result.dataResidencyRegion,
        licenseTier: result.licenseTier,
      },
      ipAddress: '127.0.0.1',
    });

    return result;
  }

  /**
   * Get tenant configuration by ID.
   */
  static getTenant(callerRole: string, tenantId: string): TenantProvisionResult {
    this.assertSuperAdmin(callerRole);
    const tenant = _provisionedTenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID "${tenantId}" not found.`);
    }
    return tenant;
  }

  /**
   * List all provisioned tenants.
   */
  static listTenants(callerRole: string): TenantProvisionResult[] {
    this.assertSuperAdmin(callerRole);
    return Array.from(_provisionedTenants.values());
  }

  /**
   * Get global assessment template catalog.
   */
  static listGlobalTemplates(): GlobalAssessmentTemplate[] {
    return [..._globalTemplates];
  }

  /**
   * Register a new global assessment template.
   */
  static registerGlobalTemplate(
    callerRole: string,
    template: GlobalAssessmentTemplate
  ): void {
    this.assertSuperAdmin(callerRole);
    _globalTemplates.push(template);
  }

  /** Test utility to clear store */
  static _clearAll(): void {
    _provisionedTenants.clear();
  }
}
