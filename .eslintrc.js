module.exports = {
  root: true,
  ignorePatterns: [
    'projects/**/*',
    'out',
    'dist',
    '**/*.d.ts',
    'node_modules',
    'webview/ptah-webview/dist'
  ],
  overrides: [
    // Main extension TypeScript files
    {
      files: ['src/**/*.ts'],
      parserOptions: {
        project: ['tsconfig.json']
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        '@typescript-eslint/recommended-requiring-type-checking'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        'prefer-const': 'error',
        'no-var': 'error'
      }
    },
    // Angular webview TypeScript files
    {
      files: ['webview/ptah-webview/src/**/*.ts'],
      parserOptions: {
        project: ['webview/ptah-webview/tsconfig.json']
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        '@angular-eslint/recommended',
        '@angular-eslint/template/process-inline-templates'
      ],
      rules: {
        // Component & Directive Selectors
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase'
          }
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case'
          }
        ],
        
        // Modern Angular Features (Angular 16+)
        '@angular-eslint/prefer-on-push-component-change-detection': 'error',
        '@angular-eslint/prefer-standalone': 'error',
        '@angular-eslint/prefer-signals': 'error',
        '@angular-eslint/use-injectable-provided-in': 'error',
        
        // Signal Migration Rules (Angular 17+)
        '@angular-eslint/prefer-signal-inputs': 'error',
        '@angular-eslint/prefer-signal-queries': 'error',
        
        // Deprecated/Legacy Pattern Prevention
        '@angular-eslint/no-host-metadata-property': 'error',
        '@angular-eslint/no-inputs-metadata-property': 'error',
        '@angular-eslint/no-outputs-metadata-property': 'error',
        '@angular-eslint/use-component-view-encapsulation': 'warn',
        
        // Component Lifecycle & Architecture
        '@angular-eslint/contextual-lifecycle': 'error',
        '@angular-eslint/no-empty-lifecycle-method': 'error',
        '@angular-eslint/no-conflicting-lifecycle': 'error',
        '@angular-eslint/use-lifecycle-interface': 'error',
        
        // TypeScript Enhancement
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
        '@typescript-eslint/prefer-readonly': 'error',
        
        // Signal-Specific Rules
        '@typescript-eslint/prefer-readonly': 'error', // Signals should be readonly
        'prefer-const': 'error'
      }
    },
    // Angular HTML templates
    {
      files: ['webview/ptah-webview/src/**/*.html'],
      extends: [
        '@angular-eslint/template/recommended',
        '@angular-eslint/template/accessibility'
      ],
      rules: {
        // Modern Control Flow (Angular 17+)
        '@angular-eslint/template/prefer-control-flow': 'error',
        
        // Template Best Practices
        '@angular-eslint/template/prefer-self-closing-tags': 'error',
        '@angular-eslint/template/prefer-ngsrc': 'error',
        '@angular-eslint/template/no-inline-styles': 'warn',
        '@angular-eslint/template/use-track-by-function': 'error',
        
        // Accessibility & UX
        '@angular-eslint/template/alt-text': 'warn',
        '@angular-eslint/template/click-events-have-key-events': 'warn',
        '@angular-eslint/template/mouse-events-have-key-events': 'warn',
        '@angular-eslint/template/valid-aria': 'error',
        '@angular-eslint/template/elements-content': 'warn',
        
        // Performance & Structure
        '@angular-eslint/template/no-call-expression': 'error',
        '@angular-eslint/template/no-duplicate-attributes': 'error',
        '@angular-eslint/template/conditional-complexity': ['warn', { maxComplexity: 3 }],
        '@angular-eslint/template/cyclomatic-complexity': ['warn', { maxComplexity: 10 }],
        
        // Modern Angular Patterns
        '@angular-eslint/template/prefer-control-flow': 'error', // @if/@for/@switch over *ngIf/*ngFor/*ngSwitch
        '@angular-eslint/template/no-negated-async': 'error',
        '@angular-eslint/template/no-any': 'warn'
      }
    }
  ]
};