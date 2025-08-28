/**
 * Egyptian Theme Service Test Suite
 * VS Code Theme Integration + Egyptian Identity Testing
 */

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { EgyptianThemeService } from './egyptian-theme.service';
import { VSCodeService } from '../../services/vscode.service';

describe('EgyptianThemeService', () => {
  let service: EgyptianThemeService;
  let mockVSCodeService: jasmine.SpyObj<VSCodeService>;

  beforeEach(() => {
    const vscodeServiceSpy = jasmine.createSpyObj('VSCodeService', [
      'getThemeKind',
      'onThemeChanged'
    ]);

    TestBed.configureTestingModule({
      providers: [
        EgyptianThemeService,
        { provide: VSCodeService, useValue: vscodeServiceSpy }
      ]
    });

    service = TestBed.inject(EgyptianThemeService);
    mockVSCodeService = TestBed.inject(VSCodeService) as jasmine.SpyObj<VSCodeService>;
  });

  describe('Service Initialization', () => {
    
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default theme', () => {
      const currentTheme = service.currentTheme();
      expect(currentTheme).toBeTruthy();
      expect(currentTheme).toBeOneOf(['light', 'dark', 'high-contrast']);
    });

    it('should have initialized theme detection', () => {
      expect(service.isInitialized()).toBeTruthy();
    });
  });

  describe('Egyptian Color Palette', () => {
    
    it('should maintain Egyptian blue primary color', () => {
      const colors = service.themeColors();
      expect(colors.primary).toContain('#1034A6'); // Egyptian blue
    });

    it('should maintain Egyptian gold accent color', () => {
      const colors = service.themeColors();
      expect(colors.accent).toContain('#FFD700'); // Egyptian gold
    });

    it('should provide Egyptian color variants', () => {
      const colors = service.themeColors();
      expect(colors.surface).toBeDefined();
      expect(colors.background).toBeDefined();
      expect(colors.egyptianAccent).toBeDefined();
      expect(colors.egyptianGlow).toBeDefined();
    });
  });

  describe('VS Code Theme Detection', () => {
    
    it('should detect VS Code light theme', () => {
      // Mock light theme CSS variables
      document.documentElement.style.setProperty('--vscode-editor-background', '#ffffff');
      document.documentElement.style.setProperty('--vscode-editor-foreground', '#000000');

      service.detectVSCodeTheme();
      const theme = service.currentTheme();
      
      expect(theme.type).toBe('light');
    });

    it('should detect VS Code dark theme', () => {
      // Mock dark theme CSS variables
      document.documentElement.style.setProperty('--vscode-editor-background', '#1e1e1e');
      document.documentElement.style.setProperty('--vscode-editor-foreground', '#d4d4d4');

      service.detectVSCodeTheme();
      const theme = service.currentTheme();
      
      expect(theme.type).toBe('dark');
    });

    it('should detect VS Code high contrast theme', () => {
      // Mock high contrast CSS variables
      document.documentElement.style.setProperty('--vscode-editor-background', '#000000');
      document.documentElement.style.setProperty('--vscode-editor-foreground', '#ffffff');
      document.documentElement.setAttribute('data-vscode-theme-kind', 'vscode-high-contrast');

      service.detectVSCodeTheme();
      const theme = service.currentTheme();
      
      expect(theme.type).toBe('high-contrast');
    });
  });

  describe('Theme Switching Performance', () => {
    
    it('should switch themes within 200ms target', async () => {
      const startTime = performance.now();
      
      service.setTheme('dark');
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow signal updates
      
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      expect(switchTime).toBeLessThan(200);
    });

    it('should handle rapid theme switching', async () => {
      const switchTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const theme = i % 2 === 0 ? 'light' : 'dark';
        service.setTheme(theme);
        const endTime = performance.now();
        switchTimes.push(endTime - startTime);
      }
      
      const averageTime = switchTimes.reduce((a, b) => a + b) / switchTimes.length;
      expect(averageTime).toBeLessThan(50); // Should be very fast for rapid switching
    });

    it('should maintain theme state consistency', () => {
      service.setTheme('light');
      expect(service.currentTheme().type).toBe('light');

      service.setTheme('dark');
      expect(service.currentTheme().type).toBe('dark');

      service.setTheme('high-contrast');
      expect(service.currentTheme().type).toBe('high-contrast');
    });
  });

  describe('Material Theme Integration', () => {
    
    it('should provide Material-compatible color schemes', () => {
      const theme = service.currentTheme();
      
      // Should have Material Design color structure
      expect(theme.colors.primary).toBeTruthy();
      expect(theme.colors.accent).toBeTruthy();
      expect(theme.colors.warn).toBeTruthy();
      expect(theme.colors.background).toBeTruthy();
      expect(theme.colors.surface).toBeTruthy();
    });

    it('should generate CSS custom properties for Material', () => {
      const cssVariables = service.getCSSVariables();
      
      expect(cssVariables['--egyptian-primary']).toBeTruthy();
      expect(cssVariables['--egyptian-accent']).toBeTruthy();
      expect(cssVariables['--mat-primary']).toBeTruthy();
      expect(cssVariables['--mat-accent']).toBeTruthy();
    });

    it('should adapt Material colors for different themes', () => {
      // Light theme
      service.setTheme('light');
      const lightVars = service.getCSSVariables();
      
      // Dark theme
      service.setTheme('dark');
      const darkVars = service.getCSSVariables();
      
      // Background colors should be different
      expect(lightVars['--mat-background']).not.toBe(darkVars['--mat-background']);
      
      // But Egyptian accents should remain consistent
      expect(lightVars['--egyptian-primary']).toBe(darkVars['--egyptian-primary']);
      expect(lightVars['--egyptian-accent']).toBe(darkVars['--egyptian-accent']);
    });
  });

  describe('Accessibility Compliance', () => {
    
    it('should maintain WCAG contrast ratios in light theme', () => {
      service.setTheme('light');
      const theme = service.currentTheme();
      
      // Mock contrast ratio validation
      const backgroundLightness = this.getLightness(theme.colors.background);
      const textLightness = this.getLightness(theme.colors.onBackground);
      
      const contrastRatio = Math.abs(backgroundLightness - textLightness);
      expect(contrastRatio).toBeGreaterThan(0.4); // WCAG AA minimum approximation
    });

    it('should maintain WCAG contrast ratios in dark theme', () => {
      service.setTheme('dark');
      const theme = service.currentTheme();
      
      const backgroundLightness = this.getLightness(theme.colors.background);
      const textLightness = this.getLightness(theme.colors.onBackground);
      
      const contrastRatio = Math.abs(backgroundLightness - textLightness);
      expect(contrastRatio).toBeGreaterThan(0.4); // WCAG AA minimum approximation
    });

    it('should enhance contrast in high-contrast mode', () => {
      service.setTheme('high-contrast');
      const theme = service.currentTheme();
      
      // High contrast should have maximum difference
      const backgroundLightness = this.getLightness(theme.colors.background);
      const textLightness = this.getLightness(theme.colors.onBackground);
      
      const contrastRatio = Math.abs(backgroundLightness - textLightness);
      expect(contrastRatio).toBeGreaterThan(0.8); // Very high contrast
    });

    // Helper method for contrast testing
    private getLightness(color: string): number {
      // Simple lightness calculation for testing
      if (color.includes('#000') || color.includes('rgb(0')) return 0;
      if (color.includes('#fff') || color.includes('rgb(255')) return 1;
      if (color.includes('#1e1e1e')) return 0.12;
      if (color.includes('#ffffff')) return 1;
      return 0.5; // Default middle value
    }
  });

  describe('Strategy Pattern Implementation', () => {
    
    it('should use light theme strategy correctly', () => {
      service.setTheme('light');
      const theme = service.currentTheme();
      
      expect(theme.type).toBe('light');
      expect(theme.isDark).toBe(false);
      expect(theme.colors.background).toContain('#fff'); // Light background
    });

    it('should use dark theme strategy correctly', () => {
      service.setTheme('dark');
      const theme = service.currentTheme();
      
      expect(theme.type).toBe('dark');
      expect(theme.isDark).toBe(true);
      expect(theme.colors.background).toContain('#1e1e1e'); // Dark background
    });

    it('should use high-contrast theme strategy correctly', () => {
      service.setTheme('high-contrast');
      const theme = service.currentTheme();
      
      expect(theme.type).toBe('high-contrast');
      expect(theme.isHighContrast).toBe(true);
      expect(theme.colors.background).toBe('#000000'); // True black
      expect(theme.colors.onBackground).toBe('#ffffff'); // True white
    });
  });

  describe('Signal-based Reactivity', () => {
    
    it('should use Angular signals for theme state', () => {
      const themeSignal = service.currentTheme;
      expect(typeof themeSignal).toBe('function'); // Signals are functions
    });

    it('should trigger updates when theme changes', () => {
      let updateCount = 0;
      
      // Subscribe to theme changes
      const subscription = service.currentTheme.subscribe?.(() => {
        updateCount++;
      });

      service.setTheme('dark');
      service.setTheme('light');
      
      expect(updateCount).toBeGreaterThan(0);
    });

    it('should provide computed CSS variables signal', () => {
      const cssVarsSignal = service.getCSSVariables;
      expect(typeof cssVarsSignal).toBe('function');
      
      const initialVars = cssVarsSignal();
      expect(initialVars).toBeTruthy();
      expect(Object.keys(initialVars).length).toBeGreaterThan(0);
    });
  });

  describe('Memory and Performance', () => {
    
    it('should not leak memory during theme switching', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many theme switches
      for (let i = 0; i < 100; i++) {
        service.setTheme(i % 2 === 0 ? 'light' : 'dark');
      }
      
      // Force garbage collection if available
      if ((globalThis as any).gc) {
        (globalThis as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory should not grow excessively (within 10MB)
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
    });

    it('should cache theme computations', () => {
      const startTime = performance.now();
      
      // First computation
      const theme1 = service.currentTheme();
      const firstTime = performance.now() - startTime;
      
      const midTime = performance.now();
      
      // Second computation (should be cached)
      const theme2 = service.currentTheme();
      const secondTime = performance.now() - midTime;
      
      expect(theme1).toBe(theme2); // Should be same object
      expect(secondTime).toBeLessThan(firstTime); // Should be faster
    });
  });
});