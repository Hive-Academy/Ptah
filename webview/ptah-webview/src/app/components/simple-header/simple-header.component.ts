import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, PlusIcon, BarChart3Icon } from 'lucide-angular';
import { EgyptianButtonComponent } from '../../shared/components/egyptian-button.component';
import { AppStateManager, ViewType } from '../../core/services/app-state.service';

@Component({
  selector: 'app-simple-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, EgyptianButtonComponent],
  template: `
    <header
      class="flex items-center justify-between px-4 py-3 vscode-bg vscode-border border-b border-solid"
    >
      <!-- Left Side: Ptah Icon as Home Button -->
      <div class="flex items-center">
        <button
          class="w-14 h-14 rounded-lg hover:bg-gold-500/10 flex items-center justify-center transition-colors duration-200"
          (click)="onHome()"
          [title]="'Back to Chat'"
        >
          <img
            src="/images/ptah-icon.png"
            alt="Ptah"
            class="w-12 h-12 rounded-lg"
            [style.filter]="'sepia(100%) hue-rotate(45deg) saturate(2) brightness(1.2)'"
          />
        </button>
      </div>

      <!-- Right Side: Actions -->
      <div class="flex items-center gap-2">
        <app-egyptian-button
          [iconData]="PlusIcon"
          [iconOnly]="true"
          tooltip="New Session"
          size="sm"
          variant="secondary"
          (clicked)="onNewSession()"
        >
        </app-egyptian-button>

        <app-egyptian-button
          [iconData]="BarChart3Icon"
          [iconOnly]="true"
          tooltip="Analytics"
          size="sm"
          variant="secondary"
          [active]="appState.currentView() === 'analytics'"
          (clicked)="onAnalytics()"
        >
        </app-egyptian-button>
      </div>
    </header>
  `,
})
export class SimpleHeaderComponent {
  // Lucide Icons
  readonly PlusIcon = PlusIcon;
  readonly BarChart3Icon = BarChart3Icon;

  // Services
  readonly appState = inject(AppStateManager);

  @Output() newSession = new EventEmitter<void>();
  @Output() analytics = new EventEmitter<void>();

  onHome(): void {
    // Always navigate to chat when Ptah icon is clicked
    this.appState.setCurrentView('chat');
  }

  onNewSession(): void {
    // Navigate to chat and emit new session event
    this.appState.setCurrentView('chat');
    this.newSession.emit();
  }

  onAnalytics(): void {
    // Toggle between analytics and chat views
    if (this.appState.currentView() === 'analytics') {
      this.appState.setCurrentView('chat');
    } else {
      this.appState.setCurrentView('analytics');
    }
    this.analytics.emit();
  }
}
