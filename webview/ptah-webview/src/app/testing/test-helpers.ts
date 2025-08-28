/**
 * Test Helpers for UI/UX Revamp Testing
 * Angular Material 20 + Egyptian Accents Test Infrastructure
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatCardHarness } from '@angular/material/card/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { DebugElement, Component, Type } from '@angular/core';
import { By } from '@angular/platform-browser';

import { SHARED_COMPONENTS } from '../shared';
import { EgyptianThemeService } from '../core/services/egyptian-theme.service';

/**
 * Test Module Builder for Material Components with Egyptian Theming
 */
export class MaterialTestModuleBuilder {
  static async createTestingModule<T>(
    componentType: Type<T>,
    options: TestModuleOptions = {},
  ): Promise<TestingModule<T>> {
    const testBed = TestBed.configureTestingModule({
      imports: [
        componentType,
        NoopAnimationsModule,
        ...SHARED_COMPONENTS,
        ...(options.imports || []),
      ],
      providers: [
        EgyptianThemeService,

        ...(options.providers || []),
        ...this.createMockProviders(options.mockServices || []),
      ],
    });

    // Schema configuration handled in TestBed module setup

    await testBed.compileComponents();

    const fixture = TestBed.createComponent(componentType);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    return {
      fixture,
      component: fixture.componentInstance,
      loader,
      debugElement: fixture.debugElement,
      nativeElement: fixture.nativeElement,
    };
  }

  private static createMockProviders(services: string[]) {
    return services.map((service) => ({
      provide: service,
      useValue: {
        // Mock implementation
        method1: () => {},
        method2: () => {},
      },
    }));
  }
}

/**
 * Egyptian Accent Testing Utilities
 */
export class EgyptianAccentTester {
  constructor(
    private fixture: ComponentFixture<any>,
    private loader: HarnessLoader,
  ) {}

  /**
   * Test Egyptian Button Directive - Gold accent hover effects
   */
  async testEgyptianButton(selector: string): Promise<EgyptianButtonTestResult> {
    const button = await this.loader.getHarness(MatButtonHarness.with({ selector }));

    const host = await button.host();

    // Test golden accent class application
    const hasGoldenAccent = await host.hasClass('egyptian-golden-accent');

    // Test hover state
    await host.hover();
    const hasHoverGlow = await host.hasClass('egyptian-hover-glow');

    // Test ripple color
    const rippleColor = await host.getCssValue('--mdc-ripple-color');

    return {
      hasGoldenAccent,
      hasHoverGlow,
      rippleColor,
      isAccessible: await this.checkButtonAccessibility(button),
    };
  }

  /**
   * Test Egyptian Input Directive - Gold glow on focus
   */
  async testEgyptianInput(selector: string): Promise<EgyptianInputTestResult> {
    const input = await this.loader.getHarness(MatInputHarness.with({ selector }));

    // Test focus glow effect
    await input.focus();
    const host = await input.host();
    const hasGoldenGlow = await host.hasClass('egyptian-focus-glow');

    // Test Egyptian blue outline
    const borderColor = await host.getCssValue('border-color');
    const boxShadow = await host.getCssValue('box-shadow');

    return {
      hasGoldenGlow,
      borderColor,
      boxShadow,
      isAccessible: await this.checkInputAccessibility(input),
    };
  }

  /**
   * Test Egyptian Card Directive - Papyrus texture application
   */
  async testEgyptianCard(selector: string): Promise<EgyptianCardTestResult> {
    const card = await this.loader.getHarness(MatCardHarness.with({ selector }));

    const host = await card.host();

    // Test papyrus background class
    const hasPapyrusTexture = await host.hasClass('egyptian-papyrus-texture');

    // Test Egyptian color palette
    const backgroundColor = await host.getCssValue('background-color');
    const borderColor = await host.getCssValue('border-color');

    return {
      hasPapyrusTexture,
      backgroundColor,
      borderColor,
      elevation: await this.getMatCardElevation(host),
    };
  }

  /**
   * Test Egyptian Spinner Directive - Themed progress indicators
   */
  async testEgyptianSpinner(selector: string): Promise<EgyptianSpinnerTestResult> {
    const spinner = await this.loader.getHarness(MatProgressSpinnerHarness.with({ selector }));

    const host = await spinner.host();

    // Test Egyptian theming
    const strokeColor = await host.getCssValue('--mdc-circular-progress-indicator-color');
    const hasEgyptianStyling = await host.hasClass('egyptian-spinner');

    return {
      strokeColor,
      hasEgyptianStyling,
      value: await spinner.getValue(),
      mode: await spinner.getMode(),
    };
  }

