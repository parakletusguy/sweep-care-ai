import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * PRD §18: Multi-Tenant Organizations
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  sector: text('sector', { enum: ['corporate', 'school', 'church', 'training'] }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * PRD §19: White-Label Configuration
 */
export const tenantBranding = pgTable('tenant_branding', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull().unique(),
  productName: text('product_name').notNull(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#0f766e').notNull(),
  accentColor: text('accent_color').default('#0d9488').notNull(),
  fontFamily: text('font_family').default('Inter'),
  showPoweredBy: boolean('show_powered_by').default(true).notNull(),
  supportEmail: text('support_email'),
  customDomain: text('custom_domain'),
});

/**
 * PRD §83, §118: Tenant Policies & TBD Isolation
 */
export const tenantPolicies = pgTable('tenant_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull().unique(),
  minCohortSize: integer('min_cohort_size').default(10).notNull(), // TBD-PRIV-001 (default 10)
  retentionDaysClassD: integer('retention_days_class_d').default(365).notNull(), // TBD-PRIV-002
  requireGuardianUnderAge: integer('require_guardian_under_age').default(18).notNull(), // TBD-LEGAL-001
  crisisResourcesJson: text('crisis_resources_json'), // PRD §61
});

/**
 * PRD §22: Hierarchical Organization Structure
 */
export const organizationUnits = pgTable('organization_units', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  unitType: text('unit_type').notNull(), // e.g. 'region', 'location', 'department', 'team'
  code: text('code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * PRD §11–17: User Accounts & Roles
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role', {
    enum: [
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'WELLBEING_PROFESSIONAL',
      'HR_MANAGER',
      'TRAINER_FACILITATOR',
      'PARTICIPANT',
      'SAFEGUARDING_OFFICER',
    ],
  }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * PRD §22: User Membership in Organization Units
 */
export const userMemberships = pgTable('user_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationUnitId: uuid('organization_unit_id').references(() => organizationUnits.id, { onDelete: 'cascade' }).notNull(),
});

/**
 * PRD §58: Consent Records
 */
export const consentRecords = pgTable('consent_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  consentType: text('consent_type').notNull(),
  hasConsented: boolean('has_consented').notNull(),
  policyVersion: text('policy_version').notNull(),
  consentedAt: timestamp('consented_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
});

/**
 * PRD §55, §85, AC-009: Append-Only Audit Trail
 */
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  actorId: uuid('actor_id').notNull(),
  action: text('action').notNull(),
  classification: text('classification', {
    enum: [
      'CLASS_A_PUBLIC',
      'CLASS_B_ORGANIZATIONAL',
      'CLASS_C_PERSONAL',
      'CLASS_D_SENSITIVE_WELLBEING',
      'CLASS_E_SENSITIVE_HEALTH',
      'CLASS_F_SAFEGUARDING',
    ],
  }).notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * PRD §43, AC-006: Intervention Programmes with Human Review Gates
 */
export const programmes = pgTable('programmes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  status: text('status', {
    enum: [
      'DRAFT',
      'UNDER_REVIEW',
      'APPROVED',
      'SCHEDULED',
      'ACTIVE',
      'COMPLETED',
      'OUTCOME_REVIEW',
      'ARCHIVED',
    ],
  }).default('DRAFT').notNull(),
  problemStatement: text('problem_statement').notNull(),
  isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
  humanApprovedById: uuid('human_approved_by_id'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
