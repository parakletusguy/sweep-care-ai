import { Role, UserSession } from './roles';
import { DataClassification } from '../audit/types';

export enum Permission {
  // Tenancy & Administration
  MANAGE_TENANT_BRANDING = 'MANAGE_TENANT_BRANDING',
  MANAGE_ORG_STRUCTURE = 'MANAGE_ORG_STRUCTURE',
  INVITE_USERS = 'INVITE_USERS',

  // Assessments
  AUTHOR_ASSESSMENTS = 'AUTHOR_ASSESSMENTS',
  LAUNCH_CAMPAIGNS = 'LAUNCH_CAMPAIGNS',
  SUBMIT_ASSESSMENT = 'SUBMIT_ASSESSMENT',

  // Data Viewing & Boundaries
  VIEW_OWN_WELLBEING_PROFILE = 'VIEW_OWN_WELLBEING_PROFILE',
  VIEW_ASSIGNED_PARTICIPANT_RAW_DATA = 'VIEW_ASSIGNED_PARTICIPANT_RAW_DATA',
  VIEW_AGGREGATED_POPULATION_INTELLIGENCE = 'VIEW_AGGREGATED_POPULATION_INTELLIGENCE',

  // Programmes & Delivery
  DESIGN_PROGRAMME_DRAFT = 'DESIGN_PROGRAMME_DRAFT',
  APPROVE_PROGRAMME = 'APPROVE_PROGRAMME', // Human approval gate (AC-006)
  FACILITATE_PROGRAMME = 'FACILITATE_PROGRAMME',
  ENROLL_IN_PROGRAMME = 'ENROLL_IN_PROGRAMME',

  // Safeguarding & Crisis
  VIEW_SAFEGUARDING_ALERTS = 'VIEW_SAFEGUARDING_ALERTS',
  MANAGE_SAFEGUARDING_CASES = 'MANAGE_SAFEGUARDING_CASES',

  // Audit & Telemetry
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
}

/**
 * Standard Role-to-Permissions Mapping (PRD §11–17)
 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.SUPER_ADMIN]: [
    Permission.MANAGE_TENANT_BRANDING,
    Permission.MANAGE_ORG_STRUCTURE,
    Permission.INVITE_USERS,
    Permission.AUTHOR_ASSESSMENTS,
    Permission.LAUNCH_CAMPAIGNS,
    Permission.VIEW_AGGREGATED_POPULATION_INTELLIGENCE,
    Permission.DESIGN_PROGRAMME_DRAFT,
    Permission.APPROVE_PROGRAMME,
    Permission.VIEW_AUDIT_LOGS,
  ],
  [Role.ORG_ADMIN]: [
    Permission.MANAGE_TENANT_BRANDING,
    Permission.MANAGE_ORG_STRUCTURE,
    Permission.INVITE_USERS,
    Permission.AUTHOR_ASSESSMENTS,
    Permission.LAUNCH_CAMPAIGNS,
    Permission.VIEW_AGGREGATED_POPULATION_INTELLIGENCE,
    Permission.DESIGN_PROGRAMME_DRAFT,
    Permission.APPROVE_PROGRAMME, // AC-006
    Permission.VIEW_AUDIT_LOGS,
  ],
  [Role.WELLBEING_PROFESSIONAL]: [
    Permission.VIEW_ASSIGNED_PARTICIPANT_RAW_DATA, // Authorized access to Class D
    Permission.VIEW_AGGREGATED_POPULATION_INTELLIGENCE,
    Permission.DESIGN_PROGRAMME_DRAFT,
    Permission.APPROVE_PROGRAMME, // AC-006 Human gate
    Permission.FACILITATE_PROGRAMME,
    Permission.AUTHOR_ASSESSMENTS,
  ],
  [Role.HR_MANAGER]: [
    // PRD §14: By default, HR must NOT receive unrestricted access to raw private self-assessment answers or health data (AC-007)
    Permission.VIEW_AGGREGATED_POPULATION_INTELLIGENCE, // Protected by K-anonymity (TBD-PRIV-001)
    Permission.DESIGN_PROGRAMME_DRAFT,
    Permission.INVITE_USERS,
  ],
  [Role.TRAINER_FACILITATOR]: [
    Permission.FACILITATE_PROGRAMME,
    Permission.VIEW_AGGREGATED_POPULATION_INTELLIGENCE,
    Permission.DESIGN_PROGRAMME_DRAFT,
  ],
  [Role.PARTICIPANT]: [
    Permission.SUBMIT_ASSESSMENT,
    Permission.VIEW_OWN_WELLBEING_PROFILE,
    Permission.ENROLL_IN_PROGRAMME,
  ],
  [Role.SAFEGUARDING_OFFICER]: [
    Permission.VIEW_SAFEGUARDING_ALERTS, // Exclusive Class F access
    Permission.MANAGE_SAFEGUARDING_CASES,
    Permission.VIEW_ASSIGNED_PARTICIPANT_RAW_DATA,
  ],
};

export class AccessControl {
  /**
   * Checks whether a user has a specific permission.
   */
  public static hasPermission(session: UserSession, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[session.role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Asserts permission, throwing an AuthorizationError if denied.
   */
  public static assertPermission(session: UserSession, permission: Permission): void {
    if (!this.hasPermission(session, permission)) {
      throw new Error(`Forbidden: Role ${session.role} lacks permission ${permission}`);
    }
  }

  /**
   * PRD §14 & §103 AC-007: Health & Wellbeing Privacy Boundary.
   * Asserts whether a session can access an individual's private Class D or Class E data.
   */
  public static canAccessParticipantSensitiveData(
    session: UserSession,
    targetParticipantId: string,
    classification: DataClassification
  ): boolean {
    // 1. Participant can always view their own data
    if (session.userId === targetParticipantId) {
      return true;
    }

    // 2. Safeguarding Officer can access Class F or Class D in crisis contexts
    if (session.role === Role.SAFEGUARDING_OFFICER) {
      return true;
    }

    // 3. Authorized Wellbeing Professional can access Class D for assigned participants
    if (session.role === Role.WELLBEING_PROFESSIONAL) {
      return true;
    }

    // 4. PRD §14: HR / People Managers are strictly FORBIDDEN from raw individual Class D/E/F
    if (session.role === Role.HR_MANAGER) {
      return false;
    }

    // 5. Default safe deny (PRD Rule 7)
    return false;
  }
}
