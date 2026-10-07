import crypto from 'crypto';
import { ScimGroup, ScimListResponse, ScimUser } from './types';
import { TenantContextStore } from '../tenancy/tenant-context';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';

/**
 * Phase 2C: SCIM 2.0 Enterprise Directory Provisioning Manager (PRD §70, RFC 7644)
 * Enables automated directory sync, onboarding, and deprovisioning from Okta, Azure AD / Entra ID.
 */
export class ScimManager {
  private static users: Map<string, ScimUser[]> = new Map();
  private static groups: Map<string, ScimGroup[]> = new Map();

  /**
   * Provisions a new user via SCIM 2.0 (POST /scim/v2/Users).
   */
  public static provisionUser(tenantId: string, scimUser: Omit<ScimUser, 'id'>): ScimUser {
    TenantContextStore.assertTenantMatch(tenantId);

    const tenantUsers = this.users.get(tenantId) || [];
    const primaryEmail = scimUser.emails.find((e) => e.primary)?.value || scimUser.userName;

    // Check email uniqueness within tenant
    if (tenantUsers.some((u) => u.userName.toLowerCase() === scimUser.userName.toLowerCase())) {
      throw new Error(`ScimConflict: User with userName '${scimUser.userName}' already exists in tenant.`);
    }

    const createdUser: ScimUser = {
      ...scimUser,
      id: crypto.randomUUID(),
    };

    tenantUsers.push(createdUser);
    this.users.set(tenantId, tenantUsers);

    AuditLogger.log({
      tenantId,
      actorId: 'SCIM_SERVICE_PROVIDER',
      action: 'CREATE',
      classification: DataClassification.CLASS_C_PERSONAL,
      resourceType: 'ScimUser',
      resourceId: createdUser.id,
      metadata: {
        userName: createdUser.userName,
        active: createdUser.active,
      },
    });

    return createdUser;
  }

  /**
   * Updates an existing user via SCIM 2.0 (PATCH /scim/v2/Users/{id}).
   */
  public static updateUser(
    tenantId: string,
    scimUserId: string,
    updates: Partial<ScimUser>
  ): ScimUser {
    TenantContextStore.assertTenantMatch(tenantId);

    const tenantUsers = this.users.get(tenantId) || [];
    const userIndex = tenantUsers.findIndex((u) => u.id === scimUserId);

    if (userIndex === -1) {
      throw new Error(`ScimNotFound: User with ID '${scimUserId}' not found in tenant.`);
    }

    const existingUser = tenantUsers[userIndex];
    const updatedUser: ScimUser = {
      ...existingUser,
      ...updates,
      id: existingUser.id, // ID is immutable
    };

    tenantUsers[userIndex] = updatedUser;
    this.users.set(tenantId, tenantUsers);

    AuditLogger.log({
      tenantId,
      actorId: 'SCIM_SERVICE_PROVIDER',
      action: 'UPDATE',
      classification: DataClassification.CLASS_C_PERSONAL,
      resourceType: 'ScimUser',
      resourceId: updatedUser.id,
      metadata: {
        active: updatedUser.active,
      },
    });

    return updatedUser;
  }

  /**
   * Deprovisions/deactivates a user via SCIM 2.0 (DELETE /scim/v2/Users/{id}).
   */
  public static deprovisionUser(tenantId: string, scimUserId: string): void {
    TenantContextStore.assertTenantMatch(tenantId);

    const user = this.updateUser(tenantId, scimUserId, { active: false });

    AuditLogger.log({
      tenantId,
      actorId: 'SCIM_SERVICE_PROVIDER',
      action: 'DELETE',
      classification: DataClassification.CLASS_C_PERSONAL,
      resourceType: 'ScimUser',
      resourceId: user.id,
      metadata: {
        deactivated: true,
      },
    });
  }

  /**
   * Lists users in SCIM 2.0 ListResponse format (GET /scim/v2/Users).
   */
  public static listUsers(tenantId: string): ScimListResponse<ScimUser> {
    TenantContextStore.assertTenantMatch(tenantId);

    const list = this.users.get(tenantId) || [];
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: list.length,
      startIndex: 1,
      itemsPerPage: list.length,
      Resources: list,
    };
  }

  /**
   * Synchronizes an organizational group/cohort via SCIM 2.0 (POST /scim/v2/Groups).
   */
  public static syncGroup(tenantId: string, group: Omit<ScimGroup, 'id'>): ScimGroup {
    TenantContextStore.assertTenantMatch(tenantId);

    const tenantGroups = this.groups.get(tenantId) || [];
    const newGroup: ScimGroup = {
      ...group,
      id: crypto.randomUUID(),
    };

    tenantGroups.push(newGroup);
    this.groups.set(tenantId, tenantGroups);

    return newGroup;
  }

  public static _clearForTesting(): void {
    this.users.clear();
    this.groups.clear();
  }
}
