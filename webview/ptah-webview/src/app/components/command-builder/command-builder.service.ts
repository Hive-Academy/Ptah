import { Injectable, signal, computed } from '@angular/core';
import { CommandTemplate, CommandCategory, CommandBuildResult } from './command-builder.types';

@Injectable({
  providedIn: 'root'
})
export class CommandBuilderService {
  // Signals for reactive state
  private _templates = signal<CommandTemplate[]>([]);
  private _selectedTemplate = signal<CommandTemplate | null>(null);
  private _parameters = signal<Record<string, any>>({});
  private _searchQuery = signal<string>('');
  private _selectedCategory = signal<string>('all');

  // Computed values
  readonly templates = this._templates.asReadonly();
  readonly selectedTemplate = this._selectedTemplate.asReadonly();
  readonly parameters = this._parameters.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();

  readonly categories = computed(() => {
    const templates = this._templates();
    const categoryMap = new Map<string, CommandCategory>();

    templates.forEach(template => {
      if (!categoryMap.has(template.category)) {
        categoryMap.set(template.category, {
          id: template.category,
          name: this.getCategoryDisplayName(template.category),
          description: this.getCategoryDescription(template.category),
          icon: this.getCategoryIcon(template.category),
          templates: []
        });
      }
      categoryMap.get(template.category)!.templates.push(template);
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly filteredTemplates = computed(() => {
    const templates = this._templates();
    const query = this._searchQuery().toLowerCase();
    const category = this._selectedCategory();

    return templates.filter(template => {
      const matchesSearch = !query ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query));

      const matchesCategory = category === 'all' || template.category === category;

      return matchesSearch && matchesCategory;
    });
  });

  readonly previewCommand = computed(() => {
    const template = this._selectedTemplate();
    const params = this._parameters();

    if (!template) return '';

    return this.buildCommand(template, params);
  });

  readonly isCommandValid = computed(() => {
    const template = this._selectedTemplate();
    const params = this._parameters();

    if (!template) return false;

    // Check all required parameters are provided
    return template.parameters.every(param => {
      if (!param.required) return true;

      const value = params[param.name];
      return value !== undefined && value !== null && value !== '';
    });
  });

  constructor() {
    this.loadDefaultTemplates();
  }

  // Actions
  setTemplates(templates: CommandTemplate[]): void {
    this._templates.set(templates);
  }

  selectTemplate(template: CommandTemplate | null): void {
    this._selectedTemplate.set(template);

    // Initialize parameters with default values
    if (template) {
      const defaultParams: Record<string, any> = {};
      template.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
          defaultParams[param.name] = param.defaultValue;
        }
      });
      this._parameters.set(defaultParams);
    } else {
      this._parameters.set({});
    }
  }

  updateParameter(name: string, value: any): void {
    this._parameters.update(params => ({
      ...params,
      [name]: value
    }));
  }

  setParameters(parameters: Record<string, any>): void {
    this._parameters.set(parameters);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setSelectedCategory(category: string): void {
    this._selectedCategory.set(category);
  }

  buildCommandResult(): CommandBuildResult | null {
    const template = this._selectedTemplate();
    const params = this._parameters();

    if (!template || !this.isCommandValid()) {
      return null;
    }

    return {
      command: this.buildCommand(template, params),
      parameters: { ...params },
      template
    };
  }

  private buildCommand(template: CommandTemplate, parameters: Record<string, any>): string {
    let command = template.template;

    // Replace parameter placeholders
    template.parameters.forEach(param => {
      const value = parameters[param.name];
      const placeholder = new RegExp(`\\{\\{${param.name}\\}\\}`, 'g');

      if (value !== undefined && value !== null) {
        if (param.type === 'multiselect' && Array.isArray(value)) {
          command = command.replace(placeholder, value.join(', '));
        } else {
          command = command.replace(placeholder, String(value));
        }
      } else {
        command = command.replace(placeholder, '');
      }
    });

    return command.trim();
  }

  private loadDefaultTemplates(): void {
    const defaultTemplates: CommandTemplate[] = [
      {
        id: 'code-review',
        name: 'Code Review',
        description: 'Comprehensive code review with security and best practices analysis',
        category: 'analysis',
        template: 'Please review this code for {{focus}}. Pay special attention to {{aspects}}:\n\n{{code}}',
        icon: 'search-review',
        tags: ['review', 'security', 'bugs', 'quality'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code file to review',
            placeholder: 'Select file to review...'
          },
          {
            name: 'focus',
            type: 'select',
            required: true,
            description: 'Primary focus of the review',
            defaultValue: 'bugs and security issues',
            options: [
              'bugs and security issues',
              'performance optimization',
              'code style and best practices',
              'maintainability and readability',
              'architecture and design patterns'
            ]
          },
          {
            name: 'aspects',
            type: 'multiselect',
            required: false,
            description: 'Specific aspects to analyze',
            options: [
              'Error handling',
              'Input validation',
              'SQL injection prevention',
              'XSS prevention',
              'Memory leaks',
              'Performance bottlenecks',
              'Code duplication',
              'Naming conventions'
            ]
          }
        ],
        examples: [
          {
            title: 'Security Review',
            description: 'Focus on security vulnerabilities',
            parameters: {
              focus: 'bugs and security issues',
              aspects: ['Input validation', 'SQL injection prevention', 'XSS prevention']
            }
          },
          {
            title: 'Performance Review',
            description: 'Optimize for better performance',
            parameters: {
              focus: 'performance optimization',
              aspects: ['Memory leaks', 'Performance bottlenecks']
            }
          }
        ]
      },
      {
        id: 'generate-tests',
        name: 'Generate Tests',
        description: 'Generate comprehensive test suites for code',
        category: 'testing',
        template: 'Generate {{testType}} tests for this {{language}} code. Include tests for {{coverage}}:\n\n{{code}}',
        icon: 'beaker',
        tags: ['testing', 'unit tests', 'integration', 'e2e'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to generate tests for',
            placeholder: 'Select source file...'
          },
          {
            name: 'testType',
            type: 'select',
            required: true,
            description: 'Type of tests to generate',
            defaultValue: 'unit',
            options: ['unit', 'integration', 'e2e', 'performance']
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language (auto-detected if empty)',
            placeholder: 'e.g., TypeScript, Python, Java'
          },
          {
            name: 'coverage',
            type: 'multiselect',
            required: true,
            description: 'What to test',
            defaultValue: ['happy paths', 'error cases'],
            options: [
              'happy paths',
              'error cases',
              'edge cases',
              'boundary conditions',
              'performance characteristics',
              'concurrent access'
            ]
          }
        ]
      },
      {
        id: 'explain-code',
        name: 'Explain Code',
        description: 'Get detailed explanations of complex code',
        category: 'documentation',
        template: 'Please explain this {{language}} code in {{style}} style. Focus on {{focus}}:\n\n{{code}}',
        icon: 'book',
        tags: ['documentation', 'explain', 'learning'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to explain',
            placeholder: 'Select code file...'
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected'
          },
          {
            name: 'style',
            type: 'select',
            required: true,
            description: 'Explanation style',
            defaultValue: 'beginner-friendly',
            options: [
              'beginner-friendly',
              'technical detailed',
              'concise summary',
              'step-by-step walkthrough'
            ]
          },
          {
            name: 'focus',
            type: 'select',
            required: true,
            description: 'What to focus on',
            defaultValue: 'overall functionality',
            options: [
              'overall functionality',
              'algorithm explanation',
              'design patterns used',
              'performance characteristics',
              'potential improvements'
            ]
          }
        ]
      },
      {
        id: 'optimize-code',
        name: 'Optimize Code',
        description: 'Optimize code for performance, readability, or maintainability',
        category: 'optimization',
        template: 'Optimize this {{language}} code for {{goal}}. {{constraints}}\n\n{{code}}',
        icon: 'rocket',
        tags: ['optimization', 'performance', 'refactoring'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to optimize',
            placeholder: 'Select code file...'
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected'
          },
          {
            name: 'goal',
            type: 'select',
            required: true,
            description: 'Optimization goal',
            defaultValue: 'performance',
            options: [
              'performance',
              'memory usage',
              'readability',
              'maintainability',
              'code size'
            ]
          },
          {
            name: 'constraints',
            type: 'string',
            required: false,
            description: 'Any constraints or requirements',
            placeholder: 'e.g., Must maintain backwards compatibility'
          }
        ]
      },
      {
        id: 'find-bugs',
        name: 'Find Bugs',
        description: 'Identify potential bugs and issues in code',
        category: 'analysis',
        template: 'Analyze this {{language}} code for potential bugs and issues. Focus on {{severity}} issues:\n\n{{code}}',
        icon: 'bug',
        tags: ['bugs', 'debugging', 'analysis'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to analyze for bugs',
            placeholder: 'Select code file...'
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected'
          },
          {
            name: 'severity',
            type: 'select',
            required: true,
            description: 'Focus on specific severity levels',
            defaultValue: 'all',
            options: [
              'all',
              'critical only',
              'high and critical',
              'runtime errors',
              'logic errors'
            ]
          }
        ]
      },
      {
        id: 'add-documentation',
        name: 'Add Documentation',
        description: 'Generate comprehensive documentation for code',
        category: 'documentation',
        template: 'Generate {{docType}} documentation for this {{language}} code. Include {{sections}}:\n\n{{code}}',
        icon: 'book-open',
        tags: ['documentation', 'comments', 'readme'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to document',
            placeholder: 'Select code file...'
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected'
          },
          {
            name: 'docType',
            type: 'select',
            required: true,
            description: 'Type of documentation',
            defaultValue: 'inline comments',
            options: [
              'inline comments',
              'README.md',
              'API documentation',
              'JSDoc/docstrings',
              'user guide'
            ]
          },
          {
            name: 'sections',
            type: 'multiselect',
            required: true,
            description: 'Documentation sections to include',
            defaultValue: ['overview', 'parameters', 'examples'],
            options: [
              'overview',
              'parameters',
              'return values',
              'examples',
              'error handling',
              'performance notes',
              'dependencies',
              'usage instructions'
            ]
          }
        ]
      }
    ];

    this._templates.set(defaultTemplates);
  }

  private getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      analysis: 'Code Analysis',
      testing: 'Testing',
      documentation: 'Documentation',
      optimization: 'Optimization',
      generation: 'Code Generation',
      refactoring: 'Refactoring',
      security: 'Security',
      debugging: 'Debugging'
    };

    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  private getCategoryDescription(category: string): string {
    const categoryDescriptions: Record<string, string> = {
      analysis: 'Analyze code for bugs, security issues, and improvements',
      testing: 'Generate and improve test suites',
      documentation: 'Create comprehensive documentation',
      optimization: 'Optimize code for performance and maintainability',
      generation: 'Generate new code and boilerplate',
      refactoring: 'Refactor and restructure existing code',
      security: 'Security analysis and hardening',
      debugging: 'Debug and troubleshoot issues'
    };

    return categoryDescriptions[category] || `${category} related templates`;
  }

  private getCategoryIcon(category: string): string {
    const categoryIcons: Record<string, string> = {
      analysis: 'search-review',
      testing: 'beaker',
      documentation: 'book',
      optimization: 'rocket',
      generation: 'code',
      refactoring: 'tools',
      security: 'shield',
      debugging: 'bug'
    };

    return categoryIcons[category] || 'folder';
  }
}
