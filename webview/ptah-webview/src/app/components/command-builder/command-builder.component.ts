import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { CommandBuilderService } from './command-builder.service';
import { VSCodeService } from '../../services/vscode.service';
import { CommandTemplate, CommandParameter } from './command-builder.types';
import {
  MATERIAL_IMPORTS,
  SHARED_COMPONENTS,
  EgyptianCardDirective
} from '../../shared';

@Component({
  selector: 'app-command-builder',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...MATERIAL_IMPORTS,
    ...SHARED_COMPONENTS,
    EgyptianCardDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="command-builder min-h-screen bg-gradient-to-br from-blue-50 to-amber-50" [attr.data-theme]="vscodeService.config().theme">
      <!-- Egyptian Header -->
      <mat-card egyptianCard="accent" class="mb-8">
        <mat-card-content class="text-center py-6">
          <div class="flex items-center justify-center mb-4">
            <mat-icon class="w-12 h-12 text-amber-600 mr-4 !text-4xl" color="accent">build_circle</mat-icon>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">Command Builder</h1>
          </div>
          <p class="text-gray-600 text-lg max-w-2xl mx-auto">
            Harness the power of Claude with guided template creation. Choose from expertly crafted templates
            to accelerate your development workflow.
          </p>
        </mat-card-content>
      </mat-card>

      <!-- Main Content -->
      <div class="container mx-auto px-6 pb-12">
        <!-- Template Gallery -->
        @if (!selectedTemplate()) {
          <div class="template-gallery">
            <!-- Enhanced Search and Filter -->
            <mat-card egyptianCard="primary" class="mb-8">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon color="primary">search</mat-icon>
                  Discover Templates
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="flex flex-col md:flex-row gap-4">
                  <!-- Search Input -->
                  <mat-form-field class="flex-1" egyptianInput="accent" appearance="outline">
                    <mat-label>Search Templates</mat-label>
                    <input matInput
                      placeholder="Search by name, description, or tags..."
                      [value]="searchQuery()"
                      (input)="onSearchChange($event)">
                    <mat-icon matPrefix>search</mat-icon>
                  </mat-form-field>

                  <!-- Category Filter -->
                  <mat-form-field class="w-full md:w-64" appearance="outline">
                    <mat-label>Category</mat-label>
                    <mat-select [value]="selectedCategory()" (selectionChange)="commandBuilderService.setSelectedCategory($event.value)">
                      <mat-option value="all">🌟 All Categories</mat-option>
                      @for (category of categories(); track category.id) {
                        <mat-option [value]="category.id">
                          {{ getCategoryEmoji(category.id) }} {{ category.name }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              </mat-card-content>

              <!-- Category Stats -->
              <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                @for (category of categories(); track category.id) {
                  <div class="text-center p-3 bg-gradient-to-r from-amber-100 to-amber-50 rounded border border-amber-200">
                    <div class="text-2xl mb-1">{{ getCategoryEmoji(category.id) }}</div>
                    <div class="text-sm font-semibold text-gray-800">{{ category.name }}</div>
                    <div class="text-xs text-gray-600">{{ category.templates.length }} templates</div>
                  </div>
                }
              </div>
            </mat-card>

            <!-- Template Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (template of filteredTemplates(); track template.id) {
                <mat-card
                  [egyptianCard]="template.tags?.includes('popular') ? 'accent' : 'primary'"
                  class="cursor-pointer hover:scale-105 transition-transform duration-200 h-full"
                  (click)="selectTemplate(template)"
                >
                  <!-- Popular Badge -->
                  @if (template.tags?.includes('popular')) {
                    <div class="absolute -top-2 -right-2">
                      <div class="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        ⭐ POPULAR
                      </div>
                    </div>
                  }

                  <mat-card-content>
                    <div class="flex flex-col h-full">
                    <!-- Template Icon and Title -->
                    <div class="flex items-start mb-4">
                      <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-lapis-400 to-lapis-600 rounded-egyptian flex items-center justify-center mr-4">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                            @case ('tools') {
                              <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"/>
                            }
                            @default {
                              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z"/>
                            }
                          }
                        </svg>
                      </div>

                      <div class="flex-1">
                        <h3 class="font-bold text-lg text-hieroglyph-800 mb-2">{{ template.name }}</h3>
                        <div class="text-xs bg-gradient-to-r from-ankh-100 to-ankh-50 text-ankh-700 px-2 py-1 rounded-full inline-block">
                          {{ getCategoryDisplayName(template.category) }}
                        </div>
                      </div>
                    </div>

                    <!-- Description -->
                    <p class="text-hieroglyph-600 mb-4 flex-1 leading-relaxed">{{ template.description }}</p>

                    <!-- Template Tags -->
                    @if (template.tags && template.tags.length > 0) {
                      <div class="flex flex-wrap gap-2 mb-4">
                        @for (tag of template.tags.slice(0, 3); track tag) {
                          @if (tag !== 'popular') {
                            <span class="px-2 py-1 text-xs bg-papyrus-200 text-hieroglyph-600 rounded-egyptian">
                              {{ tag }}
                            </span>
                          }
                        }
                        @if (template.tags.length > 3) {
                          <span class="px-2 py-1 text-xs bg-papyrus-300 text-hieroglyph-600 rounded-egyptian">
                            +{{ template.tags.length - 3 }} more
                          </span>
                        }
                      </div>
                    }

                    <!-- Action Footer -->
                    <div class="flex items-center justify-between pt-4 border-t border-papyrus-300">
                      <div class="text-sm text-hieroglyph-500">
                        {{ template.parameters.length }} parameters
                      </div>
                      <div class="flex items-center text-lapis-600 font-medium">
                        <span class="mr-2">Select</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              @if (filteredTemplates().length === 0) {
                <div class="col-span-full">
                  <app-egyptian-card class="text-center py-12">
                    <svg class="w-16 h-16 mx-auto text-hieroglyph-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <h3 class="text-xl font-semibold text-hieroglyph-600 mb-2">No Templates Found</h3>
                    <p class="text-hieroglyph-500 mb-4">Try adjusting your search criteria or category filter.</p>
                    <button
                      (click)="clearSearch()"
                      class="pharaoh-button"
                    >
                      Clear Search
                    </button>
                  </app-egyptian-card>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- Enhanced Parameter Configuration -->
          <div class="parameter-configuration">
            <!-- Enhanced Template Header -->
            <app-egyptian-card variant="accent" class="mb-8">
              <div class="flex items-center justify-between mb-6">
                <button
                  (click)="clearSelection()"
                  class="flex items-center space-x-2 text-lapis-600 hover:text-lapis-800 transition-colors"
                  title="Back to template gallery"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  <span class="font-medium">Back to Gallery</span>
                </button>

                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gradient-to-br from-lapis-400 to-lapis-600 rounded-egyptian flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      @switch (selectedTemplate()?.icon) {
                        @case ('search-review') {
                          <path d="M9 12l2 2 4-4m5-6a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        }
                        @case ('beaker') {
                          <path d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C1.077 14.509 2.077 17 4 17h8c1.923 0 2.923-2.491 1.293-4.121l-4-4A1 1 0 019 8.172V4.414l.707-.707A1 1 0 009 2H7z"/>
                        }
                        @case ('book') {
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 715.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                        }
                        @default {
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z"/>
                        }
                      }
                    </svg>
                  </div>
                  <div class="text-xs bg-gradient-to-r from-ankh-100 to-ankh-50 text-ankh-700 px-3 py-1 rounded-full">
                    {{ getCategoryDisplayName(selectedTemplate()?.category || '') }}
                  </div>
                </div>
              </div>

              <div class="text-center">
                <h2 class="text-3xl font-bold gold-shimmer mb-3">{{ selectedTemplate()?.name }}</h2>
                <p class="text-hieroglyph-600 text-lg leading-relaxed max-w-3xl mx-auto">
                  {{ selectedTemplate()?.description }}
                </p>

                @if (selectedTemplate()?.tags) {
                  <div class="flex flex-wrap justify-center gap-2 mt-4">
                    @for (tag of selectedTemplate()!.tags; track tag) {
                      @if (tag !== 'popular') {
                        <span class="px-3 py-1 text-sm bg-papyrus-200 text-hieroglyph-600 rounded-egyptian">
                          {{ tag }}
                        </span>
                      }
                    }
                  </div>
                }
              </div>
            </app-egyptian-card>

            <!-- Enhanced Parameter Configuration Form -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Parameters Panel -->
              <div class="space-y-6">
                <app-egyptian-card title="Configure Parameters" class="sticky top-4">
                  <form [formGroup]="parameterForm" class="space-y-6">
                    @for (parameter of selectedTemplate()?.parameters || []; track parameter.name) {
                      <div class="parameter-field">
                        <label [for]="parameter.name" class="block text-sm font-medium text-hieroglyph-700 mb-2">
                          {{ parameter.description }}
                          @if (parameter.required) {
                            <span class="text-red-500 ml-1">*</span>
                          }
                        </label>

                        @switch (parameter.type) {
                          @case ('string') {
                            <input
                              [id]="parameter.name"
                              [formControlName]="parameter.name"
                              [placeholder]="parameter.placeholder || 'Enter value...'"
                              type="text"
                              class="hieroglyph-input w-full"
                            />
                          }
                          @case ('select') {
                            <select
                              [id]="parameter.name"
                              [formControlName]="parameter.name"
                              class="hieroglyph-input w-full"
                            >
                              @if (!parameter.required) {
                                <option value="">-- Select option --</option>
                              }
                              @for (option of parameter.options; track option) {
                                <option [value]="getOptionValue(option)">{{ getOptionLabel(option) }}</option>
                              }
                            </select>
                          }
                          @case ('multiselect') {
                            <div class="space-y-2 max-h-48 overflow-y-auto bg-papyrus-50 rounded-egyptian p-4 border border-papyrus-300">
                              @for (option of parameter.options; track $index) {
                                <label class="flex items-center space-x-3 p-2 rounded-egyptian hover:bg-papyrus-100 cursor-pointer transition-colors">
                                  <input
                                    type="checkbox"
                                    [value]="getOptionValue(option)"
                                    (change)="onMultiselectChange(parameter.name, getOptionValue(option), $event)"
                                    [checked]="isMultiselectSelected(parameter.name, getOptionValue(option))"
                                    class="rounded border-papyrus-300 text-lapis-600 focus:ring-lapis-500"
                                  />
                                  <span class="text-sm text-hieroglyph-700">{{ getOptionLabel(option) }}</span>
                                </label>
                              }
                            </div>
                          }
                          @case ('boolean') {
                            <label class="flex items-center space-x-3 cursor-pointer">
                              <input
                                [id]="parameter.name"
                                [formControlName]="parameter.name"
                                type="checkbox"
                                class="rounded border-papyrus-300 text-lapis-600 focus:ring-lapis-500"
                              />
                              <span class="text-sm text-hieroglyph-700">Enable this option</span>
                            </label>
                          }
                          @case ('file') {
                            <div class="space-y-2">
                              <button
                                type="button"
                                (click)="selectFile(parameter.name)"
                                class="w-full flex items-center justify-center space-x-3 p-4 border border-dashed border-papyrus-400 rounded-egyptian hover:border-lapis-500 hover:bg-lapis-50 transition-colors"
                              >
                                <svg class="w-6 h-6 text-hieroglyph-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                <span class="text-hieroglyph-600">
                                  {{ getFileDisplayName(parameter.name) || parameter.placeholder || 'Click to select file' }}
                                </span>
                              </button>
                              @if (getParameterValue(parameter.name)) {
                                <div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-egyptian">
                                  <div class="flex items-center space-x-2">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span class="text-sm text-green-800 font-medium">File Selected</span>
                                  </div>
                                  <button
                                    type="button"
                                    (click)="clearFile(parameter.name)"
                                    class="text-green-600 hover:text-green-800 transition-colors"
                                    title="Clear selection"
                                  >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                  </button>
                                </div>
                              }
                            </div>
                          }
                        }

                        @if (parameterForm.get(parameter.name)?.errors && parameterForm.get(parameter.name)?.touched) {
                          <div class="mt-2 p-3 bg-red-50 border border-red-200 rounded-egyptian">
                            <div class="flex items-center space-x-2">
                              <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              <span class="text-sm text-red-700">
                                @if (parameterForm.get(parameter.name)?.errors?.['required']) {
                                  This field is required
                                }
                                @if (parameter.validation?.message) {
                                  {{ parameter.validation?.message }}
                                }
                              </span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </form>
                </app-egyptian-card>

                <!-- Examples Section -->
                @if (selectedTemplate()?.examples && selectedTemplate()!.examples!.length > 0) {
                  <app-egyptian-card title="Quick Start Examples">
                    <div class="space-y-3">
                      @for (example of selectedTemplate()!.examples!; track example.title) {
                        <div
                          class="p-4 border border-papyrus-300 rounded-egyptian hover:border-lapis-400 hover:bg-lapis-50 cursor-pointer transition-all duration-200"
                          (click)="applyExample(example)"
                        >
                          <h4 class="font-semibold text-hieroglyph-800 mb-2">{{ example.title }}</h4>
                          <p class="text-sm text-hieroglyph-600 mb-3">{{ example.description }}</p>
                          <div class="flex items-center justify-between">
                            <span class="text-xs text-lapis-600 font-medium">Click to apply</span>
                            <svg class="w-4 h-4 text-lapis-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                          </div>
                        </div>
                      }
                    </div>
                  </app-egyptian-card>
                }
              </div>

              <!-- Live Preview Panel -->
              <div class="space-y-6">
                <app-egyptian-card title="Command Preview" class="sticky top-4">
                  <div class="space-y-4">
                    <!-- Validation Status -->
                    <div class="flex items-center justify-between p-4 rounded-egyptian"
                         [class]="isCommandValid() ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
                      <div class="flex items-center space-x-2">
                        @if (isCommandValid()) {
                          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span class="text-green-800 font-medium">Ready to Execute</span>
                        } @else {
                          <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span class="text-yellow-800 font-medium">Complete Required Fields</span>
                        }
                      </div>

                      <div class="text-sm"
                           [class]="isCommandValid() ? 'text-green-600' : 'text-yellow-600'">
                        {{ getValidationMessage() }}
                      </div>
                    </div>

                    <!-- Command Preview -->
                    <div class="bg-hieroglyph-900 rounded-egyptian p-4 overflow-auto max-h-96">
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-green-400 text-sm font-mono">claude></span>
                        <div class="flex space-x-2">
                          <button
                            (click)="copyCommand()"
                            [disabled]="!isCommandValid()"
                            class="text-hieroglyph-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Copy command"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <pre class="text-papyrus-100 text-sm font-mono leading-relaxed whitespace-pre-wrap">{{ previewCommand() || 'Configure parameters above to see the command preview...' }}</pre>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        (click)="copyCommand()"
                        [disabled]="!isCommandValid()"
                        class="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-papyrus-300 rounded-egyptian text-hieroglyph-700 hover:bg-papyrus-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        <span>Copy Command</span>
                      </button>

                      <button
                        (click)="executeCommand()"
                        [disabled]="!isCommandValid()"
                        class="flex-1 pharaoh-button disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12l-2-5H6l-2 5z"/>
                        </svg>
                        Execute in Chat
                      </button>
                    </div>
                  </div>
                </app-egyptian-card>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

  `
})
export class CommandBuilderComponent {
  readonly commandBuilderService = inject(CommandBuilderService);
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

  // Helper methods for UI
  getCategoryEmoji(categoryId: string): string {
    const emojiMap: Record<string, string> = {
      'code-review': '🔍',
      'testing': '🧪',
      'documentation': '📚',
      'refactoring': '🔨',
      'analysis': '🔎',
      'optimization': '🚀',
      'generation': '⚡',
      'security': '🛡️',
      'debugging': '🐛'
    };
    return emojiMap[categoryId] || '📁';
  }

  getCategoryDisplayName(categoryId: string): string {
    return this.commandBuilderService.getCategoryDisplayName(categoryId);
  }

  clearSearch(): void {
    this.commandBuilderService.setSearchQuery('');
    this.commandBuilderService.setSelectedCategory('all');
  }

  getValidationMessage(): string {
    const template = this.selectedTemplate();
    if (!template) return '';

    const requiredParams = template.parameters.filter(p => p.required);
    const params = this.commandBuilderService.parameters();
    const missingParams = requiredParams.filter(p => {
      const value = params[p.name];
      return value === undefined || value === null || value === '';
    });

    if (missingParams.length === 0) {
      return 'All requirements met';
    } else if (missingParams.length === 1) {
      return `Missing: ${missingParams[0].description}`;
    } else {
      return `Missing ${missingParams.length} required fields`;
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
