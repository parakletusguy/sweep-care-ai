import { NextResponse } from 'next/server';
import { getRequestIdentity, caseErrorResponse } from '../case-service';

const allowedRoles = new Set(['WELLBEING_PROFESSIONAL', 'SAFEGUARDING_OFFICER']);

/**
 * Returns only the signed-in professional's own memberships. It intentionally
 * does not expose an organization-wide staff directory or participant list.
 */
export async function GET() {
  try {
    const identity = await getRequestIdentity();
    const { data: memberships, error } = await identity.supabase
      .from('sweep_memberships')
      .select('tenant_id, role, sweep_tenants ( id, name, slug )')
      .eq('user_id', identity.userId)
      .eq('is_active', true);

    if (error) throw error;

    const careMemberships = (memberships ?? []).filter((membership) =>
      allowedRoles.has(membership.role)
    );

    return NextResponse.json({ memberships: careMemberships });
  } catch (error) {
    return caseErrorResponse(error);
  }
}
