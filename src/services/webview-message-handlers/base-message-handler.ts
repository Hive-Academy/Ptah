import {
  StrictMessageType,
  MessagePayloadMap,
  MessageResponse,
  MessageMetadata,
  MessageError,
} from '../../types/message.types';
import { CorrelationId } from '../../types/branded.types';

/**
 * Strict Message Post Function Type - eliminates 'any'
 */
export type StrictPostMessageFunction = (message: {
  readonly type: string;
  readonly payload: unknown;
  readonly metadata?: MessageMetadata;
}) => void;

/**
 * Base interface for webview message handlers
 * Follows Interface Segregation Principle - only contains what all handlers need
 * Now with strict typing - eliminates 'any' types
 */
export interface IWebviewMessageHandler<
  T extends keyof MessagePayloadMap = keyof MessagePayloadMap,
> {
  readonly messageType: string;
  canHandle(messageType: string): boolean;
  handle<K extends T>(messageType: K, payload: MessagePayloadMap[K]): Promise<MessageResponse>;
}

/**
 * Base class for webview message handlers
 * Provides common functionality and enforces consistent patterns
 * Now with strict typing - eliminates all 'any' types
 */
export abstract class BaseWebviewMessageHandler<
  T extends keyof MessagePayloadMap = keyof MessagePayloadMap,
> implements IWebviewMessageHandler<T>
{
  abstract readonly messageType: string;

  constructor(protected postMessage: StrictPostMessageFunction) {}

  canHandle(messageType: string): boolean {
    return messageType.startsWith(this.messageType);
  }

  abstract handle<K extends T>(
    messageType: K,
    payload: MessagePayloadMap[K]
  ): Promise<MessageResponse>;

  protected sendSuccessResponse<TData = unknown>(
    type: string,
    data: TData,
    requestId?: CorrelationId
  ): void {
    const response: MessageResponse<TData> = {
      requestId: requestId || CorrelationId.create(),
      success: true,
      data,
      metadata: {
        timestamp: Date.now(),
        source: 'extension',
        version: '1.0.0',
      },
    };

    this.postMessage({
      type,
      payload: response,
    });
  }

  protected sendErrorResponse(
    type: string,
    error: string | Error | MessageError,
    requestId?: CorrelationId
  ): void {
    const messageError: MessageError =
      error instanceof Error
        ? {
            code: 'HANDLER_ERROR',
            message: error.message,
            stack: error.stack,
          }
        : typeof error === 'string'
          ? {
              code: 'HANDLER_ERROR',
              message: error,
            }
          : error;

    const response: MessageResponse = {
      requestId: requestId || CorrelationId.create(),
      success: false,
      error: messageError,
      metadata: {
        timestamp: Date.now(),
        source: 'extension',
        version: '1.0.0',
      },
    };

    this.postMessage({
      type: type.replace(':', ':error'),
      payload: response,
    });
  }
}
