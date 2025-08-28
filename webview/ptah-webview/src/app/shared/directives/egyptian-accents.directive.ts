import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  inject,
  computed,
  effect,
  Renderer2,
} from '@angular/core';
import { EgyptianThemeService } from '../../core/services/egyptian-theme.service';

/**
 *
 * Usage: <button mat-raised-button egyptianButton="primary">Send</button>
 */
@Directive({
  selector: '[egyptianButton]',
  standalone: true,
})
export class EgyptianButtonDirective implements OnInit, OnDestroy {
  @Input() egyptianButton = 'default';
  @Input() egyptianSize: 'sm' | 'md' | 'lg' = 'md';

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly themeService = inject(EgyptianThemeService);

  // Computed classes based on theme and variant
  private readonly cssClasses = computed(() => {
    const theme = this.themeService.currentTheme();
    const baseClasses = [
      'egyptian-btn',
      `egyptian-btn-${this.egyptianButton}`,
      `egyptian-btn-${this.egyptianSize}`,
      `egyptian-btn-theme-${theme}`,
    ];

    // Add glow effect for accent and sacred variants
    if (this.egyptianButton === 'accent' || this.egyptianButton === 'sacred') {
      baseClasses.push('egyptian-btn-glow');
    }

    return baseClasses;
  });

  // Effect to apply CSS classes when theme or variant changes
  private readonly classEffect = effect(() => {
    const classes = this.cssClasses();

    // Remove old Egyptian classes
    const currentClasses = this.el.nativeElement.className.split(' ');
    currentClasses.forEach((cls: string) => {
      if (cls.startsWith('egyptian-btn')) {
        this.renderer.removeClass(this.el.nativeElement, cls);
      }
    });

    // Add new classes
    classes.forEach((cls) => {
      this.renderer.addClass(this.el.nativeElement, cls);
    });

    // Apply theme-specific custom properties
    const colors = this.themeService.themeColors();
    if (this.egyptianButton === 'accent' || this.egyptianButton === 'sacred') {
      this.renderer.setStyle(this.el.nativeElement, '--egyptian-glow-color', colors.egyptianGlow);
    }
  });

  ngOnInit(): void {
    // Initial setup - classes will be applied via effect
    this.renderer.setAttribute(this.el.nativeElement, 'data-egyptian-button', this.egyptianButton);

    // Ensure accessibility attributes are preserved
    const existingAriaLabel = this.el.nativeElement.getAttribute('aria-label');
    if (!existingAriaLabel) {
      this.renderer.setAttribute(this.el.nativeElement, 'aria-label', 'Egyptian themed button');
    }
  }

  ngOnDestroy(): void {
    // Cleanup is automatic with Angular signals/effects
  }
}

/**
 *
 * Usage: <mat-form-field egyptianInput="accent"><input matInput></mat-form-field>
 */
@Directive({
  selector: '[egyptianInput]',
  standalone: true,
})
export class EgyptianInputDirective implements OnInit, OnDestroy {
  @Input() egyptianInput = 'default';
  @Input() egyptianGlow = false;

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly themeService = inject(EgyptianThemeService);

  // Computed classes for form field theming
  private readonly cssClasses = computed(() => {
    const theme = this.themeService.currentTheme();
    const baseClasses = [
      'egyptian-input',
      `egyptian-input-${this.egyptianInput}`,
      `egyptian-input-theme-${theme}`,
    ];

    // Add glow effect when enabled or for certain variants
    if (this.egyptianGlow || this.egyptianInput === 'accent' || this.egyptianInput === 'sacred') {
      baseClasses.push('egyptian-input-glow');
    }

    return baseClasses;
  });

