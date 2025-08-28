import * as vscode from 'vscode';
import { StrictPostMessageFunction } from '../services/webview-message-handlers/base-message-handler';
import { SessionManager } from '../services/session-manager';
import { ClaudeCliService } from '../services/claude-cli.service';
import { ContextManager } from '../services/context-manager';
import { CommandBuilderService } from '../services/command-builder.service';
import { WebviewHtmlGenerator } from '../services/webview-html-generator';
import { 
  WebviewMessageRouter,
  ChatMessageHandler,
  CommandMessageHandler,
  ContextMessageHandler,
  AnalyticsMessageHandler,
  StateMessageHandler,
  ViewMessageHandler
} from '../services/webview-message-handlers';
import { Logger } from '../core/logger';
import { WebviewMessage, isSystemMessage, isRoutableMessage } from '../types/message.types';

/**
 * Workspace information interface
 */
interface WorkspaceInfo {
  name: string;
  path: string;
  projectType: string;
}

/**
 * Unified Angular Webview Provider - REFACTORED with SOLID principles
 * Single Responsibility: Manage webview lifecycle and coordinate message handling
 * Follows Dependency Inversion: Depends on abstractions, not concrete implementations
 */
export class AngularWebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  private _panel?: vscode.WebviewPanel;
  private htmlGenerator: WebviewHtmlGenerator;
  private messageRouter: WebviewMessageRouter;

  constructor(
    private context: vscode.ExtensionContext,
    private sessionManager: SessionManager,
    private claudeService: ClaudeCliService,
    private contextManager: ContextManager,
    private commandBuilderService: CommandBuilderService
  ) {
    this.htmlGenerator = new WebviewHtmlGenerator(context);
    this.messageRouter = new WebviewMessageRouter();
    this.initializeMessageHandlers();
  }

  /**
   * Initialize message handlers - follows Open/Closed Principle
   * New handlers can be added without modifying existing code
   * Now with strict typing - eliminates 'any' types
   */
  private initializeMessageHandlers(): void {
    const postMessageFn = this.postMessage.bind(this);

    // Register all message handlers with explicit type casting for compatibility
    this.messageRouter.registerHandler(new ChatMessageHandler(postMessageFn, this.sessionManager, this.claudeService) as any);
    this.messageRouter.registerHandler(new CommandMessageHandler(postMessageFn, this.commandBuilderService) as any);
    this.messageRouter.registerHandler(new ContextMessageHandler(postMessageFn, this.contextManager) as any);
    this.messageRouter.registerHandler(new AnalyticsMessageHandler(postMessageFn, this.sessionManager, this.commandBuilderService) as any);
    this.messageRouter.registerHandler(new StateMessageHandler(postMessageFn, this.context) as any);
    this.messageRouter.registerHandler(new ViewMessageHandler(postMessageFn) as any);

    Logger.info('All message handlers initialized');
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

    // Configure webview for Angular app
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'browser'),
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.context.extensionUri, 'out')
      ]
    };

    // Set Angular HTML content using dedicated generator
    const workspaceInfo = this.getWorkspaceInfo();
    webviewView.webview.html = this.htmlGenerator.generateAngularWebviewContent(webviewView.webview, workspaceInfo);

    // Handle messages using the router
    webviewView.webview.onDidReceiveMessage(
      this.handleWebviewMessage.bind(this),
      undefined,
      this._disposables
    );

    // Handle visibility changes
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.sendInitialData();
      }
    });

    // Send initial data when webview loads
    this.sendInitialData();

    // Register command to open full panel
    this.registerPanelCommand();
  }

  /**
   * Create a full-screen Angular SPA panel
   */
  public createPanel(): void {
    if (this._panel) {
      this._panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this._panel = vscode.window.createWebviewPanel(
      'ptah-angular-spa',
      'Ptah - Claude Code Assistant',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview'),
          vscode.Uri.joinPath(this.context.extensionUri, 'media'),
          vscode.Uri.joinPath(this.context.extensionUri, 'out')
        ]
      }
    );

    const workspaceInfo = this.getWorkspaceInfo();
    this._panel.webview.html = this.htmlGenerator.generateAngularWebviewContent(this._panel.webview, workspaceInfo);
    
    // Handle messages from Angular app
    this._panel.webview.onDidReceiveMessage(
      this.handleWebviewMessage.bind(this),
      undefined,
      this._disposables
    );

    // Handle panel disposal
    this._panel.onDidDispose(() => {
      this._panel = undefined;
    }, undefined, this._disposables);

    // Send initial data
    this.sendInitialData(this._panel.webview);
  }

  /**
   * Switch the view mode (handled by Angular routing)
   */
  public switchView(viewType: 'chat' | 'command-builder' | 'analytics'): void {
    this.postMessage({
      type: 'navigate',
      payload: { route: `/${viewType}` }
    });
  }

  /**
   * Handle messages from Angular application using the router
   * Follows Single Responsibility - just coordinates, doesn't handle business logic
   * IMPROVED: Added requestInitialData handler based on research findings
   */
  private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
    try {
      // Handle special system messages first
      if (message.type === 'ready') {
        await this.sendInitialData();
        return;
      }

      if (message.type === 'webview-ready') {
        Logger.info('Webview ready signal received');
        return;
      }

      // RESEARCH FINDING: Handle requestInitialData message that Angular sends
      if (message.type === 'requestInitialData') {
        Logger.info('Angular requested initial data');
        await this.sendInitialData();
        return;
      }

      // Route routable messages to appropriate handlers
      if (isRoutableMessage(message)) {
        await this.messageRouter.routeMessage(message.type, message.payload);
      } else {
        // System message already handled above, log if unrecognized
        Logger.warn(`Unrecognized system message type: ${message.type}`);
      }

    } catch (error) {
      Logger.error('Error handling webview message:', error);
      this.postMessage({
        type: 'error',
        payload: { 
          message: error instanceof Error ? error.message : 'Unknown error',
          source: message.type 
        }
      });
    }
  }

  /**
   * Send initial data to Angular application
   */
  private async sendInitialData(webview?: vscode.Webview): Promise<void> {
    const target = webview || this._view?.webview || this._panel?.webview;
    if (!target) return;

    try {
      // Get current state
      const currentSession = this.sessionManager.getCurrentSession();
      const context = await this.contextManager.getCurrentContext();
      const workspaceInfo = this.getWorkspaceInfo();

      const initialData = {
        type: 'initialData',
        payload: {
          session: currentSession,
          context,
          workspaceInfo,
          theme: vscode.window.activeColorTheme.kind,
          isVSCode: true,
          extensionVersion: this.context.extension.packageJSON.version
        }
      };

      target.postMessage(initialData);
      Logger.info('Initial data sent to webview');
    } catch (error) {
      Logger.error('Error sending initial data:', error);
    }
  }

  /**
   * Send message to Angular application - Now with strict typing
   * Implements StrictPostMessageFunction interface
   */
  private postMessage: StrictPostMessageFunction = (message) => {
    if (this._panel?.webview) {
      this._panel.webview.postMessage(message);
    } else if (this._view?.webview) {
      this._view.webview.postMessage(message);
    }
  };

  /**
   * Get workspace information
   */
  private getWorkspaceInfo(): WorkspaceInfo | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return null;

    return {
      name: workspaceFolders[0].name,
      path: workspaceFolders[0].uri.fsPath,
      projectType: this.detectProjectType(workspaceFolders[0].uri.fsPath)
    };
  }

  /**
   * Detect project type based on files
   */
  private detectProjectType(workspacePath: string): string {
    // TODO: Implement project type detection logic
    return 'unknown';
  }

  /**
   * Register the panel command (DRY principle - extracted method)
   */
  private registerPanelCommand(): void {
    vscode.commands.registerCommand('ptah.openFullPanel', () => {
      this.createPanel();
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    Logger.info('Disposing Angular Webview Provider...');
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
}
