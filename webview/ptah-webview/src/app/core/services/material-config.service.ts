import { Injectable, computed, inject } from '@angular/core';
import { EgyptianThemeService } from './egyptian-theme.service';

/**
 * Egyptian component variants that can be applied to Material components
 */
export type EgyptianVariant = 'default' | 'primary' | 'accent' | 'hieroglyph' | 'papyrus' | 'sacred' | 'warn';

/**
 * Material button configuration for Egyptian theming
 */
export interface EgyptianButtonConfig {
  matButtonType: 'basic' | 'raised' | 'stroked' | 'flat' | 'icon' | 'fab' | 'mini-fab';
  color: 'primary' | 'accent' | 'warn' | undefined;
  disabled: boolean;
  disableRipple: boolean;
  cssClasses: string[];
  ariaLabel?: string;
}

/**
 * Material form field configuration for Egyptian theming
 */
export interface EgyptianFormFieldConfig {
  appearance: 'fill' | 'outline';
  color: 'primary' | 'accent' | 'warn' | undefined;
  floatLabel: 'always' | 'never' | 'auto';
  hideRequiredMarker: boolean;
  hintLabel?: string;
  cssClasses: string[];
  subscriptSizing: 'fixed' | 'dynamic';
}

/**
 * Material card configuration for Egyptian theming
 */
export interface EgyptianCardConfig {
  cssClasses: string[];
  elevation?: number;
  hasHeader: boolean;
  hasContent: boolean;
  hasActions: boolean;
  headerCssClasses: string[];
  contentCssClasses: string[];
  actionsCssClasses: string[];
}

/**
 * Material progress spinner configuration for Egyptian theming
 */
export interface EgyptianSpinnerConfig {
  diameter: number;
  strokeWidth: number;
  color: 'primary' | 'accent' | 'warn' | undefined;
  mode: 'determinate' | 'indeterminate';
  value?: number;
  cssClasses: string[];
}

/**
 * Material icon configuration for Egyptian theming
 */
export interface EgyptianIconConfig {
  fontSet?: string;
  fontIcon?: string;
  svgIcon?: string;
  inline: boolean;
  ariaLabel?: string;
  ariaHidden: boolean;
  cssClasses: string[];
}

/**
 * MaterialConfigService - Factory pattern for consistent Material component configuration
 * 
 * Provides standardized configurations for Material components with Egyptian theming.
 * Uses the Factory pattern to generate consistent component properties and CSS classes.
 */
@Injectable({
  providedIn: 'root'
})
export class MaterialConfigService {
  private readonly themeService = inject(EgyptianThemeService);
  
  // Computed CSS class generators based on current theme
  private readonly egyptianBaseClasses = computed(() => {
    const theme = this.themeService.currentTheme();
    return {
      base: 'egyptian-themed',
      primary: `egyptian-primary-${theme}`,
      accent: `egyptian-accent-${theme}`,
      glow: `egyptian-glow-${theme}`,
      hieroglyph: `egyptian-hieroglyph-${theme}`,
      papyrus: `egyptian-papyrus-${theme}`,
      sacred: `egyptian-sacred-${theme}`
    };
  });

  // Theme-aware color configuration
  private readonly themeColorConfig = computed(() => {
    const colors = this.themeService.themeColors();
    return {
      primary: colors.primary,
      accent: colors.accent,
      background: colors.background,
      surface: colors.surface,
      text: colors.text,
      egyptianAccent: colors.egyptianAccent,
      egyptianGlow: colors.egyptianGlow
    };
  });

  /**
   * Generate Egyptian-themed button configuration
   */
  createButtonConfig(
    variant: EgyptianVariant = 'default',
    options: Partial<EgyptianButtonConfig> = {}
  ): EgyptianButtonConfig {
    const baseClasses = this.egyptianBaseClasses();
    const defaultConfig: EgyptianButtonConfig = {
      matButtonType: 'raised',
      color: 'primary',
      disabled: false,
      disableRipple: false,
      cssClasses: [baseClasses.base],
      ariaLabel: undefined
    };

    // Apply variant-specific configuration
    const variantConfig = this.getButtonVariantConfig(variant, baseClasses);
    
    return {
      ...defaultConfig,
      ...variantConfig,
      ...options,
      cssClasses: [
        ...defaultConfig.cssClasses,
        ...(variantConfig.cssClasses || []),
        ...(options.cssClasses || [])
      ]
    };
  }

