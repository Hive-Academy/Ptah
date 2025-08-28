/**
 * Message Validator Service - Runtime Type Safety with Zod
 * Based on architectural analysis lines 566-613
 * Provides comprehensive runtime validation for all message types
 */

import { z, ZodError } from 'zod';
import { Logger } from '../../core/logger';
import {
  StrictMessage,
  StrictMessageType,
  MessagePayloadMap,
  MessageResponse,
  StrictChatMessage,
  StrictChatSession,
  ChatSendMessagePayloadSchema,
  ChatMessageChunkPayloadSchema,
  MessageMetadataSchema,
  MessageResponseSchema,
  StrictChatMessageSchema,
  StrictChatSessionSchema,
  StrictMessageSchema
} from '../../types/message.types';
import {
  SessionId,
  MessageId,
  CorrelationId,
  BrandedTypeValidator
} from '../../types/branded.types';

/**
 * Structured Error Hierarchy for Validation Failures
 * Based on architectural analysis lines 616-659
 */
export abstract class PtahError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'validation' | 'communication' | 'cli' | 'state';
  
  constructor(
    message: string,
    public readonly context: Readonly<Record<string, unknown>> = {},
    public readonly timestamp = Date.now()
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends PtahError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'validation' as const;
  
  constructor(
    message: string, 
    context: Readonly<{
      errors?: readonly z.ZodIssue[];
      received?: unknown;
      expected?: string;
    }> = {}
  ) {
    super(message, context);
  }
}

export class MessageValidationError extends ValidationError {
  readonly code = 'VALIDATION_ERROR'; // Keep base code for compatibility
  
  constructor(
    message: string,
    public readonly messageType: string,
    context: Readonly<Record<string, unknown>> = {}
  ) {
    super(message, context);
  }
}

/**
 * Type-Safe Message Validator Service
 * Eliminates all 'any' types through runtime validation
 */
export class MessageValidatorService {
  // Use static Logger methods as per project pattern

