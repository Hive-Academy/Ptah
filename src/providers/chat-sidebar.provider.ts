import * as vscode from 'vscode';
import { Logger } from '../core/logger';
import { SessionManager } from '../services/session-manager';
import { ClaudeCliService } from '../services/claude-cli.service';
import { ContextManager } from '../services/context-manager';
import { ChatMessage } from '../types/common.types';

export class ChatSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    private sessionManager: SessionManager,
    private claudeService: ClaudeCliService,
    private contextManager: ContextManager
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
        vscode.Uri.joinPath(this.context.extensionUri, 'out')
      ]
    };

    // Set HTML content
    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      this.handleWebviewMessage.bind(this),
      undefined,
      this._disposables
    );

    // Handle visibility changes
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refreshCurrentSession();
      }
    });

    // Send initial data
    this.sendInitialData();
  }

  private getWebviewContent(webview: vscode.Webview): string {
    // Generate nonce for security
    const nonce = this.getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" 
              content="default-src 'none'; 
                       script-src 'nonce-${nonce}';
                       style-src 'unsafe-inline';
                       font-src data:;
                       img-src data: https:;">
        <title>Ptah Chat</title>
        <style>
          :root {
            --vscode-foreground: var(--vscode-foreground);
            --vscode-background: var(--vscode-editor-background);
            --vscode-input-background: var(--vscode-input-background);
            --vscode-button-background: var(--vscode-button-background);
            --ptah-accent: #d4af37;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background: var(--vscode-background);
            color: var(--vscode-foreground);
            height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .chat-header {
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--vscode-sideBar-background);
          }

          .session-info h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
          }

          .workspace-info {
            font-size: 11px;
            opacity: 0.7;
            margin-top: 2px;
          }

          .session-actions {
            display: flex;
            gap: 4px;
          }

          .session-actions button {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 4px;
            border-radius: 3px;
          }

          .session-actions button:hover {
            background: var(--vscode-toolbar-hoverBackground);
          }

          .token-usage-bar {
            height: 3px;
            background: var(--vscode-progressBar-background);
            position: relative;
            margin: 0 12px;
          }

          .usage-fill {
            height: 100%;
            background: var(--ptah-accent);
            transition: width 0.3s ease;
          }

          .usage-fill.warning {
            background: var(--vscode-editorWarning-foreground);
          }

          .usage-fill.danger {
            background: var(--vscode-editorError-foreground);
          }

          .message-list {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .message {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .user-message {
            align-self: flex-end;
            max-width: 80%;
          }

          .user-message .message-content {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            padding: 8px 12px;
            border-radius: 12px 12px 4px 12px;
            word-wrap: break-word;
          }

          .assistant-message {
            align-self: flex-start;
            max-width: 90%;
          }

          .assistant-message .message-content {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            padding: 8px 12px;
            border-radius: 12px 12px 12px 4px;
            word-wrap: break-word;
          }

          .message-timestamp {
            font-size: 10px;
            opacity: 0.6;
            text-align: right;
            margin-top: 2px;
          }

          .assistant-message .message-timestamp {
            text-align: left;
          }

          .attached-files {
            margin-top: 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }

          .file-tag {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            display: flex;
            align-items: center;
            gap: 2px;
          }

          .input-area {
            border-top: 1px solid var(--vscode-panel-border);
            padding: 12px;
            background: var(--vscode-sideBar-background);
          }

          .message-input-container {
            display: flex;
            gap: 8px;
            align-items: flex-end;
          }

          .message-input {
            flex: 1;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-input-foreground);
            padding: 8px;
            border-radius: 4px;
            resize: none;
            min-height: 20px;
            max-height: 100px;
            font-family: inherit;
            font-size: inherit;
          }

          .message-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
          }

          .send-button {
            background: var(--ptah-accent);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
          }

          .send-button:hover:not(:disabled) {
            opacity: 0.9;
          }

          .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .quick-actions {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }

          .quick-action-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          }

          .quick-action-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
          }

          .loading {
            text-align: center;
            padding: 20px;
            opacity: 0.7;
          }

          .streaming-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            opacity: 0.7;
            font-style: italic;
          }

          .typing-dots {
            display: flex;
            gap: 2px;
          }

          .typing-dots span {
            width: 4px;
            height: 4px;
            background: var(--vscode-foreground);
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
          }

          .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
          .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

          @keyframes typing {
            0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }

          pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
          }

          code {
            background: var(--vscode-textCodeBlock-background);
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 12px;
          }

          .error-message {
            color: var(--vscode-errorForeground);
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
          }
        </style>
      </head>
      <body>
        <div id="ptah-chat-root">
          <div class="chat-container">
            <!-- Chat Header -->
            <header class="chat-header">
              <div class="session-info">
                <h3 id="session-name">New Session</h3>
                <div class="workspace-info" id="workspace-info"></div>
              </div>
              <div class="session-actions">
                <button onclick="newSession()" title="New Session">+</button>
                <button onclick="switchSession()" title="Switch Session">⇄</button>
              </div>
            </header>

            <!-- Token Usage Bar -->
            <div class="token-usage-bar" style="display: none;" id="token-bar">
              <div class="usage-fill" id="usage-fill"></div>
            </div>

            <!-- Message List -->
            <div class="message-list" id="message-list">
              <div class="loading" id="loading">
                <p>Initializing Ptah Chat...</p>
              </div>
            </div>

            <!-- Input Area -->
            <div class="input-area">
              <div class="message-input-container">
                <textarea 
                  id="message-input"
                  placeholder="Ask Claude about your code..."
                  rows="1"></textarea>
                <button id="send-button" class="send-button" onclick="sendMessage()">Send</button>
              </div>
              
              <div class="quick-actions">
                <button class="quick-action-button" onclick="executeQuickAction('review-current-file')">Review Code</button>
                <button class="quick-action-button" onclick="executeQuickAction('generate-tests')">Generate Tests</button>
                <button class="quick-action-button" onclick="executeQuickAction('find-bugs')">Find Bugs</button>
                <button class="quick-action-button" onclick="executeQuickAction('add-documentation')">Add Docs</button>
                <button class="quick-action-button" onclick="executeQuickAction('optimize-code')">Optimize</button>
              </div>
            </div>
          </div>
        </div>
        
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          let isStreaming = false;
          let currentSession = null;
          
          // DOM elements
          const messageList = document.getElementById('message-list');
          const messageInput = document.getElementById('message-input');
          const sendButton = document.getElementById('send-button');
          const sessionName = document.getElementById('session-name');
          const workspaceInfo = document.getElementById('workspace-info');
          const loading = document.getElementById('loading');
          const tokenBar = document.getElementById('token-bar');
          const usageFill = document.getElementById('usage-fill');

          // Initialize
          window.addEventListener('load', () => {
            notifyReady();
            setupEventHandlers();
          });

          function notifyReady() {
            vscode.postMessage({ type: 'ready' });
          }

          function setupEventHandlers() {
            messageInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            });

            messageInput.addEventListener('input', () => {
              adjustTextareaHeight();
              updateSendButton();
            });
          }

          function adjustTextareaHeight() {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
          }

          function updateSendButton() {
            const canSend = messageInput.value.trim().length > 0 && !isStreaming;
            sendButton.disabled = !canSend;
          }

          function sendMessage() {
            const content = messageInput.value.trim();
            if (!content || isStreaming) return;

            // Add user message immediately
            addMessage({
              type: 'user',
              content: content,
              timestamp: new Date().toISOString()
            });

            // Clear input
            messageInput.value = '';
            adjustTextareaHeight();
            updateSendButton();

            // Set streaming state
            isStreaming = true;
            updateSendButton();

            // Show streaming indicator
            showStreamingIndicator();

            // Send to extension
            vscode.postMessage({
              type: 'sendMessage',
              data: { content }
            });
          }

          function addMessage(message) {
            // Remove loading if present
            if (loading.parentNode) {
              loading.remove();
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${message.type}-message\`;
            messageDiv.dataset.messageId = message.id || 'temp';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            if (message.isError) {
              contentDiv.classList.add('error-message');
            }

            // Format content with basic markdown support
            contentDiv.innerHTML = formatMessageContent(message.content);

            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'message-timestamp';
            timestampDiv.textContent = new Date(message.timestamp).toLocaleTimeString();

            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(timestampDiv);

            messageList.appendChild(messageDiv);
            scrollToBottom();
          }

          function formatMessageContent(content) {
            // Basic markdown formatting
            return content
              .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
              .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
              .replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>')
              .replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>')
              .replace(/\\n/g, '<br>');
          }

          function showStreamingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'streaming-indicator';
            indicator.id = 'streaming-indicator';
            indicator.innerHTML = \`
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Claude is thinking...</span>
            \`;
            messageList.appendChild(indicator);
            scrollToBottom();
          }

          function hideStreamingIndicator() {
            const indicator = document.getElementById('streaming-indicator');
            if (indicator) {
              indicator.remove();
            }
          }

          function scrollToBottom() {
            messageList.scrollTop = messageList.scrollHeight;
          }

          function newSession() {
            vscode.postMessage({ type: 'newSession' });
          }

          function switchSession() {
            vscode.postMessage({ type: 'switchSession' });
          }

          function executeQuickAction(action) {
            vscode.postMessage({ 
              type: 'executeCommand', 
              data: { command: action } 
            });
          }

          // Handle messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
              case 'initialized':
                handleInitialized(message.data);
                break;
                
              case 'userMessage':
                // User message already added when sending
                break;
                
              case 'assistantMessage':
                handleAssistantMessage(message.data);
                break;
                
              case 'streamingComplete':
                isStreaming = false;
                hideStreamingIndicator();
                updateSendButton();
                break;
                
              case 'error':
                handleError(message.data);
                break;
                
              case 'sessionUpdated':
                updateSessionInfo(message.data);
                break;
            }
          });

          function handleInitialized(data) {
            if (data.session) {
              currentSession = data.session;
              sessionName.textContent = data.session.name;
              
              // Load existing messages
              messageList.innerHTML = '';
              if (data.session.messages && data.session.messages.length > 0) {
                data.session.messages.forEach(msg => addMessage(msg));
              }
            }
            
            if (data.workspace) {
              workspaceInfo.textContent = \`\${data.workspace.name} • \${data.workspace.type}\`;
            }
            
            // Remove initial loading
            if (loading.parentNode) {
              loading.remove();
            }
          }

          function handleAssistantMessage(message) {
            hideStreamingIndicator();
            addMessage(message);
            
            if (!message.streaming) {
              isStreaming = false;
              updateSendButton();
            }
          }

          function handleError(error) {
            hideStreamingIndicator();
            addMessage({
              type: 'system',
              content: error.message || 'An error occurred',
              timestamp: new Date().toISOString(),
              isError: true
            });
            
            isStreaming = false;
            updateSendButton();
          }

          function updateSessionInfo(session) {
            currentSession = session;
            sessionName.textContent = session.name;
            
            // Update token usage if available
            if (session.tokenUsage) {
              const percentage = (session.tokenUsage.total / 200000) * 100;
              usageFill.style.width = percentage + '%';
              
              if (percentage > 90) {
                usageFill.className = 'usage-fill danger';
              } else if (percentage > 80) {
                usageFill.className = 'usage-fill warning';
              } else {
                usageFill.className = 'usage-fill';
              }
              
              tokenBar.style.display = 'block';
            }
          }

          // Initialize UI state
          updateSendButton();
        </script>
      </body>
      </html>
    `;
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'ready':
        await this.sendInitialData();
        break;
        
      case 'sendMessage':
        await this.handleSendMessage(message.data);
        break;
        
      case 'newSession':
        await this.handleNewSession();
        break;
        
      case 'switchSession':
        await this.handleSwitchSession();
        break;
        
      case 'executeCommand':
        await this.handleExecuteCommand(message.data);
        break;
    }
  }

  private async handleSendMessage(data: { content: string; files?: string[] }): Promise<void> {
    try {
      // Add user message to session
      const userMessage = await this.sessionManager.sendMessage(data.content, data.files);
      
      // Get current session for Claude interaction
      const currentSession = this.sessionManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Start Claude chat if not already started
      try {
        // For now, we'll simulate Claude responses since we don't have the actual Claude CLI
        // In a real implementation, this would start the Claude process and stream responses
        
        setTimeout(async () => {
          const assistantMessage: ChatMessage = {
            id: this.getNonce(),
            sessionId: currentSession.id,
            type: 'assistant',
            content: `I received your message: "${data.content}". This is a simulated response while we're setting up the Claude CLI integration. The actual implementation will connect to Claude Code CLI and stream real responses.`,
            timestamp: new Date(),
            tokenCount: 150
          };

          await this.sessionManager.addAssistantMessage(
            currentSession.id, 
            assistantMessage.content, 
            assistantMessage.tokenCount
          );

          this._view?.webview.postMessage({
            type: 'assistantMessage',
            data: assistantMessage
          });

          this._view?.webview.postMessage({
            type: 'streamingComplete'
          });
        }, 1000);

      } catch (error) {
        Logger.error('Failed to get Claude response', error);
        this._view?.webview.postMessage({
          type: 'error',
          data: { message: 'Failed to get response from Claude. Please check your Claude CLI installation.' }
        });
      }

    } catch (error) {
      Logger.error('Failed to send message', error);
      this._view?.webview.postMessage({
        type: 'error',
        data: { message: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private async handleNewSession(): Promise<void> {
    try {
      const session = await this.sessionManager.createSession();
      await this.sendSessionUpdate(session);
    } catch (error) {
      Logger.error('Failed to create new session', error);
    }
  }

  private async handleSwitchSession(): Promise<void> {
    try {
      await this.sessionManager.showSessionPicker();
      // Session update will be handled by the session manager
    } catch (error) {
      Logger.error('Failed to switch session', error);
    }
  }

  private async handleExecuteCommand(data: { command: string }): Promise<void> {
    try {
      switch (data.command) {
        case 'review-current-file':
          await vscode.commands.executeCommand('ptah.reviewCurrentFile');
          break;
        case 'generate-tests':
          await vscode.commands.executeCommand('ptah.generateTests');
          break;
        case 'find-bugs':
          await this.sessionManager.sendMessage('Please analyze the current code for potential bugs and issues.');
          break;
        case 'add-documentation':
          await this.sessionManager.sendMessage('Please add comprehensive documentation to the current code.');
          break;
        case 'optimize-code':
          await this.sessionManager.sendMessage('Please suggest optimizations for the current code.');
          break;
      }
    } catch (error) {
      Logger.error('Failed to execute command', error);
    }
  }

  private async sendInitialData(): Promise<void> {
    const currentSession = this.sessionManager.getCurrentSession();
    const workspaceInfo = this.getWorkspaceInfo();
    
    this._view?.webview.postMessage({
      type: 'initialized',
      data: {
        session: currentSession,
        workspace: workspaceInfo
      }
    });
  }

  private async sendSessionUpdate(session: any): Promise<void> {
    this._view?.webview.postMessage({
      type: 'sessionUpdated',
      data: session
    });
  }

  private refreshCurrentSession(): void {
    const currentSession = this.sessionManager.getCurrentSession();
    if (currentSession) {
      this.sendSessionUpdate(currentSession);
    }
  }

  private getWorkspaceInfo(): any {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;

    return {
      name: workspaceFolder.name,
      path: workspaceFolder.uri.fsPath,
      type: this.detectProjectType(workspaceFolder.uri.fsPath)
    };
  }

  private detectProjectType(path: string): string {
    // Simple project type detection
    try {
      const fs = require('fs');
      if (fs.existsSync(require('path').join(path, 'package.json'))) {
        const packageJson = JSON.parse(fs.readFileSync(require('path').join(path, 'package.json'), 'utf8'));
        if (packageJson.dependencies?.react) return 'react';
        if (packageJson.dependencies?.vue) return 'vue';
        if (packageJson.dependencies?.angular) return 'angular';
        return 'node';
      }
      if (fs.existsSync(require('path').join(path, 'requirements.txt'))) return 'python';
      if (fs.existsSync(require('path').join(path, 'pom.xml'))) return 'java';
      if (fs.existsSync(require('path').join(path, 'Cargo.toml'))) return 'rust';
    } catch (error) {
      // Ignore errors
    }
    
    return 'general';
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  dispose(): void {
    this._disposables.forEach(d => d.dispose());
  }
}
