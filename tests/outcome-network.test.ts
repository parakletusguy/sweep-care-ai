import { describe, it, expect, beforeEach } from 'vitest';
import { OutcomeNetworkManager } from '../src/domain/benchmarks/outcome-network-manager';

describe('Phase 4: Governed Outcome Intelligence Network (PRD §100, §114)', () => {
  beforeEach(() => {
    OutcomeNetworkManager._clearAll();
  });

  it('rejects cohort outcome contribution if tenant has not opted into the network', () => {
    expect(() =>
      OutcomeNetworkManager.ingestCohortOutcome({
        tenantId: 'unconsented-tenant-xyz',
        sector: 'corporate',
        interventionCategory: 'WORKLOAD_BOUNDARIES',
        cohortSize: 30,
        baselineAverageScore: 55,
        postInterventionAverageScore: 72,
        durationWeeks: 6,
        participantRetentionRate: 0.92,
      })
    ).toThrow(/has not opted into the Outcome Intelligence Network/i);
  });

  it('allows opted-in tenants to contribute de-identified cohort outcomes', () => {
    OutcomeNetworkManager.optIn('tenant-alpha', 'super-admin-01');

    const outcome = OutcomeNetworkManager.ingestCohortOutcome({
      tenantId: 'tenant-alpha',
      sector: 'corporate',
      interventionCategory: 'WORKLOAD_BOUNDARIES',
      cohortSize: 20,
      baselineAverageScore: 50,
      postInterventionAverageScore: 68,
      durationWeeks: 4,
      participantRetentionRate: 0.9,
    });

    expect(outcome.cohortIdHash).toBeTruthy();
    expect(outcome.scoreDelta).toBe(18);
    expect(outcome.relativeImprovementPercent).toBe(36);
    expect(outcome.cohortSizeBracket).toBe('10-25');
  });

  it('suppresses sector benchmark aggregates if fewer than 3 organizations have contributed (K-privacy)', () => {
    // Only 2 organizations contribute
    OutcomeNetworkManager.optIn('org-1', 'admin-1');
    OutcomeNetworkManager.optIn('org-2', 'admin-2');

    OutcomeNetworkManager.ingestCohortOutcome({
      tenantId: 'org-1',
      sector: 'school',
      interventionCategory: 'EXAM_RESILIENCE',
      cohortSize: 30,
      baselineAverageScore: 45,
      postInterventionAverageScore: 65,
      durationWeeks: 6,
      participantRetentionRate: 0.88,
    });

    OutcomeNetworkManager.ingestCohortOutcome({
      tenantId: 'org-2',
      sector: 'school',
      interventionCategory: 'EXAM_RESILIENCE',
      cohortSize: 40,
      baselineAverageScore: 48,
      postInterventionAverageScore: 70,
      durationWeeks: 6,
      participantRetentionRate: 0.95,
    });

    const benchmark = OutcomeNetworkManager.getSectorBenchmark('school', 'EXAM_RESILIENCE');
    expect(benchmark.isSuppressedDueToSmallSample).toBe(true);
    expect(benchmark.benchmarkConfidenceLevel).toBe('INSUFFICIENT_DATA');
    expect(benchmark.totalParticipatingOrganizations).toBe(2);
  });

  it('discloses verified benchmark metrics when 3 or more organizations participate with >= 50 participants', () => {
    OutcomeNetworkManager.optIn('org-1', 'admin-1');
    OutcomeNetworkManager.optIn('org-2', 'admin-2');
    OutcomeNetworkManager.optIn('org-3', 'admin-3');

    OutcomeNetworkManager.ingestCohortOutcome({
      tenantId: 'org-1',
      sector: 'corporate',
      interventionCategory: 'WORKLOAD_BOUNDARIES',
      cohortSize: 25,
      baselineAverageScore: 50,
      postInterventionAverageScore: 65, // +30%
      durationWeeks: 4,
      participantRetentionRate: 0.9,
    });

    OutcomeNetworkManager.ingestCohortOutcome({
      tenantId: 'org-2',
      sector: 'corporate',
      interventionCategory: 'WORKLOAD_BOUNDARIES',
      cohortSize: 30,
      baselineAverageScore: 52,
      postInterventionAverageScore: 71, // +36.5%
      durationWeeks: 4,
      participantRetentionRate: 0.92,
    });

    OutcomeNetworkManager.ingestCohortOutcome({
      tenantId: 'org-3',
      sector: 'corporate',
      interventionCategory: 'WORKLOAD_BOUNDARIES',
      cohortSize: 35,
      baselineAverageScore: 48,
      postInterventionAverageScore: 68, // +41.7%
      durationWeeks: 4,
      participantRetentionRate: 0.88,
    });

    const benchmark = OutcomeNetworkManager.getSectorBenchmark('corporate', 'WORKLOAD_BOUNDARIES');
    expect(benchmark.isSuppressedDueToSmallSample).toBe(false);
    expect(benchmark.totalParticipatingOrganizations).toBe(3);
    expect(benchmark.averageScoreImprovementPercent).toBeGreaterThan(30);
    expect(benchmark.benchmarkConfidenceLevel).toBe('MODERATE');
  });

  it('honors opt-in revocation and blocks subsequent ingestions', () => {
    OutcomeNetworkManager.optIn('org-temp', 'admin-temp');
    expect(OutcomeNetworkManager.isOptedIn('org-temp')).toBe(true);

    OutcomeNetworkManager.revokeOptIn('org-temp', 'admin-temp');
    expect(OutcomeNetworkManager.isOptedIn('org-temp')).toBe(false);

    expect(() =>
      OutcomeNetworkManager.ingestCohortOutcome({
        tenantId: 'org-temp',
        sector: 'church',
        interventionCategory: 'FAMILY_CARE',
        cohortSize: 20,
        baselineAverageScore: 60,
        postInterventionAverageScore: 75,
        durationWeeks: 6,
        participantRetentionRate: 0.95,
      })
    ).toThrow(/has not opted into the Outcome Intelligence Network/i);
  });
});
