import { describe, it, expect } from 'vitest';
import { OutcomeEngine } from '@/domain/outcomes/outcome-engine';

describe('Sprint 1.10: PRD §45 Outcome Measurement & Non-Causal Reporting', () => {
  it('calculates longitudinal domain score deltas and completion rate accurately', () => {
    const result = OutcomeEngine.compareOutcomes({
      programmeId: 'prog-boundary-01',
      baselineCampaignId: 'camp-q1',
      postCampaignId: 'camp-q2',
      assessmentVersionId: 'asm-v1',
      baselineCohortSize: 50,
      postCohortSize: 42,
      baselineAverages: {
        stress: { name: 'Workplace Stress', score: 55.0 },
        belonging: { name: 'Team Belonging', score: 62.0 },
      },
      postAverages: {
        stress: { name: 'Workplace Stress', score: 68.5 }, // +13.5
        belonging: { name: 'Team Belonging', score: 63.0 }, // +1.0 (no meaningful change)
      },
    });

    expect(result.completionRatePercent).toBe(84.0); // 42 / 50 = 84%
    expect(result.domainDeltas['stress'].delta).toBe(13.5);
    expect(result.domainDeltas['stress'].direction).toBe('IMPROVED');
    expect(result.domainDeltas['belonging'].delta).toBe(1.0);
    expect(result.domainDeltas['belonging'].direction).toBe('NO_MEANINGFUL_CHANGE');

    // PRD §45 Guardrail: Verifies non-causal language phrasing
    expect(result.nonCausalSummaryStatement).toContain('reported an average wellbeing score increase');
    expect(result.nonCausalSummaryStatement).not.toContain('caused');
    expect(result.nonCausalSummaryStatement).toContain('Workplace Stress');
    expect(result.limitations.length).toBeGreaterThan(0);
  });
});
