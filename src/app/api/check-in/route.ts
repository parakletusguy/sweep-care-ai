import { NextResponse } from 'next/server';
import { ScoringEngine } from '@/domain/scoring/scoring-engine';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  checkInRequestSchema,
  scoringRulesSchema,
  validateResponsesAgainstRules,
} from './check-in-guards';

const coreAssessmentConsent = 'CORE_ASSESSMENT';
const participantRole = 'PARTICIPANT';

function unavailableResponse() {
  return NextResponse.json(
    { error: 'Check-in storage is not configured yet. Please try again later.' },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const requestResult = checkInRequestSchema.safeParse(body);
  if (!requestResult.success) {
    return NextResponse.json(
      { error: 'Check-in details are incomplete or invalid.' },
      { status: 400 }
    );
  }

  try {
    const requesterClient = await createClient();
    const {
      data: { user },
      error: authenticationError,
    } = await requesterClient.auth.getUser();

    if (authenticationError || !user) {
      return NextResponse.json({ error: 'Sign in is required to submit a check-in.' }, { status: 401 });
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return unavailableResponse();
    }

    const { campaignId, responses } = requestResult.data;
    const { data: campaign, error: campaignError } = await adminClient
      .from('sweep_campaigns')
      .select('id, tenant_id, assessment_version_id, status, opens_at, closes_at')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) {
      return NextResponse.json({ error: 'The requested check-in was not found.' }, { status: 404 });
    }

    const now = new Date();
    if (
      campaign.status !== 'ACTIVE' ||
      now < new Date(campaign.opens_at) ||
      now >= new Date(campaign.closes_at)
    ) {
      return NextResponse.json({ error: 'This check-in is not currently available.' }, { status: 409 });
    }

    const { data: membership, error: membershipError } = await adminClient
      .from('sweep_memberships')
      .select('role, is_active')
      .eq('tenant_id', campaign.tenant_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.is_active || membership.role !== participantRole) {
      return NextResponse.json(
        { error: 'Your account is not eligible to submit this participant check-in.' },
        { status: 403 }
      );
    }

    const { data: consent, error: consentError } = await adminClient
      .from('sweep_consents')
      .select('granted, recorded_at')
      .eq('tenant_id', campaign.tenant_id)
      .eq('participant_id', user.id)
      .eq('category', coreAssessmentConsent)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (consentError) throw consentError;
    if (!consent?.granted) {
      return NextResponse.json(
        { error: 'Your current consent is required before submitting a check-in.' },
        { status: 403 }
      );
    }

    const { data: assessmentVersion, error: versionError } = await adminClient
      .from('sweep_assessment_versions')
      .select('id, scoring_rules, published_at')
      .eq('id', campaign.assessment_version_id)
      .eq('tenant_id', campaign.tenant_id)
      .maybeSingle();

    if (versionError) throw versionError;
    if (!assessmentVersion?.published_at) {
      return NextResponse.json(
        { error: 'This check-in has not been published correctly.' },
        { status: 409 }
      );
    }

    const rulesResult = scoringRulesSchema.safeParse(assessmentVersion.scoring_rules);
    if (!rulesResult.success) {
      return unavailableResponse();
    }

    try {
      validateResponsesAgainstRules(responses, rulesResult.data);
    } catch {
      return NextResponse.json(
        { error: 'Your answers do not match this check-in.' },
        { status: 400 }
      );
    }

    const scoringResult = ScoringEngine.calculate(
      assessmentVersion.id,
      responses,
      rulesResult.data
    );

    const { data: submission, error: submissionError } = await adminClient
      .from('sweep_assessment_submissions')
      .insert({
        tenant_id: campaign.tenant_id,
        campaign_id: campaign.id,
        assessment_version_id: assessmentVersion.id,
        participant_id: user.id,
        responses,
        score_snapshot: scoringResult,
      })
      .select('id, submitted_at')
      .single();

    if (submissionError) {
      if (submissionError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted this check-in.' },
          { status: 409 }
        );
      }
      throw submissionError;
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      submittedAt: submission.submitted_at,
      score: scoringResult.overallIndex,
      domainScores: scoringResult.domainScores,
    });
  } catch (error) {
    console.error('Check-in submission failed.', error);
    return NextResponse.json(
      { error: 'Unable to save the check-in right now. Please try again later.' },
      { status: 500 }
    );
  }
}
