import * as vscode from 'vscode';
import { Logger } from './logger';
import { ClaudeCliService } from '../services/claude-cli.service';
import { SessionManager } from '../services/session-manager';
import { ContextManager } from '../services/context-manager';
import { WorkspaceManager } from '../services/workspace-manager';
import { ChatSidebarProvider } from '../providers/chat-sidebar.provider';

export class PtahExtension implements vscode.Disposable {
  private static _instance: PtahExtension;
  private disposables: vscode.Disposable[] = [];
  
  // Core services
  private claudeCliService!: ClaudeCliService;
  private sessionManager!: SessionManager;
  private contextManager!: ContextManager;
  private workspaceManager!: WorkspaceManager;
  
  // UI providers
  private chatSidebarProvider!: ChatSidebarProvider;

  constructor(private context: vscode.ExtensionContext) {
    PtahExtension._instance = this;
    Logger.initialize();
  }

  static get instance(): PtahExtension {
    return PtahExtension._instance;
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing Ptah extension services...');
    
    // Initialize core services
    this.claudeCliService = new ClaudeCliService();
    this.sessionManager = new SessionManager(this.context);
    this.contextManager = new ContextManager();
    this.workspaceManager = new WorkspaceManager();

    // Verify Claude Code CLI availability
    const isClaudeAvailable = await this.claudeCliService.verifyInstallation();
    if (!isClaudeAvailable) {
      await this.handleClaudeNotFound();
      return;
    }

    // Initialize UI providers
    await this.initializeProviders();
    
    Logger.info('Ptah extension services initialized successfully');
  }

  async registerAll(): Promise<void> {
    Logger.info('Registering extension components...');
    
    // Register webview providers
    this.registerWebviewProviders();
    
    // Register commands
    this.registerCommands();
    
    // Register event handlers
    this.registerEventHandlers();
    
    Logger.info('Extension components registered successfully');
  }

  private async initializeProviders(): Promise<void> {
    // Initialize chat sidebar provider
    this.chatSidebarProvider = new ChatSidebarProvider(
      this.context,
      this.sessionManager,
      this.claudeCliService,
      this.contextManager
    );
  }

  private registerWebviewProviders(): void {
    // Register chat sidebar
    this.disposables.push(
      vscode.window.registerWebviewViewProvider(
        'ptah.chatSidebar',
        this.chatSidebarProvider,
        { webviewOptions: { retainContextWhenHidden: true } }
      )
    );
  }

  private registerCommands(): void {
    const commands = [
      // Quick actions
      vscode.commands.registerCommand('ptah.quickChat', () => this.quickChat()),
      vscode.commands.registerCommand('ptah.reviewCurrentFile', () => this.reviewCurrentFile()),
      vscode.commands.registerCommand('ptah.generateTests', () => this.generateTests()),
      vscode.commands.registerCommand('ptah.buildCommand', () => this.buildCommand()),
      vscode.commands.registerCommand('ptah.newSession', () => this.newSession()),
      vscode.commands.registerCommand('ptah.includeFile', (uri) => this.includeFile(uri)),
      vscode.commands.registerCommand('ptah.excludeFile', (uri) => this.excludeFile(uri)),
      vscode.commands.registerCommand('ptah.showAnalytics', () => this.showAnalytics()),
    ];

    this.disposables.push(...commands);
  }

  private registerEventHandlers(): void {
    // Handle workspace changes
    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.contextManager.refreshContext();
      })
    );

    // Handle file changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        // Update context if the changed file is included
        if (this.contextManager.isFileIncluded(event.document.uri.fsPath)) {
          this.contextManager.updateFileContent(event.document.uri.fsPath, event.document.getText());
        }
      })
    );
  }

  private async handleClaudeNotFound(): Promise<void> {
    const message = 'Claude Code CLI not found. Please install Claude Code to use Ptah.';
    const actions = ['Install Guide', 'Retry', 'Configure Path'];
    
    const selection = await vscode.window.showWarningMessage(message, ...actions);
    
    if (selection === 'Install Guide') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/anthropics/claude-code#installation'));
    } else if (selection === 'Retry') {
      await this.claudeCliService.verifyInstallation();
    } else if (selection === 'Configure Path') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'ptah.claudeCliPath');
    }
  }

  async showWelcome(): Promise<void> {
    const message = 'Welcome to Ptah! Ready to transform your Claude Code experience?';
    const actions = ['Get Started', 'Documentation'];
    
    const selection = await vscode.window.showInformationMessage(message, ...actions);
    
    if (selection === 'Get Started') {
      // Open chat sidebar and show quick tour
      await vscode.commands.executeCommand('ptah.chatSidebar.focus');
    } else if (selection === 'Documentation') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-org/ptah-claude-code#readme'));
    }
  }

  // Command handlers
  private async quickChat(): Promise<void> {
    await vscode.commands.executeCommand('ptah.chatSidebar.focus');
    // Focus on input area
  }

  private async reviewCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No file is currently open to review.');
      return;
    }

    // Add current file to context and send review command
    const filePath = editor.document.uri.fsPath;
    await this.contextManager.includeFile(vscode.Uri.file(filePath));
    
    // Send review message to chat
    const reviewMessage = `Please review this code for bugs, security issues, and improvements:\\n\\n${editor.document.getText()}`;
    await this.sessionManager.sendMessage(reviewMessage, [filePath]);
  }

  private async generateTests(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No file is currently open to generate tests for.');
      return;
    }

    // Add current file to context and send test generation command
    const filePath = editor.document.uri.fsPath;
    await this.contextManager.includeFile(vscode.Uri.file(filePath));
    
    const testMessage = `Generate comprehensive unit tests for this code:\\n\\n${editor.document.getText()}`;
    await this.sessionManager.sendMessage(testMessage, [filePath]);
  }

  private async buildCommand(): Promise<void> {
    // Open command builder (will implement later)
    vscode.window.showInformationMessage('Command builder coming soon!');
  }

  private async newSession(): Promise<void> {
    await this.sessionManager.createSession();
  }

  private async includeFile(uri: vscode.Uri): Promise<void> {
    await this.contextManager.includeFile(uri);
  }

  private async excludeFile(uri: vscode.Uri): Promise<void> {
    await this.contextManager.excludeFile(uri);
  }

  private async showAnalytics(): Promise<void> {
    vscode.window.showInformationMessage('Analytics dashboard coming soon!');
  }

  dispose(): void {
    Logger.info('Disposing Ptah extension...');
    
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    
    // Dispose services
    this.claudeCliService?.dispose();
    this.sessionManager?.dispose();
    this.contextManager?.dispose();
    this.workspaceManager?.dispose();
    
    Logger.dispose();
  }
}
