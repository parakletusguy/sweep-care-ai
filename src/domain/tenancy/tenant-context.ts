import { AsyncLocalStorage } from 'async_hooks';
import { TenantContext } from './types';

/**
 * TenantContextStore maintains the ambient tenant context across asynchronous call stacks.
 * Ensures zero cross-tenant contamination (PRD §18, AC-001, Rule 12).
 */
export class TenantContextStore {
  private static storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Runs an operation inside an explicit tenant boundary.
   */
  public static run<T>(context: TenantContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Retrieves the currently active tenant ID.
   * Throws an error if called outside an authenticated tenant context.
   */
  public static getCurrentTenantId(): string {
    const ctx = this.storage.getStore();
    if (!ctx || !ctx.tenantId) {
      throw new Error('TenantIsolationViolation: Operation attempted outside active tenant context.');
    }
    return ctx.tenantId;
  }

  /**
   * Retrieves the full active tenant context or null if unauthenticated.
   */
  public static getContext(): TenantContext | null {
    return this.storage.getStore() ?? null;
  }

  /**
   * Verifies that a target entity belongs to the active tenant.
   * Throws an unauthorized cross-tenant violation if mismatched (AC-001).
   */
  public static assertTenantMatch(entityTenantId: string): void {
    const currentTenantId = this.getCurrentTenantId();
    if (entityTenantId !== currentTenantId) {
      throw new Error(
        `CrossTenantAccessDenied: Attempted to access entity belonging to tenant ${entityTenantId} from tenant ${currentTenantId}.`
      );
    }
  }
}