  // Effect to apply CSS classes and focus glow
  private readonly classEffect = effect(() => {
    const classes = this.cssClasses();

    // Remove old Egyptian classes
    const currentClasses = this.el.nativeElement.className.split(' ');
    currentClasses.forEach((cls: string) => {
      if (cls.startsWith('egyptian-input')) {
        this.renderer.removeClass(this.el.nativeElement, cls);
      }
    });

    // Add new classes
    classes.forEach((cls) => {
      this.renderer.addClass(this.el.nativeElement, cls);
    });

    // Apply theme-specific glow color
    const colors = this.themeService.themeColors();
    this.renderer.setStyle(this.el.nativeElement, '--egyptian-glow-color', colors.egyptianGlow);
    this.renderer.setStyle(this.el.nativeElement, '--egyptian-accent-color', colors.egyptianAccent);
  });

  ngOnInit(): void {
    // Add focus event listeners for glow effect
    this.setupFocusGlow();
    this.renderer.setAttribute(this.el.nativeElement, 'data-egyptian-input', this.egyptianInput);
  }

  ngOnDestroy(): void {
    // Cleanup is automatic with Angular signals/effects
  }

  private setupFocusGlow(): void {
    const inputElement =
      this.el.nativeElement.querySelector('input') ||
      this.el.nativeElement.querySelector('textarea');

    if (inputElement) {
      this.renderer.listen(inputElement, 'focus', () => {
        this.renderer.addClass(this.el.nativeElement, 'egyptian-input-focused');
      });

      this.renderer.listen(inputElement, 'blur', () => {
        this.renderer.removeClass(this.el.nativeElement, 'egyptian-input-focused');
      });
    }
  }
}

/**
 *
 * Usage: <mat-card egyptianCard="papyrus">Content</mat-card>
 */
@Directive({
  selector: '[egyptianCard]',
  standalone: true,
})
export class EgyptianCardDirective implements OnInit, OnDestroy {
  @Input() egyptianCard = 'default';
  @Input() egyptianElevation = true;

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly themeService = inject(EgyptianThemeService);

  // Computed classes for card theming
  private readonly cssClasses = computed(() => {
    const theme = this.themeService.currentTheme();
    const baseClasses = [
      'egyptian-card',
      `egyptian-card-${this.egyptianCard}`,
      `egyptian-card-theme-${theme}`,
    ];

    // Add elevation classes
    if (this.egyptianElevation) {
      baseClasses.push('egyptian-card-elevated');
    }

    // Add special effects for certain variants
    if (this.egyptianCard === 'papyrus') {
      baseClasses.push('egyptian-card-textured');
    }

    if (this.egyptianCard === 'sacred') {
      baseClasses.push('egyptian-card-sacred-glow');
    }

    return baseClasses;
  });

  // Effect to apply card styling
  private readonly classEffect = effect(() => {
    const classes = this.cssClasses();

    // Remove old Egyptian classes
    const currentClasses = this.el.nativeElement.className.split(' ');
    currentClasses.forEach((cls: string) => {
      if (cls.startsWith('egyptian-card')) {
        this.renderer.removeClass(this.el.nativeElement, cls);
      }
    });

    // Add new classes
    classes.forEach((cls) => {
      this.renderer.addClass(this.el.nativeElement, cls);
    });

    // Apply theme colors
    const colors = this.themeService.themeColors();
    this.renderer.setStyle(this.el.nativeElement, '--egyptian-accent-color', colors.egyptianAccent);
  });

  ngOnInit(): void {
    this.renderer.setAttribute(this.el.nativeElement, 'data-egyptian-card', this.egyptianCard);

    // Ensure proper accessibility
    const existingRole = this.el.nativeElement.getAttribute('role');
    if (!existingRole) {
      this.renderer.setAttribute(this.el.nativeElement, 'role', 'region');
    }
  }

  ngOnDestroy(): void {
    // Cleanup is automatic with Angular signals/effects
  }
}

/**
 *
 * Usage: <mat-icon egyptianIcon="hieroglyph">send</mat-icon>
 */
@Directive({
  selector: '[egyptianIcon]',
  standalone: true,
})
export class EgyptianIconDirective implements OnInit, OnDestroy {
  @Input() egyptianIcon = 'default';
  @Input() egyptianGlow = false;

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly themeService = inject(EgyptianThemeService);

