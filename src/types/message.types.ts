/**
 * Strict Message Type System - Eliminates all 'any' types
 * Based on architectural analysis lines 504-538
 * Implements discriminated unions for type-safe message handling
 */

import { z } from 'zod';
import { SessionId, MessageId, CorrelationId, SessionIdSchema, MessageIdSchema, CorrelationIdSchema } from './branded.types';

// Re-export for convenience
export { CorrelationId };

/**
 * Strict Message Types - replaces generic 'string' with exact literals
 */
export type StrictMessageType = 
  | 'chat:sendMessage' 
  | 'chat:messageChunk' 
  | 'chat:sessionStart' 
  | 'chat:sessionEnd'
  | 'chat:newSession'
  | 'chat:switchSession'
  | 'chat:getHistory'
  | 'chat:messageAdded'
  | 'chat:messageComplete'
  | 'chat:sessionCreated'
  | 'chat:sessionSwitched'
  | 'chat:historyLoaded'
  | 'context:updateFiles'
  | 'context:getFiles'
  | 'context:includeFile'
  | 'context:excludeFile'
  | 'commands:getTemplates'
  | 'commands:executeCommand'
  | 'commands:selectFile'
  | 'commands:saveTemplate'
  | 'analytics:trackEvent'
  | 'analytics:getData'
  | 'state:save'
  | 'state:load'
  | 'state:clear'
  | 'view:changed'
  | 'view:routeChanged' 
  | 'view:generic';

/**
 * Message Payloads - Strict typing for each message type
 */
export interface ChatSendMessagePayload {
  readonly content: string;
  readonly files?: readonly string[];
  readonly correlationId?: CorrelationId;
  readonly metadata?: Readonly<{
    model?: string;
    temperature?: number;
  }>;
}

export interface ChatMessageChunkPayload {
  readonly sessionId: SessionId;
  readonly messageId: MessageId;
  readonly content: string;
  readonly isComplete: boolean;
  readonly streaming: boolean;
}

export interface ChatSessionStartPayload {
  readonly sessionId: SessionId;
  readonly workspaceId?: string;
}

export interface ChatSessionEndPayload {
  readonly sessionId: SessionId;
  readonly duration: number;
}

export interface ChatNewSessionPayload {
  readonly name?: string;
  readonly workspaceId?: string;
}

export interface ChatSwitchSessionPayload {
  readonly sessionId: SessionId;
}

