export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  parameters: CommandParameter[];
  examples?: CommandExample[];
  icon?: string;
  tags?: string[];
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'file' | 'directory' | 'select' | 'boolean' | 'multiselect';
  required: boolean;
  description: string;
  placeholder?: string;
  defaultValue?: any;
  options?: string[] | SelectOption[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
}

export interface SelectOption {
  value: any;
  label: string;
  description?: string;
}

export interface CommandExample {
  title: string;
  description: string;
  parameters: Record<string, any>;
}

export interface CommandCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: CommandTemplate[];
}

export interface CommandBuildResult {
  command: string;
  parameters: Record<string, any>;
  template: CommandTemplate;
}
