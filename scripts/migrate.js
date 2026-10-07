/**
 * SWEEP Care AI — Supabase Database Migration Runner (PRD Rule 10, Rule 12)
 *
 * Connects to Supabase Postgres, creates schema tables, and enforces RLS.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

const rawConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error('Error: DATABASE_URL or DIRECT_URL not found in .env.local');
  process.exit(1);
}

// Strip query parameters so pg ssl config is respected
const cleanUrl = rawConnectionString.split('?')[0];

const client = new Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

const DDL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector TEXT NOT NULL CHECK (sector IN ('corporate', 'school', 'church', 'training')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenant Branding
CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0f766e',
  accent_color TEXT NOT NULL DEFAULT '#0d9488',
  font_family TEXT DEFAULT 'Inter',
  show_powered_by BOOLEAN NOT NULL DEFAULT true,
  support_email TEXT,
  custom_domain TEXT
);

-- 3. Tenant Policies
CREATE TABLE IF NOT EXISTS tenant_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  min_cohort_size INT NOT NULL DEFAULT 10,
  retention_days_class_d INT NOT NULL DEFAULT 365,
  require_guardian_under_age INT NOT NULL DEFAULT 18,
  crisis_resources_json TEXT
);

-- 4. Organization Units
CREATE TABLE IF NOT EXISTS organization_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'SUPER_ADMIN', 'ORG_ADMIN', 'WELLBEING_PROFESSIONAL',
    'HR_MANAGER', 'TRAINER_FACILITATOR', 'PARTICIPANT', 'SAFEGUARDING_OFFICER'
  )),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. User Memberships
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_unit_id UUID NOT NULL REFERENCES organization_units(id) ON DELETE CASCADE
);

-- 7. Consent Records
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  has_consented BOOLEAN NOT NULL,
  policy_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- 8. Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN (
    'CLASS_A_PUBLIC', 'CLASS_B_ORGANIZATIONAL', 'CLASS_C_PERSONAL',
    'CLASS_D_SENSITIVE_WELLBEING', 'CLASS_E_SENSITIVE_HEALTH', 'CLASS_F_SAFEGUARDING'
  )),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Programmes
CREATE TABLE IF NOT EXISTS programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SCHEDULED', 'ACTIVE',
    'COMPLETED', 'OUTCOME_REVIEW', 'ARCHIVED'
  )),
  problem_statement TEXT NOT NULL,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  human_approved_by_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Cases
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
    'OPEN', 'IN_REVIEW', 'ACTIVE_SUPPORT', 'REFERRED', 'ESCALATED', 'RESOLVED', 'CLOSED'
  )),
  priority TEXT NOT NULL DEFAULT 'ROUTINE' CHECK (priority IN (
    'ROUTINE', 'ELEVATED', 'URGENT', 'CRISIS'
  )),
  classification TEXT NOT NULL DEFAULT 'CLASS_D_SENSITIVE_WELLBEING' CHECK (classification IN (
    'CLASS_D_SENSITIVE_WELLBEING', 'CLASS_F_SAFEGUARDING'
  )),
  assigned_professional_id UUID REFERENCES users(id),
  opened_by_id UUID NOT NULL REFERENCES users(id),
  safeguarding_event_id UUID,
  assessment_submission_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 11. Case Notes
CREATE TABLE IF NOT EXISTS case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  author_role TEXT NOT NULL,
  content TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN (
    'CLASS_D_SENSITIVE_WELLBEING', 'CLASS_F_SAFEGUARDING'
  )),
  is_confidential BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_by_id UUID NOT NULL REFERENCES users(id),
  assigned_professional_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN (
    'INTERNAL_PROGRAMME', 'INTERNAL_SPECIALIST', 'EXTERNAL_EAP',
    'EXTERNAL_CLINICAL', 'COMMUNITY_SUPPORT'
  )),
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN (
    'PENDING_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REFERRED_EXTERNAL',
    'COMPLETED', 'DECLINED', 'CANCELLED'
  )),
  provider_name TEXT NOT NULL,
  external_contact_info TEXT,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_APP')),
  subject_line TEXT NOT NULL,
  body_preview TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- 14. Health Measurements
CREATE TABLE IF NOT EXISTS health_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dataType TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN (
    'MANUAL_ENTRY', 'DEVICE_BLE', 'APPLE_HEALTH_API', 'GOOGLE_HEALTH_CONNECT_API'
  )),
  device_model TEXT,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED_SELF_REPORT' CHECK (verification_status IN (
    'UNVERIFIED_SELF_REPORT', 'DEVICE_VERIFIED', 'CLINICAL_VALIDATED'
  )),
  consent_scope_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Tenant Configurations
CREATE TABLE IF NOT EXISTS tenant_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  data_residency_region TEXT NOT NULL DEFAULT 'eu-west' CHECK (data_residency_region IN (
    'eu-west', 'us-east', 'gb-lon', 'af-south'
  )),
  license_tier TEXT NOT NULL DEFAULT 'STARTER' CHECK (license_tier IN (
    'STARTER', 'PROFESSIONAL', 'ENTERPRISE'
  )),
  is_health_data_enabled BOOLEAN NOT NULL DEFAULT false,
  is_ai_assistant_enabled BOOLEAN NOT NULL DEFAULT true,
  min_cohort_size INT NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tenant-isolated tables (Rule 12, AC-001)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_configurations ENABLE ROW LEVEL SECURITY;
`;

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('Connected successfully!');

  console.log('Executing database schema migration...');
  await client.query(DDL);
  console.log('Migration executed successfully!');

  console.log('Verifying created tables in public schema:');
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  res.rows.forEach(r => console.log(' - ' + r.table_name));

  await client.end();
  console.log('Database migration completed cleanly.');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  client.end().catch(() => {});
  process.exit(1);
});
