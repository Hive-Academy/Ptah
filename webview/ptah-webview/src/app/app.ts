import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationComponent } from './components/navigation/navigation.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';
import { LoadingSpinnerComponent } from './shared';
import { AppStateManager, ViewType } from './core/services/app-state.service';
import { ViewManagerService } from './core/services/view-manager.service';
import { VSCodeService } from './core/services/vscode.service';
import { WebviewNavigationService } from './core/services/webview-navigation.service';
import { EgyptianThemeService } from './core/services/egyptian-theme.service';
import { Subject } from 'rxjs';
// Individual component imports for pure signal-based navigation
import { ChatComponent } from './components/chat/chat.component';
import { CommandBuilderComponent } from './components/command-builder/command-builder.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';
import { ContextTreeComponent } from './components/context-tree/context-tree.component';
// REMOVED: Angular Router imports - incompatible with VS Code webviews

@Component({
  selector: 'app-root',
  imports: [
    NavigationComponent,
    StatusBarComponent,
    LoadingSpinnerComponent,
    ChatComponent,
    CommandBuilderComponent,
    AnalyticsDashboardComponent,
    ContextTreeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      min-height: 100vh;
      width: 100%;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }

    .app-content {
      flex: 1;
      overflow: auto;
      padding: 16px;
      height: 0; /* Required for flex child proper sizing */
    }

    /* Responsive design for different webview sizes */
    @media (max-width: 768px) {
      .app-content {
        padding: 8px;
      }
    }
  `]
})
export class App implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ANGULAR 20 PATTERN: Use inject() instead of constructor injection
  public appState = inject(AppStateManager);
  private viewManager = inject(ViewManagerService);
  public vscodeService = inject(VSCodeService);
  private navigationService = inject(WebviewNavigationService);
  public themeService = inject(EgyptianThemeService);
  // REMOVED: Router injection - using pure signal-based navigation

  // ANGULAR 20 PATTERN: Signal-based state for reactive UI
  private initializationStatus = signal<'idle' | 'initializing' | 'ready' | 'error'>('idle');

  // ANGULAR 20 PATTERN: Computed signals for derived state
  readonly isReady = computed(() => this.initializationStatus() === 'ready');
  readonly hasError = computed(() => this.initializationStatus() === 'error');
  readonly isInitializing = computed(() => this.initializationStatus() === 'initializing');

  // Theme-related computed values
  readonly currentTheme = this.themeService.currentTheme;
  readonly themeColors = this.themeService.themeColors;
  readonly isThemeInitialized = this.themeService.isInitialized;

  constructor() {
    console.log('Ptah App constructor - initializing with pure signal navigation...');
    this.setupVSCodeIntegration();
    // REMOVED: Router logging setup - no router used
  }

  async ngOnInit(): Promise<void> {
    console.log('Ptah App ngOnInit - starting initialization...');
    this.initializationStatus.set('initializing');

    try {
      // Initialize view manager
      await this.viewManager.initialize();
      console.log('Ptah App - ViewManager initialized successfully');

      // Notify VS Code that the app is ready
      this.vscodeService.notifyReady();

      // Handle initial view setup
      await this.handleInitialView();

      this.initializationStatus.set('ready');
    } catch (error) {
      console.error('Ptah App - Failed to initialize ViewManager:', error);
      this.initializationStatus.set('error');
    }
  }

  ngOnDestroy(): void {
    console.log('Ptah App - disposing...');
    this.destroy$.next();
    this.destroy$.complete();
    this.viewManager.dispose();
  }

  async onViewChanged(view: ViewType): Promise<void> {
    console.log('Ptah App - View changed to:', view);

    // Use hybrid navigation service for reliable navigation
    const success = await this.navigationService.navigateToView(view);

    if (success) {
      // Update view manager for consistency
      this.viewManager.switchView(view);
      console.log(`Ptah App - Navigation to ${view} completed successfully`);
    } else {
      console.error(`Ptah App - Navigation to ${view} failed`);
      // Show user-friendly error message
      this.appState.handleError(`Failed to navigate to ${view}`);
    }
  }

  private setupVSCodeIntegration(): void {
    // Navigation is now handled directly in WebviewNavigationService
    // No need for additional VS Code navigation handling here

    // Listen for theme changes
    this.vscodeService.onMessageType('themeChanged')
      .subscribe((themeData) => {
        console.log('Theme changed:', themeData);
        // The theme is already updated in VSCodeService
        // You can add additional theme handling here if needed
      });
  }

  // REMOVED: setupRouterLogging - no longer using Angular Router

  private async handleInitialView(): Promise<void> {
    console.log('Setting up initial view with pure signal navigation');

    // Initialize to chat view by default
    const success = await this.navigationService.navigateToView('chat');
    if (!success) {
      console.warn('Initial navigation to chat failed, using fallback');
      this.appState.setCurrentView('chat');
    }
  }
}
