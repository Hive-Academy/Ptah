export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'testing' | 'documentation' | 'optimization' | 'custom';
  template: string;
  icon: string;
  tags: string[];
  parameters: TemplateParameter[];
  examples?: TemplateExample[];
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'file' | 'select' | 'multiselect' | 'number' | 'boolean';
  required: boolean;
  description: string;
  placeholder?: string;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface TemplateExample {
  title: string;
  description: string;
  parameters: Record<string, any>;
}

export interface CommandBuilderMessage {
  type: 'getTemplates' | 'getTemplate' | 'executeCommand' | 'saveTemplate' | 'deleteTemplate' | 'trackUsage' | 'selectFile' | 'ready';
  payload?: any;
}

export interface CommandBuilderResponse {
  type: 'templates' | 'template' | 'commandResult' | 'error' | 'fileSelected' | 'ready';
  payload?: any;
  error?: string;
}

export interface ExecuteCommandRequest {
  templateId: string;
  parameters: Record<string, any>;
  context?: {
    workspaceFolder?: string;
    activeFile?: string;
    selectedText?: string;
  };
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
  timestamp: Date;
}

export interface CommandBuildResult {
  command: string;
  parameters: Record<string, any>;
  template: CommandTemplate;
}
