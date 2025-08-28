import { Injectable, signal, computed } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface VSCodeMessage {
  type: string;
  data?: any;
}

export interface WebviewConfig {
  isVSCode: boolean;
  theme: 'light' | 'dark' | 'high-contrast';
  workspaceRoot: string;
  workspaceName: string;
  extensionUri: string;
}

@Injectable({
  providedIn: 'root'
})
export class VSCodeService {
  private vscode: any;
  private messageSubject = new Subject<VSCodeMessage>();

  // ANGULAR 20 PATTERN: Private signals for internal state
  private _config = signal<WebviewConfig>({
    isVSCode: false,
    theme: 'dark',
    workspaceRoot: '',
    workspaceName: '',
    extensionUri: ''
  });

  private _isConnected = signal(false);

  // ANGULAR 20 PATTERN: Readonly computed signals for external access
  readonly config = this._config.asReadonly();
  readonly isConnected = this._isConnected.asReadonly();

  // ANGULAR 20 PATTERN: Computed signals for derived state
  readonly isDevelopmentMode = computed(() => !this.isConnected());
  readonly currentTheme = computed(() => this.config().theme);
  readonly workspaceDisplayName = computed(() =>
    this.config().workspaceName || 'Unknown Workspace'
  );

  constructor() {
    this.initializeVSCodeAPI();
    this.setupMessageListener();
    this.setupThemeListener();
  }

  private initializeVSCodeAPI(): void {
    console.log('VSCodeService: Initializing VS Code API...');
    try {
      // Check if we're running in VS Code webview
      if (typeof window !== 'undefined' && (window as any).vscode) {
        console.log('VSCodeService: VS Code API found in window');
        this.vscode = (window as any).vscode;
        this._isConnected.set(true);
      } else if (typeof (window as any).acquireVsCodeApi !== 'undefined') {
        console.log('VSCodeService: acquiring VS Code API...');
        this.vscode = (window as any).acquireVsCodeApi();
        this._isConnected.set(true);
      } else {
        console.warn('VSCodeService: VS Code API not available - running in development mode');
        this._isConnected.set(false);
        this.setupDevelopmentMode();
      }

      // Get initial config from window
      const windowConfig = (window as any).ptahConfig;
      if (windowConfig) {
        console.log('VSCodeService: Found window config:', windowConfig);
        this._config.set({
          isVSCode: windowConfig.isVSCode || false,
          theme: windowConfig.theme || 'dark',
          workspaceRoot: windowConfig.workspaceRoot || '',
          workspaceName: windowConfig.workspaceName || '',
          extensionUri: windowConfig.extensionUri || ''
        });
      }

      console.log('VSCodeService: Initialization complete. Connected:', this.isConnected());
    } catch (error) {
      console.error('VSCodeService: Failed to initialize VS Code API:', error);
      this._isConnected.set(false);
      this.setupDevelopmentMode();
    }
  }

  private setupDevelopmentMode(): void {
    // Setup mock configuration for development
    this._config.set({
      isVSCode: false,
      theme: 'dark',
      workspaceRoot: '/mock/workspace',
      workspaceName: 'Mock Workspace',
      extensionUri: ''
    });
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      const message = event.data as VSCodeMessage;

      // Handle theme changes
      if (message.type === 'theme-change' || message.type === 'themeChanged') {
        this._config.update((config: WebviewConfig) => ({
          ...config,
          theme: message.data?.theme || message.data
        }));
      }

      // Handle state management responses
      if (message.type === 'state:saved') {
        console.log('VSCodeService: State saved successfully');
      } else if (message.type === 'state:error') {
        console.error('VSCodeService: State save error:', message.data?.message);
      } else if (message.type === 'state:loaded') {
        console.log('VSCodeService: State loaded:', message.data?.state);
      }

      // Emit message to subscribers
      this.messageSubject.next(message);
    });
  }

  private setupThemeListener(): void {
    // Listen for VS Code theme changes via custom events
    fromEvent(window, 'vscode-theme-changed').subscribe((event: any) => {
      if (event.detail) {
        this._config.update((config: WebviewConfig) => ({
          ...config,
          theme: event.detail.theme
        }));
      }
    });
  }

  /**
   * Send message to VS Code extension
   */
  postMessage(type: string, data?: any): void {
    if (!this.isConnected()) {
      console.warn('VS Code API not available, message not sent:', { type, data });
      return;
    }

    try {
      this.vscode.postMessage({ type, data });
    } catch (error) {
      console.error('Failed to send message to VS Code:', error);
    }
  }

  /**
   * Listen for messages from VS Code extension
   */
  onMessage(): Observable<VSCodeMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Listen for specific message types
   */
  onMessageType(messageType: string): Observable<any> {
    return this.messageSubject.pipe(
      filter(message => message.type === messageType),
      map(message => message.data)
    );
  }

  /**
   * Notify VS Code that webview is ready
   */
  notifyReady(): void {
    this.postMessage('webview-ready');
  }

  /**
   * Navigate to a specific route within the Angular app
   */
  navigateToRoute(route: string): void {
    this.postMessage('route-changed', { route });
  }

  /**
   * Request file picker from VS Code
   */
  requestFilePicker(options?: { multiple?: boolean; filters?: any }): void {
    this.postMessage('requestFilePicker', options);
  }

  /**
   * Execute VS Code command
   */
  executeVSCodeCommand(command: string, args?: any[]): void {
    this.postMessage('executeCommand', { command, args });
  }

  /**
   * Update VS Code configuration
   */
  updateConfiguration(key: string, value: any): void {
    this.postMessage('updateConfiguration', { key, value });
  }

  /**
   * Show VS Code message
   */
  showMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    this.postMessage('showMessage', { message, type });
  }

  /**
   * Save webview state to VS Code
   * FIXED: Use message protocol instead of direct setState
   */
  saveState(state: any): void {
    // Validate state is an object
    if (state && typeof state === 'object') {
      this.postMessage('saveState', state);
    } else {
      console.warn('VSCodeService: saveState called with invalid state:', state);
      // Send empty object as fallback
      this.postMessage('saveState', {});
    }
  }

  /**
   * Get saved webview state from VS Code
   */
  getState(): any {
    if (this.vscode && this.vscode.getState) {
      return this.vscode.getState();
    }
    return null;
  }

  /**
   * Chat-related methods
   */
  sendChatMessage(content: string, files?: string[]): void {
    this.postMessage('chat:sendMessage', { content, files });
  }

  createNewChatSession(): void {
    this.postMessage('chat:newSession');
  }

  switchChatSession(sessionId: string): void {
    this.postMessage('chat:switchSession', { sessionId });
  }

  /**
   * Command Builder methods
   */
  getCommandTemplates(): void {
    this.postMessage('commands:getTemplates');
  }

  executeCommand(templateId: string, parameters: any): void {
    this.postMessage('commands:executeCommand', { templateId, parameters });
  }

  saveCommandTemplate(template: any): void {
    this.postMessage('commands:saveTemplate', { template });
  }

  /**
   * Context Management methods
   */
  getContextFiles(): void {
    this.postMessage('context:getFiles');
  }

  includeFile(filePath: string): void {
    this.postMessage('context:includeFile', { filePath });
  }

  excludeFile(filePath: string): void {
    this.postMessage('context:excludeFile', { filePath });
  }

  /**
   * Analytics methods
   */
  getAnalyticsData(): void {
    this.postMessage('analytics:getData');
  }
}
