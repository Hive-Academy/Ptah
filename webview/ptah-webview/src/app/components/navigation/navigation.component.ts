import { Component, Output, EventEmitter, Input, signal, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EgyptianThemeService } from '../../core/services/egyptian-theme.service';

export interface NavigationItem {
  id: 'chat' | 'command-builder' | 'analytics' | 'context-tree';
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <mat-toolbar class="app-navigation-toolbar">
      <!-- Brand Section with subtle Egyptian accent -->
      <div class="nav-brand">
        <!-- Small, tasteful hieroglyph accent -->
        <mat-icon class="brand-icon" [attr.aria-hidden]="true">psychology</mat-icon>
        <div class="brand-text">
          <h1 class="brand-title">{{ title }}</h1>
          @if (subtitle) {
            <p class="brand-subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>

      <span class="spacer"></span>

      <!-- Clean Navigation Tabs -->
      <nav class="nav-tabs" role="tablist">
        @for (item of navigationItems; track item.id) {
          <button
            mat-button
            [id]="'nav-' + item.id"
            [class]="getTabClasses(item.id)"
            [attr.aria-selected]="currentView === item.id"
            [attr.aria-controls]="'panel-' + item.id"
            [disabled]="disabled || navigatingToView() === item.id"
            [matTooltip]="item.label"
            role="tab"
            (click)="onViewChange(item.id)">
            @if (navigatingToView() === item.id) {
              <mat-spinner diameter="16" class="nav-loading-spinner"></mat-spinner>
            } @else if (item.icon) {
              <mat-icon>{{ getIconName(item.icon) }}</mat-icon>
            }
            <span class="nav-label">{{ item.label }}</span>
          </button>
        }
      </nav>

      <!-- Action Buttons -->
      @if (showActions) {
        <span class="spacer"></span>
        <div class="nav-actions">
          <ng-content select="[slot=actions]"></ng-content>
        </div>
      }
    </mat-toolbar>
  `,
  styles: [`
    .app-navigation-toolbar {
      background: var(--vscode-titleBar-activeBackground, #f8f9fa);
      color: var(--vscode-titleBar-activeForeground, #374151);
      border-bottom: 1px solid var(--vscode-panel-border, #e5e7eb);
      padding: 0 16px;
      min-height: 56px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      color: var(--egyptian-accent, #f59e0b);
      opacity: 0.8;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.2;
      margin: 0;
      color: var(--vscode-titleBar-activeForeground, #374151);
    }

    .brand-subtitle {
      font-size: 12px;
      line-height: 1.2;
      margin: 0;
      opacity: 0.7;
      color: var(--vscode-descriptionForeground, #6b7280);
    }

    .spacer {
      flex: 1;
    }

    .nav-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-tab {
      min-width: 44px;
      height: 36px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      text-transform: none;
      transition: all 200ms ease;
    }

    .nav-tab .mat-button-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .nav-label {
      white-space: nowrap;
    }

    .nav-tab.active {
      background: var(--vscode-button-background, #0066cc);
      color: var(--vscode-button-foreground, #ffffff);
    }

    .nav-tab.active .brand-icon {
      color: currentColor;
    }

    .nav-tab.inactive {
      background: transparent;
      color: var(--vscode-titleBar-activeForeground, #374151);
    }

    .nav-tab.inactive:hover {
      background: var(--vscode-button-hoverBackground, rgba(0, 102, 204, 0.1));
    }

    .nav-tab.inactive:hover .mat-icon {
      color: var(--egyptian-accent, #f59e0b);
    }

    .nav-tab:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-loading-spinner {
      width: 16px !important;
      height: 16px !important;
    }

    .nav-loading-spinner ::ng-deep circle {
      stroke: currentColor;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* VS Code theme adaptations */
    :host-context(.vscode-dark) .app-navigation-toolbar {
      background: var(--vscode-titleBar-activeBackground, #2d3748);
      color: var(--vscode-titleBar-activeForeground, #e2e8f0);
      border-bottom-color: var(--vscode-panel-border, #4a5568);
    }

    :host-context(.vscode-dark) .brand-title {
      color: var(--vscode-titleBar-activeForeground, #e2e8f0);
    }

    :host-context(.vscode-dark) .nav-tab.active {
      background: var(--vscode-button-background, #0066cc);
      color: var(--vscode-button-foreground, #ffffff);
    }

    :host-context(.vscode-dark) .nav-tab.inactive {
      color: var(--vscode-titleBar-activeForeground, #e2e8f0);
    }

    :host-context(.vscode-high-contrast) .app-navigation-toolbar {
      background: var(--vscode-titleBar-activeBackground, #000000);
      color: var(--vscode-titleBar-activeForeground, #ffffff);
      border-bottom: 2px solid var(--vscode-contrastBorder, #ffffff);
    }

    :host-context(.vscode-high-contrast) .nav-tab.active {
      background: var(--vscode-button-background, #0000ff);
      color: var(--vscode-button-foreground, #ffffff);
      border: 1px solid var(--vscode-contrastBorder, #ffffff);
    }

    /* Responsive design for sidebar widths */
    @container (max-width: 400px) {
      .nav-label {
        display: none;
      }

      .brand-subtitle {
        display: none;
      }
    }
  `]
})
export class NavigationComponent {
  private themeService = inject(EgyptianThemeService);

  @Input() title: string = 'Ptah';
  @Input() subtitle?: string = 'Claude Code Editor';
  @Input() currentView: 'chat' | 'command-builder' | 'analytics' | 'context-tree' = 'command-builder';
  @Input() disabled: boolean = false;
  @Input() showActions: boolean = false;

  @Output() viewChanged = new EventEmitter<'chat' | 'command-builder' | 'analytics' | 'context-tree'>();

  // Loading state for navigation buttons
  protected navigatingToView = signal<string | null>(null);

  readonly navigationItems: NavigationItem[] = [
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'command-builder', label: 'Commands', icon: 'build' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    { id: 'context-tree', label: 'Context', icon: 'account_tree' }
  ];

  onViewChange(viewId: 'chat' | 'command-builder' | 'analytics' | 'context-tree'): void {
    if (!this.disabled && viewId !== this.currentView && this.navigatingToView() !== viewId) {
      this.navigatingToView.set(viewId);
      this.viewChanged.emit(viewId);

      // Clear navigation loading state after delay (navigation should complete quickly)
      setTimeout(() => {
        this.navigatingToView.set(null);
      }, 1000);
    }
  }

  getTabClasses(viewId: string): string {
    const baseClasses = 'nav-tab';
    const activeClass = this.currentView === viewId ? 'active' : 'inactive';
    return `${baseClasses} ${activeClass}`;
  }

  /**
   * Map custom icon names to Material Design icons
   */
  getIconName(icon: string): string {
    const iconMap: Record<string, string> = {
      'message-circle': 'chat',
      'terminal': 'terminal',
      'bar-chart': 'analytics',
      'folder-tree': 'account_tree',
      'chat': 'chat',
      'build': 'build',
      'analytics': 'analytics',
      'account_tree': 'account_tree'
    };
    return iconMap[icon] || icon;
  }
}
