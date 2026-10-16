import { NextResponse } from 'next/server';
import { caseErrorResponse, getAccessibleCase, getRequestIdentity } from '../../case-service';
import { createReferralSchema } from '../../case-guards';

type RouteContext = { params: Promise<{ caseId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = createReferralSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Referral details are incomplete or invalid.' }, { status: 400 });
    }

    const { caseId } = await context.params;
    const identity = await getRequestIdentity();
    const caseRecord = await getAccessibleCase(identity, caseId);
    const { data: referral, error } = await identity.supabase
      .from('sweep_referrals')
      .insert({
        case_id: caseRecord.id,
        tenant_id: caseRecord.tenant_id,
        participant_id: caseRecord.participant_id,
        referred_by_id: identity.userId,
        type: body.data.type,
        provider_name: body.data.providerName,
        external_contact_info: body.data.externalContactInfo || null,
        reason: body.data.reason,
        notes: body.data.notes || null,
        classification: caseRecord.classification,
      })
      .select(
        'id, type, status, provider_name, external_contact_info, reason, notes, classification, created_at, updated_at, completed_at'
      )
      .single();

    if (error) throw error;
    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    return caseErrorResponse(error);
  }
}
