import { NextResponse } from 'next/server';
import { caseErrorResponse, getAccessibleCase, getRequestIdentity } from '../../../case-service';
import {
  canTransitionReferral,
  resourceIdSchema,
  updateReferralSchema,
  type ReferralStatus,
} from '../../../case-guards';

type RouteContext = { params: Promise<{ caseId: string; referralId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = updateReferralSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'The requested referral status is invalid.' }, { status: 400 });
    }

    const { caseId, referralId } = await context.params;
    if (!resourceIdSchema.safeParse(referralId).success) {
      return NextResponse.json({ error: 'A valid referral identifier is required.' }, { status: 400 });
    }
    const identity = await getRequestIdentity();
    const caseRecord = await getAccessibleCase(identity, caseId);
    const { data: current, error: currentError } = await identity.supabase
      .from('sweep_referrals')
      .select('id, status')
      .eq('id', referralId)
      .eq('case_id', caseRecord.id)
      .eq('tenant_id', caseRecord.tenant_id)
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current) {
      return NextResponse.json({ error: 'The referral was not found.' }, { status: 404 });
    }
    if (!canTransitionReferral(current.status as ReferralStatus, body.data.status)) {
      return NextResponse.json(
        { error: 'This referral cannot move to that status from its current state.' },
        { status: 409 }
      );
    }

    const { data: referral, error } = await identity.supabase
      .from('sweep_referrals')
      .update({
        status: body.data.status,
      })
      .eq('id', current.id)
      .eq('tenant_id', caseRecord.tenant_id)
      .select('id, status, updated_at, completed_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ referral });
  } catch (error) {
    return caseErrorResponse(error);
  }
}
