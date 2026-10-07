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

  // Phase 2A: Professional Case Management & Referrals (PRD §13, §14, §17)
  MANAGE_CASES = 'MANAGE_CASES',
  VIEW_CONFIDENTIAL_NOTES = 'VIEW_CONFIDENTIAL_NOTES',
  CREATE_REFERRAL = 'CREATE_REFERRAL',

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
    Permission.MANAGE_CASES, // Phase 2A
    Permission.VIEW_CONFIDENTIAL_NOTES, // Phase 2A
    Permission.CREATE_REFERRAL, // Phase 2A
  ],
  [Role.HR_MANAGER]: [
    // PRD §14: By default, HR must NOT receive unrestricted access to raw private self-assessment answers, confidential notes or health data (AC-007)
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
    Permission.MANAGE_CASES, // Phase 2A
    Permission.VIEW_CONFIDENTIAL_NOTES, // Phase 2A
    Permission.CREATE_REFERRAL, // Phase 2A
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

  /**
   * Phase 2A: Asserts whether a user session can access a confidential case or its notes.
   * Strictly enforces AC-007 (HR lockout) and PRD §13/§17 professional boundaries.
   */
  public static canAccessCase(
    session: UserSession,
    caseClassification: DataClassification,
    assignedProfessionalId?: string
  ): boolean {
    // 1. HR Manager is strictly FORBIDDEN (PRD §14, AC-007)
    if (session.role === Role.HR_MANAGER) {
      return false;
    }

    // 2. Facilitator and Participant are strictly barred from professional case records
    if (session.role === Role.TRAINER_FACILITATOR || session.role === Role.PARTICIPANT) {
      return false;
    }

    // 3. Safeguarding Officer has access to Class F and Class D cases
    if (session.role === Role.SAFEGUARDING_OFFICER) {
      return true;
    }

    // 4. Wellbeing Professional has access to Class D cases (assigned or tenant pool)
    if (session.role === Role.WELLBEING_PROFESSIONAL) {
      // If the case is safeguarding (Class F), only designated safeguarding officers or specifically assigned professionals can access
      if (caseClassification === DataClassification.CLASS_F_SAFEGUARDING) {
        return assignedProfessionalId === session.userId;
      }
      return true;
    }

    // 5. Default safe deny
    return false;
  }

  public static assertCanAccessCase(
    session: UserSession,
    caseClassification: DataClassification,
    assignedProfessionalId?: string
  ): void {
    if (!this.canAccessCase(session, caseClassification, assignedProfessionalId)) {
      throw new Error(
        `Forbidden: Role ${session.role} is not authorized to access ${caseClassification} case records (PRD §14, AC-007).`
      );
    }
  }
}

