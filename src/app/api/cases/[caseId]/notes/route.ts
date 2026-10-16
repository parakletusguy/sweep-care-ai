import { NextResponse } from 'next/server';
import { caseErrorResponse, getAccessibleCase, getRequestIdentity } from '../../case-service';
import { createCaseNoteSchema } from '../../case-guards';

type RouteContext = { params: Promise<{ caseId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = createCaseNoteSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'A confidential note must contain valid text.' }, { status: 400 });
    }

    const { caseId } = await context.params;
    const identity = await getRequestIdentity();
    const caseRecord = await getAccessibleCase(identity, caseId);
    const { data: note, error } = await identity.supabase
      .from('sweep_case_notes')
      .insert({
        case_id: caseRecord.id,
        tenant_id: caseRecord.tenant_id,
        author_id: identity.userId,
        content: body.data.content,
        classification: caseRecord.classification,
      })
      .select('id, author_id, content, classification, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return caseErrorResponse(error);
  }
}