  private async checkButtonAccessibility(button: MatButtonHarness): Promise<AccessibilityResult> {
    const host = await button.host();
    const ariaLabel = await host.getAttribute('aria-label');
    const role = await host.getAttribute('role');
    const tabIndex = await host.getAttribute('tabindex');

    return {
      hasAriaLabel: !!ariaLabel,
      hasProperRole: role === 'button',
      isFocusable: tabIndex !== '-1',
      meetsTouchTarget: await this.checkTouchTargetSize(host),
    };
  }

  private async checkInputAccessibility(input: MatInputHarness): Promise<AccessibilityResult> {
    const host = await input.host();
    const ariaLabel = await host.getAttribute('aria-label');
    const ariaDescribedBy = await host.getAttribute('aria-describedby');
    const required = await host.getAttribute('required');

    return {
      hasAriaLabel: !!ariaLabel,
      hasDescription: !!ariaDescribedBy,
      hasRequiredIndicator: required !== null,
      meetsTouchTarget: await this.checkTouchTargetSize(host),
    };
  }

  private async checkTouchTargetSize(element: any): Promise<boolean> {
    const rect = await element.getDimensions();
    return rect.width >= 44 && rect.height >= 44;
  }

  private async getMatCardElevation(host: any): Promise<number> {
    const boxShadow = await host.getCssValue('box-shadow');
    // Parse Material elevation from box-shadow
    if (boxShadow.includes('rgba(0, 0, 0, 0.2)')) return 4;
    if (boxShadow.includes('rgba(0, 0, 0, 0.14)')) return 2;
    if (boxShadow.includes('rgba(0, 0, 0, 0.12)')) return 1;
    return 0;
  }
}

/**
 * VS Code Theme Testing Utilities
 */
export class VSCodeThemeTester {
  constructor(private fixture: ComponentFixture<any>) {}

  /**
   * Simulate VS Code theme change and measure response time
   */
  async testThemeSwitch(
    targetTheme: 'light' | 'dark' | 'high-contrast',
  ): Promise<ThemeSwitchResult> {
    const startTime = performance.now();

    // Simulate VS Code CSS variable change
    document.documentElement.style.setProperty(
      '--vscode-editor-background',
      targetTheme === 'dark' ? '#1e1e1e' : '#ffffff',
    );

    document.documentElement.style.setProperty(
      '--vscode-editor-foreground',
      targetTheme === 'dark' ? '#d4d4d4' : '#000000',
    );

    // Trigger change detection
    this.fixture.detectChanges();
    await this.fixture.whenStable();

    const endTime = performance.now();
    const switchTime = endTime - startTime;

    return {
      switchTime,
      meetsPerformanceTarget: switchTime < 200,
      theme: targetTheme,
      adaptationComplete: await this.verifyThemeAdaptation(targetTheme),
    };
  }

  private async verifyThemeAdaptation(theme: string): Promise<boolean> {
    const elements = this.fixture.nativeElement.querySelectorAll('[class*="mat-"]');

    for (let element of elements) {
      const backgroundColor = getComputedStyle(element).backgroundColor;
      const color = getComputedStyle(element).color;

      // Verify theme colors are properly applied
      if (theme === 'dark') {
        if (backgroundColor.includes('rgb(255') || color.includes('rgb(0')) {
          return false;
        }
      } else if (theme === 'light') {
        if (backgroundColor.includes('rgb(30') || color.includes('rgb(255')) {
          return false;
        }
      }
    }

    return true;
  }
}

/**
 * Performance Testing Utilities
 */
export class PerformanceTester {
  /**
   * Measure component render time
   */
  static async measureRenderTime<T>(
    componentType: Type<T>,
    iterations: number = 100,
  ): Promise<PerformanceResult> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      const testBed = TestBed.configureTestingModule({
        imports: [componentType, NoopAnimationsModule],
      });

      await testBed.compileComponents();
      const fixture = TestBed.createComponent(componentType);
      fixture.detectChanges();

      const end = performance.now();
      times.push(end - start);

      TestBed.resetTestingModule();
    }

    return {
      p50: this.calculatePercentile(times, 50),
      p95: this.calculatePercentile(times, 95),
      p99: this.calculatePercentile(times, 99),
      average: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }

  private static calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

