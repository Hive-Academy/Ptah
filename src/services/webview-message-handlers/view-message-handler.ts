import { BaseWebviewMessageHandler } from './base-message-handler';
import { Logger } from '../../core/logger';

/**
 * ViewMessageHandler - Handles view-related messages from Angular webview
 * Single Responsibility: Manage view state changes and navigation events
 */
export class ViewMessageHandler extends BaseWebviewMessageHandler {
  messageType = 'view';

  /**
   * Check if this handler can process the message
   */
  canHandle(messageType: string): boolean {
    return messageType === 'viewChanged' || 
           messageType === 'route-changed' || 
           messageType === 'view';
  }

  /**
   * Handle view-related messages
   */
  async handle(messageType: string, payload: any): Promise<void> {
    Logger.info(`Handling view message: ${messageType}`, payload);

    switch (messageType) {
      case 'viewChanged':
        await this.handleViewChanged(payload);
        break;
      
      case 'route-changed':
        await this.handleRouteChanged(payload);
        break;
      
      case 'view':
        await this.handleGenericView(payload);
        break;
      
      default:
        Logger.warn(`Unhandled view message type: ${messageType}`);
    }
  }

  /**
   * Handle view change events from Angular
   */
  private async handleViewChanged(payload: any): Promise<void> {
    Logger.info(`View changed to: ${payload?.view || 'unknown'}`);
    
    // Could potentially update extension state or context here
    // For now, just log the view change
    if (payload?.view) {
      Logger.info(`Angular webview navigated to: ${payload.view}`);
    }
  }

  /**
   * Handle route change events from Angular router
   */
  private async handleRouteChanged(payload: any): Promise<void> {
    Logger.info(`Route changed to: ${payload?.route || 'unknown'}`);
    
    // Track route changes for analytics or state management
    if (payload?.route) {
      Logger.info(`Angular router navigated to: ${payload.route}`);
    }
  }

  /**
   * Handle generic view messages
   */
  private async handleGenericView(payload: any): Promise<void> {
    Logger.info('Handling generic view message', payload);
  }
}
