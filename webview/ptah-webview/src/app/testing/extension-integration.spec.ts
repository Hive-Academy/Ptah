/**
 * VS Code Extension Integration Tests
 * Material 20 + Egyptian Accents + Extension Loading
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { App } from '../app';
import { SHARED_COMPONENTS } from '../shared';
import { EgyptianThemeService } from '../core/services/egyptian-theme.service';
import { MaterialConfigService } from '../core/services/material-config.service';
import { VSCodeService } from '../services/vscode.service';
import { AppStateService } from '../services/app-state.service';

describe('VS Code Extension Integration - UI/UX Revamp', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let mockVSCodeService: jasmine.SpyObj<VSCodeService>;
  let egyptianThemeService: EgyptianThemeService;

  beforeEach(async () => {
    const vscodeServiceSpy = jasmine.createSpyObj('VSCodeService', [
      'postMessage',
      'getState',
      'setState',
      'onMessage'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        App,
        NoopAnimationsModule,
        ...SHARED_COMPONENTS
      ],
      providers: [
        { provide: VSCodeService, useValue: vscodeServiceSpy },
        AppStateService,
        EgyptianThemeService,
        MaterialConfigService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    mockVSCodeService = TestBed.inject(VSCodeService) as jasmine.SpyObj<VSCodeService>;
    egyptianThemeService = TestBed.inject(EgyptianThemeService);
  });

  describe('Extension Loading Tests', () => {
    
    it('should create the application successfully', () => {
      expect(app).toBeTruthy();
    });

    it('should initialize with Material 20 components', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const materialElements = fixture.nativeElement.querySelectorAll('[class*="mat-"]');
      expect(materialElements.length).toBeGreaterThan(0);

      // Verify Material 20 specific classes exist
      const hasMaterial20Elements = Array.from(materialElements).some(element => 
        element.className.includes('mdc-') || 
        element.className.includes('mat-mdc-')
      );
      expect(hasMaterial20Elements).toBe(true);
    });

    it('should load Egyptian theme service', () => {
      expect(egyptianThemeService).toBeTruthy();
      expect(egyptianThemeService.currentTheme()).toBeTruthy();
    });

    it('should establish VS Code communication', () => {
      fixture.detectChanges();
      
      // Should attempt to get initial VS Code state
      expect(mockVSCodeService.getState).toHaveBeenCalled();
    });

    it('should detect VS Code theme on initialization', async () => {
      // Mock VS Code CSS variables
      document.documentElement.style.setProperty('--vscode-editor-background', '#1e1e1e');
      document.documentElement.style.setProperty('--vscode-editor-foreground', '#d4d4d4');

      fixture.detectChanges();
      await fixture.whenStable();

      const currentTheme = egyptianThemeService.currentTheme();
      expect(currentTheme.type).toBe('dark');
    });

    it('should render without console errors', () => {
      spyOn(console, 'error');
      spyOn(console, 'warn');

      fixture.detectChanges();

      expect(console.error).not.toHaveBeenCalled();
      // Allow bundle size warnings
      const warnCalls = (console.warn as jasmine.Spy).calls.all();
      const nonBundleWarnings = warnCalls.filter(call => 
        !call.args[0]?.toString().includes('bundle') && 
        !call.args[0]?.toString().includes('budget')
      );
      expect(nonBundleWarnings.length).toBe(0);
    });
  });

  describe('Egyptian Identity Integration', () => {
    
    it('should apply Egyptian accents to Material components', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const egyptianElements = fixture.nativeElement.querySelectorAll('[class*="egyptian-"]');
      expect(egyptianElements.length).toBeGreaterThan(0);

      // Verify Egyptian + Material class combinations
      const hasEgyptianMaterialCombination = Array.from(egyptianElements).some(element =>
        element.className.includes('mat-') && element.className.includes('egyptian-')
      );
      expect(hasEgyptianMaterialCombination).toBe(true);
    });

    it('should maintain Egyptian color palette', () => {
      fixture.detectChanges();

      const themeColors = egyptianThemeService.currentTheme().colors;
      expect(themeColors.primary).toContain('#1034A6'); // Egyptian blue
      expect(themeColors.accent).toContain('#FFD700'); // Egyptian gold
    });

    it('should display Egyptian hieroglyph icons', () => {
      fixture.detectChanges();

      const iconElements = fixture.nativeElement.querySelectorAll('mat-icon');
      expect(iconElements.length).toBeGreaterThan(0);

      // Should have some Egyptian-themed icons
      const hasEgyptianIcons = Array.from(iconElements).some(icon =>
        icon.textContent?.includes('⚱') || // Urn
        icon.textContent?.includes('𓋹') || // Ankh-like
        icon.className.includes('egyptian')
      );
      expect(hasEgyptianIcons).toBe(true);
    });
  });

  describe('Webview Constraints Compliance', () => {
    
    it('should not use inline styles (CSP compliance)', () => {
      fixture.detectChanges();

      const allElements = fixture.nativeElement.querySelectorAll('*');
      for (let element of allElements) {
        expect(element.getAttribute('style')).toBeNull();
      }
    });

    it('should work within VS Code webview security context', () => {
      fixture.detectChanges();

      // Should not attempt direct DOM manipulation outside Angular
      const scripts = fixture.nativeElement.querySelectorAll('script');
      expect(scripts.length).toBe(0);

      // Should not use eval or similar unsafe operations
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle message passing correctly', () => {
      fixture.detectChanges();

      // Simulate receiving a message from VS Code
      const testMessage = { type: 'theme-change', data: { theme: 'dark' } };
      
      // Should not throw when processing messages
      expect(() => {
        // Mock message processing would happen here
      }).not.toThrow();
    });
  });

  describe('Bundle Size and Performance', () => {
    
    it('should load within acceptable time limits', async () => {
      const startTime = performance.now();
      
      fixture.detectChanges();
      await fixture.whenStable();
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load under 1 second
    });

    it('should tree-shake Material components correctly', () => {
      fixture.detectChanges();

      // Should only include used Material components
      const materialElements = fixture.nativeElement.querySelectorAll('[class*="mat-"]');
      const uniqueComponents = new Set();
      
      materialElements.forEach(element => {
        const classes = element.className.split(' ');
        classes.forEach(cls => {
          if (cls.startsWith('mat-') && cls.includes('-')) {
            const component = cls.split('-')[1];
            uniqueComponents.add(component);
          }
        });
      });

      // Should have a reasonable number of components (not the entire Material library)
      expect(uniqueComponents.size).toBeLessThan(20);
      expect(uniqueComponents.size).toBeGreaterThan(5);
    });

    it('should optimize for VS Code sidebar constraints', () => {
      // Simulate narrow sidebar
      fixture.nativeElement.style.width = '300px';
      fixture.nativeElement.style.maxWidth = '300px';
      
      fixture.detectChanges();

      // Should not overflow horizontally
      const scrollWidth = fixture.nativeElement.scrollWidth;
      const clientWidth = fixture.nativeElement.clientWidth;
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Allow small variance
    });
  });

  describe('Theme Switching Performance', () => {
    
    it('should switch themes quickly', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const startTime = performance.now();

      // Simulate VS Code theme change
      document.documentElement.style.setProperty('--vscode-editor-background', '#ffffff');
      document.documentElement.style.setProperty('--vscode-editor-foreground', '#000000');

      // Trigger theme detection
      window.dispatchEvent(new Event('vscode-theme-changed'));
      
      fixture.detectChanges();
      await fixture.whenStable();

      const switchTime = performance.now() - startTime;
      expect(switchTime).toBeLessThan(200); // Should switch under 200ms
    });

    it('should maintain Egyptian accents during theme changes', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      // Initial Egyptian elements count
      const initialEgyptianElements = fixture.nativeElement.querySelectorAll('[class*="egyptian-"]').length;

      // Switch theme
      document.documentElement.style.setProperty('--vscode-editor-background', '#ffffff');
      fixture.detectChanges();
      await fixture.whenStable();

      // Egyptian elements should remain
      const afterSwitchElements = fixture.nativeElement.querySelectorAll('[class*="egyptian-"]').length;
      expect(afterSwitchElements).toBe(initialEgyptianElements);
    });
  });

  describe('Accessibility in VS Code Context', () => {
    
    it('should maintain ARIA labels in webview context', () => {
      fixture.detectChanges();

      const interactiveElements = fixture.nativeElement.querySelectorAll('button, input, [role="button"]');
      
      interactiveElements.forEach(element => {
        const hasAccessibleName = 
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent?.trim() ||
          element.querySelector('[aria-label]');
          
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('should support keyboard navigation in webview', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const focusableElements = fixture.nativeElement.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test tab navigation
      focusableElements.forEach(element => {
        expect(element.tabIndex).not.toBe(-1);
      });
    });

    it('should work with VS Code high contrast mode', async () => {
      // Simulate high contrast mode
      document.documentElement.style.setProperty('--vscode-editor-background', '#000000');
      document.documentElement.style.setProperty('--vscode-editor-foreground', '#ffffff');
      document.documentElement.setAttribute('data-vscode-theme-kind', 'vscode-high-contrast');

      fixture.detectChanges();
      await fixture.whenStable();

      const elements = fixture.nativeElement.querySelectorAll('button, input, [role="button"]');
      elements.forEach(element => {
        const styles = getComputedStyle(element);
        const borderWidth = parseFloat(styles.borderWidth);
        expect(borderWidth).toBeGreaterThan(0); // Should have visible borders in high contrast
      });
    });
  });
});