import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { CommandBuilderService } from './command-builder.service';
import { VSCodeService } from '../../services/vscode.service';
import { CommandTemplate, CommandParameter } from './command-builder.types';

@Component({
  selector: 'app-command-builder',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="command-builder" [attr.data-theme]="vscodeService.config().theme">
      <!-- Header -->
      <header class="command-builder-header">
        <h1>Command Builder</h1>
        <p>Build powerful Claude commands with guided templates</p>
      </header>

      <!-- Main Content -->
      <div class="command-builder-content">
        <!-- Template Selection -->
        @if (!selectedTemplate()) {
          <div class="template-selection">
            <!-- Search and Filter -->
            <div class="search-filter-bar">
              <div class="search-box">
                <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
                <input
                  type="text"
                  placeholder="Search templates..."
                  [value]="searchQuery()"
                  (input)="onSearchChange($event)"
                  class="search-input"
                />
              </div>

              <select
                [value]="selectedCategory()"
                (change)="onCategoryChange($event)"
                class="category-filter"
              >
                <option value="all">All Categories</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
            </div>

            <!-- Template Grid -->
            <div class="template-grid">
              @for (template of filteredTemplates(); track template.id) {
                <div
                  class="template-card"
                  (click)="selectTemplate(template)"
                  [class.featured]="template.tags?.includes('popular')"
                >
                  <div class="template-icon">
                    <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                      @switch (template.icon) {
                        @case ('search-review') {
                          <path d="M9 12l2 2 4-4m5-6a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        }
                        @case ('beaker') {
                          <path d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C1.077 14.509 2.077 17 4 17h8c1.923 0 2.923-2.491 1.293-4.121l-4-4A1 1 0 019 8.172V4.414l.707-.707A1 1 0 009 2H7z"/>
                        }
                        @case ('book') {
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                        }
                        @default {
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z"/>
                        }
                      }
                    </svg>
                  </div>

                  <div class="template-content">
                    <h3 class="template-name">{{ template.name }}</h3>
                    <p class="template-description">{{ template.description }}</p>

                    @if (template.tags) {
                      <div class="template-tags">
                        @for (tag of template.tags; track tag) {
                          <span class="tag">{{ tag }}</span>
                        }
                      </div>
                    }
                  </div>

                  <div class="template-arrow">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- Parameter Configuration -->
          <div class="parameter-configuration">
            <!-- Template Header -->
            <div class="selected-template-header">
              <button
                class="back-button"
                (click)="clearSelection()"
                title="Back to templates"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Back
              </button>

              <div class="template-info">
                <h2>{{ selectedTemplate()?.name }}</h2>
                <p>{{ selectedTemplate()?.description }}</p>
              </div>
            </div>

            <!-- Parameter Form -->
            <form [formGroup]="parameterForm" class="parameter-form">
              @for (parameter of selectedTemplate()?.parameters || []; track parameter.name) {
                <div class="parameter-field">
                  <label [for]="parameter.name" class="parameter-label">
                    {{ parameter.description }}
                    @if (parameter.required) {
                      <span class="required">*</span>
                    }
                  </label>

                  @switch (parameter.type) {
                    @case ('string') {
                      <input
                        [id]="parameter.name"
                        [formControlName]="parameter.name"
                        [placeholder]="parameter.placeholder || ''"
                        type="text"
                        class="parameter-input"
                      />
                    }
                    @case ('select') {
                      <select
                        [id]="parameter.name"
                        [formControlName]="parameter.name"
                        class="parameter-select"
                      >
                        @if (!parameter.required) {
                          <option value="">-- Select option --</option>
                        }
                        @for (option of parameter.options; track option) {
                          <option [value]="option">{{ option }}</option>
                        }
                      </select>
                    }
                    @case ('multiselect') {
                      <div class="multiselect-container">
                        @for (option of parameter.options; track $index) {
                          <label class="checkbox-label">
                            <input
                              type="checkbox"
                              [value]="getOptionValue(option)"
                              (change)="onMultiselectChange(parameter.name, getOptionValue(option), $event)"
                              [checked]="isMultiselectSelected(parameter.name, getOptionValue(option))"
                            />
                            <span class="checkbox-text">{{ getOptionLabel(option) }}</span>
                          </label>
                        }
                      </div>
                    }
                    @case ('boolean') {
                      <label class="toggle-label">
                        <input
                          [id]="parameter.name"
                          [formControlName]="parameter.name"
                          type="checkbox"
                          class="toggle-input"
                        />
                        <span class="toggle-slider"></span>
                      </label>
                    }
                    @case ('file') {
                      <div class="file-input-container">
                        <button
                          type="button"
                          class="file-select-button"
                          (click)="selectFile(parameter.name)"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                          </svg>
                          {{ getFileDisplayName(parameter.name) || parameter.placeholder || 'Select file...' }}
                        </button>
                        @if (getParameterValue(parameter.name)) {
                          <button
                            type="button"
                            class="file-clear-button"
                            (click)="clearFile(parameter.name)"
                            title="Clear selection"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                          </button>
                        }
                      </div>
                    }
                  }

                  @if (parameterForm.get(parameter.name)?.errors && parameterForm.get(parameter.name)?.touched) {
                    <div class="parameter-error">
                      @if (parameterForm.get(parameter.name)?.errors?.['required']) {
                        This field is required
                      }
                      @if (parameter.validation?.message) {
                        {{ parameter.validation?.message }}
                      }
                    </div>
                  }
                </div>
              }
            </form>

            <!-- Examples -->
            @if (selectedTemplate()?.examples?.length) {
              <div class="examples-section">
                <h3>Examples</h3>
                <div class="examples-grid">
                  @for (example of selectedTemplate()?.examples || []; track example.title) {
                    <div
                      class="example-card"
                      (click)="applyExample(example)"
                    >
                      <h4>{{ example.title }}</h4>
                      <p>{{ example.description }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Preview and Actions -->
      @if (selectedTemplate()) {
        <div class="command-preview-section">
          <div class="preview-header">
            <h3>Command Preview</h3>
            <div class="preview-actions">
              <button
                class="copy-button"
                (click)="copyCommand()"
                [disabled]="!isCommandValid()"
                title="Copy command to clipboard"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                </svg>
                Copy
              </button>

              <button
                class="execute-button"
                (click)="executeCommand()"
                [disabled]="!isCommandValid()"
                [class.primary]="isCommandValid()"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
                Execute Command
              </button>
            </div>
          </div>

          <div class="command-preview">
            <pre><code>{{ previewCommand() || 'Configure parameters to see preview...' }}</code></pre>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./command-builder.component.scss']
})
export class CommandBuilderComponent {
  private commandBuilderService = inject(CommandBuilderService);
  readonly vscodeService = inject(VSCodeService);  // Make public for template access
  private fb = inject(FormBuilder);

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

  // Parameter handling
  getParameterValue(paramName: string): any {
    return this.parameterForm?.get(paramName)?.value;
  }

  onMultiselectChange(paramName: string, option: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentValue = this.getParameterValue(paramName) || [];

    let newValue: string[];
    if (target.checked) {
      newValue = [...currentValue, option];
    } else {
      newValue = currentValue.filter((item: string) => item !== option);
    }

    this.parameterForm.get(paramName)?.setValue(newValue);
  }

  isMultiselectSelected(paramName: string, option: string): boolean {
    const value = this.getParameterValue(paramName);
    return Array.isArray(value) && value.includes(option);
  }

  // File handling
  selectFile(paramName: string): void {
    this.vscodeService.requestFilePicker({ multiple: false });

    // Listen for file selection response
    this.vscodeService.onMessageType('fileSelected').subscribe(data => {
      if (data.files && data.files.length > 0) {
        this.parameterForm.get(paramName)?.setValue(data.files[0]);
      }
    });
  }

  clearFile(paramName: string): void {
    this.parameterForm.get(paramName)?.setValue('');
  }

  getFileDisplayName(paramName: string): string {
    const filePath = this.getParameterValue(paramName);
    if (!filePath) return '';

    // Extract filename from path
    return filePath.split(/[/\\]/).pop() || filePath;
  }

  // Examples
  applyExample(example: any): void {
    if (this.parameterForm) {
      Object.keys(example.parameters).forEach(key => {
        const control = this.parameterForm.get(key);
        if (control) {
          control.setValue(example.parameters[key]);
        }
      });
    }
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
