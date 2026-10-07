export interface ParticipantDomainScores {
  participantId: string;
  scores: Record<string, number>;
}

export interface AggregatedPopulationView {
  cohortCount: number;
  isSuppressed: boolean;
  suppressionReason?: string;
  domainAverages?: Record<string, number>;
}

/**
 * Small-Group Privacy Preservation Engine (PRD §36, TBD-PRIV-001)
 * Enforces K-anonymity and mathematical cell suppression to prevent indirect identification of individuals.
 */
export class PopulationPrivacyEngine {
  /**
   * Aggregates population responses, suppressing all metrics if cohort size is less than minCohortThreshold.
   */
  public static aggregate(
    responses: ParticipantDomainScores[],
    minCohortThreshold = 10
  ): AggregatedPopulationView {
    const n = responses.length;

    // Enforce K-anonymity suppression threshold (PRD §36, TBD-PRIV-001)
    if (n < minCohortThreshold) {
      return {
        cohortCount: n,
        isSuppressed: true,
        suppressionReason: `Cohort size (${n}) is below the required privacy protection threshold (K=${minCohortThreshold}).`,
      };
    }

    const domainTotals: Record<string, { sum: number; count: number }> = {};
    for (const resp of responses) {
      for (const [domain, score] of Object.entries(resp.scores)) {
        if (!domainTotals[domain]) {
          domainTotals[domain] = { sum: 0, count: 0 };
        }
        domainTotals[domain].sum += score;
        domainTotals[domain].count += 1;
      }
    }

    const domainAverages: Record<string, number> = {};
    for (const [domain, { sum, count }] of Object.entries(domainTotals)) {
      domainAverages[domain] = Math.round((sum / count) * 10) / 10;
    }

    return {
      cohortCount: n,
      isSuppressed: false,
      domainAverages,
    };
  }
}
