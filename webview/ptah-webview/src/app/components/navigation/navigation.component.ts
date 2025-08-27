import { Component, Output, EventEmitter, Input } from '@angular/core';

export interface NavigationItem {
  id: 'chat' | 'command-builder' | 'analytics';
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  template: `
    <header class="app-header bg-gradient-to-r from-gold-500 to-gold-600 text-white p-4">
      <div class="flex items-center justify-between">
        <!-- Brand Section -->
        <div class="flex items-center">
          <span class="text-2xl mr-3 animate-glow">𓂀</span>
          <div>
            <h1 class="text-xl font-bold">{{ title }}</h1>
            @if (subtitle) {
              <p class="text-sm text-gold-100 opacity-90">{{ subtitle }}</p>
            }
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="flex space-x-2" role="tablist">
          @for (item of navigationItems; track item.id) {
            <button
              [id]="'nav-' + item.id"
              [class]="getTabClasses(item.id)"
              [attr.aria-selected]="currentView === item.id"
              [attr.aria-controls]="'panel-' + item.id"
              [disabled]="disabled"
              role="tab"
              (click)="onViewChange(item.id)">
              @if (item.icon) {
                <i [class]="'icon-' + item.icon + ' mr-2'"></i>
              }
              {{ item.label }}
            </button>
          }
        </nav>

        <!-- Action Buttons -->
        @if (showActions) {
          <div class="flex items-center space-x-2">
            <ng-content select="[slot=actions]"></ng-content>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      @apply flex-shrink-0 shadow-lg;
    }

    .nav-tab {
      @apply px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
             focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50;
    }

    .nav-tab.active {
      @apply bg-white text-gold-600 shadow-md;
    }

    .nav-tab.inactive {
      @apply text-white hover:bg-gold-700 hover:bg-opacity-50;
    }

    .nav-tab:disabled {
      @apply opacity-50 cursor-not-allowed;
    }

    @keyframes glow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .animate-glow {
      animation: glow 3s ease-in-out infinite;
    }

    /* VS Code theme adaptations */
    :host-context(.vscode-dark) .app-header {
      @apply from-gold-600 to-gold-700;
    }

    :host-context(.vscode-light) .app-header {
      @apply from-gold-400 to-gold-500;
    }

    :host-context(.vscode-high-contrast) .app-header {
      @apply bg-black border-b-2 border-white;
    }
  `]
})
export class NavigationComponent {
  @Input() title: string = 'Ptah - Claude Code Assistant';
  @Input() subtitle?: string;
  @Input() currentView: 'chat' | 'command-builder' | 'analytics' = 'command-builder';
  @Input() disabled: boolean = false;
  @Input() showActions: boolean = false;

  @Output() viewChanged = new EventEmitter<'chat' | 'command-builder' | 'analytics'>();

  readonly navigationItems: NavigationItem[] = [
    { id: 'chat', label: 'Chat', icon: 'message-circle' },
    { id: 'command-builder', label: 'Commands', icon: 'terminal' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart' }
  ];

  onViewChange(viewId: 'chat' | 'command-builder' | 'analytics'): void {
    if (!this.disabled && viewId !== this.currentView) {
      this.viewChanged.emit(viewId);
    }
  }

  getTabClasses(viewId: string): string {
    const baseClasses = 'nav-tab';
    const activeClass = this.currentView === viewId ? 'active' : 'inactive';
    return `${baseClasses} ${activeClass}`;
  }
}
