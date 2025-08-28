/**
 * MessageToJsonTransform - Type-Safe JSON Conversion Stream
 *
 * Converts parsed message chunks to StrictChatMessage format with Zod validation
 * Integrates with Phase 1 branded types (MessageId, SessionId, CorrelationId)
 * Output: MessageResponse format for webview message handlers
 *
 * Performance target: <5ms per message conversion
 * Type safety: 100% strict typing with runtime Zod validation
 */

import { Transform, TransformCallback } from 'stream';
import { z } from 'zod';
import { Logger } from '../../core/logger';
import {
  MessageId,
  SessionId,
  CorrelationId,
  BrandedTypeValidator,
} from '../../types/branded.types';
import {
  StrictChatMessage,
  MessageResponse,
  MessageMetadata,
  StrictChatMessageSchema,
} from '../../types/message.types';
import { ParsedMessageChunk } from './claude-message-transform.stream';

/**
 * Transform options for message JSON conversion
 */
export interface MessageToJsonTransformOptions {
  readonly correlationId?: CorrelationId;
  readonly highWaterMark?: number;
  readonly validateOutput?: boolean;
}

/**
 * Error for JSON transformation failures
 */
export class MessageJsonTransformError extends Error {
  constructor(
    message: string,
    public readonly context: {
      readonly messageId?: MessageId;
      readonly sessionId?: SessionId;
      readonly correlationId?: CorrelationId;
      readonly originalError?: unknown;
    }
  ) {
    super(message);
    this.name = 'MessageJsonTransformError';
  }
}

/**
 * High-performance Transform stream for converting parsed messages to JSON
 *
 * Features:
 * - Converts ParsedMessageChunk to StrictChatMessage format
 * - Integrates branded types (SessionId, MessageId) from Phase 1
 * - Applies Zod validation for runtime type safety
 * - Outputs MessageResponse format for handlers
 * - <5ms target processing time per message
 */
export class MessageToJsonTransformStream extends Transform {
  private readonly correlationId: CorrelationId;
  private readonly validateOutput: boolean;

  // Performance monitoring
  private transformCount = 0;
  private totalProcessingTime = 0;

  constructor(options: MessageToJsonTransformOptions = {}) {
    super({
      objectMode: true,
      highWaterMark: options.highWaterMark || 16,
      readableObjectMode: true,
      writableObjectMode: true,
    });

    this.correlationId = options.correlationId || CorrelationId.create();
    this.validateOutput = options.validateOutput !== false; // Default true

    Logger.info(`Initialized MessageToJsonTransformStream with correlation: ${this.correlationId}`);
  }

  /**
   * Transform implementation - converts ParsedMessageChunk to MessageResponse
   * Target: <5ms processing time per message
   */
  _transform(
    chunk: ParsedMessageChunk,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    const startTime = Date.now();

    try {
      // Validate input chunk
      if (!this.isValidParsedChunk(chunk)) {
        throw new MessageJsonTransformError('Invalid parsed message chunk', {
          messageId: (chunk as any).messageId,
          sessionId: (chunk as any).sessionId,
          correlationId: this.correlationId,
        });
      }

      // Convert to StrictChatMessage
      const chatMessage = this.convertToStrictChatMessage(chunk);

      // Apply Zod validation if enabled
      if (this.validateOutput) {
        this.validateStrictChatMessage(chatMessage);
      }

      // Create MessageResponse wrapper
      const messageResponse = this.createMessageResponse(chatMessage, chunk);

      // Performance monitoring
      const processingTime = Date.now() - startTime;
      this.transformCount++;
      this.totalProcessingTime += processingTime;

      if (processingTime > 5) {
        Logger.warn(`JSON transform exceeded 5ms target: ${processingTime}ms`);
      }

      Logger.info(`Successfully transformed message to JSON in ${processingTime}ms`);

      // Push MessageResponse to output
      this.push(messageResponse);
      callback();
    } catch (error) {
      Logger.error('Error transforming message to JSON', error);

      // Create error response
      const errorResponse = this.createErrorResponse(chunk, error);
      this.push(errorResponse);

      callback(); // Continue processing despite error
    }
  }

  /**
   * Validate parsed message chunk structure
   */
  private isValidParsedChunk(chunk: unknown): chunk is ParsedMessageChunk {
    if (!chunk || typeof chunk !== 'object') {
      return false;
    }

    const c = chunk as any;
    return (
      typeof c.type === 'string' &&
      ['user', 'assistant', 'partial'].includes(c.type) &&
      typeof c.content === 'string' &&
      typeof c.isComplete === 'boolean' &&
      typeof c.messageId === 'string' &&
      typeof c.sessionId === 'string' &&
      typeof c.timestamp === 'number'
    );
  }

