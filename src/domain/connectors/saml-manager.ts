import { SamlAssertion, SamlIdpConfig } from './types';
import { Role, UserSession } from '../identity/roles';
import { TenantContextStore } from '../tenancy/tenant-context';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';

/**
 * Phase 2C: SAML 2.0 / Enterprise SSO Identity Federation Manager (PRD §70)
 * Validates SAML assertions, maps corporate IdP attributes to canonical roles, and issues sessions.
 */
export class SamlManager {
  private static idpConfigs: Map<string, SamlIdpConfig> = new Map();

  /**
   * Registers a tenant's SAML IdP configuration.
   */
  public static registerIdp(config: SamlIdpConfig): void {
    TenantContextStore.assertTenantMatch(config.tenantId);
    this.idpConfigs.set(config.tenantId, config);
  }

  /**
   * Validates a signed SAML assertion and creates an authenticated UserSession.
   */
  public static processAssertion(tenantId: string, assertion: SamlAssertion): UserSession {
    TenantContextStore.assertTenantMatch(tenantId);

    const config = this.idpConfigs.get(tenantId);
    if (!config) {
      throw new Error(`SamlConfigError: No SAML IdP configured for tenant ${tenantId}.`);
    }

    // Check assertion expiration
    const expiry = new Date(assertion.validUntil).getTime();
    if (Date.now() > expiry) {
      throw new Error('SamlSecurityViolation: SAML assertion has expired.');
    }

    // Role Mapping
    let resolvedRole = config.defaultRole || Role.PARTICIPANT;
    const rawRoleClaim = assertion.attributes['roles'] || assertion.attributes['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (rawRoleClaim && config.roleAttributeMapping) {
      const claimStr = Array.isArray(rawRoleClaim) ? rawRoleClaim[0] : rawRoleClaim;
      if (config.roleAttributeMapping[claimStr]) {
        resolvedRole = config.roleAttributeMapping[claimStr];
      }
    }

    const session: UserSession = {
      userId: assertion.nameId,
      tenantId,
      email: assertion.nameId,
      role: resolvedRole,
    };

    AuditLogger.log({
      tenantId,
      actorId: session.userId,
      action: 'READ',
      classification: DataClassification.CLASS_C_PERSONAL,
      resourceType: 'SamlSession',
      resourceId: assertion.sessionIndex,
      metadata: {
        role: resolvedRole,
        issuer: assertion.issuer,
      },
    });

    return session;
  }

  public static _clearForTesting(): void {
    this.idpConfigs.clear();
  }
}
