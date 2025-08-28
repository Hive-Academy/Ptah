import { SessionId, MessageId } from './branded.types';
import { StrictChatMessage, StrictChatSession } from './message.types';

/**
 * @deprecated Use StrictChatMessage from message.types.ts for type safety
 * This interface is kept for backward compatibility only
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokenCount?: number;
  files?: string[];
  streaming?: boolean;
  isError?: boolean;
}

/**
 * Strict replacement for ChatMessage - use this for new code
 */
export { StrictChatMessage };

/**
 * @deprecated Use StrictChatSession from message.types.ts for type safety
 * This interface is kept for backward compatibility only
 */
export interface ChatSession {
  id: string;
  name: string;
  workspaceId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActiveAt: Date;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Strict replacement for ChatSession - use this for new code
 */
export { StrictChatSession };

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  parameters: CommandParameter[];
  examples?: CommandExample[];
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'file' | 'directory' | 'select' | 'boolean' | 'auto-detect';
  required: boolean;
  description: string;
  defaultValue?: string | number | boolean | readonly string[];
  options?: string[];
  validation?: string;
}

export interface CommandExample {
  title: string;
  description: string;
  parameters: Readonly<Record<string, string | number | boolean | readonly string[]>>;
}

export interface ContextInfo {
  includedFiles: string[];
  excludedFiles: string[];
  tokenEstimate: number;
  optimizations: OptimizationSuggestion[];
}

export interface OptimizationSuggestion {
  type: 'exclude_pattern' | 'include_only' | 'summarize';
  description: string;
  estimatedSavings: number;
  autoApplicable: boolean;
  files?: string[];
}

export interface WorkspaceInfo {
  name: string;
  path: string;
  type: string;
}

export interface TokenUsage {
  used: number;
  max: number;
  cost?: number;
}

export interface CommandResult {
  success: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

export interface SessionInfo {
  id: string;
  name: string;
  messages: ChatMessage[];
  tokenUsage: TokenUsage;
}
