import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-egyptian-card',
  standalone: true,
  template: `
    <div [class]="'egyptian-card ' + additionalClasses">
      @if (title) {
        <div class="card-header border-b border-papyrus-300 pb-4 mb-4">
          <h3 class="gold-shimmer text-lg font-semibold">{{ title }}</h3>
          @if (subtitle) {
            <p class="text-hieroglyph-600 text-sm mt-1">{{ subtitle }}</p>
          }
        </div>
      }

      <div class="card-content">
        <ng-content></ng-content>
      </div>

      @if (hasActions) {
        <div class="card-actions border-t border-papyrus-300 pt-4 mt-4">
          <ng-content select="[slot=actions]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .egyptian-card {
        @apply bg-gradient-to-br from-papyrus-100 to-sand-50
             border border-papyrus-300
             rounded-egyptian
             shadow-papyrus
             transition-all duration-300
             hover:shadow-hieroglyph
             hover:border-papyrus-400
             p-6;
      }

      .egyptian-card.elevated {
        @apply shadow-lg hover:shadow-xl;
      }

      .egyptian-card.compact {
        @apply p-4;
      }

      .egyptian-card.accent {
        @apply border-l-4 border-ankh-500
             bg-gradient-to-r from-ankh-50 to-transparent;
      }

      /* VS Code theme adaptations */
      :host-context(.vscode-dark) .egyptian-card {
        @apply bg-gradient-to-br from-hieroglyph-800 to-hieroglyph-900
             border-hieroglyph-600
             text-papyrus-100;
      }

      :host-context(.vscode-light) .egyptian-card {
        @apply bg-gradient-to-br from-papyrus-50 to-sand-25
             border-papyrus-200
             text-hieroglyph-800;
      }

      :host-context(.vscode-high-contrast) .egyptian-card {
        @apply bg-black border-white text-white;
      }
    `,
  ],
})
export class EgyptianCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() variant: 'default' | 'elevated' | 'compact' | 'accent' = 'default';
  @Input() hasActions: boolean = false;

  get additionalClasses(): string {
    const classes = [];

    if (this.variant !== 'default') {
      classes.push(this.variant);
    }

    return classes.join(' ');
  }
}
