export type SectorType = 'corporate' | 'school' | 'church' | 'training';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  sector: SectorType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantBranding {
  tenantId: string;
  productName: string;
  logoUrl?: string;
  primaryColor: string; // e.g. '#2563eb'
  accentColor: string;
  fontFamily?: string;
  showPoweredBy: boolean; // PRD §19: Configurable "Powered by SWEEP Care AI"
  supportEmail?: string;
  customDomain?: string;
}

export interface TenantPolicy {
  tenantId: string;
  minCohortSize: number; // TBD-PRIV-001 (default 10)
  retentionDaysClassD: number; // TBD-PRIV-002 (default 365)
  requireGuardianUnderAge: number; // TBD-LEGAL-001 (default 18)
  crisisResourcesJson?: string; // PRD §61
}

export interface TenantContext {
  tenantId: string;
  tenantSlug?: string;
}

