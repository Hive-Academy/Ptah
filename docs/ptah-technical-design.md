# 📜 Ptah VS Code Extension - Technical Architecture

## Executive Summary

This document details the technical architecture for **Ptah**, a comprehensive VS Code extension that provides visual interfaces for all Claude Code CLI capabilities. Built using TypeScript and Angular webviews, Ptah seamlessly integrates Claude Code's power into developers' natural VS Code workflows.

## 🎯 Architecture Goals

1. **Native VS Code Integration** - Feels like built-in VS Code functionality
2. **Complete Claude Code Coverage** - Every CLI feature accessible through visual interfaces
3. **Intelligent Context Awareness** - Automatically understands workspace and project state
4. **Performance Excellence** - Sub-second response times, minimal memory footprint
5. **Extensible Foundation** - Architecture supports future premium features

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VS CODE EXTENSION HOST                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   EXTENSION CONTEXT                         │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    │
│  │  │   Extension  │  │   Command    │  │   Configuration   │   │    │
│  │  │  Activation  │  │   Registry   │  │    Manager       │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    │
│  │  │   Claude     │  │   Context    │  │   Workspace      │   │    │
│  │  │ CLI Service  │  │   Manager    │  │    Manager       │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    │
│  │  │   Session    │  │  Analytics   │  │   TreeData       │   │    │
│  │  │   Manager    │  │   Service    │  │   Providers      │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  WEBVIEW PROVIDERS                          │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    │
│  │  │ Chat Sidebar │  │  Command     │  │   Analytics      │   │    │
│  │  │  Provider    │  │  Builder     │  │   Dashboard      │   │    │
│  │  │  (Angular)   │  │  Provider    │  │   Provider       │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    │
│  │  │ Subagent     │  │   Context    │  │   Settings       │   │    │
│  │  │ Management   │  │  Visualizer  │  │    Panel         │   │    │
│  │  │  Provider    │  │   Provider   │  │   Provider       │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │   VS Code Extension API  │
                    └────────────┬─────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                         VS CODE UI                                  │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │ Activity    │ │  Sidebar    │ │   Editor    │ │ Status Bar  │    │
│  │    Bar      │ │   Views     │ │   Area      │ │             │    │
│  │    Icon     │ │             │ │             │ │   Ptah      │    │
│  │    (📜)     │ │ Chat Panel  │ │ Context     │ │  Status     │    │
│  │             │ │ Context     │ │ Indicators  │ │             │    │
│  └─────────────┘ │ Tree View   │ │ Quick Fixes │ └─────────────┘    │
│                  │             │ │             │                    │
│                  └─────────────┘ └─────────────┘                    │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │  Command    │ │   Bottom    │ │   Right     │ │   Menu      │    │
│  │  Palette    │ │   Panel     │ │  Sidebar    │ │   Items     │    │
│  │             │ │             │ │             │ │             │    │
│  │ Ptah:       │ │ Analytics   │ │ Additional  │ │ Ptah        │    │
│  │ Commands    │ │ Dashboard   │ │  Webviews   │ │ Actions     │    │
│  │             │ │             │ │             │ │             │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Core Components

### 1. Extension Activation & Registration

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { PtahExtension } from './core/ptah-extension';
import { Logger } from './core/logger';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    Logger.info('Activating Ptah extension...');

    // Initialize main extension controller
    const ptahExtension = new PtahExtension(context);
    await ptahExtension.initialize();

    // Register all providers, commands, and services
    await ptahExtension.registerAll();

    // Setup workspace integration
    await ptahExtension.setupWorkspaceIntegration();

    // Show welcome if first time
    if (ptahExtension.isFirstActivation()) {
      await ptahExtension.showWelcome();
    }

    Logger.info('Ptah extension activated successfully');
  } catch (error) {
    Logger.error('Failed to activate Ptah extension', error);
    vscode.window.showErrorMessage(`Ptah activation failed: ${error.message}`);
  }
}

export function deactivate(): void {
  Logger.info('Deactivating Ptah extension');
  PtahExtension.instance?.dispose();
}
```

### 2. Main Extension Controller

```typescript
// src/core/ptah-extension.ts
export class PtahExtension implements vscode.Disposable {
  private static _instance: PtahExtension;
  private disposables: vscode.Disposable[] = [];

  // Core services
  private claudeCliService: ClaudeCliService;
  private sessionManager: SessionManager;
  private contextManager: ContextManager;
  private workspaceManager: WorkspaceManager;
  private analyticsService: AnalyticsService;

  // UI providers
  private chatSidebarProvider: ChatSidebarProvider;
  private commandBuilderProvider: CommandBuilderProvider;
  private contextTreeProvider: ContextTreeProvider;
  private analyticsDashboardProvider: AnalyticsDashboardProvider;

  constructor(private context: vscode.ExtensionContext) {
    PtahExtension._instance = this;
  }

  static get instance(): PtahExtension {
    return PtahExtension._instance;
  }

