/**
 * PRD §11–17 Confirmed User Roles
 */
export enum Role {
  /** PRD §11: Platform operator with cross-tenant administrative powers */
  SUPER_ADMIN = 'SUPER_ADMIN',

  /** PRD §12: Tenant owner/administrator managing branding, users, and campaigns */
  ORG_ADMIN = 'ORG_ADMIN',

  /** PRD §13: Qualified care professionals (counsellors, psychologists, social workers) */
  WELLBEING_PROFESSIONAL = 'WELLBEING_PROFESSIONAL',

  /** PRD §14: HR and People Managers with aggregated population visibility ONLY */
  HR_MANAGER = 'HR_MANAGER',

  /** PRD §15: Trainers and workshop facilitators delivering interventions */
  TRAINER_FACILITATOR = 'TRAINER_FACILITATOR',

  /** PRD §16: End participants (employees, students, congregants, learners) */
  PARTICIPANT = 'PARTICIPANT',

  /** PRD §17: Designated officers receiving safety alerts and crisis escalation */
  SAFEGUARDING_OFFICER = 'SAFEGUARDING_OFFICER',
}

export interface UserSession {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
  assignedGroupIds?: string[];
  isSuperAdmin?: boolean;
}
