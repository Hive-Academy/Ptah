/**
 * Base interface for webview message handlers
 * Follows Interface Segregation Principle - only contains what all handlers need
 */
export interface IWebviewMessageHandler {
  readonly messageType: string;
  canHandle(messageType: string): boolean;
  handle(messageType: string, payload: any): Promise<any>;
}

/**
 * Base class for webview message handlers
 * Provides common functionality and enforces consistent patterns
 */
export abstract class BaseWebviewMessageHandler implements IWebviewMessageHandler {
  abstract readonly messageType: string;

  constructor(protected postMessage: (message: any) => void) {}

  canHandle(messageType: string): boolean {
    return messageType.startsWith(this.messageType);
  }

  abstract handle(messageType: string, payload: any): Promise<any>;

  protected sendSuccessResponse(type: string, data: any): void {
    this.postMessage({
      type,
      payload: data
    });
  }

  protected sendErrorResponse(type: string, error: string | Error): void {
    this.postMessage({
      type: type.replace(':', ':error'),
      payload: { 
        message: error instanceof Error ? error.message : error 
      }
    });
  }
}