  async initialize(): Promise<void> {
    // Initialize core services
    this.claudeCliService = new ClaudeCliService();
    this.sessionManager = new SessionManager(this.context);
    this.contextManager = new ContextManager();
    this.workspaceManager = new WorkspaceManager();
    this.analyticsService = new AnalyticsService(this.context);

    // Verify Claude Code CLI availability
    const isClaudeAvailable = await this.claudeCliService.verifyInstallation();
    if (!isClaudeAvailable) {
      await this.handleClaudeNotFound();
      return;
    }

    // Initialize UI providers
    await this.initializeProviders();
  }

  async registerAll(): Promise<void> {
    // Register webview providers
    this.registerWebviewProviders();

    // Register tree data providers
    this.registerTreeProviders();

    // Register commands
    this.registerCommands();

    // Register event handlers
    this.registerEventHandlers();

    // Register status bar items
    this.registerStatusBar();
  }

  private registerWebviewProviders(): void {
    // Chat sidebar
    this.chatSidebarProvider = new ChatSidebarProvider(
      this.context,
      this.sessionManager,
      this.claudeCliService
    );

    this.context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('ptah.chatSidebar', this.chatSidebarProvider, {
        webviewOptions: { retainContextWhenHidden: true },
      })
    );

    // Command builder panel
    this.commandBuilderProvider = new CommandBuilderProvider(
      this.context,
      this.claudeCliService,
      this.contextManager
    );

    // Analytics dashboard
    this.analyticsDashboardProvider = new AnalyticsDashboardProvider(
      this.context,
      this.analyticsService
    );
  }

  private registerCommands(): void {
    const commands = [
      // Quick actions
      vscode.commands.registerCommand('ptah.quickChat', () => this.quickChat()),
      vscode.commands.registerCommand('ptah.reviewCurrentFile', () => this.reviewCurrentFile()),
      vscode.commands.registerCommand('ptah.generateTests', () => this.generateTests()),

      // Session management
      vscode.commands.registerCommand('ptah.newSession', () => this.sessionManager.createSession()),
      vscode.commands.registerCommand('ptah.switchSession', () =>
        this.sessionManager.showSessionPicker()
      ),

      // Command building
      vscode.commands.registerCommand('ptah.buildCommand', () =>
        this.commandBuilderProvider.show()
      ),
      vscode.commands.registerCommand('ptah.showTemplates', () =>
        this.commandBuilderProvider.showTemplates()
      ),

      // Context management
      vscode.commands.registerCommand('ptah.includeFile', (uri) =>
        this.contextManager.includeFile(uri)
      ),
      vscode.commands.registerCommand('ptah.excludeFile', (uri) =>
        this.contextManager.excludeFile(uri)
      ),
      vscode.commands.registerCommand('ptah.optimizeContext', () =>
        this.contextManager.showOptimizations()
      ),

      // Analytics
      vscode.commands.registerCommand('ptah.showAnalytics', () =>
        this.analyticsDashboardProvider.show()
      ),
      vscode.commands.registerCommand('ptah.exportUsageData', () =>
        this.analyticsService.exportData()
      ),
    ];

    this.context.subscriptions.push(...commands);
  }
}
```

### 3. Claude CLI Integration Service

```typescript
// src/services/claude-cli.service.ts
export class ClaudeCliService implements vscode.Disposable {
  private activeProcesses = new Map<string, ChildProcess>();
  private installationPath?: string;

  async verifyInstallation(): Promise<boolean> {
    try {
      // Check for Claude Code CLI in various locations
      const possiblePaths = [
        'claude', // Global PATH
        path.join(os.homedir(), '.local', 'bin', 'claude'),
        '/usr/local/bin/claude',
        // Windows paths
        path.join(os.homedir(), 'AppData', 'Local', 'Claude', 'claude.exe'),
      ];

      for (const cmdPath of possiblePaths) {
        try {
          const result = await this.executeCommand(cmdPath, ['--version'], { timeout: 5000 });
          if (result.success) {
            this.installationPath = cmdPath;
            Logger.info(`Claude CLI found at: ${cmdPath}`);
            return true;
          }
        } catch (error) {
          // Try next path
          continue;
        }
      }

      return false;
    } catch (error) {
      Logger.error('Failed to verify Claude CLI installation', error);
      return false;
    }
  }

  async startChatSession(
    sessionId: string,
    projectPath?: string
  ): Promise<AsyncIterator<ChatMessage>> {
    const args = ['chat'];

    if (projectPath) {
      args.push('--project', projectPath);
    }

    // Add workspace-specific context
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      args.push('--context', workspaceRoot);
    }

    const process = spawn(this.installationPath!, args, {
      cwd: projectPath || workspaceRoot,
      stdio: 'pipe',
      env: { ...process.env },
    });

    this.activeProcesses.set(sessionId, process);