/**
 * Responsive Design Testing Utilities
 */
export class ResponsiveTester {
  constructor(private fixture: ComponentFixture<any>) {}

  /**
   * Test component at different VS Code sidebar widths
   */
  async testResponsiveBreakpoints(): Promise<ResponsiveTestResult[]> {
    const breakpoints = [
      { width: 300, name: 'minimum' },
      { width: 400, name: 'small' },
      { width: 600, name: 'medium' },
      { width: 800, name: 'large' },
    ];

    const results: ResponsiveTestResult[] = [];

    for (const breakpoint of breakpoints) {
      const result = await this.testAtWidth(breakpoint.width);
      results.push({
        breakpoint: breakpoint.name,
        width: breakpoint.width,
        hasOverflow: result.hasOverflow || false,
        touchTargetsValid: result.touchTargetsValid || false,
        elementsVisible: result.elementsVisible || false,
        textReadable: result.textReadable || false,
      });
    }

    return results;
  }

  private async testAtWidth(width: number): Promise<Partial<ResponsiveTestResult>> {
    // Simulate sidebar width change
    const container = this.fixture.nativeElement;
    container.style.width = `${width}px`;
    container.style.maxWidth = `${width}px`;

    this.fixture.detectChanges();
    await this.fixture.whenStable();

    return {
      hasOverflow: this.checkForOverflow(container),
      touchTargetsValid: await this.validateTouchTargets(container),
      elementsVisible: this.checkElementVisibility(container),
      textReadable: this.checkTextReadability(container),
    };
  }

  private checkForOverflow(container: HTMLElement): boolean {
    return container.scrollWidth > container.clientWidth;
  }

  private async validateTouchTargets(container: HTMLElement): Promise<boolean> {
    const interactiveElements = container.querySelectorAll('button, input, [role="button"]');

    for (let element of interactiveElements) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        return false;
      }
    }

    return true;
  }

  private checkElementVisibility(container: HTMLElement): boolean {
    const importantElements = container.querySelectorAll('[data-test-important]');

    for (let element of importantElements) {
      if (getComputedStyle(element).display === 'none') {
        return false;
      }
    }

    return true;
  }

  private checkTextReadability(container: HTMLElement): boolean {
    const textElements = container.querySelectorAll('p, span, div[class*="text-"]');

    for (let element of textElements) {
      const fontSize = parseFloat(getComputedStyle(element).fontSize);
      if (fontSize < 12) {
        return false;
      }
    }

    return true;
  }
}

// Type Definitions

export interface TestModuleOptions {
  imports?: any[];
  providers?: any[];
  mockServices?: string[];
}

export interface TestingModule<T> {
  fixture: ComponentFixture<T>;
  component: T;
  loader: HarnessLoader;
  debugElement: DebugElement;
  nativeElement: HTMLElement;
}

export interface EgyptianButtonTestResult {
  hasGoldenAccent: boolean;
  hasHoverGlow: boolean;
  rippleColor: string;
  isAccessible: AccessibilityResult;
}

export interface EgyptianInputTestResult {
  hasGoldenGlow: boolean;
  borderColor: string;
  boxShadow: string;
  isAccessible: AccessibilityResult;
}

export interface EgyptianCardTestResult {
  hasPapyrusTexture: boolean;
  backgroundColor: string;
  borderColor: string;
  elevation: number;
}

export interface EgyptianSpinnerTestResult {
  strokeColor: string;
  hasEgyptianStyling: boolean;
  value: number | null;
  mode: string;
}

export interface AccessibilityResult {
  hasAriaLabel?: boolean;
  hasProperRole?: boolean;
  isFocusable?: boolean;
  hasDescription?: boolean;
  hasRequiredIndicator?: boolean;
  meetsTouchTarget: boolean;
}

export interface ThemeSwitchResult {
  switchTime: number;
  meetsPerformanceTarget: boolean;
  theme: 'light' | 'dark' | 'high-contrast';
  adaptationComplete: boolean;
}

export interface PerformanceResult {
  p50: number;
  p95: number;
  p99: number;
  average: number;
  min: number;
  max: number;
}

export interface ResponsiveTestResult {
  breakpoint: string;
  width: number;
  hasOverflow: boolean;
  touchTargetsValid: boolean;
  elementsVisible: boolean;
  textReadable: boolean;
}
