import { describe, it, expect } from 'vitest';
import { PopulationPrivacyEngine, ParticipantDomainScores } from '@/domain/analytics/privacy-engine';

describe('PRD §36 & TBD-PRIV-001: Small-Group Privacy Preservation', () => {
  const generateMockResponses = (count: number): ParticipantDomainScores[] => {
    return Array.from({ length: count }, (_, i) => ({
      participantId: `part-${i}`,
      scores: {
        emotional_wellbeing: 70 + (i % 10),
        workload_strain: 50 + (i % 5),
      },
    }));
  };

  it('suppresses aggregate reporting if cohort size is strictly below K=10', () => {
    const smallCohort = generateMockResponses(8);
    const result = PopulationPrivacyEngine.aggregate(smallCohort, 10);

    expect(result.isSuppressed).toBe(true);
    expect(result.domainAverages).toBeUndefined();
    expect(result.suppressionReason).toContain('K=10');
  });

  it('allows aggregate reporting when cohort size meets or exceeds K=10', () => {
    const validCohort = generateMockResponses(12);
    const result = PopulationPrivacyEngine.aggregate(validCohort, 10);

    expect(result.isSuppressed).toBe(false);
    expect(result.domainAverages).toBeDefined();
    expect(result.domainAverages!['emotional_wellbeing']).toBeGreaterThan(70);
  });

  it('supports custom per-tenant threshold K=5 where configured', () => {
    const pilotCohort = generateMockResponses(6);
    const result = PopulationPrivacyEngine.aggregate(pilotCohort, 5);

    expect(result.isSuppressed).toBe(false);
    expect(result.domainAverages).toBeDefined();
  });
});
