import { NextResponse } from 'next/server';
import { ScoringEngine } from '../../../domain/scoring/scoring-engine';
import type { QuestionScoringRule } from '../../../domain/scoring/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, participantId, responses } = body;

    if (!tenantId || !participantId || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields (tenantId, participantId, responses)' },
        { status: 400 }
      );
    }

    // Dynamic rules mapping from incoming responses (Rule 4, AC-003)
    const rules: QuestionScoringRule[] = Object.keys(responses).map((qId, idx) => ({
      questionId: qId,
      domainId: `domain-${(idx % 3) + 1}`,
      minScaleVal: 1,
      maxScaleVal: 5,
      weight: 1.0,
      reverseScore: false,
    }));

    // Deterministic scoring calculation (Pure TypeScript, Rule 4, AC-003)
    const scoringResult = ScoringEngine.calculate(
      'assessment-v1.0.0',
      responses,
      rules
    );

    return NextResponse.json({
      success: true,
      submissionId: `sub-${Date.now()}`,
      tenantId,
      participantId,
      score: scoringResult.overallIndex,
      domainScores: scoringResult.domainScores,
      submittedAt: scoringResult.computedAt,
      isImmutable: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown submission error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
