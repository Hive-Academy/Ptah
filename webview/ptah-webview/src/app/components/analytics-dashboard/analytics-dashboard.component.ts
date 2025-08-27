import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BarChart3Icon, TrendingUpIcon, ClockIcon, ZapIcon } from 'lucide-angular';

import { EgyptianCardComponent } from '../../shared/components/egyptian-card.component';

@Component({
  selector: 'app-analytics-dashboard',
  imports: [
    CommonModule,
    LucideAngularModule,
    EgyptianCardComponent
  ],
  template: `
    <div class="analytics-dashboard">
      <div class="dashboard-header mb-6">
        <h2 class="text-2xl font-bold text-hieroglyph-800 mb-2">
          <lucide-angular [img]="BarChart3Icon" size="24" class="inline mr-2"></lucide-angular>
          Analytics Dashboard
        </h2>
        <p class="text-hieroglyph-600">Track your Claude Code usage and performance metrics</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <app-egyptian-card variant="elevated" class="stat-card">
          <div class="flex items-center p-4">
            <lucide-angular [img]="ZapIcon" size="32" class="text-gold-500 mr-3"></lucide-angular>
            <div>
              <div class="text-2xl font-bold text-hieroglyph-800">42</div>
              <div class="text-sm text-hieroglyph-600">Commands Run</div>
            </div>
          </div>
        </app-egyptian-card>

        <app-egyptian-card variant="elevated" class="stat-card">
          <div class="flex items-center p-4">
            <lucide-angular [img]="ClockIcon" size="32" class="text-gold-500 mr-3"></lucide-angular>
            <div>
              <div class="text-2xl font-bold text-hieroglyph-800">2.3s</div>
              <div class="text-sm text-hieroglyph-600">Avg Response</div>
            </div>
          </div>
        </app-egyptian-card>

        <app-egyptian-card variant="elevated" class="stat-card">
          <div class="flex items-center p-4">
            <lucide-angular [img]="TrendingUpIcon" size="32" class="text-gold-500 mr-3"></lucide-angular>
            <div>
              <div class="text-2xl font-bold text-hieroglyph-800">89%</div>
              <div class="text-sm text-hieroglyph-600">Success Rate</div>
            </div>
          </div>
        </app-egyptian-card>

        <app-egyptian-card variant="elevated" class="stat-card">
          <div class="flex items-center p-4">
            <lucide-angular [img]="BarChart3Icon" size="32" class="text-gold-500 mr-3"></lucide-angular>
            <div>
              <div class="text-2xl font-bold text-hieroglyph-800">156K</div>
              <div class="text-sm text-hieroglyph-600">Tokens Used</div>
            </div>
          </div>
        </app-egyptian-card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <app-egyptian-card title="Recent Activity" variant="elevated">
          <div class="p-4">
            <div class="space-y-3">
              <div class="activity-item flex items-center justify-between">
                <div class="flex items-center">
                  <lucide-angular [img]="ZapIcon" size="16" class="text-gold-500 mr-2"></lucide-angular>
                  <span class="text-sm">Code review completed</span>
                </div>
                <span class="text-xs text-hieroglyph-500">2 min ago</span>
              </div>

              <div class="activity-item flex items-center justify-between">
                <div class="flex items-center">
                  <lucide-angular [img]="ZapIcon" size="16" class="text-gold-500 mr-2"></lucide-angular>
                  <span class="text-sm">Tests generated for UserService</span>
                </div>
                <span class="text-xs text-hieroglyph-500">5 min ago</span>
              </div>

              <div class="activity-item flex items-center justify-between">
                <div class="flex items-center">
                  <lucide-angular [img]="ZapIcon" size="16" class="text-gold-500 mr-2"></lucide-angular>
                  <span class="text-sm">Bug analysis completed</span>
                </div>
                <span class="text-xs text-hieroglyph-500">10 min ago</span>
              </div>
            </div>
          </div>
        </app-egyptian-card>

        <app-egyptian-card title="Performance Metrics" variant="elevated">
          <div class="p-4">
            <div class="space-y-4">
              <div class="metric-row">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm font-medium">Token Usage</span>
                  <span class="text-sm text-hieroglyph-600">78%</span>
                </div>
                <div class="w-full bg-hieroglyph-200 rounded-full h-2">
                  <div class="bg-gold-500 h-2 rounded-full" style="width: 78%"></div>
                </div>
              </div>

              <div class="metric-row">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm font-medium">Response Time</span>
                  <span class="text-sm text-hieroglyph-600">Good</span>
                </div>
                <div class="w-full bg-hieroglyph-200 rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
                </div>
              </div>

              <div class="metric-row">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm font-medium">Success Rate</span>
                  <span class="text-sm text-hieroglyph-600">Excellent</span>
                </div>
                <div class="w-full bg-hieroglyph-200 rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 89%"></div>
                </div>
              </div>
            </div>
          </div>
        </app-egyptian-card>
      </div>
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      @apply max-w-7xl mx-auto p-4;
    }

    .stat-card {
      @apply transition-transform hover:scale-105;
    }

    .activity-item {
      @apply border-b border-hieroglyph-100 pb-2 last:border-b-0 last:pb-0;
    }

    .metric-row {
      @apply last:mb-0;
    }

    /* VS Code theme adaptations */
    :host-context(.vscode-dark) .analytics-dashboard {
      @apply text-white;
    }

    :host-context(.vscode-dark) .activity-item {
      @apply border-hieroglyph-700;
    }

    :host-context(.vscode-high-contrast) .analytics-dashboard {
      @apply text-white;
    }
  `]
})
export class AnalyticsDashboardComponent {
  readonly BarChart3Icon = BarChart3Icon;
  readonly TrendingUpIcon = TrendingUpIcon;
  readonly ClockIcon = ClockIcon;
  readonly ZapIcon = ZapIcon;
}
