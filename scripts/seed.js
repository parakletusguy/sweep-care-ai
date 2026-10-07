/**
 * SWEEP Care AI — Live Supabase Database Seed Script (PRD §18, §19, §22)
 *
 * Populates realistic multi-sector tenants, organizational units, users,
 * programmes, and confidential case records into the live Supabase PostgreSQL database.
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

const cleanUrl = rawConnectionString.split('?')[0];
const client = new Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

async function runSeed() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('Connected! Beginning multi-sector database seeding...');

  // 1. Seed 4 Sector Tenants
  const tenantData = [
    {
      slug: 'acme-corp',
      name: 'Acme Corporation',
      sector: 'corporate',
      brandName: 'Acme People Wellbeing',
      primaryColor: '#0f766e',
      accentColor: '#0d9488',
    },
    {
      slug: 'st-jude-uni',
      name: 'St. Jude University',
      sector: 'school',
      brandName: 'St. Jude Student Welfare Portal',
      primaryColor: '#2563eb',
      accentColor: '#3b82f6',
    },
    {
      slug: 'grace-fellowship',
      name: 'Grace Community Fellowship',
      sector: 'church',
      brandName: 'Grace Community Care Network',
      primaryColor: '#7c3aed',
      accentColor: '#8b5cf6',
    },
    {
      slug: 'executive-institute',
      name: 'Executive Leadership Institute',
      sector: 'training',
      brandName: 'Executive Stamina & Performance Hub',
      primaryColor: '#0284c7',
      accentColor: '#38bdf8',
    },
  ];

  for (const t of tenantData) {
    // Upsert tenant
    const tRes = await client.query(`
      INSERT INTO tenants (slug, name, sector, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
      RETURNING id;
    `, [t.slug, t.name, t.sector]);
    const tenantId = tRes.rows[0].id;

    // Upsert tenant branding
    await client.query(`
      INSERT INTO tenant_branding (tenant_id, product_name, primary_color, accent_color)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        primary_color = EXCLUDED.primary_color,
        accent_color = EXCLUDED.accent_color;
    `, [tenantId, t.brandName, t.primaryColor, t.accentColor]);

    // Upsert tenant policy
    await client.query(`
      INSERT INTO tenant_policies (tenant_id, min_cohort_size, retention_days_class_d, require_guardian_under_age)
      VALUES ($1, 10, 365, 18)
      ON CONFLICT (tenant_id) DO UPDATE SET min_cohort_size = 10;
    `, [tenantId]);

    // Upsert tenant configuration (Phase 3)
    await client.query(`
      INSERT INTO tenant_configurations (tenant_id, data_residency_region, license_tier, is_health_data_enabled)
      VALUES ($1, 'eu-west', 'ENTERPRISE', true)
      ON CONFLICT (tenant_id) DO UPDATE SET license_tier = 'ENTERPRISE';
    `, [tenantId]);

    // Seed primary Org Units for Acme Corp
    if (t.slug === 'acme-corp') {
      const orgUnits = [
        { name: 'Product Engineering', type: 'department', code: 'ENG' },
        { name: 'Customer Success', type: 'department', code: 'CS' },
        { name: 'Sales & Marketing', type: 'department', code: 'SM' },
      ];

      for (const ou of orgUnits) {
        await client.query(`
          INSERT INTO organization_units (tenant_id, name, unit_type, code)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING;
        `, [tenantId, ou.name, ou.type, ou.code]);
      }

      // Seed Key Role Users for Acme Corp
      const users = [
        {
          email: 'admin@sweepcare.org',
          name: 'Platform Super Admin',
          role: 'SUPER_ADMIN',
        },
        {
          email: 'dr.adebayo@acmewellness.org',
          name: 'Dr. E. Adebayo',
          role: 'WELLBEING_PROFESSIONAL',
        },
        {
          email: 'sarah.hr@acmecorp.com',
          name: 'Sarah Jenkins (VP People)',
          role: 'HR_MANAGER',
        },
        {
          email: 'alex.participant@acmecorp.com',
          name: 'Alex Rivera (Staff Engineer)',
          role: 'PARTICIPANT',
        },
        {
          email: 'safeguarding@acmecorp.com',
          name: 'Elena Rostova (Lead Safeguarding)',
          role: 'SAFEGUARDING_OFFICER',
        },
      ];

      const userMap = {};
      for (const u of users) {
        const uRes = await client.query(`
          INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
          VALUES ($1, $2, 'scrypt$hash$placeholder', $3, $4, true)
          ON CONFLICT DO NOTHING
          RETURNING id;
        `, [tenantId, u.email, u.name, u.role]);

        if (uRes.rows[0]) {
          userMap[u.role] = uRes.rows[0].id;
        } else {
          const existing = await client.query(`SELECT id FROM users WHERE email = $1 AND tenant_id = $2`, [u.email, tenantId]);
          userMap[u.role] = existing.rows[0]?.id;
        }
      }

      // Seed Approved Intervention Programme
      if (userMap['WELLBEING_PROFESSIONAL']) {
        const progRes = await client.query(`
          INSERT INTO programmes (
            tenant_id, title, status, problem_statement, is_ai_generated,
            human_approved_by_id, approved_at
          )
          VALUES (
            $1,
            'Asynchronous Work Boundaries & Cognitive Recovery',
            'ACTIVE',
            'Elevated workload cognitive fatigue identified in Engineering teams during Q3 pulse.',
            true,
            $2,
            NOW()
          )
          ON CONFLICT DO NOTHING
          RETURNING id;
        `, [tenantId, userMap['WELLBEING_PROFESSIONAL']]);

        // Seed Sample Case and Confidential Notes
        if (userMap['PARTICIPANT']) {
          const caseRes = await client.query(`
            INSERT INTO cases (
              tenant_id, participant_id, title, description, status,
              priority, classification, assigned_professional_id, opened_by_id
            )
            VALUES (
              $1,
              $2,
              'Acute Workload Stress & Fatigue Support',
              'Self-reported cognitive exhaustion from consecutive on-call duty rotations.',
              'ACTIVE_SUPPORT',
              'ELEVATED',
              'CLASS_D_SENSITIVE_WELLBEING',
              $3,
              $3
            )
            ON CONFLICT DO NOTHING
            RETURNING id;
          `, [tenantId, userMap['PARTICIPANT'], userMap['WELLBEING_PROFESSIONAL']]);

          const caseId = caseRes.rows[0]?.id;
          if (caseId) {
            await client.query(`
              INSERT INTO case_notes (
                case_id, tenant_id, author_id, author_role, content,
                classification, is_confidential
              )
              VALUES (
                $1,
                $2,
                $3,
                'Wellbeing Professional',
                'Completed confidential triage. Participant experiencing acute cognitive fatigue from consecutive shift demands. Recommended workload pause and resilience exercises.',
                'CLASS_D_SENSITIVE_WELLBEING',
                true
              );
            `, [caseId, tenantId, userMap['WELLBEING_PROFESSIONAL']]);
          }
        }
      }
    }
  }

  console.log('Seeding completed! Summary of records:');
  const counts = await client.query(`
    SELECT 'tenants' as table_name, count(*) as total FROM tenants
    UNION ALL
    SELECT 'users', count(*) FROM users
    UNION ALL
    SELECT 'programmes', count(*) FROM programmes
    UNION ALL
    SELECT 'cases', count(*) FROM cases
    UNION ALL
    SELECT 'case_notes', count(*) FROM case_notes;
  `);

  counts.rows.forEach(r => console.log(` • ${r.table_name}: ${r.total}`));

  await client.end();
  console.log('Done!');
}

runSeed().catch(err => {
  console.error('Seeding error:', err);
  client.end().catch(() => {});
  process.exit(1);
});
