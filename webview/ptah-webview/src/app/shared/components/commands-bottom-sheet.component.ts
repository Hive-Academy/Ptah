import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CommandIcon, XIcon, TerminalIcon, FileTextIcon, SearchIcon, FlaskConicalIcon, BookOpenIcon, TrendingUpIcon } from 'lucide-angular';

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  category: 'review' | 'generate' | 'debug' | 'optimize' | 'document';
}

@Component({
  selector: 'app-commands-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  template: `
    <!-- Backdrop -->
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
        (click)="close()">
        
        <!-- Bottom Sheet -->
        <div 
          class="w-full max-h-[70vh] vscode-bg rounded-t-2xl border-t vscode-border shadow-2xl transform transition-transform duration-300 ease-out"
          [class.translate-y-0]="isOpen()"
          [class.translate-y-full]="!isOpen()"
          (click)="$event.stopPropagation()">
          
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b vscode-border">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <lucide-angular [img]="CommandIcon" class="w-4 h-4 text-blue-400"></lucide-angular>
              </div>
              <div>
                <h3 class="text-lg font-semibold vscode-fg">Commands</h3>
                <p class="text-sm vscode-description">Choose a command template</p>
              </div>
            </div>
            
            <button 
              class="w-8 h-8 rounded-full hover:vscode-hover-bg flex items-center justify-center transition-colors duration-200"
              (click)="close()"
              type="button">
              <lucide-angular [img]="XIcon" class="w-4 h-4 vscode-description"></lucide-angular>
            </button>
          </div>

          <!-- Content -->
          <div class="p-4 overflow-y-auto max-h-[calc(70vh-120px)]">
            <!-- Search -->
            <div class="relative mb-4">
              <input 
                type="text"
                placeholder="Search commands..."
                class="w-full px-4 py-3 pl-10 rounded-lg vscode-input-bg vscode-input-border border vscode-input-fg placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                [(ngModel)]="searchQuery"
                (input)="filterCommands()">
              
              <lucide-angular 
                [img]="SearchIcon" 
                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 vscode-description">
              </lucide-angular>
            </div>

            <!-- Command Categories -->
            <div class="space-y-6">
              @for (category of getFilteredCategories(); track category.name) {
                <div>
                  <h4 class="text-sm font-medium vscode-fg mb-3 uppercase tracking-wide opacity-70">
                    {{ category.name }}
                  </h4>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (command of category.commands; track command.id) {
                      <button
                        class="flex items-start gap-3 p-3 rounded-lg vscode-border border hover:vscode-hover-bg transition-all duration-200 text-left group"
                        (click)="selectCommand(command)"
                        type="button">
                        
                        <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors duration-200">
                          <lucide-angular [img]="command.icon" class="w-4 h-4 text-blue-400"></lucide-angular>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                          <div class="font-medium vscode-fg mb-1">{{ command.name }}</div>
                          <div class="text-sm vscode-description line-clamp-2">{{ command.description }}</div>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- No Results -->
            @if (getFilteredCategories().length === 0) {
              <div class="text-center py-8">
                <div class="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
                  <lucide-angular [img]="SearchIcon" class="w-8 h-8 vscode-description"></lucide-angular>
                </div>
                <p class="vscode-fg font-medium mb-1">No commands found</p>
                <p class="text-sm vscode-description">Try adjusting your search terms</p>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class CommandsBottomSheetComponent {
  @Input() isOpen = signal(false);
  @Output() commandSelected = new EventEmitter<CommandTemplate>();
  @Output() closed = new EventEmitter<void>();

  // Icons
  readonly CommandIcon = CommandIcon;
  readonly XIcon = XIcon;
  readonly SearchIcon = SearchIcon;

  // State
  searchQuery = '';
  filteredCommands: CommandTemplate[] = [];

  // Command templates
  commands: CommandTemplate[] = [
    {
      id: 'review-code',
      name: 'Review Code',
      description: 'Analyze current file for potential improvements and best practices',
      icon: FileTextIcon,
      prompt: 'Please review the current file for potential improvements.',
      category: 'review'
    },
    {
      id: 'generate-tests',
      name: 'Generate Tests',
      description: 'Create comprehensive unit tests for the current file',
      icon: FlaskConicalIcon,
      prompt: 'Generate comprehensive unit tests for the current file.',
      category: 'generate'
    },
    {
      id: 'find-bugs',
      name: 'Find Bugs',
      description: 'Analyze code for potential bugs and issues',
      icon: SearchIcon,
      prompt: 'Analyze the current code for potential bugs and issues.',
      category: 'debug'
    },
    {
      id: 'add-docs',
      name: 'Add Documentation',
      description: 'Add comprehensive documentation to the current code',
      icon: BookOpenIcon,
      prompt: 'Add comprehensive documentation to the current code.',
      category: 'document'
    },
    {
      id: 'optimize-performance',
      name: 'Optimize Performance',
      description: 'Suggest performance optimizations for the current code',
      icon: TrendingUpIcon,
      prompt: 'Suggest performance optimizations for the current code.',
      category: 'optimize'
    }
  ];

  ngOnInit() {
    this.filteredCommands = [...this.commands];
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  selectCommand(command: CommandTemplate): void {
    this.commandSelected.emit(command);
    this.close();
  }

  filterCommands(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCommands = [...this.commands];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredCommands = this.commands.filter(command =>
      command.name.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query)
    );
  }

  getFilteredCategories() {
    const categories = [
      { name: 'Review', key: 'review' as const },
      { name: 'Generate', key: 'generate' as const },
      { name: 'Debug', key: 'debug' as const },
      { name: 'Optimize', key: 'optimize' as const },
      { name: 'Document', key: 'document' as const }
    ];

    return categories
      .map(category => ({
        name: category.name,
        commands: this.filteredCommands.filter(cmd => cmd.category === category.key)
      }))
      .filter(category => category.commands.length > 0);
  }
}