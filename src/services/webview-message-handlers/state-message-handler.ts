import * as vscode from 'vscode';
import { BaseWebviewMessageHandler } from './base-message-handler';
import { Logger } from '../../core/logger';

/**
 * StateMessageHandler - Single Responsibility: Handle state management messages
 * Handles saveState, loadState, and state management operations
 */
export class StateMessageHandler extends BaseWebviewMessageHandler {
  readonly messageType = 'saveState';

  constructor(
    postMessage: (message: any) => void,
    private context: vscode.ExtensionContext
  ) {
    super(postMessage);
  }

  canHandle(messageType: string): boolean {
    return messageType === 'saveState' || messageType === 'loadState' || messageType === 'clearState';
  }

  async handle(messageType: string, payload: any): Promise<any> {
    Logger.info(`Handling state message: ${messageType}`);

    try {
      switch (messageType) {
        case 'saveState':
          return await this.handleSaveState(payload);
        case 'loadState':
          return await this.handleLoadState(payload);
        case 'clearState':
          return await this.handleClearState(payload);
        default:
          throw new Error(`Unknown state message type: ${messageType}`);
      }
    } catch (error) {
      Logger.error(`Error in StateMessageHandler.handle: ${error}`);
      this.sendErrorResponse('state:error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async handleSaveState(payload: any): Promise<void> {
    Logger.info('Saving webview state...');
    
    // Handle case where payload might be null/undefined from VS Code setState
    if (payload === null || payload === undefined) {
      payload = {};
    }
    
    if (typeof payload !== 'object') {
      Logger.warn('Invalid state payload type, converting to object:', typeof payload);
      payload = { data: payload };
    }

    // Save the state to VS Code's globalState
    await this.context.globalState.update('ptah.webview.state', payload);
    
    Logger.info('Webview state saved successfully');
    this.sendSuccessResponse('state:saved', { 
      message: 'State saved successfully',
      timestamp: new Date().toISOString()
    });
  }

  private async handleLoadState(payload: any): Promise<void> {
    Logger.info('Loading webview state...');
    
    // Load the state from VS Code's globalState
    const savedState = this.context.globalState.get('ptah.webview.state', {});
    
    Logger.info('Webview state loaded successfully');
    this.sendSuccessResponse('state:loaded', {
      state: savedState,
      timestamp: new Date().toISOString()
    });
  }

  private async handleClearState(payload: any): Promise<void> {
    Logger.info('Clearing webview state...');
    
    // Clear the state from VS Code's globalState
    await this.context.globalState.update('ptah.webview.state', undefined);
    
    Logger.info('Webview state cleared successfully');
    this.sendSuccessResponse('state:cleared', {
      message: 'State cleared successfully',
      timestamp: new Date().toISOString()
    });
  }
}
