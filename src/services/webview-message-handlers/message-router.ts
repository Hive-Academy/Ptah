import { IWebviewMessageHandler } from './base-message-handler';
import { Logger } from '../../core/logger';

/**
 * WebviewMessageRouter - Single Responsibility: Route messages to appropriate handlers
 * Follows Open/Closed Principle - new handlers can be added without modifying this class
 */
export class WebviewMessageRouter {
  private handlers: IWebviewMessageHandler[] = [];

  /**
   * Register a message handler
   * Follows Dependency Inversion Principle - depends on abstraction, not concrete classes
   */
  registerHandler(handler: IWebviewMessageHandler): void {
    this.handlers.push(handler);
    Logger.info(`Registered message handler for: ${handler.messageType}`);
  }

  /**
   * Route a message to the appropriate handler
   */
  async routeMessage(messageType: string, payload: any): Promise<void> {
    const handler = this.findHandler(messageType);
    
    if (!handler) {
      Logger.warn(`No handler found for message type: ${messageType}`);
      throw new Error(`Unknown message type: ${messageType}`);
    }

    try {
      await handler.handle(messageType, payload);
      Logger.info(`Successfully handled message: ${messageType}`);
    } catch (error) {
      Logger.error(`Error handling message ${messageType}:`, error);
      throw error;
    }
  }

  /**
   * Find appropriate handler for message type
   */
  private findHandler(messageType: string): IWebviewMessageHandler | undefined {
    return this.handlers.find(handler => handler.canHandle(messageType));
  }

  /**
   * Get all registered handlers (for debugging/testing)
   */
  getRegisteredHandlers(): string[] {
    return this.handlers.map(h => h.messageType);
  }
}
