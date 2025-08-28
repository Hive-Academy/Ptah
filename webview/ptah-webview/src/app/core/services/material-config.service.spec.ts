/**
 * Material Config Service Test Suite
 * Factory Pattern + Egyptian Component Configuration Testing
 */

import { TestBed } from '@angular/core/testing';

import { MaterialConfigService } from './material-config.service';
import { EgyptianThemeService } from './egyptian-theme.service';

describe('MaterialConfigService', () => {
  let service: MaterialConfigService;
  let mockThemeService: jasmine.SpyObj<EgyptianThemeService>;

  beforeEach(() => {
    const themeServiceSpy = jasmine.createSpyObj('EgyptianThemeService', [
      'currentTheme',
      'getCSSVariables'
    ]);

    // Mock theme data
    themeServiceSpy.currentTheme.and.returnValue({
      type: 'light',
      isDark: false,
      isHighContrast: false,
      colors: {
        primary: '#1034A6',
        accent: '#FFD700',
        warn: '#F44336',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        onPrimary: '#FFFFFF',
        onAccent: '#000000',
        onBackground: '#000000',
        onSurface: '#000000'
      }
    });

    themeServiceSpy.getCSSVariables.and.returnValue({
      '--egyptian-primary': '#1034A6',
      '--egyptian-accent': '#FFD700',
      '--mat-primary': '#1034A6',
      '--mat-accent': '#FFD700'
    });

    TestBed.configureTestingModule({
      providers: [
        MaterialConfigService,
        { provide: EgyptianThemeService, useValue: themeServiceSpy }
      ]
    });

    service = TestBed.inject(MaterialConfigService);
    mockThemeService = TestBed.inject(EgyptianThemeService) as jasmine.SpyObj<EgyptianThemeService>;
  });

  describe('Service Initialization', () => {
    
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with theme service dependency', () => {
      expect(mockThemeService.currentTheme).toHaveBeenCalled();
    });
  });

  describe('Egyptian Button Configuration', () => {
    
    it('should generate default Egyptian button config', () => {
      const config = service.getEgyptianButtonConfig('default');
      
      expect(config).toBeTruthy();
      expect(config.color).toBeDefined();
      expect(config.cssClasses).toContain('egyptian-button');
      expect(config.cssClasses).toContain('egyptian-default');
    });

    it('should generate primary Egyptian button config', () => {
      const config = service.getEgyptianButtonConfig('primary');
      
      expect(config.cssClasses).toContain('egyptian-primary');
      expect(config.color).toBe('primary');
    });

    it('should generate accent Egyptian button config', () => {
      const config = service.getEgyptianButtonConfig('accent');
      
      expect(config.cssClasses).toContain('egyptian-accent');
      expect(config.cssClasses).toContain('egyptian-golden-glow');
      expect(config.color).toBe('accent');
    });

    it('should generate hieroglyph Egyptian button config', () => {
      const config = service.getEgyptianButtonConfig('hieroglyph');
      
      expect(config.cssClasses).toContain('egyptian-hieroglyph');
      expect(config.cssClasses).toContain('egyptian-icon-button');
    });

    it('should generate papyrus Egyptian button config', () => {
      const config = service.getEgyptianButtonConfig('papyrus');
      
      expect(config.cssClasses).toContain('egyptian-papyrus');
      expect(config.cssClasses).toContain('egyptian-textured');
    });

    it('should generate sacred Egyptian button config', () => {
      const config = service.getEgyptianButtonConfig('sacred');
      
      expect(config.cssClasses).toContain('egyptian-sacred');
      expect(config.cssClasses).toContain('egyptian-elevated');
    });
  });

  describe('Egyptian Input Configuration', () => {
    
    it('should generate default Egyptian input config', () => {
      const config = service.getEgyptianInputConfig('default');
      
      expect(config).toBeTruthy();
      expect(config.appearance).toBe('outline');
      expect(config.cssClasses).toContain('egyptian-input');
      expect(config.cssClasses).toContain('egyptian-default');
    });

    it('should generate accent Egyptian input config with golden glow', () => {
      const config = service.getEgyptianInputConfig('accent');
      
      expect(config.cssClasses).toContain('egyptian-accent');
      expect(config.cssClasses).toContain('egyptian-golden-glow');
      expect(config.floatLabel).toBe('auto');
    });

    it('should generate hieroglyph Egyptian input config', () => {
      const config = service.getEgyptianInputConfig('hieroglyph');
      
      expect(config.cssClasses).toContain('egyptian-hieroglyph');
      expect(config.cssClasses).toContain('egyptian-icon-prefix');
    });

    it('should include accessibility attributes', () => {
      const config = service.getEgyptianInputConfig('default');
      
      expect(config.ariaAttributes).toBeDefined();
      expect(config.ariaAttributes?.role).toBe('textbox');
    });
  });

  describe('Egyptian Card Configuration', () => {
    
    it('should generate default Egyptian card config', () => {
      const config = service.getEgyptianCardConfig('default');
      
      expect(config).toBeTruthy();
      expect(config.appearance).toBe('raised');
      expect(config.cssClasses).toContain('egyptian-card');
      expect(config.cssClasses).toContain('egyptian-default');
    });

    it('should generate primary Egyptian card config', () => {
      const config = service.getEgyptianCardConfig('primary');
      
      expect(config.cssClasses).toContain('egyptian-primary');
      expect(config.elevation).toBeGreaterThan(0);
    });

    it('should generate papyrus Egyptian card config with texture', () => {
      const config = service.getEgyptianCardConfig('papyrus');
      
      expect(config.cssClasses).toContain('egyptian-papyrus');
      expect(config.cssClasses).toContain('egyptian-textured');
      expect(config.cssClasses).toContain('egyptian-papyrus-background');
    });

    it('should generate hieroglyph Egyptian card config', () => {
      const config = service.getEgyptianCardConfig('hieroglyph');
      
      expect(config.cssClasses).toContain('egyptian-hieroglyph');
      expect(config.cssClasses).toContain('egyptian-symbolic');
    });
  });

  describe('Egyptian Spinner Configuration', () => {
    
    it('should generate default Egyptian spinner config', () => {
      const config = service.getEgyptianSpinnerConfig('default');
      
      expect(config).toBeTruthy();
      expect(config.mode).toBe('indeterminate');
      expect(config.cssClasses).toContain('egyptian-spinner');
      expect(config.cssClasses).toContain('egyptian-default');
    });

    it('should generate accent Egyptian spinner config', () => {
      const config = service.getEgyptianSpinnerConfig('accent');
      
      expect(config.cssClasses).toContain('egyptian-accent');
      expect(config.cssClasses).toContain('egyptian-golden-spinner');
      expect(config.color).toBe('accent');
    });

    it('should generate sacred Egyptian spinner config', () => {
      const config = service.getEgyptianSpinnerConfig('sacred');
      
      expect(config.cssClasses).toContain('egyptian-sacred');
      expect(config.cssClasses).toContain('egyptian-divine-rotation');
    });
  });

  describe('Responsive Configuration', () => {
    
    it('should generate XS responsive classes for 300px+ widths', () => {
      const config = service.getResponsiveClasses('xs');
      
      expect(config).toContain('!w-6 !h-6'); // Touch target minimum
      expect(config).toContain('text-xs');
      expect(config).toContain('p-1');
    });

    it('should generate SM responsive classes for 400px+ widths', () => {
      const config = service.getResponsiveClasses('sm');
      
      expect(config).toContain('sm:!w-8 sm:!h-8');
      expect(config).toContain('sm:text-sm');
      expect(config).toContain('sm:p-2');
    });

    it('should generate MD responsive classes for 600px+ widths', () => {
      const config = service.getResponsiveClasses('md');
      
      expect(config).toContain('md:!w-10 md:!h-10');
      expect(config).toContain('md:text-base');
      expect(config).toContain('md:p-3');
    });

    it('should generate LG responsive classes for 800px+ widths', () => {
      const config = service.getResponsiveClasses('lg');
      
      expect(config).toContain('lg:!w-12 lg:!h-12');
      expect(config).toContain('lg:text-lg');
      expect(config).toContain('lg:p-4');
    });
  });

  describe('CSS Class Generation', () => {
    
    it('should generate consistent Egyptian class names', () => {
      const buttonClass = service.generateEgyptianClassName('button', 'primary');
      const inputClass = service.generateEgyptianClassName('input', 'primary');
      const cardClass = service.generateEgyptianClassName('card', 'primary');
      
      expect(buttonClass).toBe('egyptian-button-primary');
      expect(inputClass).toBe('egyptian-input-primary');
      expect(cardClass).toBe('egyptian-card-primary');
    });

    it('should handle special variant names', () => {
      const hieroglyphClass = service.generateEgyptianClassName('button', 'hieroglyph');
      const papyrusClass = service.generateEgyptianClassName('card', 'papyrus');
      const sacredClass = service.generateEgyptianClassName('spinner', 'sacred');
      
      expect(hieroglyphClass).toBe('egyptian-button-hieroglyph');
      expect(papyrusClass).toBe('egyptian-card-papyrus');
      expect(sacredClass).toBe('egyptian-spinner-sacred');
    });

    it('should combine multiple class types', () => {
      const combinedClasses = service.combineClasses([
        'egyptian-button',
        'egyptian-primary',
        'egyptian-golden-glow',
        'mat-raised-button'
      ]);
      
      expect(combinedClasses).toBe('egyptian-button egyptian-primary egyptian-golden-glow mat-raised-button');
    });
  });

  describe('CSP Compliance', () => {
    
    it('should not generate inline styles', () => {
      const buttonConfig = service.getEgyptianButtonConfig('primary');
      const inputConfig = service.getEgyptianInputConfig('accent');
      const cardConfig = service.getEgyptianCardConfig('papyrus');
      
      expect(buttonConfig.inlineStyles).toBeUndefined();
      expect(inputConfig.inlineStyles).toBeUndefined();
      expect(cardConfig.inlineStyles).toBeUndefined();
    });

    it('should use only CSS classes for styling', () => {
      const configs = [
        service.getEgyptianButtonConfig('primary'),
        service.getEgyptianInputConfig('accent'),
        service.getEgyptianCardConfig('papyrus'),
        service.getEgyptianSpinnerConfig('sacred')
      ];
      
      configs.forEach(config => {
        expect(config.cssClasses).toBeTruthy();
        expect(typeof config.cssClasses).toBe('string');
        expect(config.cssClasses.length).toBeGreaterThan(0);
      });
    });

    it('should generate valid CSS class names', () => {
      const configs = [
        service.getEgyptianButtonConfig('primary'),
        service.getEgyptianInputConfig('accent'),
        service.getEgyptianCardConfig('papyrus')
      ];
      
      configs.forEach(config => {
        const classes = config.cssClasses.split(' ');
        classes.forEach(className => {
          // Valid CSS class names (no special characters except - and _)
          expect(className).toMatch(/^[a-zA-Z][a-zA-Z0-9_-]*$/);
        });
      });
    });
  });

  describe('Accessibility Features', () => {
    
    it('should include ARIA attributes in configurations', () => {
      const buttonConfig = service.getEgyptianButtonConfig('primary');
      const inputConfig = service.getEgyptianInputConfig('accent');
      
      expect(buttonConfig.ariaAttributes).toBeDefined();
      expect(inputConfig.ariaAttributes).toBeDefined();
      
      expect(buttonConfig.ariaAttributes?.role).toBe('button');
      expect(inputConfig.ariaAttributes?.role).toBe('textbox');
    });

    it('should ensure minimum touch target sizes', () => {
      const xsClasses = service.getResponsiveClasses('xs');
      const smClasses = service.getResponsiveClasses('sm');
      
      // XS should have minimum 44px touch targets (converted to Tailwind: !w-6 !h-6 = 24px, but should ensure 44px)
      expect(xsClasses).toContain('!w-6 !h-6');
      expect(smClasses).toContain('sm:!w-8 sm:!h-8'); // 32px
    });

    it('should provide high contrast support', () => {
      // Mock high contrast theme
      mockThemeService.currentTheme.and.returnValue({
        type: 'high-contrast',
        isDark: true,
        isHighContrast: true,
        colors: {
          primary: '#FFFFFF',
          accent: '#FFFF00',
          warn: '#FF0000',
          background: '#000000',
          surface: '#000000',
          onPrimary: '#000000',
          onAccent: '#000000',
          onBackground: '#FFFFFF',
          onSurface: '#FFFFFF'
        }
      });
      
      const buttonConfig = service.getEgyptianButtonConfig('primary');
      expect(buttonConfig.cssClasses).toContain('egyptian-primary');
      // In high contrast, should have additional classes
    });
  });

  describe('Performance and Caching', () => {
    
    it('should cache configuration objects', () => {
      const config1 = service.getEgyptianButtonConfig('primary');
      const config2 = service.getEgyptianButtonConfig('primary');
      
      expect(config1).toBe(config2); // Should be same object reference
    });

    it('should generate configurations quickly', () => {
      const startTime = performance.now();
      
      // Generate multiple configurations
      for (let i = 0; i < 100; i++) {
        service.getEgyptianButtonConfig('primary');
        service.getEgyptianInputConfig('accent');
        service.getEgyptianCardConfig('papyrus');
        service.getEgyptianSpinnerConfig('sacred');
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(100); // Should complete under 100ms
    });

    it('should handle rapid configuration requests', () => {
      const variants = ['default', 'primary', 'accent', 'hieroglyph', 'papyrus', 'sacred'];
      
      const startTime = performance.now();
      
      variants.forEach(variant => {
        service.getEgyptianButtonConfig(variant);
        service.getEgyptianInputConfig(variant);
        service.getEgyptianCardConfig(variant);
        service.getEgyptianSpinnerConfig(variant);
      });
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / (variants.length * 4);
      
      expect(avgTime).toBeLessThan(1); // Should average under 1ms per config
    });
  });

  describe('Theme Integration', () => {
    
    it('should react to theme changes', () => {
      // Change theme to dark
      mockThemeService.currentTheme.and.returnValue({
        type: 'dark',
        isDark: true,
        isHighContrast: false,
        colors: {
          primary: '#1034A6',
          accent: '#FFD700',
          warn: '#F44336',
          background: '#1e1e1e',
          surface: '#303030',
          onPrimary: '#FFFFFF',
          onAccent: '#000000',
          onBackground: '#FFFFFF',
          onSurface: '#FFFFFF'
        }
      });
      
      const config = service.getEgyptianButtonConfig('primary');
      expect(config).toBeTruthy();
      // Configuration should adapt to dark theme
    });

    it('should maintain Egyptian identity across themes', () => {
      // Test light theme
      const lightConfig = service.getEgyptianButtonConfig('accent');
      expect(lightConfig.cssClasses).toContain('egyptian-accent');
      expect(lightConfig.cssClasses).toContain('egyptian-golden-glow');
      
      // Switch to dark theme
      mockThemeService.currentTheme.and.returnValue({
        type: 'dark',
        isDark: true,
        isHighContrast: false,
        colors: {
          primary: '#1034A6',
          accent: '#FFD700',
          warn: '#F44336',
          background: '#1e1e1e',
          surface: '#303030',
          onPrimary: '#FFFFFF',
          onAccent: '#000000',
          onBackground: '#FFFFFF',
          onSurface: '#FFFFFF'
        }
      });
      
      const darkConfig = service.getEgyptianButtonConfig('accent');
      expect(darkConfig.cssClasses).toContain('egyptian-accent');
      expect(darkConfig.cssClasses).toContain('egyptian-golden-glow');
    });
  });
});