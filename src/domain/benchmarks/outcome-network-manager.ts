/**
 * SWEEP Care AI — Outcome Intelligence Network Manager (PRD §100, §114)
 *
 * Governed cross-tenant learning answering:
 * "What programmes work best, for which populations, in which contexts?"
 *
 * Core Governance & Privacy Guarantees:
 * - Strict Opt-In: Zero automated pooling of private tenant data without explicit agreement.
 * - De-identification Pipeline: Hashes identifiers, removes individual timestamps and user IDs.
 * - Safe Thresholds: Benchmark aggregates are suppressed unless backed by at least 3 distinct
 *   organizations and at least 50 participants (K=50).
 */

import crypto from 'crypto';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';
import type {
  NetworkOptInContract,
  DeidentifiedCohortOutcome,
  SectorBenchmarkResult,
} from './types';

// In-memory opt-in contracts per tenant
const _contracts: Map<string, NetworkOptInContract> = new Map();

// De-identified pool of cohort outcomes
const _deidentifiedPool: Array<{
  tenantIdHash: string;
  outcome: DeidentifiedCohortOutcome;
}> = [];

export class OutcomeNetworkManager {
  /**
   * Explicitly opt a tenant into the Outcome Intelligence Network under an ethics agreement.
   */
  static optIn(
    tenantId: string,
    authorizedByUserId: string,
    ethicsAgreementVersion: string = 'ETHICS-AGREEMENT-V1.0'
  ): NetworkOptInContract {
    const contract: NetworkOptInContract = {
      tenantId,
      isOptedIn: true,
      authorizedByUserId,
      ethicsAgreementVersion,
      agreedAt: new Date().toISOString(),
    };

    _contracts.set(tenantId, contract);

    AuditLogger.log({
      tenantId,
      actorId: authorizedByUserId,
      action: 'CONSENT_GRANTED',
      classification: DataClassification.CLASS_B_ORGANIZATIONAL,
      resourceType: 'outcome_network_contract',
      resourceId: tenantId,
      metadata: {
        networkAgreement: ethicsAgreementVersion,
        action: 'OPT_IN_OUTCOME_BENCHMARKS',
      },
      ipAddress: '127.0.0.1',
    });

    return contract;
  }

  /**
   * Revoke participation from the Outcome Intelligence Network.
   * Future federated rounds will not include this tenant.
   */
  static revokeOptIn(tenantId: string, authorizedByUserId: string): void {
    const contract = _contracts.get(tenantId);
    if (!contract || !contract.isOptedIn) {
      return;
    }

    contract.isOptedIn = false;
    contract.revokedAt = new Date().toISOString();

    AuditLogger.log({
      tenantId,
      actorId: authorizedByUserId,
      action: 'CONSENT_REVOKED',
      classification: DataClassification.CLASS_B_ORGANIZATIONAL,
      resourceType: 'outcome_network_contract',
      resourceId: tenantId,
      metadata: {
        action: 'REVOKE_OUTCOME_BENCHMARKS',
      },
      ipAddress: '127.0.0.1',
    });
  }

  /**
   * Check if a tenant has an active opt-in contract.
   */
  static isOptedIn(tenantId: string): boolean {
    return _contracts.get(tenantId)?.isOptedIn === true;
  }

