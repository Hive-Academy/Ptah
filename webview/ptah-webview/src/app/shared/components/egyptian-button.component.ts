import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-egyptian-button',
  standalone: true,
  template: `
    <button
      [class]="'pharaoh-button ' + additionalClasses"
      [disabled]="disabled"
      [type]="type"
      (click)="handleClick()"
      [attr.aria-label]="ariaLabel">
      @if (icon) {
        <i [class]="'icon-' + icon" class="mr-2"></i>
      }
      <ng-content></ng-content>
      @if (loading) {
        <i class="animate-spin ml-2">⏳</i>
      }
    </button>
  `,
  styles: [`
    .pharaoh-button {
      @apply bg-gradient-to-r from-gold-500 to-gold-600
             text-white font-semibold
             px-6 py-3 rounded-egyptian
             shadow-md hover:shadow-lg
             transform hover:scale-105
             transition-all duration-200
             focus:ring-2 focus:ring-gold-400 focus:ring-opacity-50
             disabled:opacity-50 disabled:cursor-not-allowed
             disabled:transform-none;
    }

    .pharaoh-button.secondary {
      @apply bg-gradient-to-r from-lapis-500 to-lapis-600
             hover:from-lapis-600 hover:to-lapis-700;
    }

    .pharaoh-button.tertiary {
      @apply bg-transparent border-2 border-gold-500 text-gold-500
             hover:bg-gold-500 hover:text-white;
    }
  `]
})
export class EgyptianButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon?: string;
  @Input() variant: 'primary' | 'secondary' | 'tertiary' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() ariaLabel?: string;
  @Output() clicked = new EventEmitter<void>();

  get additionalClasses(): string {
    const classes = [];

    if (this.variant !== 'primary') {
      classes.push(this.variant);
    }

    switch (this.size) {
      case 'sm':
        classes.push('px-3 py-1 text-sm');
        break;
      case 'lg':
        classes.push('px-8 py-4 text-lg');
        break;
    }

    return classes.join(' ');
  }

  handleClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