  /**
   * Generate Egyptian-themed form field configuration
   */
  createFormFieldConfig(
    variant: EgyptianVariant = 'default',
    options: Partial<EgyptianFormFieldConfig> = {}
  ): EgyptianFormFieldConfig {
    const baseClasses = this.egyptianBaseClasses();
    const defaultConfig: EgyptianFormFieldConfig = {
      appearance: 'outline',
      color: 'primary',
      floatLabel: 'auto',
      hideRequiredMarker: false,
      subscriptSizing: 'fixed',
      cssClasses: [baseClasses.base]
    };

    // Apply variant-specific configuration
    const variantConfig = this.getFormFieldVariantConfig(variant, baseClasses);

    return {
      ...defaultConfig,
      ...variantConfig,
      ...options,
      cssClasses: [
        ...defaultConfig.cssClasses,
        ...(variantConfig.cssClasses || []),
        ...(options.cssClasses || [])
      ]
    };
  }

  /**
   * Generate Egyptian-themed card configuration
   */
  createCardConfig(
    variant: EgyptianVariant = 'default',
    options: Partial<EgyptianCardConfig> = {}
  ): EgyptianCardConfig {
    const baseClasses = this.egyptianBaseClasses();
    const defaultConfig: EgyptianCardConfig = {
      cssClasses: [baseClasses.base],
      hasHeader: false,
      hasContent: true,
      hasActions: false,
      headerCssClasses: ['egyptian-card-header'],
      contentCssClasses: ['egyptian-card-content'],
      actionsCssClasses: ['egyptian-card-actions']
    };

    // Apply variant-specific configuration
    const variantConfig = this.getCardVariantConfig(variant, baseClasses);

    return {
      ...defaultConfig,
      ...variantConfig,
      ...options,
      cssClasses: [
        ...defaultConfig.cssClasses,
        ...(variantConfig.cssClasses || []),
        ...(options.cssClasses || [])
      ]
    };
  }

  /**
   * Generate Egyptian-themed spinner configuration
   */
  createSpinnerConfig(
    variant: EgyptianVariant = 'default',
    options: Partial<EgyptianSpinnerConfig> = {}
  ): EgyptianSpinnerConfig {
    const baseClasses = this.egyptianBaseClasses();
    const defaultConfig: EgyptianSpinnerConfig = {
      diameter: 40,
      strokeWidth: 4,
      color: 'primary',
      mode: 'indeterminate',
      cssClasses: [baseClasses.base]
    };

    // Apply variant-specific configuration
    const variantConfig = this.getSpinnerVariantConfig(variant, baseClasses);

    return {
      ...defaultConfig,
      ...variantConfig,
      ...options,
      cssClasses: [
        ...defaultConfig.cssClasses,
        ...(variantConfig.cssClasses || []),
        ...(options.cssClasses || [])
      ]
    };
  }

  /**
   * Generate Egyptian-themed icon configuration
   */
  createIconConfig(
    variant: EgyptianVariant = 'default',
    options: Partial<EgyptianIconConfig> = {}
  ): EgyptianIconConfig {
    const baseClasses = this.egyptianBaseClasses();
    const defaultConfig: EgyptianIconConfig = {
      inline: false,
      ariaHidden: true,
      cssClasses: [baseClasses.base]
    };

    // Apply variant-specific configuration
    const variantConfig = this.getIconVariantConfig(variant, baseClasses);

    return {
      ...defaultConfig,
      ...variantConfig,
      ...options,
      cssClasses: [
        ...defaultConfig.cssClasses,
        ...(variantConfig.cssClasses || []),
        ...(options.cssClasses || [])
      ]
    };
  }

