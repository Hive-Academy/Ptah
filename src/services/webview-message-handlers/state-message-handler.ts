import * as vscode from 'vscode';
import { BaseWebviewMessageHandler, StrictPostMessageFunction, IWebviewMessageHandler } from './base-message-handler';
import { StrictMessageType, MessagePayloadMap, MessageResponse } from '../../types/message.types';
import { CorrelationId } from '../../types/branded.types';
import { Logger } from '../../core/logger';

/**
 * State Message Types - Strict type definition
 */
type StateMessageTypes = 'state:save' | 'state:load' | 'state:clear';

/**
 * StateMessageHandler - Single Responsibility: Handle state management messages
 * Handles saveState, loadState, and state management operations
 */
export class StateMessageHandler extends BaseWebviewMessageHandler<StateMessageTypes> 
  implements IWebviewMessageHandler<StateMessageTypes> {
  readonly messageType = 'state:';

  constructor(
    postMessage: StrictPostMessageFunction,
    private context: vscode.ExtensionContext
  ) {
    super(postMessage);
  }


  async handle<K extends StateMessageTypes>(messageType: K, payload: MessagePayloadMap[K]): Promise<MessageResponse> {
    Logger.info(`Handling state message: ${messageType}`);

    try {
      switch (messageType) {
        case 'state:save':
          return await this.handleSaveState(payload as any);
        case 'state:load':
          return await this.handleLoadState(payload as any);
        case 'state:clear':
          return await this.handleClearState(payload as any);
        default:
          throw new Error(`Unknown state message type: ${messageType}`);
      }
    } catch (error) {
      Logger.error(`Error in StateMessageHandler.handle: ${error}`);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendErrorResponse('state:error', errorMessage);
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'STATE_HANDLER_ERROR',
          message: errorMessage
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    }
  }

  private async handleSaveState(payload: any): Promise<MessageResponse> {
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
    const responseData = { 
      message: 'State saved successfully',
      timestamp: new Date().toISOString()
    };
    this.sendSuccessResponse('state:saved', responseData);
    
    return {
      requestId: CorrelationId.create(),
      success: true,
      data: responseData,
      metadata: {
        timestamp: Date.now(),
        source: 'extension',
        version: '1.0.0'
      }
    };
  }

  private async handleLoadState(payload: any): Promise<MessageResponse> {
    Logger.info('Loading webview state...');
    
    // Load the state from VS Code's globalState
    const savedState = this.context.globalState.get('ptah.webview.state', {});
    
    Logger.info('Webview state loaded successfully');
    const responseData = {
      state: savedState,
      timestamp: new Date().toISOString()
    };
    this.sendSuccessResponse('state:loaded', responseData);
    
    return {
      requestId: CorrelationId.create(),
      success: true,
      data: responseData,
      metadata: {
        timestamp: Date.now(),
        source: 'extension',
        version: '1.0.0'
      }
    };
  }

  private async handleClearState(payload: any): Promise<MessageResponse> {
    Logger.info('Clearing webview state...');
    
    // Clear the state from VS Code's globalState
    await this.context.globalState.update('ptah.webview.state', undefined);
    
    Logger.info('Webview state cleared successfully');
    const responseData = {
      message: 'State cleared successfully',
      timestamp: new Date().toISOString()
    };
    this.sendSuccessResponse('state:cleared', responseData);
    
    return {
      requestId: CorrelationId.create(),
      success: true,
      data: responseData,
      metadata: {
        timestamp: Date.now(),
        source: 'extension',
        version: '1.0.0'
      }
    };
  }
}
