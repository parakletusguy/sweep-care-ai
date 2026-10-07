import { describe, it, expect, beforeEach } from 'vitest';
import { ScimManager } from '../src/domain/connectors/scim-manager';
import { SamlManager } from '../src/domain/connectors/saml-manager';
import { LmsSyncManager } from '../src/domain/connectors/lms-sync-manager';
import { Role } from '../src/domain/identity/roles';
import { TenantContextStore } from '../src/domain/tenancy/tenant-context';
import { AuditLogger } from '../src/domain/audit/audit-logger';

describe('Phase 2C: Enterprise Directory & LMS Connectors', () => {
  const tenant1 = '44444444-4444-4444-4444-444444444444';
  const tenant2 = '55555555-5555-5555-5555-555555555555';

  beforeEach(() => {
    ScimManager._clearForTesting();
    SamlManager._clearForTesting();
    LmsSyncManager._clearForTesting();
    AuditLogger._clearForTesting();
  });

  describe('1. SCIM 2.0 User Provisioning & Deprovisioning (RFC 7644)', () => {
    it('provisions, updates, lists, and deprovisions users while enforcing tenant isolation', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        // Provision
        const newUser = ScimManager.provisionUser(tenant1, {
          userName: 'alex.smith@corp.com',
          name: { givenName: 'Alex', familyName: 'Smith' },
          emails: [{ value: 'alex.smith@corp.com', primary: true }],
          active: true,
        });

        expect(newUser.id).toBeDefined();
        expect(newUser.userName).toBe('alex.smith@corp.com');
        expect(newUser.active).toBe(true);

        // Conflict check
        expect(() => {
          ScimManager.provisionUser(tenant1, {
            userName: 'alex.smith@corp.com',
            emails: [{ value: 'alex.smith@corp.com', primary: true }],
            active: true,
          });
        }).toThrow(/ScimConflict/);

        // List
        const list = ScimManager.listUsers(tenant1);
        expect(list.totalResults).toBe(1);
        expect(list.Resources[0].id).toBe(newUser.id);

        // Update
        const updated = ScimManager.updateUser(tenant1, newUser.id, {
          name: { givenName: 'Alexander', familyName: 'Smith' },
        });
        expect(updated.name?.givenName).toBe('Alexander');

        // Deprovision
        ScimManager.deprovisionUser(tenant1, newUser.id);
        const listAfter = ScimManager.listUsers(tenant1);
        expect(listAfter.Resources[0].active).toBe(false);
      });

      // Tenant 2 isolation check
      TenantContextStore.run({ tenantId: tenant2 }, () => {
        const listT2 = ScimManager.listUsers(tenant2);
        expect(listT2.totalResults).toBe(0);
      });
    });
  });

  describe('2. SAML 2.0 SSO Assertion Processing & Role Mapping', () => {
    it('authenticates valid SAML assertions and maps enterprise claims to canonical roles', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        SamlManager.registerIdp({
          tenantId: tenant1,
          entityId: 'https://sts.windows.net/azure-ad-tenant/',
          signOnUrl: 'https://login.microsoftonline.com/saml2',
          certificate: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8...',
          defaultRole: Role.PARTICIPANT,
          roleAttributeMapping: {
            'CareLead': Role.WELLBEING_PROFESSIONAL,
            'PeopleTeam': Role.HR_MANAGER,
          },
        });

        // 1. Process valid participant assertion
        const session = SamlManager.processAssertion(tenant1, {
          issuer: 'https://sts.windows.net/azure-ad-tenant/',
          nameId: 'employee.jane@corp.com',
          sessionIndex: 'sess-12345',
          attributes: { roles: ['CareLead'] },
          validUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour future
        });

        expect(session.email).toBe('employee.jane@corp.com');
        expect(session.role).toBe(Role.WELLBEING_PROFESSIONAL);

        // 2. Reject expired assertion
        expect(() => {
          SamlManager.processAssertion(tenant1, {
            issuer: 'https://sts.windows.net/azure-ad-tenant/',
            nameId: 'expired@corp.com',
            sessionIndex: 'sess-expired',
            attributes: {},
            validUntil: new Date(Date.now() - 3600000).toISOString(), // 1 hour past
          });
        }).toThrow(/SamlSecurityViolation/);
      });
    });
  });

  describe('3. LMS Synchronization (Canvas & Moodle)', () => {
    it('synchronizes course cohorts and learner rosters into tenant groups', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        const course = LmsSyncManager.syncCourseRoster(tenant1, 'CANVAS', {
          courseId: 'canvas-crs-101',
          name: 'Year 10 Student Wellbeing Circle',
          courseCode: 'Y10-WB-2026',
          studentIds: ['stu-01', 'stu-02', 'stu-03', 'stu-04'],
        });

        expect(course.courseId).toBe('canvas-crs-101');
        expect(course.studentIds.length).toBe(4);

        const allCourses = LmsSyncManager.getCoursesForTenant(tenant1);
        expect(allCourses.length).toBe(1);
        expect(allCourses[0].courseCode).toBe('Y10-WB-2026');
      });
    });
  });
});
