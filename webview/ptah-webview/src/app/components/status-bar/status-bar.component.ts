import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  template: `
    <footer
      class="app-footer bg-hieroglyph-100 border-t border-papyrus-300 px-4 py-2 text-sm text-hieroglyph-600"
    >
      <div class="flex items-center justify-between">
        <!-- Status Message -->
        <div class="flex items-center space-x-2">
          @if (isConnected) {
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          } @else {
            <span class="w-2 h-2 bg-red-500 rounded-full"></span>
          }
          <span>{{ statusMessage }}</span>
        </div>

        <!-- Workspace Info -->
        <div class="flex items-center space-x-4">
          @if (workspaceInfo) {
            <span class="flex items-center">
              <i class="icon-folder mr-1"></i>
              {{ workspaceInfo.name }}
            </span>
          }

          @if (projectType) {
            <span class="px-2 py-1 bg-papyrus-200 rounded text-xs">
              {{ projectType }}
            </span>
          }

          <!-- Additional Stats -->
          <ng-content></ng-content>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        @apply flex-shrink-0;
      }

      /* VS Code theme adaptations */
      :host-context(.vscode-dark) .app-footer {
        @apply bg-hieroglyph-800 border-hieroglyph-700 text-papyrus-300;
      }

      :host-context(.vscode-dark) .bg-papyrus-200 {
        @apply bg-hieroglyph-700 text-papyrus-200;
      }

      :host-context(.vscode-light) .app-footer {
        @apply bg-papyrus-50 border-papyrus-200 text-hieroglyph-700;
      }

      :host-context(.vscode-high-contrast) .app-footer {
        @apply bg-black border-white text-white;
      }

      :host-context(.vscode-high-contrast) .bg-papyrus-200 {
        @apply bg-white text-black;
      }
    `,
  ],
})
export class StatusBarComponent {
  @Input() statusMessage: string = 'Ready';
  @Input() isConnected: boolean = false;
  @Input() workspaceInfo: any = null;

  get projectType(): string | null {
    return this.workspaceInfo?.projectType || null;
  }
}
