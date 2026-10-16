import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  canManageCaseClassification,
  resourceIdSchema,
  type CaseClassification,
} from './case-guards';

type RequestIdentity = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

export class CaseApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function caseErrorResponse(error: unknown) {
  if (error instanceof CaseApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Professional workflow request failed.', error);
  return NextResponse.json(
    { error: 'The secure care workflow is unavailable right now. Please try again later.' },
    { status: 500 }
  );
}

export async function getRequestIdentity(): Promise<RequestIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new CaseApiError(401, 'Sign in is required to access confidential care records.');
  }

  return { supabase, userId: user.id };
}

export async function assertCaseAccess(
  identity: RequestIdentity,
  tenantId: string,
  classification: CaseClassification
) {
  const membership = await getCaseWorkflowMembership(identity, tenantId);

  if (!canManageCaseClassification(membership.role, classification)) {
    throw new CaseApiError(
      403,
      'Your role does not have need-to-know access to this confidential record class.'
    );
  }

  return membership;
}

export async function getCaseWorkflowMembership(
  identity: RequestIdentity,
  tenantId: string
) {
  const { data: membership, error } = await identity.supabase
    .from('sweep_memberships')
    .select('role, is_active')
    .eq('tenant_id', tenantId)
    .eq('user_id', identity.userId)
    .maybeSingle();

  if (error) throw error;
  if (
    !membership?.is_active ||
    !['WELLBEING_PROFESSIONAL', 'SAFEGUARDING_OFFICER'].includes(membership.role)
  ) {
    throw new CaseApiError(
      403,
      'Your role does not have need-to-know access to confidential care workflows.'
    );
  }

  return membership;
}

export async function getAccessibleCase(
  identity: RequestIdentity,
  caseId: string
) {
  if (!resourceIdSchema.safeParse(caseId).success) {
    throw new CaseApiError(400, 'A valid case identifier is required.');
  }

  const { data: caseRecord, error } = await identity.supabase
    .from('sweep_cases')
    .select(
      'id, tenant_id, participant_id, title, description, status, priority, classification, assigned_professional_id, opened_by_id, created_at, updated_at, closed_at'
    )
    .eq('id', caseId)
    .maybeSingle();

  if (error) throw error;
  if (!caseRecord) {
    throw new CaseApiError(404, 'This case was not found or is outside your authorized scope.');
  }

  await assertCaseAccess(identity, caseRecord.tenant_id, caseRecord.classification as CaseClassification);
  return caseRecord;
}

/** Logs a read through the reviewed, narrow database RPC. */
export async function recordCaseRead(identity: RequestIdentity, caseIds: string[]) {
  if (caseIds.length === 0) return;

  const { error } = await identity.supabase.rpc('sweep_record_case_read', {
    p_case_ids: [...new Set(caseIds)],
  });

  if (error) throw error;
}