  /**
   * Generate responsive CSS classes based on sidebar width constraints
   */
  getResponsiveClasses(breakpoint: 'xs' | 'sm' | 'md' | 'lg' = 'sm'): string[] {
    const baseResponsive = 'egyptian-responsive';
    
    switch (breakpoint) {
      case 'xs': // <300px (very narrow sidebar)
        return [baseResponsive, 'egyptian-xs', 'egyptian-compact'];
      case 'sm': // 300-600px (normal sidebar)
        return [baseResponsive, 'egyptian-sm', 'egyptian-standard'];
      case 'md': // 600-900px (wide sidebar)
        return [baseResponsive, 'egyptian-md', 'egyptian-expanded'];
      case 'lg': // >900px (very wide sidebar)
        return [baseResponsive, 'egyptian-lg', 'egyptian-full'];
      default:
        return [baseResponsive, 'egyptian-sm'];
    }
  }

  /**
   * Get button variant-specific configuration
   */
  private getButtonVariantConfig(variant: EgyptianVariant, baseClasses: any): Partial<EgyptianButtonConfig> {
    switch (variant) {
      case 'primary':
        return {
          matButtonType: 'raised',
          color: 'primary',
          cssClasses: [baseClasses.primary, 'egyptian-btn-primary']
        };
      case 'accent':
        return {
          matButtonType: 'raised',
          color: 'accent',
          cssClasses: [baseClasses.accent, 'egyptian-btn-accent']
        };
      case 'hieroglyph':
        return {
          matButtonType: 'stroked',
          color: 'primary',
          cssClasses: [baseClasses.hieroglyph, 'egyptian-btn-hieroglyph']
        };
      case 'papyrus':
        return {
          matButtonType: 'flat',
          color: undefined,
          cssClasses: [baseClasses.papyrus, 'egyptian-btn-papyrus']
        };
      case 'sacred':
        return {
          matButtonType: 'raised',
          color: 'accent',
          cssClasses: [baseClasses.sacred, baseClasses.glow, 'egyptian-btn-sacred']
        };
      case 'warn':
        return {
          matButtonType: 'raised',
          color: 'warn',
          cssClasses: [baseClasses.warn, 'egyptian-btn-warn']
        };
      default:
        return {
          cssClasses: ['egyptian-btn-default']
        };
    }
  }

  /**
   * Get form field variant-specific configuration
   */
  private getFormFieldVariantConfig(variant: EgyptianVariant, baseClasses: any): Partial<EgyptianFormFieldConfig> {
    switch (variant) {
      case 'primary':
        return {
          appearance: 'outline',
          color: 'primary',
          cssClasses: [baseClasses.primary, 'egyptian-field-primary']
        };
      case 'accent':
        return {
          appearance: 'outline',
          color: 'accent',
          cssClasses: [baseClasses.accent, baseClasses.glow, 'egyptian-field-accent']
        };
      case 'hieroglyph':
        return {
          appearance: 'outline',
          color: 'primary',
          cssClasses: [baseClasses.hieroglyph, 'egyptian-field-hieroglyph']
        };
      case 'papyrus':
        return {
          appearance: 'fill',
          color: undefined,
          cssClasses: [baseClasses.papyrus, 'egyptian-field-papyrus']
        };
      case 'sacred':
        return {
          appearance: 'outline',
          color: 'accent',
          cssClasses: [baseClasses.sacred, baseClasses.glow, 'egyptian-field-sacred']
        };
      case 'warn':
        return {
          appearance: 'outline',
          color: 'warn',
          cssClasses: [baseClasses.warn, 'egyptian-field-warn']
        };
      default:
        return {
          cssClasses: ['egyptian-field-default']
        };
    }
  }

  /**
   * Get card variant-specific configuration
   */
  private getCardVariantConfig(variant: EgyptianVariant, baseClasses: any): Partial<EgyptianCardConfig> {
    switch (variant) {
      case 'primary':
        return {
          cssClasses: [baseClasses.primary, 'egyptian-card-primary'],
          elevation: 2
        };
      case 'accent':
        return {
          cssClasses: [baseClasses.accent, 'egyptian-card-accent'],
          elevation: 4
        };
      case 'hieroglyph':
        return {
          cssClasses: [baseClasses.hieroglyph, 'egyptian-card-hieroglyph'],
          elevation: 1
        };
      case 'papyrus':
        return {
          cssClasses: [baseClasses.papyrus, 'egyptian-card-papyrus'],
          elevation: 0
        };
      case 'sacred':
        return {
          cssClasses: [baseClasses.sacred, baseClasses.glow, 'egyptian-card-sacred'],
          elevation: 8
        };
      case 'warn':
        return {
          cssClasses: [baseClasses.warn, 'egyptian-card-warn'],
          elevation: 2
        };
      default:
        return {
          cssClasses: ['egyptian-card-default'],
          elevation: 1
        };
    }
  }

