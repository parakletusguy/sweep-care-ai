import { NextRequest, NextResponse } from 'next/server';
import {
  caseErrorResponse,
  getRequestIdentity,
  assertCaseAccess,
  getCaseWorkflowMembership,
  recordCaseRead,
} from './case-service';
import { caseQuerySchema, createCaseSchema } from './case-guards';

export async function GET(request: NextRequest) {
  try {
    const query = caseQuerySchema.safeParse({
      tenantId: request.nextUrl.searchParams.get('tenantId'),
    });
    if (!query.success) {
      return NextResponse.json({ error: 'A valid organization is required.' }, { status: 400 });
    }

    const identity = await getRequestIdentity();
    await getCaseWorkflowMembership(identity, query.data.tenantId);
    const { data: cases, error } = await identity.supabase
      .from('sweep_cases')
      .select(
        'id, participant_id, title, status, priority, classification, assigned_professional_id, created_at, updated_at, closed_at'
      )
      .eq('tenant_id', query.data.tenantId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    await recordCaseRead(identity, (cases ?? []).map((caseRecord) => caseRecord.id));

    return NextResponse.json({ cases: cases ?? [] });
  } catch (error) {
    return caseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createCaseSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Case details are incomplete or invalid.' }, { status: 400 });
    }

    const identity = await getRequestIdentity();
    await assertCaseAccess(identity, body.data.tenantId, body.data.classification);

    const { data: caseRecord, error } = await identity.supabase
      .from('sweep_cases')
      .insert({
        tenant_id: body.data.tenantId,
        participant_id: body.data.participantId,
        title: body.data.title,
        description: body.data.description,
        priority: body.data.priority,
        classification: body.data.classification,
        assigned_professional_id: identity.userId,
        opened_by_id: identity.userId,
      })
      .select(
        'id, tenant_id, participant_id, title, status, priority, classification, assigned_professional_id, created_at, updated_at'
      )
      .single();

    if (error) throw error;
    return NextResponse.json({ case: caseRecord }, { status: 201 });
  } catch (error) {
    return caseErrorResponse(error);
  }
}