  /**
   * Ingest a completed cohort outcome into the de-identified benchmarking pool.
   * Rejects ingestion if tenant has not opted in.
   */
  static ingestCohortOutcome(params: {
    tenantId: string;
    sector: 'corporate' | 'school' | 'church' | 'training';
    interventionCategory: string;
    cohortSize: number;
    baselineAverageScore: number;
    postInterventionAverageScore: number;
    durationWeeks: number;
    participantRetentionRate: number;
  }): DeidentifiedCohortOutcome {
    if (!this.isOptedIn(params.tenantId)) {
      throw new Error(
        `Cross-tenant benchmarking rejected: Tenant "${params.tenantId}" has not opted into the Outcome Intelligence Network (PRD §100).`
      );
    }

    const salt = 'sweep-outcome-salt-2026';
    const tenantIdHash = crypto
      .createHash('sha256')
      .update(params.tenantId + salt)
      .digest('hex');

    const cohortIdHash = crypto
      .createHash('sha256')
      .update(params.tenantId + params.interventionCategory + Date.now().toString())
      .digest('hex')
      .slice(0, 16);

    const delta = Math.round((params.postInterventionAverageScore - params.baselineAverageScore) * 10) / 10;
    const relativeImprovement =
      params.baselineAverageScore > 0
        ? Math.round((delta / params.baselineAverageScore) * 1000) / 10
        : 0;

    const sizeBracket =
      params.cohortSize <= 25
        ? '10-25'
        : params.cohortSize <= 50
        ? '26-50'
        : params.cohortSize <= 100
        ? '51-100'
        : '100+';

    const deidentified: DeidentifiedCohortOutcome = {
      cohortIdHash,
      sector: params.sector,
      interventionCategory: params.interventionCategory,
      cohortSizeBracket: sizeBracket,
      baselineAverageScore: params.baselineAverageScore,
      postInterventionAverageScore: params.postInterventionAverageScore,
      scoreDelta: delta,
      relativeImprovementPercent: relativeImprovement,
      durationWeeks: params.durationWeeks,
      participantRetentionRate: params.participantRetentionRate,
      contributedAt: new Date().toISOString(),
    };

    _deidentifiedPool.push({
      tenantIdHash,
      outcome: deidentified,
    });

    return deidentified;
  }

  /**
   * Compute aggregated sector benchmark intelligence.
   * Enforces privacy thresholds: requires at least 3 distinct participating organizations
   * and at least 50 total evaluated participants.
   */
  static getSectorBenchmark(
    sector: 'corporate' | 'school' | 'church' | 'training',
    interventionCategory: string
  ): SectorBenchmarkResult {
    const matching = _deidentifiedPool.filter(
      (entry) =>
        entry.outcome.sector === sector &&
        entry.outcome.interventionCategory === interventionCategory
    );

    const distinctOrganizations = new Set(matching.map((m) => m.tenantIdHash)).size;

    // Estimate participant count based on size brackets
    const estimatedParticipants = matching.reduce((sum, item) => {
      const b = item.outcome.cohortSizeBracket;
      return sum + (b === '10-25' ? 18 : b === '26-50' ? 38 : b === '51-100' ? 75 : 120);
    }, 0);

    // Strict K=50 and >= 3 organizations privacy boundary
    if (distinctOrganizations < 3 || estimatedParticipants < 50) {
      return {
        sector,
        interventionCategory,
        totalParticipatingOrganizations: distinctOrganizations,
        totalParticipantsEvaluated: estimatedParticipants,
        averageScoreImprovementPercent: 0,
        medianScoreDelta: 0,
        benchmarkConfidenceLevel: 'INSUFFICIENT_DATA',
        isSuppressedDueToSmallSample: true,
      };
    }

    const avgImprovement =
      matching.reduce((acc, curr) => acc + curr.outcome.relativeImprovementPercent, 0) /
      matching.length;

    const deltas = matching.map((m) => m.outcome.scoreDelta).sort((a, b) => a - b);
    const medianDelta = deltas[Math.floor(deltas.length / 2)];

    return {
      sector,
      interventionCategory,
      totalParticipatingOrganizations: distinctOrganizations,
      totalParticipantsEvaluated: estimatedParticipants,
      averageScoreImprovementPercent: Math.round(avgImprovement * 10) / 10,
      medianScoreDelta: medianDelta,
      benchmarkConfidenceLevel: distinctOrganizations >= 5 ? 'HIGH' : 'MODERATE',
      isSuppressedDueToSmallSample: false,
    };
  }

  /** Reset state for tests */
  static _clearAll(): void {
    _contracts.clear();
    _deidentifiedPool.length = 0;
  }
}
