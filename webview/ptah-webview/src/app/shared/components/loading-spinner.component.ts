import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div [class]="'flex items-center justify-center ' + containerClasses">
      <div [class]="'ankh-spinner ' + spinnerClasses">
        <div class="spinner-ankh">☥</div>
      </div>
      @if (message) {
        <span class="ml-3 text-hieroglyph-600">{{ message }}</span>
      }
    </div>
  `,
  styles: [
    `
      .ankh-spinner {
        @apply relative;
      }

      .spinner-ankh {
        @apply text-gold-500 animate-spin;
        animation-duration: 2s;
        transform-origin: center;
      }

      .ankh-spinner.sm .spinner-ankh {
        @apply text-lg;
      }

      .ankh-spinner.md .spinner-ankh {
        @apply text-2xl;
      }

      .ankh-spinner.lg .spinner-ankh {
        @apply text-4xl;
      }

      .ankh-spinner.overlay {
        @apply absolute inset-0 bg-black bg-opacity-20 z-50;
      }

      /* Custom spinning animation for the ankh symbol */
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .animate-spin {
        animation: spin 2s linear infinite;
      }

      /* VS Code theme adaptations */
      :host-context(.vscode-dark) .spinner-ankh {
        @apply text-gold-400;
      }

      :host-context(.vscode-light) .spinner-ankh {
        @apply text-gold-600;
      }

      :host-context(.vscode-high-contrast) .spinner-ankh {
        @apply text-white;
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message?: string;
  @Input() overlay: boolean = false;
  @Input() center: boolean = true;

  get containerClasses(): string {
    const classes = [];

    if (this.center) {
      classes.push('justify-center');
    }

    if (this.overlay) {
      classes.push('fixed inset-0 bg-black bg-opacity-50 z-50');
    }

    return classes.join(' ');
  }

  get spinnerClasses(): string {
    const classes = [this.size];

    return classes.join(' ');
  }
}
