import { SectorType } from '../tenancy/types';
import { SECTOR_PRESETS, SectorPreset } from '../presets/sectors';

export interface BrandThemeConfig {
  tenantId: string;
  productName: string;
  logoUrl?: string;
  primaryColor: string; // e.g., '#0f766e'
  accentColor: string;  // e.g., '#0d9488'
  fontFamily?: string;
  showPoweredBy: boolean; // PRD §19: Configurable "Powered by SWEEP Care AI"
  supportEmail?: string;
  customDomain?: string;
}

export interface GeneratedCssTheme {
  cssVariables: Record<string, string>;
  styleTagContent: string;
}

/**
 * White-Label Engine & Theme Generator (PRD §19, §20)
 * Translates tenant branding into dynamic CSS variables with light/dark adaptation and sector terminology.
 */
export class WhiteLabelEngine {
  /**
   * Generates dynamic CSS variables for custom branding injection.
   */
  public static generateCssTheme(config: BrandThemeConfig): GeneratedCssTheme {
    const primary = config.primaryColor || '#0f766e';
    const accent = config.accentColor || '#0d9488';
    const font = config.fontFamily || 'Inter, system-ui, sans-serif';

    const cssVariables: Record<string, string> = {
      '--brand-primary': primary,
      '--brand-accent': accent,
      '--brand-font': font,
      '--brand-primary-light': `${primary}1a`, // 10% opacity tint for badges
      '--brand-accent-light': `${accent}1a`,
    };

    const cssRules = Object.entries(cssVariables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    const styleTagContent = `:root {\n${cssRules}\n}`;

    return {
      cssVariables,
      styleTagContent,
    };
  }

  /**
   * Resolves the localized/configured terminology for a tenant's sector (PRD §20).
   */
  public static getSectorTerminology(sector: SectorType): SectorPreset['terminology'] {
    const preset = SECTOR_PRESETS[sector] || SECTOR_PRESETS.corporate;
    return preset.terminology;
  }

  /**
   * Resolves product display title applying tenant product name or sector fallback.
   */
  public static resolveDisplayName(config: BrandThemeConfig, sector: SectorType, orgName: string): string {
    if (config.productName && config.productName.trim().length > 0) {
      return config.productName;
    }
    const preset = SECTOR_PRESETS[sector] || SECTOR_PRESETS.corporate;
    return preset.defaultBranding.productNameTemplate.replace('{{OrgName}}', orgName);
  }
}
