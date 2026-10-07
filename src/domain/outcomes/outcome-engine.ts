import { DomainDelta, LongitudinalComparisonResult } from './types';

/**
 * Longitudinal Outcome Measurement & Impact Engine (PRD §45, §46)
 * Calculates pre/post score comparisons and strictly enforces non-causal reporting language.
 */
export class OutcomeEngine {
  /**
   * Compares baseline and post-assessment population findings.
   */
  public static compareOutcomes(params: {
    programmeId: string;
    baselineCampaignId: string;
    postCampaignId: string;
    assessmentVersionId: string;
    baselineAverages: Record<string, { name: string; score: number }>;
    postAverages: Record<string, { name: string; score: number }>;
    baselineCohortSize: number;
    postCohortSize: number;
  }): LongitudinalComparisonResult {
    const domainDeltas: Record<string, DomainDelta> = {};
    let totalDelta = 0;
    let count = 0;

    for (const [domainId, baseline] of Object.entries(params.baselineAverages)) {
      const post = params.postAverages[domainId];
      if (post) {
        const delta = Math.round((post.score - baseline.score) * 10) / 10;
        const pctChange =
          baseline.score > 0
            ? Math.round((delta / baseline.score) * 1000) / 10
            : 0;

        let direction: DomainDelta['direction'] = 'NO_MEANINGFUL_CHANGE';
        if (delta >= 2.0) direction = 'IMPROVED';
        else if (delta <= -2.0) direction = 'DETERIORATED';

        domainDeltas[domainId] = {
          domainId,
          domainName: baseline.name,
          baselineAverage: baseline.score,
          postAverage: post.score,
          delta,
          percentageChange: pctChange,
          direction,
        };

        totalDelta += delta;
        count += 1;
      }
    }

    const overallIndexDelta = count > 0 ? Math.round((totalDelta / count) * 10) / 10 : 0;
    const completionRatePercent =
      params.baselineCohortSize > 0
        ? Math.round((params.postCohortSize / params.baselineCohortSize) * 1000) / 10
        : 0;

    // PRD §45 Non-Causal Reporting Guardrail
    const improvedDomains = Object.values(domainDeltas)
      .filter((d) => d.direction === 'IMPROVED')
      .map((d) => d.domainName);

    const nonCausalSummaryStatement = this.generateNonCausalSummary({
      improvedDomains,
      overallDelta: overallIndexDelta,
      postCohortSize: params.postCohortSize,
    });

    return {
      programmeId: params.programmeId,
      baselineCampaignId: params.baselineCampaignId,
      postCampaignId: params.postCampaignId,
      assessmentVersionId: params.assessmentVersionId,
      baselineCohortSize: params.baselineCohortSize,
      postCohortSize: params.postCohortSize,
      completionRatePercent,
      domainDeltas,
      overallIndexDelta,
      nonCausalSummaryStatement,
      limitations: [
        'Observational pre/post comparison without randomized control group.',
        'Participation attrition may introduce self-selection variance.',
      ],
    };
  }

  /**
   * PRD §45: Enforces strictly non-causal language.
   * Prohibits "caused X% improvement" assertions.
   */
  private static generateNonCausalSummary(params: {
    improvedDomains: string[];
    overallDelta: number;
    postCohortSize: number;
  }): string {
    if (params.overallDelta > 0) {
      const domainsText =
        params.improvedDomains.length > 0
          ? `particularly in ${params.improvedDomains.join(', ')}`
          : '';
      return `Participants (N=${params.postCohortSize}) reported an average wellbeing score increase of +${params.overallDelta} points following the programme, ${domainsText}.`.replace(
        '  ',
        ' '
      );
    } else if (params.overallDelta < 0) {
      return `Participants (N=${params.postCohortSize}) reported an average wellbeing score decrease of ${params.overallDelta} points following the programme.`;
    } else {
      return `Participants (N=${params.postCohortSize}) reported no meaningful detected change in average wellbeing scores following the programme.`;
    }
  }
}
