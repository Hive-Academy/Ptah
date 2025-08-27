import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';
import { LoadingSpinnerComponent } from './shared';
import { AppStateManager, ViewType } from './services/app-state.service';
import { ViewManagerService } from './services/view-manager.service';
import { VSCodeService } from './services/vscode.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavigationComponent,
    StatusBarComponent,
    LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="app-container">
      <!-- Navigation -->
      <app-navigation
        [title]="appState.appTitle()"
        [currentView]="appState.currentView()"
        [disabled]="!appState.canSwitchViews()"
        (viewChanged)="onViewChanged($event)">
      </app-navigation>

      <!-- ANGULAR 20 PATTERN: Use @if instead of *ngIf -->
      @if (appState.isLoading() || isInitializing()) {
        <div class="app-content flex items-center justify-center">
          <app-loading-spinner
            size="lg"
            [message]="appState.statusMessage()">
          </app-loading-spinner>
        </div>
      }

      <!-- Main Content with Router - ANGULAR 20 PATTERN: Use @if -->
      @if (isReady() && !appState.isLoading()) {
        <div class="app-content">
          <router-outlet></router-outlet>
        </div>
      }

      <!-- Error State - ANGULAR 20 PATTERN: Use @if -->
      @if (hasError()) {
        <div class="app-content flex items-center justify-center">
          <div class="text-center text-red-600">
            <h3>Initialization Error</h3>
            <p>Failed to initialize the application. Please try refreshing.</p>
          </div>
        </div>
      }

      <!-- Status Bar -->
      <app-status-bar
        [statusMessage]="appState.statusMessage()"
        [isConnected]="vscodeService.isConnected()"
        [workspaceInfo]="vscodeService.config()">
      </app-status-bar>
    </main>
  `,
  styles: [`
    .app-container {
      @apply h-screen w-full flex flex-col bg-papyrus-50;
      /* Ensure the app takes full height in webview */
      min-height: 100vh;
      height: 100vh;
    }

    .app-content {
      @apply flex-1 overflow-auto p-4;
      /* Important: ensure proper scrolling in webview */
      height: 0; /* Flex child needs this for proper sizing */
    }

    /* VS Code theme adaptations */
    :host-context(.vscode-dark) .app-container {
      @apply bg-hieroglyph-900;
    }

    :host-context(.vscode-light) .app-container {
      @apply bg-papyrus-25;
    }

    :host-context(.vscode-high-contrast) .app-container {
      @apply bg-black text-white;
      border: 1px solid white;
    }

    /* Responsive design for different webview sizes */
    @media (max-width: 768px) {
      .app-content {
        @apply p-2;
      }
    }
  `]
})
export class App implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ANGULAR 20 PATTERN: Use inject() instead of constructor injection
  public appState = inject(AppStateManager);
  private viewManager = inject(ViewManagerService);
  private router = inject(Router);
  public vscodeService = inject(VSCodeService);

  // ANGULAR 20 PATTERN: Signal-based state for reactive UI
  private initializationStatus = signal<'idle' | 'initializing' | 'ready' | 'error'>('idle');

  // ANGULAR 20 PATTERN: Computed signals for derived state
  readonly isReady = computed(() => this.initializationStatus() === 'ready');
  readonly hasError = computed(() => this.initializationStatus() === 'error');
  readonly isInitializing = computed(() => this.initializationStatus() === 'initializing');

  constructor() {
    console.log('Ptah App constructor - initializing...');
    this.setupVSCodeIntegration();
    this.setupRouterLogging();
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

      // Handle initial route from VS Code if provided
      this.handleInitialRoute();

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

  onViewChanged(view: ViewType): void {
    console.log('Ptah App - View changed to:', view);
    this.viewManager.switchView(view);

    // Navigate to the corresponding route using hash navigation with error handling
    try {
      this.router.navigate([`/${view}`]).catch(error => {
        console.warn('Navigation error (suppressed in webview):', error);
        // Fallback: just update the view state without routing
        this.appState.setCurrentView(view);
      });
    } catch (error) {
      console.warn('Router navigate error (suppressed in webview):', error);
      // Fallback: just update the view state
      this.appState.setCurrentView(view);
    }

    // Notify VS Code about route change
    this.vscodeService.navigateToRoute(`/${view}`);
  }

  private setupVSCodeIntegration(): void {
    // Listen for navigation requests from VS Code
    this.vscodeService.onMessageType('navigate')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: { route: string }) => {
        console.log('Received navigation request from VS Code:', data.route);
        try {
          this.router.navigate([data.route]).catch(error => {
            console.warn('VS Code navigation error (suppressed in webview):', error);
          });
        } catch (error) {
          console.warn('VS Code router error (suppressed in webview):', error);
        }
      });

    // Listen for theme changes
    this.vscodeService.onMessageType('themeChanged')
      .pipe(takeUntil(this.destroy$))
      .subscribe((themeData) => {
        console.log('Theme changed:', themeData);
        // The theme is already updated in VSCodeService
        // You can add additional theme handling here if needed
      });
  }

  private setupRouterLogging(): void {
    // Log route changes for debugging
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        console.log('Router navigation completed:', event.url);

        // Update view state based on route
        const route = event.url.replace('/', '').replace('#/', '') || 'chat';
        if (['chat', 'command-builder', 'analytics'].includes(route)) {
          this.appState.setCurrentView(route as ViewType);
        }
      });
  }

  private handleInitialRoute(): void {
    // Check if there's an initial route specified
    const currentRoute = this.router.url;
    console.log('Current route on init:', currentRoute);

    // If we're at root, navigate to chat with error handling
    if (currentRoute === '/' || currentRoute === '') {
      try {
        this.router.navigate(['/chat']).catch(error => {
          console.warn('Initial navigation error (suppressed in webview):', error);
          // Fallback: set view state directly
          this.appState.setCurrentView('chat');
        });
      } catch (error) {
        console.warn('Initial router error (suppressed in webview):', error);
        // Fallback: set view state directly
        this.appState.setCurrentView('chat');
      }
    }
  }
}
