import { Injectable, computed, effect, signal } from '@angular/core';

/**
 * Theme adaptation strategy interface for VS Code integration
 */
export interface ThemeStrategy {
  readonly name: string;
  readonly displayName: string;
  getPrimaryColor(): string;
  getAccentColor(): string;
  getBackgroundColor(): string;
  getSurfaceColor(): string;
  getTextColor(): string;
  getEgyptianAccentColor(): string;
  getEgyptianGlowColor(): string;
  apply(): void;
}

/**
 * Light theme strategy with Egyptian golden accents
 */
export class LightThemeStrategy implements ThemeStrategy {
  readonly name = 'light';
  readonly displayName = 'Light Theme';

  getPrimaryColor(): string {
    return '#1034A6'; // Egyptian blue
  }

  getAccentColor(): string {
    return '#FFD700'; // Egyptian gold
  }

  getBackgroundColor(): string {
    return 'var(--vscode-editor-background, #ffffff)';
  }

  getSurfaceColor(): string {
    return 'var(--vscode-widget-background, #f8f9fa)';
  }

  getTextColor(): string {
    return 'var(--vscode-editor-foreground, #1f2937)';
  }

  getEgyptianAccentColor(): string {
    return '#F59E0B'; // Papyrus gold
  }

  getEgyptianGlowColor(): string {
    return 'rgba(245, 158, 11, 0.3)'; // Golden glow for focus states
  }

