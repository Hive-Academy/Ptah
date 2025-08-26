import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../core/logger';
import { ChatSession, ChatMessage, SessionInfo } from '../types/common.types';

export class SessionManager implements vscode.Disposable {
  private sessions: Map<string, ChatSession> = new Map();
  private currentSessionId?: string;
  private disposables: vscode.Disposable[] = [];

  constructor(private context: vscode.ExtensionContext) {
    this.loadSessions();
  }

  async createSession(name?: string): Promise<ChatSession> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspaceId = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;
    
    const session: ChatSession = {
      id: uuidv4(),
      name: name || `Session ${this.sessions.size + 1}`,
      workspaceId,
      messages: [],
      createdAt: new Date(),
      lastActiveAt: new Date(),
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0
      }
    };

    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;
    
    Logger.info(`Created new session: ${session.name} (${session.id})`);
    
    await this.saveSessions();
    return session;
  }

  getCurrentSession(): ChatSession | undefined {
    if (!this.currentSessionId) {
      return undefined;
    }
    return this.sessions.get(this.currentSessionId);
  }

  async switchSession(sessionId: string): Promise<boolean> {
    if (!this.sessions.has(sessionId)) {
      Logger.warn(`Attempted to switch to non-existent session: ${sessionId}`);
      return false;
    }

    this.currentSessionId = sessionId;
    const session = this.sessions.get(sessionId)!;
    session.lastActiveAt = new Date();
    
    Logger.info(`Switched to session: ${session.name} (${sessionId})`);
    
    await this.saveSessions();
    return true;
  }

  async sendMessage(content: string, files?: string[]): Promise<ChatMessage> {
    let session = this.getCurrentSession();
    
    // Create a new session if none exists
    if (!session) {
      session = await this.createSession();
    }

    const message: ChatMessage = {
      id: uuidv4(),
      sessionId: session.id,
      type: 'user',
      content,
      timestamp: new Date(),
      files
    };

    session.messages.push(message);
    session.lastActiveAt = new Date();
    
    Logger.info(`Added message to session ${session.id}: ${content.substring(0, 100)}...`);
    
    await this.saveSessions();
    return message;
  }

  async addAssistantMessage(sessionId: string, content: string, tokenCount?: number): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const message: ChatMessage = {
      id: uuidv4(),
      sessionId,
      type: 'assistant',
      content,
      timestamp: new Date(),
      tokenCount
    };

    session.messages.push(message);
    session.lastActiveAt = new Date();
    
    // Update token usage
    if (tokenCount) {
      session.tokenUsage.output += tokenCount;
      session.tokenUsage.total += tokenCount;
    }
    
    Logger.info(`Added assistant message to session ${sessionId}`);
    
    await this.saveSessions();
    return message;
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => 
      b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
    );
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.sessions.has(sessionId)) {
      return false;
    }

    this.sessions.delete(sessionId);
    
    // If we deleted the current session, clear current session
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = undefined;
    }
    
    Logger.info(`Deleted session: ${sessionId}`);
    
    await this.saveSessions();
    return true;
  }

  async clearSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.messages = [];
    session.tokenUsage = { input: 0, output: 0, total: 0 };
    session.lastActiveAt = new Date();
    
    Logger.info(`Cleared session: ${sessionId}`);
    
    await this.saveSessions();
    return true;
  }

  async renameSession(sessionId: string, newName: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.name = newName;
    session.lastActiveAt = new Date();
    
    Logger.info(`Renamed session ${sessionId} to: ${newName}`);
    
    await this.saveSessions();
    return true;
  }

  async exportSession(sessionId: string, format: 'json' | 'markdown' = 'markdown'): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // Markdown format
    let markdown = `# ${session.name}\\n\\n`;
    markdown += `**Created:** ${session.createdAt.toLocaleDateString()}\\n`;
    markdown += `**Last Active:** ${session.lastActiveAt.toLocaleDateString()}\\n`;
    markdown += `**Messages:** ${session.messages.length}\\n`;
    markdown += `**Tokens:** ${session.tokenUsage.total}\\n\\n`;
    markdown += `---\\n\\n`;

    for (const message of session.messages) {
      const timestamp = message.timestamp.toLocaleString();
      
      if (message.type === 'user') {
        markdown += `## 👤 User (${timestamp})\\n\\n`;
        markdown += `${message.content}\\n\\n`;
        
        if (message.files && message.files.length > 0) {
          markdown += `**Attached Files:**\\n`;
          for (const file of message.files) {
            markdown += `- ${file}\\n`;
          }
          markdown += `\\n`;
        }
      } else if (message.type === 'assistant') {
        markdown += `## 🤖 Claude (${timestamp})\\n\\n`;
        markdown += `${message.content}\\n\\n`;
        
        if (message.tokenCount) {
          markdown += `*Tokens: ${message.tokenCount}*\\n\\n`;
        }
      }
      
      markdown += `---\\n\\n`;
    }

    return markdown;
  }

  async showSessionPicker(): Promise<void> {
    const sessions = this.getAllSessions();
    
    if (sessions.length === 0) {
      vscode.window.showInformationMessage('No sessions available. Create a new session to get started.');
      return;
    }

    interface SessionQuickPickItem extends vscode.QuickPickItem {
      session: ChatSession;
    }

    const items: SessionQuickPickItem[] = sessions.map(session => ({
      label: session.name,
      description: `${session.messages.length} messages • ${session.tokenUsage.total} tokens`,
      detail: `Last active: ${session.lastActiveAt.toLocaleDateString()}`,
      session
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a session to switch to',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (selected) {
      await this.switchSession(selected.session.id);
    }
  }

  private loadSessions(): void {
    try {
      const sessionsData = this.context.globalState.get<any[]>('ptah.sessions', []);
      const currentSessionId = this.context.globalState.get<string>('ptah.currentSessionId');
      
      for (const sessionData of sessionsData) {
        // Convert date strings back to Date objects
        const session: ChatSession = {
          ...sessionData,
          createdAt: new Date(sessionData.createdAt),
          lastActiveAt: new Date(sessionData.lastActiveAt),
          messages: sessionData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
        
        this.sessions.set(session.id, session);
      }
      
      this.currentSessionId = currentSessionId;
      
      Logger.info(`Loaded ${this.sessions.size} sessions from storage`);
    } catch (error) {
      Logger.error('Failed to load sessions from storage', error);
    }
  }

  private async saveSessions(): Promise<void> {
    try {
      const sessionsData = Array.from(this.sessions.values());
      await this.context.globalState.update('ptah.sessions', sessionsData);
      await this.context.globalState.update('ptah.currentSessionId', this.currentSessionId);
      
      Logger.info(`Saved ${sessionsData.length} sessions to storage`);
    } catch (error) {
      Logger.error('Failed to save sessions to storage', error);
    }
  }

  dispose(): void {
    Logger.info('Disposing Session Manager...');
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