  /**
   * Validate a generic message with strict typing
   */
  static validateMessage<T extends keyof MessagePayloadMap>(
    data: unknown,
    expectedType: T
  ): StrictMessage<T> {
    try {
      // First validate the basic message structure
      const messageSchema = StrictMessageSchema(expectedType);
      const baseResult = messageSchema.safeParse(data);
      
      if (!baseResult.success) {
        throw new MessageValidationError(
          `Invalid message structure for type ${expectedType}`,
          expectedType,
          {
            errors: baseResult.error.errors,
            received: data
          }
        );
      }

      // Then validate the specific payload
      const message = baseResult.data as StrictMessage<T>;
      this.validatePayloadForType(message.payload, expectedType);

      Logger.info(`Successfully validated message: ${expectedType}`);
      return message;

    } catch (error) {
      Logger.error(`Message validation failed for ${expectedType}:`, error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new MessageValidationError(
        `Unexpected validation error for ${expectedType}`,
        expectedType,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Validate message payload based on type
   */
  private static validatePayloadForType<T extends keyof MessagePayloadMap>(
    payload: unknown,
    messageType: T
  ): MessagePayloadMap[T] {
    const schema = this.getPayloadSchemaForType(messageType);
    const result = schema.safeParse(payload);
    
    if (!result.success) {
      throw new MessageValidationError(
        `Invalid payload for message type ${messageType}`,
        messageType,
        {
          errors: result.error.errors,
          received: payload
        }
      );
    }
    
    return result.data as MessagePayloadMap[T];
  }

  /**
   * Get appropriate Zod schema for message type
   */
  private static getPayloadSchemaForType(messageType: StrictMessageType): z.ZodSchema {
    switch (messageType) {
      case 'chat:sendMessage':
        return ChatSendMessagePayloadSchema;
      case 'chat:messageChunk':
        return ChatMessageChunkPayloadSchema;
      case 'chat:sessionStart':
      case 'chat:sessionEnd':
      case 'chat:newSession':
      case 'chat:switchSession':
      case 'chat:getHistory':
      case 'chat:messageAdded':
      case 'chat:messageComplete':
      case 'chat:sessionCreated':
      case 'chat:sessionSwitched':
      case 'chat:historyLoaded':
      case 'context:updateFiles':
      case 'analytics:trackEvent':
        // For now, use basic object schema - can be extended per type
        return z.object({}).passthrough();
      default:
        throw new ValidationError(
          `No payload schema defined for message type: ${messageType}`
        );
    }
  }

  /**
   * Validate chat message with discriminated union
   */
  static validateChatMessage(data: unknown): StrictChatMessage {
    try {
      const result = StrictChatMessageSchema.safeParse(data);
      
      if (!result.success) {
        throw new ValidationError(
          'Invalid chat message structure',
          {
            errors: result.error.errors,
            received: data
          }
        );
      }

      return result.data;
      
    } catch (error) {
      Logger.error('Chat message validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate chat session
   */
  static validateChatSession(data: unknown): StrictChatSession {
    try {
      const result = StrictChatSessionSchema.safeParse(data);
      
      if (!result.success) {
        throw new ValidationError(
          'Invalid chat session structure',
          {
            errors: result.error.errors,
            received: data
          }
        );
      }

      return result.data;
      
    } catch (error) {
      Logger.error('Chat session validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate message response
   */
  static validateMessageResponse(data: unknown): MessageResponse {
    try {
      const result = MessageResponseSchema.safeParse(data);
      
      if (!result.success) {
        throw new ValidationError(
          'Invalid message response structure',
          {
            errors: result.error.errors,
            received: data
          }
        );
      }

      return result.data;
      
    } catch (error) {
      Logger.error('Message response validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate branded types with runtime checking
   */
  static validateSessionId(data: unknown): SessionId {
    return BrandedTypeValidator.validateSessionId(data);
  }

  static validateMessageId(data: unknown): MessageId {
    return BrandedTypeValidator.validateMessageId(data);
  }

  static validateCorrelationId(data: unknown): CorrelationId {
    return BrandedTypeValidator.validateCorrelationId(data);
  }

  /**
   * Safe validation wrapper - returns null instead of throwing
   */
  static safeValidateMessage<T extends keyof MessagePayloadMap>(
    data: unknown,
    expectedType: T
  ): StrictMessage<T> | null {
    try {
      return this.validateMessage(data, expectedType);
    } catch (error) {
      Logger.warn(`Safe validation failed for ${expectedType}:`, error);
      return null;
    }
  }

  /**
   * Validation wrapper for unknown message types
   */
  static validateUnknownMessage(data: unknown): {
    type: keyof MessagePayloadMap;
    message: StrictMessage;
  } | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const obj = data as Record<string, unknown>;
    const messageType = obj.type;
    
    if (typeof messageType !== 'string') {
      return null;
    }

    // Check if it's a valid message type
    const validTypes = Object.keys({} as MessagePayloadMap) as (keyof MessagePayloadMap)[];

    if (!validTypes.includes(messageType as keyof MessagePayloadMap)) {
      return null;
    }

    const validatedMessage = this.safeValidateMessage(data, messageType as keyof MessagePayloadMap);
    if (!validatedMessage) {
      return null;
    }

    return {
      type: messageType as keyof MessagePayloadMap,
      message: validatedMessage
    };
  }

  /**
   * Format validation errors for debugging
   */
  static formatValidationError(error: ZodError): string {
    return error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
  }

  /**
   * Create contextual error information
   */
  static createErrorContext(
    error: unknown,
    context: Readonly<Record<string, unknown>> = {}
  ): Record<string, unknown> {
    const baseContext = {
      timestamp: Date.now(),
      ...context
    };

    if (error instanceof ZodError) {
      return {
        ...baseContext,
        validationErrors: error.errors,
        formattedError: this.formatValidationError(error)
      };
    }

    if (error instanceof Error) {
      return {
        ...baseContext,
        errorMessage: error.message,
        errorStack: error.stack
      };
    }

    return {
      ...baseContext,
      error: String(error)
    };
  }
}