    return this.createMessageStream(process, sessionId);
  }

  async sendMessage(sessionId: string, message: string, files?: string[]): Promise<void> {
    const process = this.activeProcesses.get(sessionId);
    if (!process || process.killed) {
      throw new Error('No active session found');
    }

    // Format message with file attachments
    let fullMessage = message;
    if (files && files.length > 0) {
      const fileAttachments = files
        .map((file) => `\nFile: ${file}\n\`\`\`\n${fs.readFileSync(file, 'utf8')}\n\`\`\``)
        .join('\n');
      fullMessage += fileAttachments;
    }

    // Send to Claude process
    process.stdin!.write(fullMessage + '\n');
  }

  async buildCommand(template: CommandTemplate, parameters: Record<string, any>): Promise<string> {
    let command = template.template;

    // Replace parameters in template
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      command = command.replace(placeholder, String(value));
    }

    // Add file context if specified
    if (parameters.files && Array.isArray(parameters.files)) {
      const fileContext = parameters.files
        .map((file) => `\nFile: ${file}\n\`\`\`\n${fs.readFileSync(file, 'utf8')}\n\`\`\``)
        .join('\n');
      command += fileContext;
    }

    return command;
  }

  private async *createMessageStream(
    process: ChildProcess,
    sessionId: string
  ): AsyncIterator<ChatMessage> {
    const readline = createInterface({
      input: process.stdout!,
      crlfDelay: Infinity,
    });

    let currentMessage: Partial<ChatMessage> = {
      id: generateId(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      sessionId,
    };

    for await (const line of readline) {
      try {
        // Parse Claude output format
        if (line.startsWith('CLAUDE:')) {
          // New message start
          if (currentMessage.content) {
            yield currentMessage as ChatMessage;
          }
          currentMessage = {
            id: generateId(),
            type: 'assistant',
            content: line.substring(7),
            timestamp: new Date(),
            sessionId,
          };
        } else if (line.startsWith('TOKEN_COUNT:')) {
          // Token usage information
          const tokenCount = parseInt(line.substring(12));
          if (currentMessage) {
            currentMessage.tokenCount = tokenCount;
          }
        } else if (line.startsWith('ERROR:')) {
          // Error handling
          throw new Error(line.substring(6));
        } else {
          // Continue current message
          if (currentMessage) {
            currentMessage.content += line + '\n';
          }
        }
      } catch (error) {
        Logger.error(`Stream parsing error for session ${sessionId}`, error);
        yield {
          id: generateId(),
          type: 'system',
          content: `Error: ${error.message}`,
          timestamp: new Date(),
          sessionId,
          isError: true,
        };
      }
    }

    // Yield final message
    if (currentMessage.content) {
      yield currentMessage as ChatMessage;
    }
  }

  async executeCommand(
    command: string,
    args: string[],
    options: { timeout?: number } = {}
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => (stdout += data));
      process.stderr?.on('data', (data) => (stderr += data));

      const timeoutId = options.timeout
        ? setTimeout(() => {
            process.kill();
            reject(new Error(`Command timeout after ${options.timeout}ms`));
          }, options.timeout)
        : null;

      process.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);

        resolve({
          success: code === 0,
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      process.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  dispose(): void {
    // Clean up all active processes
    for (const [sessionId, process] of this.activeProcesses) {
      if (!process.killed) {
        process.kill();
      }
    }
    this.activeProcesses.clear();
  }
}
```

### 4. Chat Sidebar WebView Provider

```typescript
// src/providers/chat-sidebar.provider.ts
export class ChatSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    private sessionManager: SessionManager,
    private claudeService: ClaudeCliService
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

    // Configure webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.context.extensionUri, 'out'),
      ],
    };

    // Set HTML content
    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      this.handleWebviewMessage.bind(this),
      undefined,
      this._disposables
    );

    // Setup session management
    this.setupSessionSync();

    // Handle visibility changes
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refreshCurrentSession();
      }
    });
  }

  private getWebviewContent(webview: vscode.Webview): string {
    // Get Angular build artifacts
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'chat', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'chat', 'styles.css')
    );

    // Generate nonce for security
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" 
              content="default-src 'none'; 
                       script-src ${webview.cspSource} 'nonce-${nonce}';
                       style-src ${webview.cspSource} 'unsafe-inline';
                       font-src ${webview.cspSource};
                       img-src ${webview.cspSource} data:;">
        <link href="${styleUri}" rel="stylesheet">
        <title>Ptah Chat</title>
      </head>
      <body>
        <div id="ptah-chat-root">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading Ptah Chat...</p>
          </div>
        </div>
        
        <script nonce="${nonce}">
          // Initialize VS Code API
          const vscode = acquireVsCodeApi();
          
          // Global configuration
          window.ptahConfig = {
            isVSCode: true,
            theme: document.body.classList.contains('vscode-dark') ? 'dark' : 'light',
            workspaceRoot: '${vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''}',
          };

          // Handle theme changes
          window.addEventListener('message', event => {
            if (event.data.type === 'theme-change') {
              window.ptahConfig.theme = event.data.theme;
              document.documentElement.setAttribute('data-theme', event.data.theme);
            }
          });
        </script>
        
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'sendMessage':
        await this.handleSendMessage(message.data);
        break;

      case 'attachFiles':
        await this.handleAttachFiles(message.data);
        break;

      case 'newSession':
        await this.handleNewSession();
        break;

      case 'switchSession':
        await this.handleSwitchSession(message.data.sessionId);
        break;

      case 'exportSession':
        await this.handleExportSession(message.data.sessionId);
        break;

      case 'clearSession':
        await this.handleClearSession(message.data.sessionId);
        break;

      case 'ready':
        // Webview is ready, send initial data
        await this.sendInitialData();
        break;
    }
  }

  private async handleSendMessage(data: { content: string; files?: string[] }): Promise<void> {
    try {
      const currentSession = this.sessionManager.getCurrentSession();
      if (!currentSession) {
        await this.sessionManager.createSession();
      }

      // Send user message to webview immediately
      this._view?.webview.postMessage({
        type: 'userMessage',
        data: {
          id: generateId(),
          content: data.content,
          timestamp: new Date().toISOString(),
          files: data.files,
        },
      });

      // Start streaming response from Claude
      const sessionId = this.sessionManager.getCurrentSession()!.id;
      const messageStream = await this.claudeService.sendMessage(
        sessionId,
        data.content,
        data.files
      );

      // Stream responses to webview
      for await (const message of messageStream) {
        this._view?.webview.postMessage({
          type: 'assistantMessage',
          data: message,
        });
      }
    } catch (error) {
      Logger.error('Failed to send message', error);
      this._view?.webview.postMessage({
        type: 'error',
        data: { message: error.message },
      });
    }
  }

  private async handleAttachFiles(data: { uris?: string[] }): Promise<void> {
    const files = data.uris || [];

    if (files.length === 0) {
      // Show file picker
      const selected = await vscode.window.showOpenDialog({
        canSelectMany: true,
        canSelectFiles: true,
        canSelectFolders: false,
        filters: {
          'Code Files': ['ts', 'js', 'tsx', 'jsx', 'py', 'java', 'cpp', 'h'],
          'All Files': ['*'],
        },
      });

      if (selected) {
        const filePaths = selected.map((uri) => uri.fsPath);
        this._view?.webview.postMessage({
          type: 'filesAttached',
          data: { files: filePaths },
        });
      }
    } else {
      // Files already provided (e.g., from drag-and-drop)
      this._view?.webview.postMessage({
        type: 'filesAttached',
        data: { files },
      });
    }
  }

  private async sendInitialData(): Promise<void> {
    const currentSession = this.sessionManager.getCurrentSession();
    const workspaceInfo = this.getWorkspaceInfo();

    this._view?.webview.postMessage({
      type: 'initialized',
      data: {
        session: currentSession,
        workspace: workspaceInfo,
        theme: this.getCurrentTheme(),
      },
    });
  }

  private getCurrentTheme(): string {
    const theme = vscode.window.activeColorTheme;
    return theme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light';
  }

  private getWorkspaceInfo(): any {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;

    return {
      name: workspaceFolder.name,
      path: workspaceFolder.uri.fsPath,
      type: this.detectProjectType(workspaceFolder.uri.fsPath),
    };
  }

  private detectProjectType(path: string): string {
    // Simple project type detection
    if (fs.existsSync(vscode.Uri.joinPath(vscode.Uri.file(path), 'package.json').fsPath)) {
      const packageJson = JSON.parse(
        fs.readFileSync(vscode.Uri.joinPath(vscode.Uri.file(path), 'package.json').fsPath, 'utf8')
      );
      if (packageJson.dependencies?.react) return 'react';
      if (packageJson.dependencies?.vue) return 'vue';
      if (packageJson.dependencies?.angular) return 'angular';
      return 'node';
    }
    if (fs.existsSync(vscode.Uri.joinPath(vscode.Uri.file(path), 'requirements.txt').fsPath))
      return 'python';
    if (fs.existsSync(vscode.Uri.joinPath(vscode.Uri.file(path), 'pom.xml').fsPath)) return 'java';
    if (fs.existsSync(vscode.Uri.joinPath(vscode.Uri.file(path), 'Cargo.toml').fsPath))
      return 'rust';

    return 'general';
  }

  dispose(): void {
    this._disposables.forEach((d) => d.dispose());
  }
}
```

### 5. Context Management Tree Provider

```typescript
// src/providers/context-tree.provider.ts
export class ContextTreeProvider implements vscode.TreeDataProvider<ContextItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ContextItem | undefined | null | void> =
    new vscode.EventEmitter<ContextItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ContextItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private contextItems: Map<string, ContextItem> = new Map();
  private includedFiles: Set<string> = new Set();

  constructor(
    private contextManager: ContextManager,
    private workspaceManager: WorkspaceManager
  ) {
    // Listen to context changes
    this.contextManager.onDidChangeContext(() => {
      this.refresh();
    });

    // Listen to workspace changes
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.refresh();
    });

    // Initial load
    this.loadContextItems();
  }

  refresh(): void {
    this.loadContextItems();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContextItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ContextItem): Promise<ContextItem[]> {
    if (!element) {
      // Root level - show workspace folders and context summary
      const items: ContextItem[] = [];

      // Context summary item
      const summary = new ContextItem(
        'Context Summary',
        vscode.TreeItemCollapsibleState.Collapsed,
        'summary'
      );
      summary.description = `${this.includedFiles.size} files, ${this.getTokenEstimate()} tokens`;
      summary.iconPath = new vscode.ThemeIcon('graph');
      items.push(summary);

      // Workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      for (const folder of workspaceFolders) {
        const folderItem = new ContextItem(
          folder.name,
          vscode.TreeItemCollapsibleState.Expanded,
          'folder'
        );
        folderItem.resourceUri = folder.uri;
        folderItem.contextValue = 'workspaceFolder';
        items.push(folderItem);
      }

      return items;
    }

    if (element.type === 'summary') {
      return this.getContextSummaryItems();
    }

    if (element.type === 'folder' && element.resourceUri) {
      return this.getFolderChildren(element.resourceUri);
    }

    return [];
  }

  private async getContextSummaryItems(): Promise<ContextItem[]> {
    const items: ContextItem[] = [];

    // Token usage
    const tokenUsage = new ContextItem('Token Usage', vscode.TreeItemCollapsibleState.None, 'info');
    tokenUsage.description = `${this.getTokenEstimate()} / 200,000`;
    tokenUsage.iconPath = new vscode.ThemeIcon('pulse');
    items.push(tokenUsage);

    // File count
    const fileCount = new ContextItem(
      'Included Files',
      vscode.TreeItemCollapsibleState.None,
      'info'
    );
    fileCount.description = `${this.includedFiles.size}`;
    fileCount.iconPath = new vscode.ThemeIcon('files');
    items.push(fileCount);

    // Optimization suggestions
    const optimizations = await this.contextManager.getOptimizationSuggestions();
    if (optimizations.length > 0) {
      const optItem = new ContextItem(
        'Optimizations Available',
        vscode.TreeItemCollapsibleState.Collapsed,
        'optimization'
      );
      optItem.description = `${optimizations.length} suggestions`;
      optItem.iconPath = new vscode.ThemeIcon('lightbulb');
      items.push(optItem);
    }

    return items;
  }

  private async getFolderChildren(folderUri: vscode.Uri): Promise<ContextItem[]> {
    try {
      const children = await vscode.workspace.fs.readDirectory(folderUri);
      const items: ContextItem[] = [];

      for (const [name, type] of children) {
        const childUri = vscode.Uri.joinPath(folderUri, name);
        const isIncluded = this.includedFiles.has(childUri.fsPath);

        const item = new ContextItem(
          name,
          type === vscode.FileType.Directory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None,
          type === vscode.FileType.Directory ? 'folder' : 'file'
        );

        item.resourceUri = childUri;
        item.contextValue = type === vscode.FileType.Directory ? 'folder' : 'file';

        // Set inclusion status
        if (isIncluded) {
          item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
          item.tooltip = 'Included in context';
        } else {
          item.iconPath = new vscode.ThemeIcon('circle-outline');
          item.tooltip = 'Not included in context';
        }

        // Add file size and type info for files
        if (type === vscode.FileType.File) {
          try {
            const stat = await vscode.workspace.fs.stat(childUri);
            item.description = `${this.formatFileSize(stat.size)}`;
          } catch (error) {
            // Ignore stat errors
          }
        }

        items.push(item);
      }

      // Sort: folders first, then files, both alphabetically
      items.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.label.localeCompare(b.label);
      });

      return items;
    } catch (error) {
      Logger.error('Failed to read directory', error);
      return [];
    }
  }

  private loadContextItems(): void {
    const currentContext = this.contextManager.getCurrentContext();
    this.includedFiles.clear();

    if (currentContext.includedFiles) {
      for (const file of currentContext.includedFiles) {
        this.includedFiles.add(file);
      }
    }
  }

  private getTokenEstimate(): number {
    // Simple token estimation: ~4 characters per token
    let totalChars = 0;
    for (const filePath of this.includedFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        totalChars += content.length;
      } catch (error) {
        // Ignore read errors
      }
    }
    return Math.ceil(totalChars / 4);
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}

class ContextItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'summary' | 'folder' | 'file' | 'info' | 'optimization'
  ) {
    super(label, collapsibleState);
  }
}
```

---

## 📦 Package.json Configuration

```json
{
  "name": "ptah-claude-code",
  "displayName": "Ptah - Claude Code GUI",
  "description": "Complete visual interface for Claude Code CLI within VS Code",
  "version": "1.0.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["AI", "Machine Learning", "Productivity", "Other"],
  "keywords": ["claude", "ai", "chat", "code-review", "assistant", "anthropic"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "ptah",
          "title": "Ptah - Claude Code",
          "icon": "$(scroll)"
        }
      ]
    },
    "views": {
      "ptah": [
        {
          "type": "webview",
          "id": "ptah.chatSidebar",
          "name": "Chat",
          "icon": "$(comment-discussion)",
          "contextualTitle": "Claude Code Chat"
        },
        {
          "type": "tree",
          "id": "ptah.contextTree",
          "name": "Context Files",
          "icon": "$(files)",
          "contextualTitle": "Context Management"
        }
      ],
      "explorer": [
        {
          "type": "tree",
          "id": "ptah.contextExplorer",
          "name": "Ptah Context",
          "when": "ptah.enabled"
        }
      ]
    },
    "commands": [
      {
        "command": "ptah.quickChat",
        "title": "Quick Chat",
        "category": "Ptah",
        "icon": "$(comment)"
      },
      {
        "command": "ptah.reviewCurrentFile",
        "title": "Review Current File",
        "category": "Ptah",
        "icon": "$(search-review)"
      },
      {
        "command": "ptah.generateTests",
        "title": "Generate Tests",
        "category": "Ptah",
        "icon": "$(beaker)"
      },
      {
        "command": "ptah.buildCommand",
        "title": "Build Command",
        "category": "Ptah",
        "icon": "$(tools)"
      },
      {
        "command": "ptah.newSession",
        "title": "New Session",
        "category": "Ptah",
        "icon": "$(add)"
      },
      {
        "command": "ptah.includeFile",
        "title": "Include in Context",
        "category": "Ptah",
        "icon": "$(add)"
      },
      {
        "command": "ptah.excludeFile",
        "title": "Exclude from Context",
        "category": "Ptah",
        "icon": "$(remove)"
      },
      {
        "command": "ptah.showAnalytics",
        "title": "Show Analytics",
        "category": "Ptah",
        "icon": "$(graph)"
      }
    ],
    "menus": {
      "commandPalette": [
        {
          "command": "ptah.quickChat",
          "when": "ptah.enabled"
        },
        {
          "command": "ptah.reviewCurrentFile",
          "when": "editorIsOpen && ptah.enabled"
        },
        {
          "command": "ptah.generateTests",
          "when": "editorIsOpen && ptah.enabled"
        }
      ],
      "editor/context": [
        {
          "command": "ptah.reviewCurrentFile",
          "when": "ptah.enabled",
          "group": "ptah@1"
        },
        {
          "command": "ptah.generateTests",
          "when": "ptah.enabled",
          "group": "ptah@2"
        }
      ],
      "explorer/context": [
        {
          "command": "ptah.includeFile",
          "when": "ptah.enabled && !ptah.fileIncluded",
          "group": "ptah@1"
        },
        {
          "command": "ptah.excludeFile",
          "when": "ptah.enabled && ptah.fileIncluded",
          "group": "ptah@1"
        }
      ],
      "view/title": [
        {
          "command": "ptah.newSession",
          "when": "view == ptah.chatSidebar",
          "group": "navigation"
        },
        {
          "command": "ptah.showAnalytics",
          "when": "view == ptah.chatSidebar",
          "group": "navigation"
        }
      ]
    },
    "keybindings": [
      {
        "command": "ptah.quickChat",
        "key": "ctrl+shift+p ctrl+shift+c",
        "mac": "cmd+shift+p cmd+shift+c"
      },
      {
        "command": "ptah.reviewCurrentFile",
        "key": "ctrl+shift+p ctrl+shift+r",
        "mac": "cmd+shift+p cmd+shift+r",
        "when": "editorIsOpen"
      },
      {
        "command": "ptah.buildCommand",
        "key": "ctrl+shift+p ctrl+shift+b",
        "mac": "cmd+shift+p cmd+shift+b"
      }
    ],
    "configuration": {
      "title": "Ptah - Claude Code",
      "properties": {
        "ptah.claudeCliPath": {
          "type": "string",
          "default": "claude",
          "description": "Path to Claude Code CLI executable"
        },
        "ptah.defaultProvider": {
          "type": "string",
          "enum": ["anthropic", "bedrock", "vertex"],
          "default": "anthropic",
          "description": "Default Claude provider"
        },
        "ptah.maxTokens": {
          "type": "number",
          "default": 200000,
          "description": "Maximum tokens per session"
        },
        "ptah.autoIncludeOpenFiles": {
          "type": "boolean",
          "default": true,
          "description": "Automatically include open files in context"
        },
        "ptah.contextOptimization": {
          "type": "boolean",
          "default": true,
          "description": "Enable automatic context optimization suggestions"
        },
        "ptah.analyticsEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable usage analytics tracking"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js",
    "build:webview": "ng build --configuration production",
    "dev:webview": "ng build --watch --configuration development"
  },
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "@types/node": "16.x",
    "@typescript-eslint/eslint-plugin": "^5.45.0",
    "@typescript-eslint/parser": "^5.45.0",
    "eslint": "^8.28.0",
    "typescript": "^4.9.4"
  },
  "dependencies": {
    "rxjs": "^7.8.0"
  }
}
```

---

## 🏗️ Angular Webview Integration

### Chat Component Architecture

```typescript
// webview/src/app/chat/chat.component.ts
@Component({
  selector: 'ptah-chat',
  template: `
    <div class="chat-container" [attr.data-theme]="theme">
      <!-- Chat Header -->
      <header class="chat-header">
        <div class="session-info">
          <h3>{{ currentSession?.name || 'New Session' }}</h3>
          <span class="workspace-info" *ngIf="workspaceInfo">
            {{ workspaceInfo.name }} • {{ workspaceInfo.type }}
          </span>
        </div>
        <div class="session-actions">
          <button (click)="newSession()" title="New Session">
            <svg><!-- New icon --></svg>
          </button>
          <button (click)="switchSession()" title="Switch Session">
            <svg><!-- Switch icon --></svg>
          </button>
        </div>
      </header>

      <!-- Token Usage Bar -->
      <div class="token-usage-bar" *ngIf="tokenUsage">
        <div
          class="usage-fill"
          [style.width.%]="(tokenUsage.used / tokenUsage.max) * 100"
          [class.warning]="tokenUsage.used / tokenUsage.max > 0.8"
          [class.danger]="tokenUsage.used / tokenUsage.max > 0.9"
        ></div>
        <span class="usage-text">
          {{ tokenUsage.used | number }} / {{ tokenUsage.max | number }} tokens
        </span>
      </div>

      <!-- Message List -->
      <div class="message-list" #messageList>
        <div
          *ngFor="let message of messages; trackBy: trackByMessage"
          [ngClass]="getMessageClasses(message)"
        >
          <!-- User Message -->
          <div *ngIf="message.type === 'user'" class="user-message">
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="attached-files" *ngIf="message.files?.length">
                <div *ngFor="let file of message.files" class="file-tag">
                  <svg><!-- File icon --></svg>
                  {{ getFileName(file) }}
                </div>
              </div>
            </div>
            <div class="message-timestamp">
              {{ message.timestamp | date: 'short' }}
            </div>
          </div>

          <!-- Assistant Message -->
          <div *ngIf="message.type === 'assistant'" class="assistant-message">
            <div class="message-content">
              <ptah-message-renderer
                [content]="message.content"
                [streaming]="message.id === streamingMessageId"
              >
              </ptah-message-renderer>
            </div>
            <div class="message-actions">
              <button (click)="copyMessage(message)" title="Copy">
                <svg><!-- Copy icon --></svg>
              </button>
              <button (click)="regenerateMessage(message)" title="Regenerate">
                <svg><!-- Refresh icon --></svg>
              </button>
              <span class="token-count" *ngIf="message.tokenCount">
                {{ message.tokenCount }} tokens
              </span>
            </div>
          </div>
        </div>

        <!-- Streaming Indicator -->
        <div class="streaming-indicator" *ngIf="isStreaming">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>Claude is thinking...</span>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <!-- Context Files Preview -->
        <div class="context-files" *ngIf="contextFiles.length">
          <div class="context-header">
            <span>Context: {{ contextFiles.length }} files</span>
            <button (click)="clearContext()" class="clear-context">
              <svg><!-- X icon --></svg>
            </button>
          </div>
          <div class="file-chips">
            <div *ngFor="let file of contextFiles" class="file-chip">
              <svg><!-- File icon --></svg>
              <span>{{ getFileName(file) }}</span>
              <button (click)="removeFromContext(file)">
                <svg><!-- X icon --></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="message-input-container">
          <textarea
            [(ngModel)]="messageInput"
            (keydown)="handleKeyDown($event)"
            placeholder="Ask Claude about your code..."
            class="message-input"
            #messageTextarea
            [disabled]="isStreaming"
          >
          </textarea>

          <div class="input-actions">
            <button
              (click)="attachFiles()"
              class="attach-button"
              title="Attach Files"
              [disabled]="isStreaming"
            >
              <svg><!-- Paperclip icon --></svg>
            </button>

            <button
              (click)="openCommandBuilder()"
              class="command-button"
              title="Command Builder"
              [disabled]="isStreaming"
            >
              <svg><!-- Tools icon --></svg>
            </button>

            <button
              (click)="sendMessage()"
              class="send-button"
              [disabled]="!canSendMessage()"
              title="Send Message"
            >
              <svg><!-- Send icon --></svg>
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button
            *ngFor="let action of quickActions"
            (click)="executeQuickAction(action)"
            class="quick-action-button"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  private vscode = acquireVsCodeApi();
  private destroy$ = new Subject<void>();

  messages: ChatMessage[] = [];
  messageInput = '';
  currentSession?: SessionInfo;
  workspaceInfo?: WorkspaceInfo;
  contextFiles: string[] = [];
  tokenUsage?: TokenUsage;
  isStreaming = false;
  streamingMessageId?: string;
  theme = 'dark';

  quickActions = [
    { label: 'Review Code', command: 'review-current-file' },
    { label: 'Generate Tests', command: 'generate-tests' },
    { label: 'Find Bugs', command: 'find-bugs' },
    { label: 'Add Docs', command: 'add-documentation' },
    { label: 'Optimize', command: 'optimize-code' },
  ];

  ngOnInit(): void {
    this.setupVSCodeCommunication();
    this.notifyReady();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupVSCodeCommunication(): void {
    window.addEventListener('message', (event) => {
      const message = event.data;

      switch (message.type) {
        case 'initialized':
          this.handleInitialized(message.data);
          break;

        case 'userMessage':
          this.addMessage(message.data);
          break;

        case 'assistantMessage':
          this.handleAssistantMessage(message.data);
          break;

        case 'filesAttached':
          this.contextFiles = message.data.files;
          break;

        case 'error':
          this.handleError(message.data);
          break;

        case 'theme-change':
          this.theme = message.data.theme;
          break;
      }
    });
  }

  private handleInitialized(data: any): void {
    this.currentSession = data.session;
    this.workspaceInfo = data.workspace;
    this.theme = data.theme;

    if (this.currentSession?.messages) {
      this.messages = this.currentSession.messages;
    }
  }

  private handleAssistantMessage(message: ChatMessage): void {
    if (message.streaming) {
      // Update existing streaming message
      const existingIndex = this.messages.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        this.messages[existingIndex] = message;
      } else {
        this.addMessage(message);
      }
      this.streamingMessageId = message.id;
    } else {
      // Final message
      this.addMessage(message);
      this.isStreaming = false;
      this.streamingMessageId = undefined;
    }
  }

  sendMessage(): void {
    if (!this.canSendMessage()) return;

    const content = this.messageInput.trim();
    this.messageInput = '';
    this.isStreaming = true;

    this.vscode.postMessage({
      type: 'sendMessage',
      data: {
        content,
        files: this.contextFiles.length > 0 ? this.contextFiles : undefined,
      },
    });
  }

  attachFiles(): void {
    this.vscode.postMessage({
      type: 'attachFiles',
      data: {},
    });
  }

  executeQuickAction(action: { label: string; command: string }): void {
    // Send command to VS Code for execution
    this.vscode.postMessage({
      type: 'executeCommand',
      data: { command: action.command },
    });
  }

  canSendMessage(): boolean {
    return this.messageInput.trim().length > 0 && !this.isStreaming;
  }

  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private scrollToBottom(): void {
    const messageList = document.querySelector('.message-list');
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }

  private notifyReady(): void {
    this.vscode.postMessage({ type: 'ready' });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  trackByMessage(index: number, message: ChatMessage): string {
    return message.id;
  }

  getMessageClasses(message: ChatMessage): string {
    return `message ${message.type} ${message.streaming ? 'streaming' : ''}`;
  }

  getFileName(path: string): string {
    return path.split('/').pop() || path;
  }
}
```

---

## 📊 Performance & Security

### Performance Optimizations

```typescript
// Lazy loading for webview content
class WebviewContentManager {
  private contentCache = new Map<string, string>();

  async getContent(viewType: string): Promise<string> {
    if (this.contentCache.has(viewType)) {
      return this.contentCache.get(viewType)!;
    }

    const content = await this.loadContent(viewType);
    this.contentCache.set(viewType, content);
    return content;
  }

  private async loadContent(viewType: string): Promise<string> {
    // Load and compile Angular content on demand
    const bundlePath = path.join(__dirname, 'webview', `${viewType}.js`);
    return fs.readFile(bundlePath, 'utf8');
  }
}

// Memory management for large sessions
class SessionMemoryManager {
  private readonly MAX_MESSAGES = 1000;

  optimizeSession(session: ChatSession): ChatSession {
    if (session.messages.length > this.MAX_MESSAGES) {
      // Keep recent messages and summarize older ones
      const recentMessages = session.messages.slice(-500);
      const oldMessages = session.messages.slice(0, -500);

      const summary: ChatMessage = {
        id: 'summary',
        type: 'system',
        content: `[Earlier conversation with ${oldMessages.length} messages summarized]`,
        timestamp: new Date(),
        sessionId: session.id,
      };

      return {
        ...session,
        messages: [summary, ...recentMessages],
      };
    }

    return session;
  }
}
```

### Security Implementation

```typescript
// Secure webview content
private getSecureWebviewContent(webview: vscode.Webview): string {
  const nonce = getNonce();

  return `
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   script-src 'nonce-${nonce}' ${webview.cspSource};
                   style-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-inline';
                   font-src ${webview.cspSource};
                   img-src ${webview.cspSource} data: https:;
                   connect-src https:;">
  `;
}

// Input sanitization
class MessageSanitizer {
  static sanitizeInput(input: string): string {
    // Remove potential script injection
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  static validateFilePath(path: string): boolean {
    // Ensure file paths are within workspace
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) return false;

    const resolvedPath = pathModule.resolve(path);
    return resolvedPath.startsWith(workspaceRoot);
  }
}
```

---

## 🚀 Development & Deployment

### Build Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", ".vscode-test", "webview"]
}
```

```json
// webview/angular.json build configuration
{
  "build": {
    "builder": "@angular-devkit/build-angular:browser",
    "options": {
      "outputPath": "../out/webview",
      "index": "src/index.html",
      "main": "src/main.ts",
      "polyfills": "src/polyfills.ts",
      "tsConfig": "tsconfig.app.json",
      "inlineStyleLanguage": "scss",
      "assets": ["src/favicon.ico", "src/assets"],
      "styles": ["src/styles.scss"],
      "scripts": [],
      "optimization": true,
      "outputHashing": "none",
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true
    }
  }
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/build-extension.yml
name: Build Ptah Extension

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build Angular webviews
        run: |
          cd webview
          npm ci
          npm run build:prod

      - name: Build extension
        run: npm run compile

      - name: Run tests
        run: npm test

      - name: Package extension
        run: |
          npm install -g vsce
          vsce package

      - name: Upload VSIX
        uses: actions/upload-artifact@v3
        with:
          name: ptah-extension
          path: '*.vsix'
```

This technical architecture provides a comprehensive foundation for Ptah, transforming Claude Code's CLI capabilities into an intuitive VS Code extension with professional-grade visual interfaces. The modular design supports all planned features while maintaining excellent performance and security standards.
