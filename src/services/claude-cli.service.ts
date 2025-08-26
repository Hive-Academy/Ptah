import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../core/logger';
import { ChatMessage, CommandResult, CommandTemplate } from '../types/common.types';
import { ClaudeCliDetector, ClaudeInstallation } from './claude-cli-detector.service';

export class ClaudeCliService implements vscode.Disposable {
  private activeProcesses = new Map<string, ChildProcess>();
  private claudeInstallation: ClaudeInstallation | null = null;
  private detector: ClaudeCliDetector;

  constructor() {
    this.detector = new ClaudeCliDetector();
  }

  async verifyInstallation(): Promise<boolean> {
    try {
      Logger.info('🔍 Verifying Claude Code CLI installation...');
      
      if (this.claudeInstallation) {
        const isValid = await this.detector.validateInstallation(this.claudeInstallation);
        if (isValid) {
          Logger.info(`✅ Existing Claude CLI installation verified: ${this.claudeInstallation.path}`);
          return true;
        }
      }

      // Detect Claude CLI installation using dedicated detector service
      this.claudeInstallation = await this.detector.detectClaudeInstallation();
      
      if (this.claudeInstallation) {
        Logger.info(`✅ Claude CLI detected: ${this.claudeInstallation.path} (${this.claudeInstallation.source})`);
        return true;
      }

      Logger.error('❌ Claude Code CLI not found. Please install it with: npm install -g @anthropic-ai/claude-code');
      return false;
    } catch (error) {
      Logger.error('Error verifying Claude CLI installation', error);
      return false;
    }
  }

  async startChatSession(sessionId: string, projectPath?: string): Promise<AsyncIterator<ChatMessage>> {
    if (!this.claudeInstallation) {
      throw new Error('Claude CLI not found. Please install Claude Code.');
    }

    const args = ['chat'];
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    if (projectPath) {
      args.push('--project', projectPath);
    } else if (workspaceRoot) {
      args.push('--project', workspaceRoot);
    }

    Logger.info(`Starting Claude chat session: ${sessionId}`);

    const childProcess = spawn(this.claudeInstallation.path, args, {
      cwd: projectPath || workspaceRoot,
      stdio: 'pipe',
      env: { ...process.env }
    });

    this.activeProcesses.set(sessionId, childProcess);

    return this.createChatIterator(childProcess, sessionId);
  }

  private async *createChatIterator(childProcess: ChildProcess, sessionId: string): AsyncIterator<ChatMessage> {
    if (!childProcess.stdout) {
      throw new Error('Child process stdout is null');
    }

    const readline = createInterface({
      input: childProcess.stdout,
      crlfDelay: Infinity
    });

    let currentMessage: Partial<ChatMessage> = {
      id: uuidv4(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      sessionId
    };

    for await (const line of readline) {
      if (line.startsWith('User:') || line.startsWith('Assistant:')) {
        if (currentMessage.content) {
          yield currentMessage as ChatMessage;
        }
        
        currentMessage = {
          id: uuidv4(),
          type: line.startsWith('User:') ? 'user' : 'assistant',
          content: line.substring(line.indexOf(':') + 1).trim(),
          timestamp: new Date(),
          sessionId
        };
      } else {
        currentMessage.content += (currentMessage.content ? '\n' : '') + line;
      }
    }

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
      
      process.stdout?.on('data', (data) => stdout += data);
      process.stderr?.on('data', (data) => stderr += data);
      
      const timeoutId = options.timeout ? setTimeout(() => {
        process.kill();
        reject(new Error(`Command timeout after ${options.timeout}ms`));
      }, options.timeout) : null;
      
      process.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          stdout,
          stderr,
          code: code || 0
        });
      });
      
      process.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  endSession(sessionId: string): void {
    const process = this.activeProcesses.get(sessionId);
    if (process && !process.killed) {
      process.kill();
    }
    this.activeProcesses.delete(sessionId);
  }

  dispose(): void {
    Logger.info('Disposing Claude CLI service...');
    
    // Clean up all active processes
    for (const [sessionId, process] of this.activeProcesses) {
      if (!process.killed) {
        process.kill();
      }
    }
    this.activeProcesses.clear();
  }
}
