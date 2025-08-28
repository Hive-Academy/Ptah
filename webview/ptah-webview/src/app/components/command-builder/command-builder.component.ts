import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { LucideAngularModule, HammerIcon, SearchIcon } from 'lucide-angular';
import { CommandBuilderService } from './command-builder.service';
import { VSCodeService } from '../../core/services/vscode.service';
import { CommandTemplate, CommandParameter } from './command-builder.types';
// No additional component imports needed - using native HTML elements

@Component({
  selector: 'app-command-builder',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="command-builder">
      <!-- VS Code Header -->
      <div class="header">
        <div class="header-content">
          <div class="title-section">
            <lucide-angular [img]="HammerIcon" class="w-6 h-6"></lucide-angular>
            <h1>Command Builder</h1>
          </div>
          <p class="subtitle">
            Choose from expertly crafted templates to accelerate your development workflow.
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content">
        @if (!selectedTemplate()) {
          <!-- Template Gallery -->
          <div class="template-gallery">
            <!-- Search and Filter -->
            <div class="search-section">
              <div class="search-controls">
                <input
                  type="text"
                  class="vscode-input"
                  [value]="searchQuery()"
                  (input)="onSearchChange($event)"
                  placeholder="Search templates...">

                <select
                  class="category-select"
                  [value]="selectedCategory()"
                  (change)="onCategoryChange($event)">
                  <option value="all">All Categories</option>
                  @for (category of categories(); track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Template Grid -->
            <div class="template-grid">
              @for (template of filteredTemplates(); track template.id) {
                <div class="template-card" (click)="selectTemplate(template)">
                  <div class="template-header">
                    <h3>{{ template.name }}</h3>
                    <span class="category-badge">{{ getCategoryDisplayName(template.category) }}</span>
                  </div>
                  <p class="template-description">{{ template.description }}</p>
                  <div class="template-footer">
                    <span class="param-count">{{ template.parameters.length }} parameters</span>
                  </div>
                </div>
              }

              @if (filteredTemplates().length === 0) {
                <div class="no-templates">
                  <h3>No Templates Found</h3>
                  <p>Try adjusting your search criteria.</p>
                  <button class="clear-button" (click)="clearSearch()">Clear Search</button>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- Parameter Configuration -->
          <div class="parameter-config">
            <!-- Template Header -->
            <div class="config-header">
              <button class="back-button" (click)="clearSelection()">
                ← Back to Gallery
              </button>
              <div class="template-info">
                <h2>{{ selectedTemplate()?.name }}</h2>
                <p>{{ selectedTemplate()?.description }}</p>
              </div>
            </div>

            <!-- Form and Preview -->
            <div class="config-grid">
              <!-- Parameters Panel -->
              <div class="parameters-panel">
                <h3>Configure Parameters</h3>
                <form [formGroup]="parameterForm" class="parameter-form">
                  @for (parameter of selectedTemplate()?.parameters || []; track parameter.name) {
                    <div class="parameter-field">
                      <label>{{ parameter.description }}
                        @if (parameter.required) { <span class="required">*</span> }
                      </label>

                      @switch (parameter.type) {
                        @case ('string') {
                          <input
                            [formControlName]="parameter.name"
                            [placeholder]="parameter.placeholder || 'Enter value...'"
                            type="text"
                            class="vscode-input"
                          />
                        }
                        @case ('select') {
                          <select
                            [formControlName]="parameter.name"
                            class="vscode-select"
                          >
                            @if (!parameter.required) {
                              <option value="">-- Select option --</option>
                            }
                            @for (option of parameter.options; track option) {
                              <option [value]="getOptionValue(option)">{{ getOptionLabel(option) }}</option>
                            }
                          </select>
                        }
                        @case ('boolean') {
                          <label class="checkbox-label">
                            <input
                              [formControlName]="parameter.name"
                              type="checkbox"
                            />
                            <span>Enable this option</span>
                          </label>
                        }
                      }

                      @if (parameterForm.get(parameter.name)?.errors && parameterForm.get(parameter.name)?.touched) {
                        <div class="error-message">
                          @if (parameterForm.get(parameter.name)?.errors?.['required']) {
                            This field is required
                          }
                        </div>
                      }
                    </div>
                  }
                </form>
              </div>

              <!-- Preview Panel -->
              <div class="preview-panel">
                <h3>Command Preview</h3>
                <div class="validation-status" [class.valid]="isCommandValid()">
                  {{ isCommandValid() ? '✓ Ready to Execute' : '⚠ Complete Required Fields' }}
                </div>

                <div class="command-preview">
                  <pre>{{ previewCommand() || 'Configure parameters above to see the command preview...' }}</pre>
                </div>

                <div class="action-buttons">
                  <button
                    (click)="copyCommand()"
                    [disabled]="!isCommandValid()"
                    class="copy-button">
                    Copy Command
                  </button>

                  <button
                    (click)="executeCommand()"
                    [disabled]="!isCommandValid()"
                    class="execute-button">
                    Execute in Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .command-builder {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }

    .header {
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-panel-background);
      padding: 16px;
    }

    .header-content {
      text-align: center;
    }

    .title-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .title-section h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--vscode-panelTitle-activeForeground);
    }

    .subtitle {
      margin: 0;
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
    }

    .content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .search-section {
      margin-bottom: 24px;
    }

    .search-controls {
      display: flex;
      gap: 16px;
      max-width: 600px;
    }

    .search-controls vscode-input {
      flex: 1;
    }

    .category-select {
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      padding: 8px 12px;
      font-size: 14px;
      min-width: 150px;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .template-card {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 16px;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }

    .template-card:hover {
      border-color: var(--vscode-focusBorder);
    }

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .template-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .category-badge {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
    }

    .template-description {
      margin: 0 0 12px 0;
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
    }

    .template-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .no-templates {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
    }

    .config-header {
      margin-bottom: 24px;
    }

    .back-button {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 16px;
    }

    .back-button:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .template-info h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .template-info p {
      margin: 0;
      color: var(--vscode-descriptionForeground);
    }

    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .parameters-panel, .preview-panel {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 16px;
    }

    .parameters-panel h3, .preview-panel h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .parameter-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .parameter-field label {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
      font-weight: 500;
    }

    .required {
      color: var(--vscode-editorError-foreground);
    }

    .vscode-input, .vscode-select {
      width: 100%;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      padding: 8px 12px;
      font-size: 14px;
    }

    .vscode-input:focus, .vscode-select:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .error-message {
      color: var(--vscode-editorError-foreground);
      font-size: 12px;
      margin-top: 4px;
    }

    .validation-status {
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      background: var(--vscode-inputValidation-warningBackground);
      color: var(--vscode-inputValidation-warningForeground);
      border: 1px solid var(--vscode-inputValidation-warningBorder);
    }

    .validation-status.valid {
      background: var(--vscode-inputValidation-infoBackground, #d4edda);
      color: var(--vscode-inputValidation-infoForeground, #155724);
      border-color: var(--vscode-inputValidation-infoBorder, #c3e6cb);
    }

    .command-preview {
      background: var(--vscode-terminal-background, #1e1e1e);
      color: var(--vscode-terminal-foreground, #ffffff);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 13px;
      overflow-x: auto;
    }

    .command-preview pre {
      margin: 0;
      white-space: pre-wrap;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .copy-button, .execute-button {
      flex: 1;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.15s ease;
    }

    .copy-button {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border, transparent);
    }

    .copy-button:hover:not(:disabled) {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .execute-button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: 1px solid var(--vscode-button-border, transparent);
    }

    .execute-button:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }

    .copy-button:disabled, .execute-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .clear-button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 16px;
    }

    @media (max-width: 768px) {
      .config-grid {
        grid-template-columns: 1fr;
      }

      .search-controls {
        flex-direction: column;
      }
    }
  `]
})
export class CommandBuilderComponent {
  readonly commandBuilderService = inject(CommandBuilderService);
  readonly vscodeService = inject(VSCodeService);
  private fb = inject(FormBuilder);

  // Lucide Icons for template
  readonly HammerIcon = HammerIcon;
  readonly SearchIcon = SearchIcon;

  // Component signals
  readonly searchQuery = this.commandBuilderService.searchQuery;
  readonly selectedCategory = this.commandBuilderService.selectedCategory;
  readonly categories = this.commandBuilderService.categories;
  readonly filteredTemplates = this.commandBuilderService.filteredTemplates;
  readonly selectedTemplate = this.commandBuilderService.selectedTemplate;
  readonly previewCommand = this.commandBuilderService.previewCommand;
  readonly isCommandValid = this.commandBuilderService.isCommandValid;

  parameterForm!: FormGroup;

  constructor() {
    // Initialize form when template is selected
    effect(() => {
      const template = this.selectedTemplate();
      if (template) {
        this.initializeForm(template);
      }
    });

    // Notify VS Code that component is ready
    this.vscodeService.notifyReady();
  }

  // Helper methods for options
  getOptionValue(option: string | any): string {
    return typeof option === 'string' ? option : option.value;
  }

  getOptionLabel(option: string | any): string {
    return typeof option === 'string' ? option : option.label;
  }

  // Template selection
  selectTemplate(template: CommandTemplate): void {
    this.commandBuilderService.selectTemplate(template);
  }

  clearSelection(): void {
    this.commandBuilderService.selectTemplate(null);
  }

  // Search and filtering
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.commandBuilderService.setSearchQuery(target.value);
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.commandBuilderService.setSelectedCategory(target.value);
  }

  // Form management
  private initializeForm(template: CommandTemplate): void {
    const controls: Record<string, FormControl> = {};

    template.parameters.forEach(param => {
      const validators = param.required ? [Validators.required] : [];
      const defaultValue = param.defaultValue ?? (param.type === 'multiselect' ? [] : '');

      controls[param.name] = new FormControl(defaultValue, validators);
    });

    this.parameterForm = this.fb.group(controls);

    // Subscribe to form changes
    this.parameterForm.valueChanges.subscribe(values => {
      this.commandBuilderService.setParameters(values);
    });
  }

  getCategoryDisplayName(categoryId: string): string {
    return this.commandBuilderService.getCategoryDisplayName(categoryId);
  }

  clearSearch(): void {
    this.commandBuilderService.setSearchQuery('');
    this.commandBuilderService.setSelectedCategory('all');
  }

  // Actions
  copyCommand(): void {
    const command = this.previewCommand();
    if (command) {
      navigator.clipboard.writeText(command).then(() => {
        this.vscodeService.showMessage('Command copied to clipboard!', 'info');
      });
    }
  }

  executeCommand(): void {
    const result = this.commandBuilderService.buildCommandResult();
    if (result) {
      this.vscodeService.postMessage('executeBuiltCommand', result);
      this.vscodeService.showMessage('Command sent to chat!', 'info');
    }
  }
}