  /**
   * Convert ParsedMessageChunk to StrictChatMessage
   */
  private convertToStrictChatMessage(chunk: ParsedMessageChunk): StrictChatMessage {
    // Validate branded types
    const sessionId = BrandedTypeValidator.validateSessionId(chunk.sessionId);
    const messageId = BrandedTypeValidator.validateMessageId(chunk.messageId);

    // Convert based on message type
    switch (chunk.type) {
      case 'user':
        return {
          type: 'user',
          id: messageId,
          sessionId,
          content: chunk.content,
          timestamp: chunk.timestamp,
          // Note: files array would be added from original user message context
          files: [],
        };

      case 'assistant':
        return {
          type: 'assistant',
          id: messageId,
          sessionId,
          content: chunk.content,
          timestamp: chunk.timestamp,
          streaming: !chunk.isComplete,
          isComplete: chunk.isComplete,
        };

      case 'partial':
        // Treat partial as assistant message (most common case)
        return {
          type: 'assistant',
          id: messageId,
          sessionId,
          content: chunk.content,
          timestamp: chunk.timestamp,
          streaming: true,
          isComplete: false,
        };

      default:
        // This should never happen with proper typing, but defensive programming
        throw new MessageJsonTransformError(`Unknown message type: ${(chunk as any).type}`, {
          messageId,
          sessionId,
          correlationId: this.correlationId,
        });
    }
  }

  /**
   * Apply Zod validation to StrictChatMessage
   */
  private validateStrictChatMessage(message: StrictChatMessage): void {
    const result = StrictChatMessageSchema.safeParse(message);

    if (!result.success) {
      throw new MessageJsonTransformError('StrictChatMessage validation failed', {
        messageId: message.id,
        sessionId: message.sessionId,
        correlationId: this.correlationId,
        originalError: result.error,
      });
    }
  }

  /**
   * Create successful MessageResponse wrapper
   */
  private createMessageResponse(
    chatMessage: StrictChatMessage,
    originalChunk: ParsedMessageChunk
  ): MessageResponse<StrictChatMessage> {
    const metadata: MessageMetadata = {
      timestamp: Date.now(),
      source: 'extension',
      sessionId: chatMessage.sessionId,
      version: '1.0.0',
    };

    return {
      requestId: this.correlationId,
      success: true,
      data: chatMessage,
      metadata,
    };
  }

  /**
   * Create error MessageResponse
   */
  private createErrorResponse(chunk: ParsedMessageChunk, error: unknown): MessageResponse<never> {
    const metadata: MessageMetadata = {
      timestamp: Date.now(),
      source: 'extension',
      sessionId: chunk.sessionId,
      version: '1.0.0',
    };

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return {
      requestId: this.correlationId,
      success: false,
      error: {
        code: 'MESSAGE_TRANSFORM_ERROR',
        message: `Failed to transform message to JSON: ${errorMessage}`,
        context: {
          messageId: chunk.messageId,
          sessionId: chunk.sessionId,
          messageType: chunk.type,
          contentLength: chunk.content.length,
        },
        stack: errorStack,
      },
      metadata,
    };
  }

  /**
   * Get transform stream performance statistics
   */
  getStats(): {
    readonly transformCount: number;
    readonly averageProcessingTime: number;
    readonly totalProcessingTime: number;
    readonly correlationId: CorrelationId;
  } {
    return {
      transformCount: this.transformCount,
      averageProcessingTime:
        this.transformCount > 0 ? this.totalProcessingTime / this.transformCount : 0,
      totalProcessingTime: this.totalProcessingTime,
      correlationId: this.correlationId,
    };
  }
}

/**
 * Factory function for creating MessageToJsonTransformStream instances
 */
export function createMessageToJsonTransform(
  options?: MessageToJsonTransformOptions
): MessageToJsonTransformStream {
  return new MessageToJsonTransformStream(options);
}

/**
 * Zod schema for ParsedMessageChunk validation
 */
export const ParsedMessageChunkSchema = z
  .object({
    type: z.enum(['user', 'assistant', 'partial']),
    content: z.string(),
    isComplete: z.boolean(),
    messageId: z.string().uuid(),
    sessionId: z.string().uuid(),
    timestamp: z.number().positive(),
  })
  .strict();
