import { KnowledgeSource } from './types';

/**
 * Approved Knowledge Store (PRD §76, §77, AC-005)
 * Maintains authoritative, peer-reviewed, and regulatory knowledge records.
 * Verifies that citations returned by LLM correspond to actual approved records.
 */
export class KnowledgeStore {
  private static sources: Map<string, KnowledgeSource> = new Map();

  /**
   * Initializes store with authoritative baseline knowledge sources.
   */
  static {
    this.registerSource({
      id: 'WHO-MH-WORK-2022',
      title: 'WHO Guidelines on Mental Health at Work',
      publisher: 'World Health Organization',
      domain: 'workplace_stress',
      status: 'APPROVED',
      keyFindings: [
        'Organizational interventions that reduce workload and increase control improve wellbeing.',
        'Manager training in mental health improves supportive workplace behaviors.',
      ],
    });

    this.registerSource({
      id: 'ISO-45003-2021',
      title: 'Occupational Health and Safety: Psychological Health and Safety at Work',
      publisher: 'International Organization for Standardization (ISO)',
      domain: 'psychological_safety',
      status: 'APPROVED',
      keyFindings: [
        'Psychosocial risk management requires identifying organizational design and social factors.',
        'Continuous feedback and worker consultation are required for psychological safety.',
      ],
    });

    this.registerSource({
      id: 'NICE-NG212-2022',
      title: 'Mental Wellbeing at Work (NICE Guideline NG212)',
      publisher: 'National Institute for Health and Care Excellence (NICE)',
      domain: 'emotional_wellbeing',
      status: 'APPROVED',
      keyFindings: [
        'Provide multi-component organizational interventions including physical environment and job design.',
        'Offer universal, targeted, and individual support pathways.',
      ],
    });
  }

  public static registerSource(source: KnowledgeSource): void {
    this.sources.set(source.id, source);
  }

  public static getSource(id: string): KnowledgeSource | undefined {
    const s = this.sources.get(id);
    if (s && s.status === 'APPROVED') {
      return s;
    }
    return undefined;
  }

  /**
   * AC-005 & PRD §75 Rule 6: Citation Validation
   * Cross-references citation IDs against approved records.
   * Throws an error or returns false if any citation is unknown or unapproved.
   */
  public static validateCitations(citationIds: string[]): {
    isValid: boolean;
    unverifiedIds: string[];
    verifiedSources: KnowledgeSource[];
  } {
    const unverifiedIds: string[] = [];
    const verifiedSources: KnowledgeSource[] = [];

    for (const id of citationIds) {
      const source = this.getSource(id);
      if (!source) {
        unverifiedIds.push(id);
      } else {
        verifiedSources.push(source);
      }
    }

    return {
      isValid: unverifiedIds.length === 0,
      unverifiedIds,
      verifiedSources,
    };
  }

  /**
   * Citation records are either global or belong to the requesting tenant. A
   * tenant-scoped source must never be used to ground another tenant's output.
   */
  public static validateCitationsForTenant(citationIds: string[], tenantId: string): {
    isValid: boolean;
    unverifiedIds: string[];
    verifiedSources: KnowledgeSource[];
  } {
    const unverifiedIds: string[] = [];
    const verifiedSources: KnowledgeSource[] = [];

    for (const id of citationIds) {
      const source = this.getSource(id);
      if (!source || (source.tenantId && source.tenantId !== tenantId)) {
        unverifiedIds.push(id);
      } else {
        verifiedSources.push(source);
      }
    }

    return {
      isValid: unverifiedIds.length === 0,
      unverifiedIds,
      verifiedSources,
    };
  }

  /**
   * Queries sources by domain for RAG grounding.
   */
  public static querySourcesByDomain(domain: string): KnowledgeSource[] {
    return Array.from(this.sources.values()).filter(
      (s) => s.status === 'APPROVED' && (s.domain === domain || domain === 'all')
    );
  }

  /**
   * Returns all active approved knowledge sources.
   */
  public static getAllSources(): KnowledgeSource[] {
    return Array.from(this.sources.values()).filter((s) => s.status === 'APPROVED');
  }

  public static _clearForTesting(): void {
    this.sources.clear();
  }
}