  // Computed classes for icon theming
  private readonly cssClasses = computed(() => {
    const theme = this.themeService.currentTheme();
    const baseClasses = [
      'egyptian-icon',
      `egyptian-icon-${this.egyptianIcon}`,
      `egyptian-icon-theme-${theme}`,
    ];

    // Add glow for accent icons
    if (this.egyptianGlow || this.egyptianIcon === 'accent') {
      baseClasses.push('egyptian-icon-glow');
    }

    return baseClasses;
  });

  // Effect to apply icon styling
  private readonly classEffect = effect(() => {
    const classes = this.cssClasses();

    // Remove old Egyptian classes
    const currentClasses = this.el.nativeElement.className.split(' ');
    currentClasses.forEach((cls: string) => {
      if (cls.startsWith('egyptian-icon')) {
        this.renderer.removeClass(this.el.nativeElement, cls);
      }
    });

    // Add new classes
    classes.forEach((cls) => {
      this.renderer.addClass(this.el.nativeElement, cls);
    });

    // Apply theme colors
    const colors = this.themeService.themeColors();
    this.renderer.setStyle(this.el.nativeElement, '--egyptian-icon-color', colors.egyptianAccent);
  });

  ngOnInit(): void {
    this.renderer.setAttribute(this.el.nativeElement, 'data-egyptian-icon', this.egyptianIcon);
  }

  ngOnDestroy(): void {
    // Cleanup is automatic with Angular signals/effects
  }
}

/**
 *
 * Usage: <mat-progress-spinner egyptianSpinner="accent"></mat-progress-spinner>
 */
@Directive({
  selector: '[egyptianSpinner]',
  standalone: true,
})
export class EgyptianSpinnerDirective implements OnInit, OnDestroy {
  @Input() egyptianSpinner = 'default';

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly themeService = inject(EgyptianThemeService);

  // Computed classes for spinner theming
  private readonly cssClasses = computed(() => {
    const theme = this.themeService.currentTheme();
    const baseClasses = [
      'egyptian-spinner',
      `egyptian-spinner-${this.egyptianSpinner}`,
      `egyptian-spinner-theme-${theme}`,
    ];

    // Add golden glow for accent spinners
    if (this.egyptianSpinner === 'accent' || this.egyptianSpinner === 'sacred') {
      baseClasses.push('egyptian-spinner-glow');
    }

    return baseClasses;
  });

  // Effect to apply spinner styling
  private readonly classEffect = effect(() => {
    const classes = this.cssClasses();

    // Remove old Egyptian classes
    const currentClasses = this.el.nativeElement.className.split(' ');
    currentClasses.forEach((cls: string) => {
      if (cls.startsWith('egyptian-spinner')) {
        this.renderer.removeClass(this.el.nativeElement, cls);
      }
    });

    // Add new classes
    classes.forEach((cls) => {
      this.renderer.addClass(this.el.nativeElement, cls);
    });

    // Apply theme colors
    const colors = this.themeService.themeColors();
    this.renderer.setStyle(
      this.el.nativeElement,
      '--egyptian-spinner-color',
      colors.egyptianAccent,
    );
  });

  ngOnInit(): void {
    this.renderer.setAttribute(
      this.el.nativeElement,
      'data-egyptian-spinner',
      this.egyptianSpinner,
    );

    // Ensure accessibility for screen readers
    const existingAriaLabel = this.el.nativeElement.getAttribute('aria-label');
    if (!existingAriaLabel) {
      this.renderer.setAttribute(this.el.nativeElement, 'aria-label', 'Loading');
    }
    this.renderer.setAttribute(this.el.nativeElement, 'role', 'progressbar');
  }

  ngOnDestroy(): void {
    // Cleanup is automatic with Angular signals/effects
  }
}

/**
 * Export all Egyptian accent directives for easy imports
 */
export const EGYPTIAN_DIRECTIVES = [
  EgyptianButtonDirective,
  EgyptianInputDirective,
  EgyptianCardDirective,
  EgyptianIconDirective,
  EgyptianSpinnerDirective,
] as const;
