import { Role } from '../identity/roles';

/**
 * Phase 2C: Enterprise Directory, Identity & LMS Connector Types (PRD §70)
 */

// SCIM 2.0 Protocol Types (RFC 7643 / RFC 7644)
export interface ScimName {
  formatted?: string;
  familyName?: string;
  givenName?: string;
}

export interface ScimEmail {
  value: string;
  type?: string;
  primary?: boolean;
}

export interface ScimUser {
  id: string;
  userName: string;
  name?: ScimName;
  emails: ScimEmail[];
  active: boolean;
  groups?: Array<{ value: string; display?: string }>;
}

export interface ScimGroup {
  id: string;
  displayName: string;
  members: Array<{ value: string; display?: string }>;
}

export interface ScimListResponse<T> {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

// SAML 2.0 SSO Types
export interface SamlIdpConfig {
  tenantId: string;
  entityId: string;
  signOnUrl: string;
  certificate: string;
  defaultRole: Role;
  roleAttributeMapping?: Record<string, Role>;
}

export interface SamlAssertion {
  issuer: string;
  nameId: string;
  sessionIndex: string;
  attributes: Record<string, string | string[]>;
  validUntil: string;
}

// LMS Synchronization Types (Canvas / Moodle)
export type LmsPlatform = 'CANVAS' | 'MOODLE' | 'BLACKBOARD';

export interface LmsCourse {
  courseId: string;
  name: string;
  courseCode: string;
  studentIds: string[];
}
