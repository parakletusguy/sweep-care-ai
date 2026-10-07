import { describe, it, expect, beforeEach } from 'vitest';
import { TenantContextStore } from '@/domain/tenancy/tenant-context';

describe('AC-001: Multi-Tenant Boundary Isolation', () => {
  const tenantA = { tenantId: 'tenant-aaa-111', tenantSlug: 'acme-corp' };
  const tenantB = { tenantId: 'tenant-bbb-222', tenantSlug: 'st-jude-school' };

  it('correctly provides ambient tenantId within execution scope', () => {
    TenantContextStore.run(tenantA, () => {
      expect(TenantContextStore.getCurrentTenantId()).toBe(tenantA.tenantId);
    });

    TenantContextStore.run(tenantB, () => {
      expect(TenantContextStore.getCurrentTenantId()).toBe(tenantB.tenantId);
    });
  });

  it('throws an error if an operation is attempted outside an active tenant context', () => {
    expect(() => {
      TenantContextStore.getCurrentTenantId();
    }).toThrowError(/TenantIsolationViolation/);
  });

  it('strictly blocks cross-tenant entity access (AC-001)', () => {
    TenantContextStore.run(tenantA, () => {
      // Accessing Tenant A entity succeeds
      expect(() => {
        TenantContextStore.assertTenantMatch(tenantA.tenantId);
      }).not.toThrow();

      // Accessing Tenant B entity throws CrossTenantAccessDenied
      expect(() => {
        TenantContextStore.assertTenantMatch(tenantB.tenantId);
      }).toThrowError(/CrossTenantAccessDenied/);
    });
  });

  it('preserves asynchronous tenant context across parallel async execution paths', async () => {
    const taskA = TenantContextStore.run(tenantA, async () => {
      await new Promise((r) => setTimeout(r, 10));
      return TenantContextStore.getCurrentTenantId();
    });

    const taskB = TenantContextStore.run(tenantB, async () => {
      await new Promise((r) => setTimeout(r, 5));
      return TenantContextStore.getCurrentTenantId();
    });

    const [resultA, resultB] = await Promise.all([taskA, taskB]);
    expect(resultA).toBe(tenantA.tenantId);
    expect(resultB).toBe(tenantB.tenantId);
  });
});
