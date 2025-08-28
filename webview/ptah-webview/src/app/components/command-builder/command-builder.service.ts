import { Injectable, signal, computed } from '@angular/core';
import { CommandTemplate, CommandCategory, CommandBuildResult } from './command-builder.types';

@Injectable({
  providedIn: 'root',
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

    templates.forEach((template) => {
      if (!categoryMap.has(template.category)) {
        categoryMap.set(template.category, {
          id: template.category,
          name: this.getCategoryDisplayName(template.category),
          description: this.getCategoryDescription(template.category),
          icon: this.getCategoryIcon(template.category),
          templates: [],
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

    return templates.filter((template) => {
      const matchesSearch =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags?.some((tag) => tag.toLowerCase().includes(query));

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
    return template.parameters.every((param) => {
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
      template.parameters.forEach((param) => {
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
    this._parameters.update((params) => ({
      ...params,
      [name]: value,
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
      template,
    };
  }

  private buildCommand(template: CommandTemplate, parameters: Record<string, any>): string {
    let command = template.template;

    // Replace parameter placeholders
    template.parameters.forEach((param) => {
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
      // Code Review Category
      {
        id: 'comprehensive-code-review',
        name: 'Comprehensive Code Review',
        description: 'Deep code review with security, performance, and best practices analysis',
        category: 'code-review',
        template:
          'Please perform a comprehensive code review focusing on {{focus}}. Analyze these specific aspects: {{aspects}}. Consider the {{experience_level}} context.\n\n{{code}}',
        icon: 'search-review',
        tags: ['review', 'security', 'bugs', 'quality', 'popular'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code file to review',
            placeholder: 'Select file to review...',
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
              'architecture and design patterns',
              'accessibility compliance',
            ],
          },
          {
            name: 'aspects',
            type: 'multiselect',
            required: false,
            description: 'Specific aspects to analyze',
            defaultValue: ['Error handling', 'Input validation'],
            options: [
              'Error handling',
              'Input validation',
              'SQL injection prevention',
              'XSS prevention',
              'Memory leaks',
              'Performance bottlenecks',
              'Code duplication',
              'Naming conventions',
              'Type safety',
              'Concurrent access',
              'Resource management',
            ],
          },
          {
            name: 'experience_level',
            type: 'select',
            required: true,
            description: 'Developer experience level for feedback',
            defaultValue: 'intermediate',
            options: ['beginner', 'intermediate', 'senior', 'expert'],
          },
        ],
        examples: [
          {
            title: 'Security-First Review',
            description: 'Comprehensive security vulnerability analysis',
            parameters: {
              focus: 'bugs and security issues',
              aspects: [
                'Input validation',
                'SQL injection prevention',
                'XSS prevention',
                'Error handling',
              ],
              experience_level: 'intermediate',
            },
          },
          {
            title: 'Performance Optimization',
            description: 'Focus on performance improvements',
            parameters: {
              focus: 'performance optimization',
              aspects: ['Memory leaks', 'Performance bottlenecks', 'Resource management'],
              experience_level: 'senior',
            },
          },
        ],
      },
      {
        id: 'quick-code-scan',
        name: 'Quick Code Scan',
        description: 'Fast code quality check for immediate feedback',
        category: 'code-review',
        template:
          'Please do a quick scan of this {{language}} code for obvious {{issue_types}}. Provide a summary of findings:\n\n{{code}}',
        icon: 'scan',
        tags: ['review', 'quick', 'bugs', 'fast'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code file to scan',
            placeholder: 'Select file to scan...',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language (auto-detected if empty)',
            placeholder: 'e.g., TypeScript, Python, Java',
          },
          {
            name: 'issue_types',
            type: 'select',
            required: true,
            description: 'Types of issues to look for',
            defaultValue: 'bugs and potential issues',
            options: [
              'bugs and potential issues',
              'security vulnerabilities only',
              'performance problems only',
              'code style violations only',
            ],
          },
        ],
      },
      // Testing Category
      {
        id: 'comprehensive-test-suite',
        name: 'Comprehensive Test Suite',
        description: 'Generate complete test suites with various testing scenarios',
        category: 'testing',
        template:
          'Generate a comprehensive {{testType}} test suite for this {{language}} code. Include tests for {{coverage}}. Use {{framework}} testing framework:\n\n{{code}}',
        icon: 'beaker',
        tags: ['testing', 'unit tests', 'integration', 'e2e', 'popular'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to generate tests for',
            placeholder: 'Select source file...',
          },
          {
            name: 'testType',
            type: 'select',
            required: true,
            description: 'Type of tests to generate',
            defaultValue: 'unit',
            options: ['unit', 'integration', 'e2e', 'performance', 'security'],
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language (auto-detected if empty)',
            placeholder: 'e.g., TypeScript, Python, Java',
          },
          {
            name: 'framework',
            type: 'select',
            required: false,
            description: 'Testing framework to use',
            defaultValue: 'auto-detect',
            options: [
              'auto-detect',
              'Jest',
              'Mocha/Chai',
              'Jasmine',
              'Vitest',
              'Pytest',
              'JUnit',
              'Cypress',
              'Playwright',
            ],
          },
          {
            name: 'coverage',
            type: 'multiselect',
            required: true,
            description: 'What to test',
            defaultValue: ['happy paths', 'error cases', 'edge cases'],
            options: [
              'happy paths',
              'error cases',
              'edge cases',
              'boundary conditions',
              'performance characteristics',
              'concurrent access',
              'mocking/stubbing',
              'async operations',
            ],
          },
        ],
        examples: [
          {
            title: 'Complete Unit Tests',
            description: 'Full unit test coverage with mocks',
            parameters: {
              testType: 'unit',
              framework: 'Jest',
              coverage: ['happy paths', 'error cases', 'edge cases', 'mocking/stubbing'],
            },
          },
          {
            title: 'E2E Test Suite',
            description: 'End-to-end testing scenarios',
            parameters: {
              testType: 'e2e',
              framework: 'Playwright',
              coverage: ['happy paths', 'error cases', 'async operations'],
            },
          },
        ],
      },
      {
        id: 'test-improvement',
        name: 'Improve Existing Tests',
        description: 'Enhance and improve existing test suites for better coverage',
        category: 'testing',
        template:
          'Analyze and improve these {{language}} tests. Focus on {{improvements}} and ensure {{quality_aspects}}:\n\n{{tests}}',
        icon: 'test-upgrade',
        tags: ['testing', 'improvement', 'coverage', 'quality'],
        parameters: [
          {
            name: 'tests',
            type: 'file',
            required: true,
            description: 'Existing test file to improve',
            placeholder: 'Select test file...',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected',
          },
          {
            name: 'improvements',
            type: 'multiselect',
            required: true,
            description: 'Areas to improve',
            defaultValue: ['test coverage', 'test readability'],
            options: [
              'test coverage',
              'test readability',
              'test performance',
              'assertion quality',
              'test organization',
              'mock usage',
              'error scenarios',
              'async handling',
            ],
          },
          {
            name: 'quality_aspects',
            type: 'multiselect',
            required: false,
            description: 'Quality aspects to ensure',
            options: [
              'DRY principles',
              'clear test names',
              'proper setup/teardown',
              'isolated tests',
              'deterministic results',
            ],
          },
        ],
      },
      // Documentation Category
      {
        id: 'comprehensive-documentation',
        name: 'Comprehensive Documentation',
        description: 'Generate complete documentation including API docs, examples, and guides',
        category: 'documentation',
        template:
          'Generate comprehensive {{docType}} documentation for this {{language}} code. Include {{sections}} and target {{audience}} level:\n\n{{code}}',
        icon: 'book',
        tags: ['documentation', 'api-docs', 'examples', 'popular'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to document',
            placeholder: 'Select code file...',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected',
          },
          {
            name: 'docType',
            type: 'select',
            required: true,
            description: 'Type of documentation',
            defaultValue: 'API documentation',
            options: [
              'API documentation',
              'README.md',
              'inline comments',
              'JSDoc/docstrings',
              'user guide',
              'tutorial guide',
              'technical specification',
            ],
          },
          {
            name: 'sections',
            type: 'multiselect',
            required: true,
            description: 'Documentation sections to include',
            defaultValue: ['overview', 'parameters', 'examples', 'usage'],
            options: [
              'overview',
              'parameters',
              'return values',
              'examples',
              'usage instructions',
              'error handling',
              'performance notes',
              'dependencies',
              'configuration',
              'troubleshooting',
            ],
          },
          {
            name: 'audience',
            type: 'select',
            required: true,
            description: 'Target audience level',
            defaultValue: 'intermediate',
            options: ['beginner', 'intermediate', 'advanced', 'expert'],
          },
        ],
        examples: [
          {
            title: 'Complete API Docs',
            description: 'Full API documentation with examples',
            parameters: {
              docType: 'API documentation',
              sections: ['overview', 'parameters', 'return values', 'examples', 'error handling'],
              audience: 'intermediate',
            },
          },
          {
            title: 'README Documentation',
            description: 'Project README with usage guide',
            parameters: {
              docType: 'README.md',
              sections: ['overview', 'usage instructions', 'examples', 'configuration'],
              audience: 'beginner',
            },
          },
        ],
      },
      {
        id: 'explain-code',
        name: 'Explain Complex Code',
        description: 'Get detailed explanations of complex algorithms and patterns',
        category: 'documentation',
        template:
          'Please explain this {{language}} code in {{style}} style. Focus on {{focus}} and consider {{audience}} audience:\n\n{{code}}',
        icon: 'explain',
        tags: ['documentation', 'explain', 'learning', 'algorithms'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to explain',
            placeholder: 'Select code file...',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected',
          },
          {
            name: 'style',
            type: 'select',
            required: true,
            description: 'Explanation style',
            defaultValue: 'step-by-step walkthrough',
            options: [
              'beginner-friendly overview',
              'technical detailed analysis',
              'concise summary',
              'step-by-step walkthrough',
              'visual diagram approach',
            ],
          },
          {
            name: 'focus',
            type: 'multiselect',
            required: true,
            description: 'What to focus on',
            defaultValue: ['overall functionality', 'algorithm explanation'],
            options: [
              'overall functionality',
              'algorithm explanation',
              'design patterns used',
              'performance characteristics',
              'potential improvements',
              'data flow',
              'control flow',
              'error handling',
            ],
          },
          {
            name: 'audience',
            type: 'select',
            required: true,
            description: 'Target audience',
            defaultValue: 'intermediate developer',
            options: [
              'beginner programmer',
              'intermediate developer',
              'senior developer',
              'technical lead',
              'non-technical stakeholder',
            ],
          },
        ],
      },
      // Refactoring Category
      {
        id: 'comprehensive-refactoring',
        name: 'Comprehensive Code Refactoring',
        description:
          'Comprehensive refactoring for better structure, maintainability, and performance',
        category: 'refactoring',
        template:
          'Refactor this {{language}} code to improve {{goals}}. Consider {{principles}} and maintain {{constraints}}:\n\n{{code}}',
        icon: 'tools',
        tags: ['refactoring', 'optimization', 'structure', 'popular'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to refactor',
            placeholder: 'Select code file...',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected',
          },
          {
            name: 'goals',
            type: 'multiselect',
            required: true,
            description: 'Refactoring goals',
            defaultValue: ['maintainability', 'readability'],
            options: [
              'performance',
              'maintainability',
              'readability',
              'testability',
              'code reuse',
              'memory efficiency',
              'scalability',
              'modularity',
            ],
          },
          {
            name: 'principles',
            type: 'multiselect',
            required: false,
            description: 'Design principles to apply',
            defaultValue: ['SOLID principles', 'DRY'],
            options: [
              'SOLID principles',
              "DRY (Don't Repeat Yourself)",
              'KISS (Keep It Simple)',
              "YAGNI (You Aren't Gonna Need It)",
              'Design patterns',
              'Clean code principles',
              'Separation of concerns',
            ],
          },
          {
            name: 'constraints',
            type: 'string',
            required: false,
            description: 'Constraints to maintain',
            placeholder: 'e.g., Backward compatibility, API contracts, performance requirements',
          },
        ],
        examples: [
          {
            title: 'Performance Refactoring',
            description: 'Optimize for better performance',
            parameters: {
              goals: ['performance', 'memory efficiency'],
              principles: ['Clean code principles'],
              constraints: 'Maintain API compatibility',
            },
          },
          {
            title: 'Maintainability Focus',
            description: 'Improve code maintainability',
            parameters: {
              goals: ['maintainability', 'readability', 'testability'],
              principles: [
                'SOLID principles',
                "DRY (Don't Repeat Yourself)",
                'Separation of concerns',
              ],
              constraints: 'Keep existing functionality intact',
            },
          },
        ],
      },
      {
        id: 'extract-functions',
        name: 'Extract Functions/Methods',
        description: 'Extract reusable functions and methods from complex code',
        category: 'refactoring',
        template:
          'Extract {{extraction_type}} from this {{language}} code. Focus on {{criteria}} and ensure {{quality}}:\n\n{{code}}',
        icon: 'extract',
        tags: ['refactoring', 'functions', 'methods', 'reusability'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to extract functions from',
            placeholder: 'Select code file...',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected',
          },
          {
            name: 'extraction_type',
            type: 'multiselect',
            required: true,
            description: 'What to extract',
            defaultValue: ['reusable functions'],
            options: [
              'reusable functions',
              'utility methods',
              'helper classes',
              'configuration objects',
              'constants and enums',
              'type definitions',
            ],
          },
          {
            name: 'criteria',
            type: 'multiselect',
            required: true,
            description: 'Extraction criteria',
            defaultValue: ['code duplication', 'complex logic'],
            options: [
              'code duplication',
              'complex logic',
              'long methods',
              'mixed responsibilities',
              'hard-coded values',
              'nested conditionals',
            ],
          },
          {
            name: 'quality',
            type: 'multiselect',
            required: false,
            description: 'Quality aspects to ensure',
            defaultValue: ['clear naming', 'single responsibility'],
            options: [
              'clear naming',
              'single responsibility',
              'proper typing',
              'comprehensive documentation',
              'error handling',
              'testable design',
            ],
          },
        ],
      },
      {
        id: 'design-patterns',
        name: 'Apply Design Patterns',
        description: 'Refactor code to implement appropriate design patterns',
        category: 'refactoring',
        template:
          'Refactor this {{language}} code to implement {{patterns}}. Consider {{context}} and ensure {{benefits}}:\n\n{{code}}',
        icon: 'pattern',
        tags: ['refactoring', 'patterns', 'architecture', 'design'],
        parameters: [
          {
            name: 'code',
            type: 'file',
            required: true,
            description: 'Code to refactor with patterns',
            placeholder: 'Select code file...',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language',
            placeholder: 'Auto-detected',
          },
          {
            name: 'patterns',
            type: 'multiselect',
            required: true,
            description: 'Design patterns to apply',
            options: [
              'Factory Pattern',
              'Observer Pattern',
              'Strategy Pattern',
              'Command Pattern',
              'Decorator Pattern',
              'Singleton Pattern',
              'Builder Pattern',
              'Repository Pattern',
              'Dependency Injection',
              'MVC/MVP/MVVM',
            ],
          },
          {
            name: 'context',
            type: 'select',
            required: true,
            description: 'Application context',
            defaultValue: 'web application',
            options: [
              'web application',
              'desktop application',
              'mobile application',
              'library/framework',
              'microservice',
              'CLI application',
            ],
          },
          {
            name: 'benefits',
            type: 'multiselect',
            required: false,
            description: 'Expected benefits',
            defaultValue: ['maintainability', 'extensibility'],
            options: [
              'maintainability',
              'extensibility',
              'testability',
              'reusability',
              'flexibility',
              'decoupling',
            ],
          },
        ],
      },
      // Additional templates can be added here for specific categories
    ];

    this._templates.set(defaultTemplates);
  }

  getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      'code-review': 'Code Review',
      testing: 'Testing',
      documentation: 'Documentation',
      refactoring: 'Refactoring',
      analysis: 'Code Analysis',
      optimization: 'Optimization',
      generation: 'Code Generation',
      security: 'Security',
      debugging: 'Debugging',
    };

    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  private getCategoryDescription(category: string): string {
    const categoryDescriptions: Record<string, string> = {
      'code-review': 'Comprehensive code review and quality analysis',
      testing: 'Generate and improve test suites for better coverage',
      documentation: 'Create comprehensive documentation and explanations',
      refactoring: 'Refactor and restructure code for better maintainability',
      analysis: 'Analyze code for bugs, security issues, and improvements',
      optimization: 'Optimize code for performance and efficiency',
      generation: 'Generate new code and boilerplate templates',
      security: 'Security analysis and hardening techniques',
      debugging: 'Debug and troubleshoot code issues',
    };

    return categoryDescriptions[category] || `${category} related templates`;
  }

  private getCategoryIcon(category: string): string {
    const categoryIcons: Record<string, string> = {
      'code-review': 'search-review',
      testing: 'beaker',
      documentation: 'book',
      refactoring: 'tools',
      analysis: 'search',
      optimization: 'rocket',
      generation: 'code',
      security: 'shield',
      debugging: 'bug',
    };

    return categoryIcons[category] || 'folder';
  }
}