export interface ChatGetHistoryPayload {
  readonly sessionId: SessionId;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ChatMessageAddedPayload {
  readonly message: StrictChatMessage;
}

export interface ChatMessageCompletePayload {
  readonly message: StrictChatMessage;
}

export interface ChatSessionCreatedPayload {
  readonly session: StrictChatSession;
}

export interface ChatSessionSwitchedPayload {
  readonly session: StrictChatSession;
}

export interface ChatHistoryLoadedPayload {
  readonly messages: readonly StrictChatMessage[];
}

export interface ContextUpdatePayload {
  readonly includedFiles: readonly string[];
  readonly excludedFiles: readonly string[];
  readonly tokenEstimate: number;
}

export interface AnalyticsEventPayload {
  readonly event: string;
  readonly properties: Readonly<Record<string, string | number | boolean>>;
}

export interface ViewChangedPayload {
  readonly view: string;
  readonly timestamp?: number;
}

export interface ViewRouteChangedPayload {
  readonly route: string;
  readonly previousRoute?: string;
}

export interface ViewGenericPayload {
  readonly data: unknown;
}

export interface ContextGetFilesPayload {
  // No payload needed for get files request
}

export interface ContextIncludeFilePayload {
  readonly filePath: string;
}

export interface ContextExcludeFilePayload {
  readonly filePath: string;
}

export interface CommandsGetTemplatesPayload {
  // No payload needed for get templates request
}

export interface CommandsExecuteCommandPayload {
  readonly templateId: string;
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface CommandsSelectFilePayload {
  readonly multiple?: boolean;
}

export interface CommandsSaveTemplatePayload {
  readonly template: unknown; // Template structure
}

export interface AnalyticsGetDataPayload {
  // No payload needed for get analytics data request
}

export interface StateSavePayload {
  readonly state: unknown;
}

export interface StateLoadPayload {
  // No payload needed for load state request
}

export interface StateClearPayload {
  // No payload needed for clear state request
}

/**
 * Type mapping for message payloads - eliminates 'any' types
 */
export interface MessagePayloadMap {
  'chat:sendMessage': ChatSendMessagePayload;
  'chat:messageChunk': ChatMessageChunkPayload;
  'chat:sessionStart': ChatSessionStartPayload;
  'chat:sessionEnd': ChatSessionEndPayload;
  'chat:newSession': ChatNewSessionPayload;
  'chat:switchSession': ChatSwitchSessionPayload;
  'chat:getHistory': ChatGetHistoryPayload;
  'chat:messageAdded': ChatMessageAddedPayload;
  'chat:messageComplete': ChatMessageCompletePayload;
  'chat:sessionCreated': ChatSessionCreatedPayload;
  'chat:sessionSwitched': ChatSessionSwitchedPayload;
  'chat:historyLoaded': ChatHistoryLoadedPayload;
  'context:updateFiles': ContextUpdatePayload;
  'context:getFiles': ContextGetFilesPayload;
  'context:includeFile': ContextIncludeFilePayload;
  'context:excludeFile': ContextExcludeFilePayload;
  'commands:getTemplates': CommandsGetTemplatesPayload;
  'commands:executeCommand': CommandsExecuteCommandPayload;
  'commands:selectFile': CommandsSelectFilePayload;
  'commands:saveTemplate': CommandsSaveTemplatePayload;
  'analytics:trackEvent': AnalyticsEventPayload;
  'analytics:getData': AnalyticsGetDataPayload;
  'state:save': StateSavePayload;
  'state:load': StateLoadPayload;
  'state:clear': StateClearPayload;
  'view:changed': ViewChangedPayload;
  'view:routeChanged': ViewRouteChangedPayload;
  'view:generic': ViewGenericPayload;
}

/**
 * Generic Message Interface with Strict Typing
 */
export interface StrictMessage<T extends StrictMessageType = StrictMessageType> {
  readonly id: CorrelationId;
  readonly type: T;
  readonly payload: MessagePayloadMap[T];
  readonly metadata: MessageMetadata;
}

/**
 * Message Metadata with structured information
 */
export interface MessageMetadata {
  readonly timestamp: number;
  readonly source: 'extension' | 'webview';
  readonly sessionId?: SessionId;
  readonly version: string;
}

/**
 * Request-Response Message Types
 */
export interface MessageRequest<T extends StrictMessageType = StrictMessageType> {
  readonly id: CorrelationId;
  readonly type: T;
  readonly payload: MessagePayloadMap[T];
  readonly metadata: MessageMetadata;
  readonly timeout?: number;
}

export interface MessageResponse<T = unknown> {
  readonly requestId: CorrelationId;
  readonly success: boolean;
  readonly data?: T;
  readonly error?: MessageError;
  readonly metadata: MessageMetadata;
}

/**
 * Structured Error Information
 */
export interface MessageError {
  readonly code: string;
  readonly message: string;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly stack?: string;
}

/**
 * Strict Chat Message (replaces loose ChatMessage from common.types.ts)
 */
export type StrictChatMessage = 
  | {
      readonly type: 'user';
      readonly id: MessageId;
      readonly sessionId: SessionId;
      readonly content: string;
      readonly timestamp: number;
      readonly files?: readonly string[];
    }
  | {
      readonly type: 'assistant';
      readonly id: MessageId;
      readonly sessionId: SessionId;
      readonly content: string;
      readonly timestamp: number;
      readonly streaming: boolean;
      readonly isComplete: boolean;
    }
  | {
      readonly type: 'system';
      readonly id: MessageId;
      readonly sessionId: SessionId;
      readonly content: string;
      readonly timestamp: number;
      readonly level: 'info' | 'warning' | 'error';
    };

/**
 * Strict Chat Session (replaces loose ChatSession from common.types.ts)
 */
export interface StrictChatSession {
  readonly id: SessionId;
  readonly name: string;
  readonly workspaceId?: string;
  readonly messages: readonly StrictChatMessage[];
  readonly createdAt: number;
  readonly lastActiveAt: number;
  readonly tokenUsage: Readonly<{
    input: number;
    output: number;
    total: number;
  }>;
}

/**
 * Zod Schemas for Runtime Validation
 */
export const StrictMessageTypeSchema = z.enum([
  'chat:sendMessage',
  'chat:messageChunk', 
  'chat:sessionStart',
  'chat:sessionEnd',
  'chat:newSession',
  'chat:switchSession',
  'chat:getHistory',
  'chat:messageAdded',
  'chat:messageComplete',
  'chat:sessionCreated',
  'chat:sessionSwitched',
  'chat:historyLoaded',
  'context:updateFiles',
  'analytics:trackEvent'
]);

export const ChatSendMessagePayloadSchema = z.object({
  content: z.string().min(1).max(10000),
  files: z.array(z.string()).optional(),
  metadata: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional()
  }).optional()
}).strict();

export const ChatMessageChunkPayloadSchema = z.object({
  sessionId: SessionIdSchema,
  messageId: MessageIdSchema,
  content: z.string(),
  isComplete: z.boolean(),
  streaming: z.boolean()
}).strict();

export const MessageMetadataSchema = z.object({
  timestamp: z.number().positive(),
  source: z.enum(['extension', 'webview']),
  sessionId: SessionIdSchema.optional(),
  version: z.string()
}).strict();

export const StrictMessageSchema = <T extends StrictMessageType>(type: T) => z.object({
  id: CorrelationIdSchema,
  type: z.literal(type),
  payload: z.unknown(), // Will be refined by specific payload schema
  metadata: MessageMetadataSchema
}).strict();

export const MessageResponseSchema = z.object({
  requestId: CorrelationIdSchema,
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    context: z.record(z.unknown()).optional(),
    stack: z.string().optional()
  }).optional(),
  metadata: MessageMetadataSchema
}).strict();

export const StrictChatMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user'),
    id: MessageIdSchema,
    sessionId: SessionIdSchema,
    content: z.string().min(1).max(10000),
    timestamp: z.number().positive(),
    files: z.array(z.string()).optional()
  }),
  z.object({
    type: z.literal('assistant'),
    id: MessageIdSchema,
    sessionId: SessionIdSchema,
    content: z.string(),
    timestamp: z.number().positive(),
    streaming: z.boolean(),
    isComplete: z.boolean()
  }),
  z.object({
    type: z.literal('system'),
    id: MessageIdSchema,
    sessionId: SessionIdSchema,
    content: z.string(),
    timestamp: z.number().positive(),
    level: z.enum(['info', 'warning', 'error'])
  })
]);

export const StrictChatSessionSchema = z.object({
  id: SessionIdSchema,
  name: z.string(),
  workspaceId: z.string().optional(),
  messages: z.array(StrictChatMessageSchema),
  createdAt: z.number().positive(),
  lastActiveAt: z.number().positive(),
  tokenUsage: z.object({
    input: z.number().nonnegative(),
    output: z.number().nonnegative(),
    total: z.number().nonnegative()
  }).strict()
}).strict();