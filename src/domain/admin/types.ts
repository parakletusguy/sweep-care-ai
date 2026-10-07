/**
 * SWEEP Care AI — Super Administrator Console Types (PRD §11, §18, §83)
 *
 * The Super Admin operates at the platform level (above individual tenants).
 * Responsibilities:
 * - Provision new customer tenants
 * - Assign sovereign data residency region
 * - Configure licensing tier and feature toggles
 * - Maintain the global wellbeing assessment template catalog
 */

export type DataResidencyRegion = 'eu-west' | 'us-east' | 'gb-lon' | 'af-south';

export type LicenseTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface ProvisionTenantPayload {
  name: string;
  slug: string;
  sector: 'corporate' | 'school' | 'church' | 'training';
  dataResidencyRegion: DataResidencyRegion;
  licenseTier: LicenseTier;
  isHealthDataEnabled?: boolean;
  minCohortSize?: number;
}

export interface TenantProvisionResult {
  tenantId: string;
  slug: string;
  name: string;
  sector: string;
  dataResidencyRegion: DataResidencyRegion;
  licenseTier: LicenseTier;
  isHealthDataEnabled: boolean;
  minCohortSize: number;
  provisionedAt: string;
}

export interface GlobalAssessmentTemplate {
  templateId: string;
  title: string;
  sector: 'corporate' | 'school' | 'church' | 'training' | 'universal';
  version: string;
  isCertified: boolean;
  domains: string[];
}