  apply(): void {
    document.documentElement.style.setProperty('--egyptian-primary', this.getPrimaryColor());
    document.documentElement.style.setProperty('--egyptian-accent', this.getAccentColor());
    document.documentElement.style.setProperty('--egyptian-glow', this.getEgyptianGlowColor());
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

/**
 * Dark theme strategy with muted Egyptian golden accents
 */
export class DarkThemeStrategy implements ThemeStrategy {
  readonly name = 'dark';
  readonly displayName = 'Dark Theme';

  getPrimaryColor(): string {
    return '#3B82F6'; // Brighter blue for dark mode
  }

  getAccentColor(): string {
    return '#FCD34D'; // Muted gold for dark backgrounds
  }

  getBackgroundColor(): string {
    return 'var(--vscode-editor-background, #1f2937)';
  }

  getSurfaceColor(): string {
    return 'var(--vscode-widget-background, #374151)';
  }

  getTextColor(): string {
    return 'var(--vscode-editor-foreground, #f9fafb)';
  }

  getEgyptianAccentColor(): string {
    return '#FBBF24'; // Warmer gold for dark mode
  }

  getEgyptianGlowColor(): string {
    return 'rgba(251, 191, 36, 0.25)'; // Subtle golden glow for dark mode
  }

  apply(): void {
    document.documentElement.style.setProperty('--egyptian-primary', this.getPrimaryColor());
    document.documentElement.style.setProperty('--egyptian-accent', this.getAccentColor());
    document.documentElement.style.setProperty('--egyptian-glow', this.getEgyptianGlowColor());
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

/**
 * High contrast theme strategy with bold Egyptian elements
 */
export class HighContrastThemeStrategy implements ThemeStrategy {
  readonly name = 'high-contrast';
  readonly displayName = 'High Contrast Theme';

  getPrimaryColor(): string {
    return '#0000FF'; // Pure blue for maximum contrast
  }

  getAccentColor(): string {
    return '#FFFF00'; // Pure yellow for high contrast
  }

  getBackgroundColor(): string {
    return 'var(--vscode-editor-background, #000000)';
  }

  getSurfaceColor(): string {
    return 'var(--vscode-widget-background, #000000)';
  }

  getTextColor(): string {
    return 'var(--vscode-editor-foreground, #ffffff)';
  }

  getEgyptianAccentColor(): string {
    return '#FFFF00'; // Maximum contrast yellow
  }

  getEgyptianGlowColor(): string {
    return 'rgba(255, 255, 0, 0.5)'; // Strong glow for accessibility
  }

  apply(): void {
    document.documentElement.style.setProperty('--egyptian-primary', this.getPrimaryColor());
    document.documentElement.style.setProperty('--egyptian-accent', this.getAccentColor());
    document.documentElement.style.setProperty('--egyptian-glow', this.getEgyptianGlowColor());
    document.documentElement.setAttribute('data-theme', 'high-contrast');
  }
}

/**
 * VS Code theme types that we can detect
 */
export type VSCodeThemeKind = 'light' | 'dark' | 'high-contrast';

/**
 * EgyptianThemeService - Signal-based reactive theme management
 * 
 * Implements Strategy pattern for theme adaptation with <200ms response time
 * Uses Angular signals for optimal performance and automatic change detection
 */
@Injectable({
  providedIn: 'root'
})
export class EgyptianThemeService {
  private readonly strategies = new Map<string, ThemeStrategy>([
    ['light', new LightThemeStrategy()],
    ['dark', new DarkThemeStrategy()],
    ['high-contrast', new HighContrastThemeStrategy()]
  ]);

  // Reactive theme state using Angular signals
  private readonly _currentTheme = signal<VSCodeThemeKind>('light');
  private readonly _isInitialized = signal(false);

  // Public readonly signals for component consumption
  readonly currentTheme = this._currentTheme.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();

  // Computed values for component binding
  readonly currentStrategy = computed(() => {
    const theme = this._currentTheme();
    return this.strategies.get(theme) || this.strategies.get('light')!;
  });

  readonly themeColors = computed(() => {
    const strategy = this.currentStrategy();
    return {
      primary: strategy.getPrimaryColor(),
      accent: strategy.getAccentColor(),
      background: strategy.getBackgroundColor(),
      surface: strategy.getSurfaceColor(),
      text: strategy.getTextColor(),
      egyptianAccent: strategy.getEgyptianAccentColor(),
      egyptianGlow: strategy.getEgyptianGlowColor()
    };
  });

  // Effect to apply theme changes automatically
  private readonly themeEffect = effect(() => {
    if (this._isInitialized()) {
      const startTime = performance.now();
      const strategy = this.currentStrategy();
      strategy.apply();
      const endTime = performance.now();
      
      // Performance monitoring - ensure <200ms requirement
      const duration = endTime - startTime;
      if (duration > 200) {
        console.warn(`EgyptianThemeService: Theme switching took ${duration.toFixed(2)}ms (>200ms target)`);
      }
    }
  });

  constructor() {
    this.initializeThemeDetection();
  }

  /**
   * Initialize VS Code theme detection and set up theme change listeners
   */
  private async initializeThemeDetection(): Promise<void> {
    try {
      // Detect initial VS Code theme from CSS custom properties
      const initialTheme = this.detectVSCodeTheme();
      this._currentTheme.set(initialTheme);

      // Set up MutationObserver for theme changes (VS Code updates body classes)
      this.setupThemeChangeListener();

      // Mark as initialized to trigger effect
      this._isInitialized.set(true);

    } catch (error) {
      console.error('EgyptianThemeService: Failed to initialize theme detection', error);
      // Fallback to light theme
      this._currentTheme.set('light');
      this._isInitialized.set(true);
    }
  }

  /**
   * Detect current VS Code theme from CSS variables and DOM attributes
   */
  private detectVSCodeTheme(): VSCodeThemeKind {
    // Check VS Code theme kind from CSS variables
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--vscode-editor-background')
      .trim();

    // Check for high contrast mode indicators
    if (document.body.classList.contains('vscode-high-contrast') ||
        document.body.classList.contains('hc-black') ||
        document.body.classList.contains('hc-light')) {
      return 'high-contrast';
    }

    // Parse background color to determine light/dark
    if (bgColor) {
      const brightness = this.calculateBrightness(bgColor);
      return brightness > 128 ? 'light' : 'dark';
    }

    // Fallback: check body class for theme indicators
    if (document.body.classList.contains('vscode-dark')) {
      return 'dark';
    }

    return 'light'; // Default fallback
  }

  /**
   * Calculate brightness of a color (0-255 scale)
   */
  private calculateBrightness(color: string): number {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000;
    }

    // Handle RGB colors
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      return (r * 299 + g * 587 + b * 114) / 1000;
    }

    // Default to light theme assumption
    return 200;
  }

  /**
   * Set up mutation observer to detect VS Code theme changes
   */
  private setupThemeChangeListener(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
           (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
          const newTheme = this.detectVSCodeTheme();
          if (newTheme !== this._currentTheme()) {
            this._currentTheme.set(newTheme);
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  /**
   * Manually set theme (for testing or explicit theme selection)
   */
  setTheme(theme: VSCodeThemeKind): void {
    if (this.strategies.has(theme)) {
      this._currentTheme.set(theme);
    } else {
      console.warn(`EgyptianThemeService: Unknown theme '${theme}', falling back to light`);
      this._currentTheme.set('light');
    }
  }

  /**
   * Get all available theme strategies
   */
  getAvailableThemes(): ThemeStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    return this._currentTheme() === 'dark';
  }

  /**
   * Check if current theme is high contrast
   */
  isHighContrastTheme(): boolean {
    return this._currentTheme() === 'high-contrast';
  }

  /**
   * Get theme-appropriate Egyptian icon color
   */
  getEgyptianIconColor(): string {
    return this.currentStrategy().getEgyptianAccentColor();
  }
}