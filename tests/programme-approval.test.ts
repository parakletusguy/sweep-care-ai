import { describe, it, expect, beforeEach } from 'vitest';
import { ProgrammeManager } from '@/domain/programme/programme-manager';
import { ProgrammeState } from '@/domain/programme/types';
import { Role, UserSession } from '@/domain/identity/roles';

describe('Sprint 1.8: AC-006 Human Approval Gate & Programme Lifecycle', () => {
  const tenantId = 'tenant-care-1';

  const proSession: UserSession = {
    userId: 'user-wellbeing-pro',
    tenantId,
    email: 'pro@care.com',
    role: Role.WELLBEING_PROFESSIONAL,
  };

  const hrSession: UserSession = {
    userId: 'user-hr-lead',
    tenantId,
    email: 'hr@care.com',
    role: Role.HR_MANAGER,
  };

  beforeEach(() => {
    ProgrammeManager._clearForTesting();
  });

  it('initializes AI-generated programmes in DRAFT state with SUGGESTED_APPROACH classification', () => {
    const programme = ProgrammeManager.createAiDraft({
      tenantId,
      title: 'Restoring Team Focus',
      problemStatement: 'Elevated workload fatigue identified in Q3 assessment.',
      targetPopulation: 'Operations Team (N=35)',
      objectives: ['Establish boundaries on out-of-hours messages'],
      sessions: [{ sessionNumber: 1, title: 'Workload Audit', durationMinutes: 60, description: 'Audit tasks' }],
      supportingKnowledgeSourceIds: ['WHO-MH-WORK-2022'],
    });

    expect(programme.state).toBe(ProgrammeState.DRAFT);
    expect(programme.isAiGenerated).toBe(true);
    expect(programme.wordingClassification).toBe('SUGGESTED_APPROACH');
    expect(programme.humanApprovedById).toBeUndefined();
  });

  it('AC-006: blocks direct activation of AI programmes from DRAFT without human approval', () => {
    const programme = ProgrammeManager.createAiDraft({
      tenantId,
      title: 'Unapproved AI Workshop',
      problemStatement: 'Needs support',
      targetPopulation: 'Team B',
      objectives: ['Improve wellbeing'],
      sessions: [],
      supportingKnowledgeSourceIds: [],
    });

    // Attempting activation directly throws AC-006 ApprovalViolation
    expect(() => {
      ProgrammeManager.activateProgramme(programme.id, tenantId);
    }).toThrowError(/AC-006 ApprovalViolation/);
  });

  it('denies HR Manager from signing off / approving programmes', () => {
    const programme = ProgrammeManager.createAiDraft({
      tenantId,
      title: 'Mindfulness Cohort',
      problemStatement: 'High stress',
      targetPopulation: 'Team C',
      objectives: [],
      sessions: [],
      supportingKnowledgeSourceIds: [],
    });

    // HR manager lacks APPROVE_PROGRAMME permission
    expect(() => {
      ProgrammeManager.approveProgramme(programme.id, hrSession);
    }).toThrowError(/Forbidden/);
  });

  it('allows authorized Wellbeing Professional to approve programme, enabling activation', () => {
    const programme = ProgrammeManager.createAiDraft({
      tenantId,
      title: 'Workplace Resilience Cohort',
      problemStatement: 'Burnout risk identified',
      targetPopulation: 'Customer Support (N=20)',
      objectives: ['Peer support circles'],
      sessions: [{ sessionNumber: 1, title: 'Check-in', durationMinutes: 45, description: 'Intro' }],
      supportingKnowledgeSourceIds: ['ISO-45003-2021'],
    });

    ProgrammeManager.submitForReview(programme.id, tenantId);

    // Wellbeing Pro approves
    const approved = ProgrammeManager.approveProgramme(programme.id, proSession);
    expect(approved.state).toBe(ProgrammeState.APPROVED);
    expect(approved.humanApprovedById).toBe(proSession.userId);

    // Now activation succeeds
    const active = ProgrammeManager.activateProgramme(programme.id, tenantId);
    expect(active.state).toBe(ProgrammeState.ACTIVE);
  });
});
