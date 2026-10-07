import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentManager } from '@/domain/assessment/assessment-manager';
import { QuestionType, ValidationStatus } from '@/domain/assessment/types';

describe('Sprint 1.4: AC-002 Assessment Immutability & Version Control', () => {
  const tenantId = 'tenant-corp-1';

  beforeEach(() => {
    AssessmentManager._clearForTesting();
  });

  it('allows in-place updates before any participant responses are submitted', () => {
    const asm = AssessmentManager.createAssessment({
      tenantId,
      title: 'Initial Pulse Q1',
      domains: [{ id: 'stress', name: 'Workplace Stress' }],
      questions: [
        {
          id: 'q1',
          domainId: 'stress',
          type: QuestionType.LIKERT_SCALE,
          prompt: 'How manageable is your workload?',
          isRequired: true,
        },
      ],
    });

    expect(asm.version).toBe(1);
    expect(asm.hasSubmissions).toBe(false);

    // In-place edit
    const updated = AssessmentManager.updateAssessment(asm.id, tenantId, {
      title: 'Refined Pulse Q1',
    });

    expect(updated.version).toBe(1);
    expect(updated.title).toBe('Refined Pulse Q1');
  });

  it('AC-002: preserves historic version and spawns Version 2 upon modification once responses exist', () => {
    const asm = AssessmentManager.createAssessment({
      tenantId,
      title: 'Quarterly Wellbeing Index',
      domains: [{ id: 'belonging', name: 'Belonging & Connectedness' }],
      questions: [
        {
          id: 'q1',
          domainId: 'belonging',
          type: QuestionType.LIKERT_SCALE,
          prompt: 'I feel valued by my team',
          isRequired: true,
        },
      ],
    });

    AssessmentManager.publishAssessment(asm.id, tenantId);

    // Record that responses have been submitted
    AssessmentManager.markSubmissionsReceived(asm.id, 1, tenantId);

    // Now modify the assessment
    const v2 = AssessmentManager.updateAssessment(asm.id, tenantId, {
      title: 'Quarterly Wellbeing Index (Updated)',
      questions: [
        {
          id: 'q1',
          domainId: 'belonging',
          type: QuestionType.LIKERT_SCALE,
          prompt: 'I feel valued by my team and leaders',
          isRequired: true,
        },
      ],
    });

    // Version 2 spawned
    expect(v2.version).toBe(2);
    expect(v2.title).toBe('Quarterly Wellbeing Index (Updated)');
    expect(v2.hasSubmissions).toBe(false);

    // Version 1 remains completely intact and locked (AC-002)
    const v1 = AssessmentManager.getAssessment(asm.id, tenantId);
    expect(v1).toBeDefined();
    expect(v1!.version).toBe(1);
    expect(v1!.title).toBe('Quarterly Wellbeing Index');
    expect(v1!.hasSubmissions).toBe(true);
  });

  it('locks campaigns to the specific immutable assessment version', () => {
    const asm = AssessmentManager.createAssessment({
      tenantId,
      title: 'Annual Review Assessment',
      domains: [{ id: 'overall', name: 'Overall State' }],
      questions: [],
    });

    AssessmentManager.publishAssessment(asm.id, tenantId);

    const campaign = AssessmentManager.launchCampaign({
      tenantId,
      assessmentId: asm.id,
      title: 'Q4 All-Hands Check-in',
      targetUnitIds: ['unit-eng'],
      opensAt: '2026-10-01T00:00:00Z',
      closesAt: '2026-10-15T23:59:59Z',
    });

    expect(campaign.assessmentId).toBe(asm.id);
    expect(campaign.assessmentVersion).toBe(1); // Permanently locked to Version 1
    expect(campaign.status).toBe('ACTIVE');
  });
});
