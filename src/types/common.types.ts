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
  defaultValue?: any;
  options?: string[];
  validation?: string;
}

export interface CommandExample {
  title: string;
  description: string;
  parameters: Record<string, any>;
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
