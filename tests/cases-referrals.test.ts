import { describe, it, expect, beforeEach } from 'vitest';
import { CaseManager } from '../src/domain/cases/case-manager';
import {
  CasePriority,
  CaseStatus,
  ReferralStatus,
  ReferralType,
} from '../src/domain/cases/types';
import { Role, UserSession } from '../src/domain/identity/roles';
import { TenantContextStore } from '../src/domain/tenancy/tenant-context';
import { AuditLogger } from '../src/domain/audit/audit-logger';
import { DataClassification } from '../src/domain/audit/types';

describe('Phase 2A: Professional Case Notes & Referral Pipelines', () => {
  const tenant1 = '11111111-1111-1111-1111-111111111111';
  const tenant2 = '22222222-2222-2222-2222-222222222222';

  const professionalUser: UserSession = {
    userId: 'prof-user-1',
    tenantId: tenant1,
    email: 'counsellor@org.com',
    role: Role.WELLBEING_PROFESSIONAL,
  };

  const hrManagerUser: UserSession = {
    userId: 'hr-user-1',
    tenantId: tenant1,
    email: 'hr@org.com',
    role: Role.HR_MANAGER,
  };

  const safeguardingOfficerUser: UserSession = {
    userId: 'safeguard-officer-1',
    tenantId: tenant1,
    email: 'safeguarding@org.com',
    role: Role.SAFEGUARDING_OFFICER,
  };

  const participantUser: UserSession = {
    userId: 'part-user-1',
    tenantId: tenant1,
    email: 'employee@org.com',
    role: Role.PARTICIPANT,
  };

  const tenant2ProfessionalUser: UserSession = {
    userId: 'prof-user-2',
    tenantId: tenant2,
    email: 'counsellor@otherorg.com',
    role: Role.WELLBEING_PROFESSIONAL,
  };

  beforeEach(() => {
    CaseManager._clearForTesting();
    AuditLogger._clearForTesting();
  });

  describe('1. Tenant Boundary Isolation (AC-001)', () => {
    it('prevents cross-tenant access to cases and confidential notes', () => {
      // Create case in Tenant 1
      let createdCaseId = '';
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        const newCase = CaseManager.createCase(professionalUser, {
          tenantId: tenant1,
          participantId: 'participant-abc',
          title: 'Workplace Exhaustion Support',
          description: 'Participant experiencing acute burnout following Q3 deliverables.',
          priority: CasePriority.ELEVATED,
        });
        createdCaseId = newCase.id;
      });

      // Tenant 2 professional attempts to read Tenant 1 case -> CrossTenantAccessDenied
      TenantContextStore.run({ tenantId: tenant2 }, () => {
        expect(() => {
          CaseManager.getCase(tenant2ProfessionalUser, createdCaseId);
        }).toThrow(/CrossTenantAccessDenied/);
      });
    });
  });

  describe('2. Health & Wellbeing Privacy Boundary: HR Lockout (AC-007, PRD §14)', () => {
    it('strictly forbids HR Managers from creating, reading, or listing individual cases', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        // 1. HR Manager cannot create a case
        expect(() => {
          CaseManager.createCase(hrManagerUser, {
            tenantId: tenant1,
            participantId: 'participant-abc',
            title: 'Unauthorized Case',
            description: 'HR attempting to record private health observation.',
          });
        }).toThrow(/Forbidden.*MANAGE_CASES/);

        // Professional creates an authorized case
        const validCase = CaseManager.createCase(professionalUser, {
          tenantId: tenant1,
          participantId: 'participant-abc',
          title: 'Private Care Plan',
          description: 'Counselling referral initiated.',
        });

        // 2. HR Manager cannot read the case
        expect(() => {
          CaseManager.getCase(hrManagerUser, validCase.id);
        }).toThrow(/Forbidden.*HR_MANAGER is not authorized to access CLASS_D_SENSITIVE_WELLBEING/);

        // 3. HR Manager cannot list individual cases
        expect(() => {
          CaseManager.listCasesForSession(hrManagerUser);
        }).toThrow(/Forbidden.*HR_MANAGER cannot view individual participant cases/);

        // 4. HR Manager cannot add notes
        expect(() => {
          CaseManager.addCaseNote(hrManagerUser, validCase.id, {
            content: 'Manager observation.',
          });
        }).toThrow();
      });
    });

    it('forbids participants from accessing professional case files directly', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        const c = CaseManager.createCase(professionalUser, {
          tenantId: tenant1,
          participantId: participantUser.userId,
          title: 'Support Case',
          description: 'Routine coaching.',
        });

        expect(() => {
          CaseManager.getCase(participantUser, c.id);
        }).toThrow(/Forbidden/);
      });
    });
  });

  describe('3. Professional Case Notes & Referral Pipelines Lifecycle', () => {
    it('allows Wellbeing Professionals to open cases, record confidential notes, and progress referrals', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        // Step 1: Open case
        const careCase = CaseManager.createCase(professionalUser, {
          tenantId: tenant1,
          participantId: participantUser.userId,
          title: 'Acute Stress & Compassion Fatigue',
          description: 'Participant identified high workload friction and distress in check-in.',
          priority: CasePriority.ELEVATED,
        });

        expect(careCase.status).toBe(CaseStatus.OPEN);
        expect(careCase.priority).toBe(CasePriority.ELEVATED);
        expect(careCase.classification).toBe(DataClassification.CLASS_D_SENSITIVE_WELLBEING);

        // Step 2: Add confidential note
        const note = CaseManager.addCaseNote(professionalUser, careCase.id, {
          content: 'Completed initial 30-min intake session. Recommended mindfulness and EAP counselling.',
          isConfidential: true,
        });

        expect(note.isConfidential).toBe(true);
        expect(note.authorRole).toBe(Role.WELLBEING_PROFESSIONAL);

        // Case status transitioned to ACTIVE_SUPPORT
        const updatedCase = CaseManager.getCase(professionalUser, careCase.id);
        expect(updatedCase.status).toBe(CaseStatus.ACTIVE_SUPPORT);
        expect(updatedCase.notes).toHaveLength(1);

        // Step 3: Initiate referral pipeline
        const referral = CaseManager.createReferral(professionalUser, careCase.id, {
          type: ReferralType.EXTERNAL_EAP,
          providerName: 'Workplace Resilience EAP Partner',
          externalContactInfo: 'eap-support@wellnessprovider.org / +44 800 123 456',
          reason: 'Specialized 1-on-1 cognitive reframing sessions needed.',
        });

        expect(referral.status).toBe(ReferralStatus.PENDING_REVIEW);
        expect(referral.type).toBe(ReferralType.EXTERNAL_EAP);
        expect(updatedCase.status).toBe(CaseStatus.REFERRED);

        // Step 4: Advance referral through pipeline
        const assignedReferral = CaseManager.updateReferralStatus(
          professionalUser,
          careCase.id,
          referral.id,
          ReferralStatus.ASSIGNED
        );
        expect(assignedReferral.status).toBe(ReferralStatus.ASSIGNED);

        const inProgressReferral = CaseManager.updateReferralStatus(
          professionalUser,
          careCase.id,
          referral.id,
          ReferralStatus.IN_PROGRESS
        );
        expect(inProgressReferral.status).toBe(ReferralStatus.IN_PROGRESS);

        const completedReferral = CaseManager.updateReferralStatus(
          professionalUser,
          careCase.id,
          referral.id,
          ReferralStatus.COMPLETED
        );
        expect(completedReferral.status).toBe(ReferralStatus.COMPLETED);
        expect(completedReferral.completedAt).toBeDefined();

        // Step 5: Disallow transition from terminal state
        expect(() => {
          CaseManager.updateReferralStatus(
            professionalUser,
            careCase.id,
            referral.id,
            ReferralStatus.PENDING_REVIEW
          );
        }).toThrow(/InvalidReferralTransition/);

        // Step 6: Close case with resolution
        const closedCase = CaseManager.closeCase(
          professionalUser,
          careCase.id,
          'Participant successfully completed 6 sessions and scores returned to normal baseline.'
        );

        expect(closedCase.status).toBe(CaseStatus.CLOSED);
        expect(closedCase.closedAt).toBeDefined();
        // Closing adds administrative note
        expect(closedCase.notes).toHaveLength(2);
      });
    });
  });

  describe('4. Safeguarding Officer & Class F Safeguarding Isolation', () => {
    it('isolates Class F Safeguarding cases exclusively to designated officers and assigned staff', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        // Safeguarding officer creates Class F case
        const safeguardingCase = CaseManager.createCase(safeguardingOfficerUser, {
          tenantId: tenant1,
          participantId: participantUser.userId,
          title: 'Critical Safeguarding Escalation',
          description: 'Self-harm indicator detected in survey free-text response.',
          priority: CasePriority.CRISIS,
          classification: DataClassification.CLASS_F_SAFEGUARDING,
          assignedProfessionalId: safeguardingOfficerUser.userId,
        });

        expect(safeguardingCase.classification).toBe(DataClassification.CLASS_F_SAFEGUARDING);

        // Safeguarding officer can access
        const fetched = CaseManager.getCase(safeguardingOfficerUser, safeguardingCase.id);
        expect(fetched.id).toBe(safeguardingCase.id);

        // Unassigned Wellbeing Professional CANNOT access Class F case
        expect(() => {
          CaseManager.getCase(professionalUser, safeguardingCase.id);
        }).toThrow(/Forbidden.*is not authorized to access CLASS_F_SAFEGUARDING/);
      });
    });
  });

  describe('5. Append-Only Audit Trail (AC-009)', () => {
    it('records immutable audit events with actor ID, classification, and action for all case operations', () => {
      TenantContextStore.run({ tenantId: tenant1 }, () => {
        const c = CaseManager.createCase(professionalUser, {
          tenantId: tenant1,
          participantId: participantUser.userId,
          title: 'Audit Verification Case',
          description: 'Testing audit logging compliance.',
        });

        CaseManager.addCaseNote(professionalUser, c.id, {
          content: 'Confidential clinical discussion.',
        });

        CaseManager.createReferral(professionalUser, c.id, {
          type: ReferralType.INTERNAL_SPECIALIST,
          providerName: 'Internal Clinical Lead',
          reason: 'Secondary review.',
        });

        // Fetch audit logs for tenant
        const events = AuditLogger.getEventsForTenant(tenant1);

        // Verify we have audit events for creation, notes, and referral
        expect(events.length).toBeGreaterThanOrEqual(3);

        // Assert all events recorded Class D classification and correct actor
        const caseCreationEvent = events.find(
          (e) => e.resourceType === 'Case' && e.action === 'CREATE'
        );
        expect(caseCreationEvent).toBeDefined();
        expect(caseCreationEvent?.actorId).toBe(professionalUser.userId);
        expect(caseCreationEvent?.classification).toBe(DataClassification.CLASS_D_SENSITIVE_WELLBEING);

        const noteEvent = events.find(
          (e) => e.resourceType === 'CaseNote' && e.action === 'CREATE'
        );
        expect(noteEvent).toBeDefined();
        expect(noteEvent?.actorId).toBe(professionalUser.userId);
        expect(noteEvent?.classification).toBe(DataClassification.CLASS_D_SENSITIVE_WELLBEING);

        const referralEvent = events.find(
          (e) => e.resourceType === 'Referral' && e.action === 'CREATE'
        );
        expect(referralEvent).toBeDefined();
        expect(referralEvent?.actorId).toBe(professionalUser.userId);
      });
    });
  });
});
