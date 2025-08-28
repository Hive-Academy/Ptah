import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-egyptian-button',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <button
      [class]="buttonClasses"
      [disabled]="disabled"
      [type]="type"
      [matTooltip]="tooltip"
      [matTooltipPosition]="tooltipPosition"
      [matTooltipClass]="tooltipClass"
      (click)="handleClick()"
      [attr.aria-label]="ariaLabel"
      [style.backgroundColor]="'var(--vscode-button-background)'"
      [style.color]="'var(--vscode-button-foreground)'"
      [style.borderColor]="'var(--vscode-button-border, transparent)'"
      [style.fontFamily]="'var(--vscode-font-family)'"
      [style.fontSize]="'var(--vscode-font-size)'">
      @if (iconData) {
        <lucide-angular [img]="iconData" [class]="iconOnly ? 'w-4 h-4' : 'w-4 h-4 mr-2'"></lucide-angular>
      }
      @if (!iconOnly) {
        <ng-content></ng-content>
      }
      @if (loading) {
        <div class="animate-spin ml-2 inline-block">⏳</div>
      }
      
      <!-- Egyptian golden accent for active state -->
      @if (active) {
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-gold-400 rounded-full opacity-80"></div>
      }
    </button>
  `,
})
export class EgyptianButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon?: string;  // Deprecated - use iconData
  @Input() iconData?: LucideIconData;  // New Lucide icon support
  @Input() iconOnly: boolean = false;  // Icon-only button mode
  @Input() active: boolean = false;  // Active state support
  @Input() variant: 'primary' | 'secondary' | 'tertiary' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() ariaLabel?: string;
  @Input() tooltip: string = '';  // Tooltip text
  @Input() tooltipPosition: 'above' | 'below' | 'left' | 'right' = 'above';
  @Input() tooltipClass: string = 'bg-hieroglyph-800 text-papyrus-50 text-xs px-3 py-1 rounded-md shadow-papyrus border border-gold-400/20';  // Egyptian-themed Tailwind tooltip
  @Output() clicked = new EventEmitter<void>();

  get buttonClasses(): string {
    const baseClasses = [
      // Base layout and positioning
      'relative inline-flex items-center justify-center',
      
      // Border and shape
      'border rounded-sm',
      
      // Transitions and cursor
      'transition-all duration-150 ease-in-out cursor-pointer',
      
      // Focus management
      'outline-none focus:outline-none',
      
      // Egyptian golden focus ring
      'focus:ring-2 focus:ring-gold-400 focus:ring-opacity-30 focus:ring-offset-1'
    ];

    // Size variants
    switch (this.size) {
      case 'sm':
        baseClasses.push('px-3 py-1 text-sm');
        break;
      case 'md':
        baseClasses.push('px-4 py-2 text-base');
        break;
      case 'lg':
        baseClasses.push('px-6 py-3 text-lg');
        break;
    }

    // Hover states - using CSS custom properties with Tailwind
    if (!this.disabled) {
      baseClasses.push(
        'hover:bg-[var(--vscode-button-hoverBackground)]',
        'hover:text-[var(--vscode-button-hoverForeground)]'
      );
    }

    // Disabled states
    if (this.disabled) {
      baseClasses.push('opacity-50 cursor-not-allowed');
    }

    // Active state
    if (this.active) {
      baseClasses.push('bg-[var(--vscode-button-hoverBackground)]');
    }

    // Secondary variant using CSS custom properties
    if (this.variant === 'secondary') {
      baseClasses.push(
        'bg-[var(--vscode-button-secondaryBackground)]',
        'text-[var(--vscode-button-secondaryForeground)]'
      );
      
      if (!this.disabled) {
        baseClasses.push('hover:bg-[var(--vscode-button-secondaryHoverBackground)]');
      }
    }

    return baseClasses.join(' ');
  }

  handleClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
