import * as vscode from 'vscode';
import { BaseWebviewMessageHandler } from './base-message-handler';
import { ContextManager } from '../context-manager';

/**
 * ContextMessageHandler - Single Responsibility: Handle context management messages
 */
export class ContextMessageHandler extends BaseWebviewMessageHandler {
  readonly messageType = 'context:';

  constructor(
    postMessage: (message: any) => void,
    private contextManager: ContextManager
  ) {
    super(postMessage);
  }

  async handle(messageType: string, payload: any): Promise<any> {
    const action = messageType.replace(this.messageType, '');
    
    switch (action) {
      case 'getFiles':
        return await this.handleGetContextFiles();
      case 'includeFile':
        return await this.handleIncludeFile(payload);
      case 'excludeFile':
        return await this.handleExcludeFile(payload);
      default:
        throw new Error(`Unknown context action: ${action}`);
    }
  }

  private async handleGetContextFiles(): Promise<void> {
    try {
      const context = await this.contextManager.getCurrentContext();
      this.sendSuccessResponse('context:files', { context });
    } catch (error) {
      this.sendErrorResponse('context:getFiles', error instanceof Error ? error.message : 'Failed to get context files');
    }
  }

  private async handleIncludeFile(data: { filePath: string }): Promise<void> {
    try {
      await this.contextManager.includeFile(vscode.Uri.file(data.filePath));
      const context = await this.contextManager.getCurrentContext();
      this.sendSuccessResponse('context:updated', { context });
    } catch (error) {
      this.sendErrorResponse('context:includeFile', error instanceof Error ? error.message : 'Failed to include file');
    }
  }

  private async handleExcludeFile(data: { filePath: string }): Promise<void> {
    try {
      await this.contextManager.excludeFile(vscode.Uri.file(data.filePath));
      const context = await this.contextManager.getCurrentContext();
      this.sendSuccessResponse('context:updated', { context });
    } catch (error) {
      this.sendErrorResponse('context:excludeFile', error instanceof Error ? error.message : 'Failed to exclude file');
    }
  }
}
