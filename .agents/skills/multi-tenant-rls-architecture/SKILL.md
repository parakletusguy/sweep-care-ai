---
name: multi-tenant-rls-architecture
description: >-
  Database schema patterns, PostgreSQL Row-Level Security (RLS) policies, session tenancy context, 
  and RBAC access control enforcing zero cross-tenant leakage (AC-001) and strict tiered data 
  classification (Classes A through F). Use when creating or modifying database migrations, 
  tenancy middleware, user authorization logic, and audit trail services.
---

# Multi-Tenant Row-Level Security & RBAC Architecture (SWEEP Care AI)

## Core Requirement (PRD §18, §85, AC-001, Constitution Rule 12)

**RULE:** Every database query scoped to a tenant must enforce tenant boundaries at the database/data layer. Applications must NEVER rely solely on frontend or API filtering to isolate tenants.

---

## 1. PostgreSQL Row-Level Security (RLS) Pattern

Every table containing tenant-scoped data must include `tenant_id UUID NOT NULL` and enable RLS.

```sql
-- Example: Enabling RLS on Assessment Submissions
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy tying queries to the active tenant session variable
CREATE POLICY tenant_isolation_policy ON assessment_submissions
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
```

### Application Connection Middleware
Before executing any query in a request lifecycle:
```typescript
async function withTenantContext<T>(
  tenantId: string, 
  db: DatabaseClient, 
  fn: () => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Set local transaction parameter
    await tx.raw(`SET LOCAL app.current_tenant_id = ?`, [tenantId]);
    return await fn();
  });
}
```

---

## 2. Tiered Data Classification Matrix (PRD §55)

| Class | Category | Entities | Access Permissions | Audit Required? |
|---|---|---|---|---|
| **Class A** | Public | Public templates, help docs, generic crisis helplines | All roles, public | No |
| **Class B** | Organizational | Tenant profile, brand config, department hierarchy | Org Admin, Super Admin | Normal logging |
| **Class C** | Personal Identity | User name, email, avatar, role assignment | User, Org Admin, Super Admin | Yes (on edit) |
| **Class D** | Sensitive Wellbeing | Individual assessment answers, personal wellbeing profiles, case notes | Participant, Authorized Wellbeing Pro | **YES (AC-009)** |
| **Class E** | Sensitive Health | Physiological data (BP, glucose, sleep) | Participant, Authorized Health Pro | **YES (AC-009)** |
| **Class F** | Safeguarding | High-risk escalation events, crisis flags | Designated Safeguarding Officer ONLY | **MANDATORY (AC-009)** |

---

## 3. Strict RBAC Matrix (PRD §11–17, AC-007)

```typescript
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  WELLBEING_PROFESSIONAL = 'WELLBEING_PROFESSIONAL',
  HR_MANAGER = 'HR_MANAGER',
  TRAINER_FACILITATOR = 'TRAINER_FACILITATOR',
  PARTICIPANT = 'PARTICIPANT',
  SAFEGUARDING_OFFICER = 'SAFEGUARDING_OFFICER'
}

// Access Matrix Definition
export const PermissionRules = {
  CAN_VIEW_RAW_INDIVIDUAL_SCORES: [Role.PARTICIPANT, Role.WELLBEING_PROFESSIONAL],
  CAN_VIEW_AGGREGATED_DASHBOARDS: [Role.ORG_ADMIN, Role.HR_MANAGER, Role.WELLBEING_PROFESSIONAL, Role.TRAINER_FACILITATOR],
  CAN_MANAGE_PROGRAMMES: [Role.ORG_ADMIN, Role.WELLBEING_PROFESSIONAL, Role.TRAINER_FACILITATOR],
  CAN_APPROVE_PROGRAMMES: [Role.ORG_ADMIN, Role.WELLBEING_PROFESSIONAL], // AC-006 Human gate
  CAN_VIEW_SAFEGUARDING_ALERTS: [Role.SAFEGUARDING_OFFICER], // Class F access
  CAN_MANAGE_TENANT_BRANDING: [Role.ORG_ADMIN, Role.SUPER_ADMIN],
};
```

**CRITICAL TEST (AC-007):** HR Managers and People Managers must be explicitly blocked from querying raw individual participant scores, free-text submissions, and health data. They may only access aggregated cohort views meeting the $K$-anonymity threshold.
