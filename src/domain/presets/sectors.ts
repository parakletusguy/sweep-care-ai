import { SectorType } from '../tenancy/types';

export interface SectorPreset {
  sector: SectorType;
  displayName: string;
  terminology: {
    participants: string;
    groups: string;
    professionals: string;
    managers: string;
    assessment: string;
    programme: string;
  };
  defaultBranding: {
    primaryColor: string;
    accentColor: string;
    productNameTemplate: string;
  };
}

export const SECTOR_PRESETS: Record<SectorType, SectorPreset> = {
  corporate: {
    sector: 'corporate',
    displayName: 'Corporate & Workplace Wellbeing',
    terminology: {
      participants: 'Employees',
      groups: 'Teams / Departments',
      professionals: 'Wellbeing Officers / Counsellors',
      managers: 'People Managers / HR',
      assessment: 'Pulse Assessment',
      programme: 'Intervention Programme',
    },
    defaultBranding: {
      primaryColor: '#0f766e', // Deep Teal
      accentColor: '#0d9488',
      productNameTemplate: '{{OrgName}} Workforce Wellbeing',
    },
  },
  school: {
    sector: 'school',
    displayName: 'Schools & Higher Education',
    terminology: {
      participants: 'Students',
      groups: 'Classes / Academic Years',
      professionals: 'Counsellors / Welfare Officers',
      managers: 'School Leadership / Faculty Heads',
      assessment: 'Student Wellbeing Check-in',
      programme: 'Support Workshop / Programme',
    },
    defaultBranding: {
      primaryColor: '#2563eb', // Academic Blue
      accentColor: '#3b82f6',
      productNameTemplate: '{{OrgName}} Student Care',
    },
  },
  church: {
    sector: 'church',
    displayName: 'Churches & Faith Communities',
    terminology: {
      participants: 'Members',
      groups: 'Ministries / Congregations',
      professionals: 'Pastoral Care Team',
      managers: 'Ministry Leads',
      assessment: 'Community Care Survey',
      programme: 'Care Initiative',
    },
    defaultBranding: {
      primaryColor: '#7c3aed', // Warm Violet
      accentColor: '#8b5cf6',
      productNameTemplate: '{{OrgName}} Pastoral Care',
    },
  },
  training: {
    sector: 'training',
    displayName: 'Training & Professional Coaching',
    terminology: {
      participants: 'Learners',
      groups: 'Cohorts',
      professionals: 'Trainers / Facilitators',
      managers: 'Programme Directors',
      assessment: 'Learning & Wellbeing Check',
      programme: 'Development Programme',
    },
    defaultBranding: {
      primaryColor: '#0284c7', // Professional Sky
      accentColor: '#38bdf8',
      productNameTemplate: '{{OrgName}} Learner Intelligence',
    },
  },
};
