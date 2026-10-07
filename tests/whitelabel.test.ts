import { describe, it, expect } from 'vitest';
import { WhiteLabelEngine, BrandThemeConfig } from '@/domain/whitelabel/theme-generator';

describe('Sprint 1.2: White-Label Engine & Theming (PRD §19, §20)', () => {
  const brandConfig: BrandThemeConfig = {
    tenantId: 'tenant-st-jude',
    productName: 'St. Jude School Care Platform',
    primaryColor: '#1d4ed8', // Custom blue
    accentColor: '#3b82f6',
    fontFamily: 'Inter, sans-serif',
    showPoweredBy: true,
    supportEmail: 'care@stjudes.edu',
  };

  it('generates dynamic CSS variables for theme injection', () => {
    const theme = WhiteLabelEngine.generateCssTheme(brandConfig);

    expect(theme.cssVariables['--brand-primary']).toBe('#1d4ed8');
    expect(theme.cssVariables['--brand-accent']).toBe('#3b82f6');
    expect(theme.styleTagContent).toContain('--brand-primary: #1d4ed8;');
    expect(theme.styleTagContent).toContain('--brand-primary-light: #1d4ed81a;');
  });

  it('resolves sector-specific terminology correctly across all sectors (PRD §20)', () => {
    const schoolTerms = WhiteLabelEngine.getSectorTerminology('school');
    expect(schoolTerms.participants).toBe('Students');
    expect(schoolTerms.groups).toBe('Classes / Academic Years');

    const churchTerms = WhiteLabelEngine.getSectorTerminology('church');
    expect(churchTerms.participants).toBe('Members');
    expect(churchTerms.professionals).toBe('Pastoral Care Team');

    const corpTerms = WhiteLabelEngine.getSectorTerminology('corporate');
    expect(corpTerms.participants).toBe('Employees');
    expect(corpTerms.managers).toBe('People Managers / HR');

    const trainTerms = WhiteLabelEngine.getSectorTerminology('training');
    expect(trainTerms.participants).toBe('Learners');
    expect(trainTerms.groups).toBe('Cohorts');
  });

  it('resolves product display name applying fallback templates when not specified', () => {
    const defaultSchoolConfig: BrandThemeConfig = {
      tenantId: 'tenant-school-2',
      productName: '', // empty to test template fallback
      primaryColor: '#2563eb',
      accentColor: '#3b82f6',
      showPoweredBy: true,
    };

    const resolved = WhiteLabelEngine.resolveDisplayName(
      defaultSchoolConfig,
      'school',
      'Oakridge Academy'
    );
    expect(resolved).toBe('Oakridge Academy Student Care');
  });
});