  /**
   * Get spinner variant-specific configuration
   */
  private getSpinnerVariantConfig(variant: EgyptianVariant, baseClasses: any): Partial<EgyptianSpinnerConfig> {
    switch (variant) {
      case 'primary':
        return {
          color: 'primary',
          cssClasses: [baseClasses.primary, 'egyptian-spinner-primary']
        };
      case 'accent':
        return {
          color: 'accent',
          strokeWidth: 6,
          cssClasses: [baseClasses.accent, baseClasses.glow, 'egyptian-spinner-accent']
        };
      case 'hieroglyph':
        return {
          color: 'primary',
          diameter: 32,
          strokeWidth: 3,
          cssClasses: [baseClasses.hieroglyph, 'egyptian-spinner-hieroglyph']
        };
      case 'papyrus':
        return {
          color: undefined,
          diameter: 48,
          strokeWidth: 2,
          cssClasses: [baseClasses.papyrus, 'egyptian-spinner-papyrus']
        };
      case 'sacred':
        return {
          color: 'accent',
          diameter: 56,
          strokeWidth: 8,
          cssClasses: [baseClasses.sacred, baseClasses.glow, 'egyptian-spinner-sacred']
        };
      default:
        return {
          cssClasses: ['egyptian-spinner-default']
        };
    }
  }

  /**
   * Get icon variant-specific configuration
   */
  private getIconVariantConfig(variant: EgyptianVariant, baseClasses: any): Partial<EgyptianIconConfig> {
    switch (variant) {
      case 'primary':
        return {
          cssClasses: [baseClasses.primary, 'egyptian-icon-primary']
        };
      case 'accent':
        return {
          cssClasses: [baseClasses.accent, 'egyptian-icon-accent']
        };
      case 'hieroglyph':
        return {
          fontSet: 'egyptian-hieroglyphs',
          cssClasses: [baseClasses.hieroglyph, 'egyptian-icon-hieroglyph']
        };
      case 'papyrus':
        return {
          cssClasses: [baseClasses.papyrus, 'egyptian-icon-papyrus']
        };
      case 'sacred':
        return {
          cssClasses: [baseClasses.sacred, baseClasses.glow, 'egyptian-icon-sacred']
        };
      default:
        return {
          cssClasses: ['egyptian-icon-default']
        };
    }
  }

  /**
   * Generate accessibility-compliant ARIA attributes
   */
  generateAriaAttributes(
    componentType: 'button' | 'input' | 'card' | 'icon' | 'spinner',
    label?: string,
    description?: string
  ): Record<string, string> {
    const baseAttrs: Record<string, string> = {};

    if (label) {
      baseAttrs['aria-label'] = label;
    }

    if (description) {
      baseAttrs['aria-describedby'] = description;
    }

    switch (componentType) {
      case 'button':
        baseAttrs['role'] = 'button';
        break;
      case 'input':
        baseAttrs['role'] = 'textbox';
        break;
      case 'card':
        baseAttrs['role'] = 'region';
        break;
      case 'spinner':
        baseAttrs['role'] = 'progressbar';
        baseAttrs['aria-live'] = 'polite';
        break;
      case 'icon':
        if (!label) {
          baseAttrs['aria-hidden'] = 'true';
        }
        break;
    }

    return baseAttrs;
  }

  /**
   * Validate configuration for CSP compliance
   */
  validateCSPCompliance(config: any): boolean {
    // Ensure no inline styles in configuration
    const hasInlineStyles = JSON.stringify(config).includes('style=');
    
    if (hasInlineStyles) {
      console.warn('MaterialConfigService: Configuration contains inline styles which violate CSP');
      return false;
    }

    return true;
  }
}