import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BarChart3Icon, TrendingUpIcon, ActivityIcon } from 'lucide-angular';
import { SimpleHeaderComponent } from '../simple-header/simple-header.component';
import { AppStateManager } from '../../core/services/app-state.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    SimpleHeaderComponent
  ],
  template: `
    <div class="h-full flex flex-col vscode-bg">
      <!-- Header -->
      <app-simple-header 
        (newSession)="onNewSession()"
        (analytics)="onAnalytics()">
      </app-simple-header>

      <!-- Analytics Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <div class="max-w-4xl mx-auto">
          <!-- Title -->
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <lucide-angular [img]="BarChart3Icon" class="w-5 h-5 text-blue-400"></lucide-angular>
            </div>
            <div>
              <h1 class="text-2xl font-bold vscode-fg">Analytics</h1>
              <p class="text-sm vscode-description">Usage statistics and insights</p>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="p-6 rounded-lg vscode-border border bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <div class="flex items-center justify-between mb-4">
                <lucide-angular [img]="ActivityIcon" class="w-6 h-6 text-blue-400"></lucide-angular>
                <span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">Today</span>
              </div>
              <div class="text-2xl font-bold vscode-fg mb-1">12</div>
              <div class="text-sm vscode-description">Chat Sessions</div>
            </div>

            <div class="p-6 rounded-lg vscode-border border bg-gradient-to-br from-green-500/10 to-green-600/5">
              <div class="flex items-center justify-between mb-4">
                <lucide-angular [img]="TrendingUpIcon" class="w-6 h-6 text-green-400"></lucide-angular>
                <span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">This Week</span>
              </div>
              <div class="text-2xl font-bold vscode-fg mb-1">47</div>
              <div class="text-sm vscode-description">Messages Sent</div>
            </div>

            <div class="p-6 rounded-lg vscode-border border bg-gradient-to-br from-purple-500/10 to-purple-600/5">
              <div class="flex items-center justify-between mb-4">
                <lucide-angular [img]="BarChart3Icon" class="w-6 h-6 text-purple-400"></lucide-angular>
                <span class="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">Total</span>
              </div>
              <div class="text-2xl font-bold vscode-fg mb-1">1,234</div>
              <div class="text-sm vscode-description">Tokens Used</div>
            </div>
          </div>

          <!-- Coming Soon -->
          <div class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
              <lucide-angular [img]="BarChart3Icon" class="w-8 h-8 text-gold-400"></lucide-angular>
            </div>
            <h3 class="text-lg font-semibold vscode-fg mb-2">More Analytics Coming Soon</h3>
            <p class="vscode-description max-w-md mx-auto">
              Detailed usage reports, performance metrics, and insights are being developed.
            </p>
          </div>
        </div>
      </main>
    </div>
  `
})
export class AnalyticsComponent {
  readonly BarChart3Icon = BarChart3Icon;
  readonly TrendingUpIcon = TrendingUpIcon;
  readonly ActivityIcon = ActivityIcon;

  private appState = inject(AppStateManager);

  onNewSession(): void {
    // Navigate back to chat and start new session
    this.appState.setCurrentView('chat');
  }

  onAnalytics(): void {
    // Already on analytics - do nothing
  }
}