import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, PlusIcon, BarChart3Icon } from 'lucide-angular';
import { EgyptianButtonComponent } from '../../shared/components/egyptian-button.component';

@Component({
  selector: 'app-simple-header',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    EgyptianButtonComponent
  ],
  template: `
    <header class="flex items-center justify-between px-4 py-3 vscode-bg vscode-border border-b border-solid">
      <!-- Left Side: New Session -->
      <div class="flex items-center">
        <app-egyptian-button
          [iconData]="PlusIcon"
          tooltip="New Session"
          size="sm"
          variant="primary"
          (clicked)="onNewSession()">
          New Session
        </app-egyptian-button>
      </div>

      <!-- Right Side: Analytics -->
      <div class="flex items-center">
        <app-egyptian-button
          [iconData]="BarChart3Icon"
          [iconOnly]="true"
          tooltip="Analytics"
          size="sm"
          variant="ghost"
          (clicked)="onAnalytics()">
        </app-egyptian-button>
      </div>
    </header>
  `
})
export class SimpleHeaderComponent {
  // Lucide Icons
  readonly PlusIcon = PlusIcon;
  readonly BarChart3Icon = BarChart3Icon;

  @Output() newSession = new EventEmitter<void>();
  @Output() analytics = new EventEmitter<void>();

  onNewSession(): void {
    this.newSession.emit();
  }

  onAnalytics(): void {
    this.analytics.emit();
  }
}