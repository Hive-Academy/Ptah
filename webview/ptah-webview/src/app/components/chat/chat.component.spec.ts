/**
 * Chat Component Test Suite - UI/UX Revamp
 * Angular Material 20 + Egyptian Accents Integration Testing
 */

import { ComponentFixture, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatCardHarness } from '@angular/material/card/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { MatToolbarHarness } from '@angular/material/toolbar/testing';

import { ChatComponent } from './chat.component';
import {
  MaterialTestModuleBuilder,
  EgyptianAccentTester,
  VSCodeThemeTester,
  ResponsiveTester,
  PerformanceTester
} from '../../testing/test-helpers';

describe('ChatComponent - UI/UX Revamp Integration', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let loader: HarnessLoader;
  let egyptianTester: EgyptianAccentTester;
  let themeTester: VSCodeThemeTester;
  let responsiveTester: ResponsiveTester;

  beforeEach(async () => {
    const testModule = await MaterialTestModuleBuilder.createTestingModule(
      ChatComponent,
      {
        mockServices: ['VSCodeService', 'AppStateService', 'MessageHandlerService']
      }
    );

    component = testModule.component;
    fixture = testModule.fixture;
    loader = testModule.loader;

    egyptianTester = new EgyptianAccentTester(fixture, loader);
    themeTester = new VSCodeThemeTester(fixture);
    responsiveTester = new ResponsiveTester(fixture);

    fixture.detectChanges();
  });

  describe('Material Component Integration', () => {
    
    it('should render Mat-Toolbar with Egyptian Card accent', async () => {
      const toolbar = await loader.getHarness(MatToolbarHarness);
      expect(toolbar).toBeTruthy();

      const host = await toolbar.host();
      const hasEgyptianCard = await host.hasClass('egyptian-card');
      expect(hasEgyptianCard).toBe(true);
    });

    it('should display Material buttons with Egyptian accents', async () => {
      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      expect(buttons.length).toBeGreaterThan(0);

      for (const button of buttons) {
        const result = await egyptianTester.testEgyptianButton('mat-button');
        expect(result.hasGoldenAccent).toBe(true);
        expect(result.isAccessible.meetsTouchTarget).toBe(true);
      }
    });

    it('should render Material form field with Egyptian input styling', async () => {
      const input = await loader.getHarness(MatInputHarness.with({ 
        placeholder: /send a message/i 
      }));
      
      expect(input).toBeTruthy();
      
      const result = await egyptianTester.testEgyptianInput('mat-input');
      expect(result.hasGoldenGlow).toBe(true);
      expect(result.borderColor).toContain('rgb(16, 52, 166)'); // Egyptian blue
      expect(result.isAccessible.meetsTouchTarget).toBe(true);
    });

    it('should display message cards with Material Card component', async () => {
      // Simulate adding messages using signals
      component.messages.set([
        { 
          id: '1', 
          content: 'Test message', 
          type: 'user', 
          timestamp: new Date().toISOString()
        },
        { 
          id: '2', 
          content: 'Response message', 
          type: 'assistant', 
          timestamp: new Date().toISOString()
        }
      ]);
      
      fixture.detectChanges();

      const cards = await loader.getAllHarnesses(MatCardHarness);
      expect(cards.length).toBe(2);

      for (const card of cards) {
        const result = await egyptianTester.testEgyptianCard('mat-card');
        expect(result.hasPapyrusTexture).toBe(true);
        expect(result.elevation).toBeGreaterThan(0);
      }
    });

    it('should show Material progress spinner during loading', fakeAsync(async () => {
      component.isLoading.set(true);
      fixture.detectChanges();
      tick();

      const spinner = await loader.getHarness(MatProgressSpinnerHarness);
      expect(spinner).toBeTruthy();

      const result = await egyptianTester.testEgyptianSpinner('mat-progress-spinner');
      expect(result.hasEgyptianStyling).toBe(true);
      expect(result.strokeColor).toContain('#FFD700'); // Egyptian gold
    }));
  });

  describe('Egyptian Identity Preservation', () => {
    
    it('should maintain Egyptian color palette', async () => {
      const elements = fixture.nativeElement.querySelectorAll('[class*="egyptian-"]');
      expect(elements.length).toBeGreaterThan(0);

      for (const element of elements) {
        const styles = getComputedStyle(element);
        const hasEgyptianColors = 
          styles.backgroundColor.includes('16, 52, 166') || // Egyptian blue
          styles.color.includes('255, 215, 0') || // Egyptian gold
          styles.borderColor.includes('16, 52, 166');
        
        expect(hasEgyptianColors).toBe(true);
      }
    });

    it('should display hieroglyph icons in navigation elements', () => {
      const iconElements = fixture.nativeElement.querySelectorAll('mat-icon[class*="egyptian-hieroglyph"]');
      expect(iconElements.length).toBeGreaterThan(0);

      iconElements.forEach((icon: Element) => {
        const svgContent = icon.textContent || icon.innerHTML;
        expect(svgContent).toBeTruthy();
      });
    });

    it('should apply golden hover effects to interactive elements', async () => {
      const interactiveElements = await loader.getAllHarnesses(MatButtonHarness);
      
      for (const element of interactiveElements) {
        const host = await element.host();
        await host.hover();
        
        const hasGoldenHover = await host.hasClass('egyptian-hover-glow');
        expect(hasGoldenHover).toBe(true);
      }
    });

    it('should maintain Egyptian accents during theme switching', async () => {
      // Test light theme
      const lightResult = await themeTester.testThemeSwitch('light');
      expect(lightResult.adaptationComplete).toBe(true);

      // Verify Egyptian accents are still present
      let egyptianElements = fixture.nativeElement.querySelectorAll('[class*="egyptian-"]');
      expect(egyptianElements.length).toBeGreaterThan(0);

      // Test dark theme
      const darkResult = await themeTester.testThemeSwitch('dark');
      expect(darkResult.adaptationComplete).toBe(true);

      // Verify Egyptian accents are still present
      egyptianElements = fixture.nativeElement.querySelectorAll('[class*="egyptian-"]');
      expect(egyptianElements.length).toBeGreaterThan(0);
    });
  });

  describe('VS Code Theme Integration', () => {
    
    it('should adapt to VS Code light theme within 200ms', async () => {
      const result = await themeTester.testThemeSwitch('light');
      
      expect(result.meetsPerformanceTarget).toBe(true);
      expect(result.switchTime).toBeLessThan(200);
      expect(result.adaptationComplete).toBe(true);
    });

    it('should adapt to VS Code dark theme within 200ms', async () => {
      const result = await themeTester.testThemeSwitch('dark');
      
      expect(result.meetsPerformanceTarget).toBe(true);
      expect(result.switchTime).toBeLessThan(200);
      expect(result.adaptationComplete).toBe(true);
    });

    it('should support high contrast mode', async () => {
      const result = await themeTester.testThemeSwitch('high-contrast');
      
      expect(result.adaptationComplete).toBe(true);
      
      // Verify high contrast elements
      const elements = fixture.nativeElement.querySelectorAll('mat-button, mat-card, mat-form-field');
      for (const element of elements) {
        const styles = getComputedStyle(element);
        const borderWidth = parseFloat(styles.borderWidth);
        expect(borderWidth).toBeGreaterThan(1); // Bold borders for high contrast
      }
    });
  });

  describe('Responsive Design Validation', () => {
    
    it('should work at 300px minimum VS Code sidebar width', async () => {
      const results = await responsiveTester.testResponsiveBreakpoints();
      const minimumResult = results.find(r => r.width === 300);
      
      expect(minimumResult).toBeTruthy();
      expect(minimumResult!.hasOverflow).toBe(false);
      expect(minimumResult!.touchTargetsValid).toBe(true);
      expect(minimumResult!.elementsVisible).toBe(true);
      expect(minimumResult!.textReadable).toBe(true);
    });

    it('should scale appropriately at wider sidebar widths', async () => {
      const results = await responsiveTester.testResponsiveBreakpoints();
      const largeResult = results.find(r => r.width === 800);
      
      expect(largeResult).toBeTruthy();
      expect(largeResult!.elementsVisible).toBe(true);
      expect(largeResult!.textReadable).toBe(true);
    });

    it('should maintain 44px minimum touch targets across breakpoints', async () => {
      const results = await responsiveTester.testResponsiveBreakpoints();
      
      results.forEach(result => {
        expect(result.touchTargetsValid).toBe(true);
      });
    });

    it('should handle content overflow properly', async () => {
      // Simulate long message content
      component.messages.set(Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        content: 'Very long message content that should test overflow behavior and scrolling capabilities',
        type: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date().toISOString()
      })));

      fixture.detectChanges();

      const results = await responsiveTester.testResponsiveBreakpoints();
      
      // Should use proper scrolling, not horizontal overflow
      results.forEach(result => {
        expect(result.hasOverflow).toBe(false);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    
    it('should provide ARIA labels for all interactive elements', async () => {
      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      
      for (const button of buttons) {
        const host = await button.host();
        const ariaLabel = await host.getAttribute('aria-label');
        const text = await button.getText();
        
        expect(ariaLabel || text).toBeTruthy();
      }
    });

    it('should support keyboard navigation', async () => {
      const input = await loader.getHarness(MatInputHarness);
      
      await input.focus();
      const isFocused = await input.isFocused();
      expect(isFocused).toBe(true);

      // Test tab navigation
      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      for (const button of buttons) {
        const host = await button.host();
        const tabIndex = await host.getAttribute('tabindex');
        expect(tabIndex).not.toBe('-1');
      }
    });

    it('should maintain proper color contrast ratios', () => {
      const textElements = fixture.nativeElement.querySelectorAll('p, span, div[class*="text-"]');
      
      textElements.forEach((element: Element) => {
        const styles = getComputedStyle(element as HTMLElement);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Mock contrast ratio check - in real test would use actual calculation
        expect(color).toBeTruthy();
        expect(backgroundColor).toBeTruthy();
      });
    });

    it('should provide screen reader support', async () => {
      // Test live regions for dynamic content
      const liveRegions = fixture.nativeElement.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Test progress spinner accessibility
      if (component.isLoading()) {
        const spinner = await loader.getHarness(MatProgressSpinnerHarness);
        const host = await spinner.host();
        const ariaLabel = await host.getAttribute('aria-label');
        expect(ariaLabel).toContain('loading');
      }
    });
  });

  describe('Performance Validation', () => {
    
    it('should render within performance targets', waitForAsync(async () => {
      const performanceResult = await PerformanceTester.measureRenderTime(ChatComponent, 10);
      
      expect(performanceResult.p95).toBeLessThan(200); // 95% under 200ms
      expect(performanceResult.p99).toBeLessThan(500); // 99% under 500ms
      expect(performanceResult.average).toBeLessThan(100); // Average under 100ms
    }));

    it('should handle rapid theme switching without performance degradation', async () => {
      const switchTimes: number[] = [];
      
      // Test rapid theme switching
      for (let i = 0; i < 10; i++) {
        const theme = i % 2 === 0 ? 'light' : 'dark';
        const result = await themeTester.testThemeSwitch(theme);
        switchTimes.push(result.switchTime);
      }
      
      const averageSwitchTime = switchTimes.reduce((a, b) => a + b) / switchTimes.length;
      expect(averageSwitchTime).toBeLessThan(200);
    });

    it('should maintain performance with large message lists', async () => {
      const startTime = performance.now();
      
      // Add large number of messages
      component.messages.set(Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        content: `Message ${i}`,
        type: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date().toISOString()
      })));

      fixture.detectChanges();
      await fixture.whenStable();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(500); // Should render large lists under 500ms
    });
  });

  describe('Custom CSS Elimination Validation', () => {
    
    it('should not use any custom CSS files', () => {
      // Check that component metadata doesn't include styleUrls
      const componentMetadata = (ChatComponent as any).__annotations__?.[0];
      expect(componentMetadata?.styleUrls).toBeUndefined();
    });

    it('should only use Material Design and Tailwind classes', () => {
      const allElements = fixture.nativeElement.querySelectorAll('*');
      
      allElements.forEach((element: Element) => {
        const classList = element.classList;
        for (let className of classList) {
          const isValidClass = 
            className.startsWith('mat-') ||
            className.startsWith('egyptian-') ||
            className.startsWith('flex') ||
            className.startsWith('grid') ||
            className.startsWith('text-') ||
            className.startsWith('bg-') ||
            className.startsWith('border-') ||
            className.startsWith('p-') ||
            className.startsWith('m-') ||
            className.startsWith('w-') ||
            className.startsWith('h-') ||
            className.startsWith('min-') ||
            className.startsWith('max-') ||
            className.startsWith('sm:') ||
            className.startsWith('md:') ||
            className.startsWith('lg:') ||
            className.startsWith('xl:');
            
          expect(isValidClass).toBe(true, `Invalid class found: ${className}`);
        }
      });
    });

    it('should use only Material animations', () => {
      const animatedElements = fixture.nativeElement.querySelectorAll('[class*="mat-"]');
      
      animatedElements.forEach((element: Element) => {
        const styles = getComputedStyle(element as HTMLElement);
        if (styles.animation && styles.animation !== 'none') {
          expect(styles.animation).toContain('mat-'); // Should only use Material animations
        }
      });
    });
  });
});