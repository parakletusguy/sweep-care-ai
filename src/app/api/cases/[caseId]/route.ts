import { NextRequest, NextResponse } from 'next/server';
import {
  caseErrorResponse,
  getAccessibleCase,
  getRequestIdentity,
  recordCaseRead,
} from '../case-service';
import { canTransitionCase, updateCaseSchema, type CaseStatus } from '../case-guards';

type RouteContext = { params: Promise<{ caseId: string }> };

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const identity = await getRequestIdentity();
    const caseRecord = await getAccessibleCase(identity, caseId);

    // Do not return sensitive contents if the mandatory read audit cannot be recorded.
    await recordCaseRead(identity, [caseRecord.id]);

    const [{ data: notes, error: notesError }, { data: referrals, error: referralsError }] =
      await Promise.all([
        identity.supabase
          .from('sweep_case_notes')
          .select('id, author_id, content, classification, created_at')
          .eq('case_id', caseRecord.id)
          .eq('tenant_id', caseRecord.tenant_id)
          .order('created_at', { ascending: true }),
        identity.supabase
          .from('sweep_referrals')
          .select(
            'id, type, status, provider_name, external_contact_info, reason, notes, classification, created_at, updated_at, completed_at'
          )
          .eq('case_id', caseRecord.id)
          .eq('tenant_id', caseRecord.tenant_id)
          .order('updated_at', { ascending: false }),
      ]);

    if (notesError) throw notesError;
    if (referralsError) throw referralsError;

    return NextResponse.json({ case: caseRecord, notes: notes ?? [], referrals: referrals ?? [] });
  } catch (error) {
    return caseErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = updateCaseSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'The requested case status is invalid.' }, { status: 400 });
    }

    const { caseId } = await context.params;
    const identity = await getRequestIdentity();
    const current = await getAccessibleCase(identity, caseId);
    if (!canTransitionCase(current.status as CaseStatus, body.data.status)) {
      return NextResponse.json(
        { error: 'This case cannot move to that status from its current state.' },
        { status: 409 }
      );
    }

    const { data: caseRecord, error } = await identity.supabase
      .from('sweep_cases')
      .update({
        status: body.data.status,
      })
      .eq('id', current.id)
      .eq('tenant_id', current.tenant_id)
      .select('id, status, priority, classification, updated_at, closed_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ case: caseRecord });
  } catch (error) {
    return caseErrorResponse(error);
  }
}
