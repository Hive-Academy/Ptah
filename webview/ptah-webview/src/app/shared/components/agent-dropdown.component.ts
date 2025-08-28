import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDownIcon, UserIcon, BotIcon, CodeIcon, TestTubeIcon, SearchIcon } from 'lucide-angular';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

@Component({
  selector: 'app-agent-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div class="relative">
      <!-- Dropdown Trigger -->
      <button 
        class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg vscode-input-bg vscode-input-border border hover:vscode-hover-bg transition-colors duration-200"
        [class.ring-2]="isOpen()"
        [class.ring-blue-400]="isOpen()"
        (click)="toggleDropdown()"
        type="button">
        
        <div class="w-5 h-5 rounded-full flex items-center justify-center"
             [style.background-color]="selectedAgent().color + '20'"
             [style.color]="selectedAgent().color">
          <lucide-angular [img]="selectedAgent().icon" class="w-3 h-3"></lucide-angular>
        </div>
        
        <span class="vscode-fg">{{ selectedAgent().name }}</span>
        
        <lucide-angular 
          [img]="ChevronDownIcon" 
          class="w-4 h-4 vscode-description transition-transform duration-200"
          [class.rotate-180]="isOpen()">
        </lucide-angular>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="absolute top-full left-0 right-0 mt-1 vscode-bg vscode-border border rounded-lg shadow-lg z-50 py-2">
          @for (agent of agents; track agent.id) {
            <button
              class="w-full flex items-center gap-3 px-3 py-2 text-sm hover:vscode-hover-bg transition-colors duration-200"
              [class.vscode-selection-bg]="agent.id === selectedAgent().id"
              (click)="selectAgent(agent)"
              type="button">
              
              <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                   [style.background-color]="agent.color + '20'"
                   [style.color]="agent.color">
                <lucide-angular [img]="agent.icon" class="w-3 h-3"></lucide-angular>
              </div>
              
              <div class="flex-1 text-left">
                <div class="font-medium vscode-fg">{{ agent.name }}</div>
                <div class="text-xs vscode-description">{{ agent.description }}</div>
              </div>
              
              @if (agent.id === selectedAgent().id) {
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              }
            </button>
          }
        </div>
      }
    </div>

    <!-- Backdrop -->
    @if (isOpen()) {
      <div 
        class="fixed inset-0 z-40"
        (click)="closeDropdown()">
      </div>
    }
  `
})
export class AgentDropdownComponent {
  @Input() placeholder = 'Select Agent';
  @Input() selectedAgentId?: string;
  @Output() agentSelected = new EventEmitter<Agent>();

  // Icons
  readonly ChevronDownIcon = ChevronDownIcon;
  
  // State
  isOpen = signal(false);

  // Available agents
  agents: Agent[] = [
    {
      id: 'general',
      name: 'General',
      description: 'General purpose assistant',
      icon: BotIcon,
      color: '#60a5fa'
    },
    {
      id: 'code',
      name: 'Code',
      description: 'Write, modify, and refactor code',
      icon: CodeIcon,
      color: '#34d399'
    },
    {
      id: 'architect',
      name: 'Architect',
      description: 'Plan and design before implementation',
      icon: UserIcon,
      color: '#f59e0b'
    },
    {
      id: 'debug',
      name: 'Debug',
      description: 'Diagnose and fix software issues',
      icon: SearchIcon,
      color: '#ef4444'
    },
    {
      id: 'ask',
      name: 'Ask',
      description: 'Get answers and explanations',
      icon: TestTubeIcon,
      color: '#8b5cf6'
    }
  ];

  selectedAgent = signal<Agent>(this.agents[0]);

  ngOnInit() {
    if (this.selectedAgentId) {
      const agent = this.agents.find(a => a.id === this.selectedAgentId);
      if (agent) {
        this.selectedAgent.set(agent);
      }
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  selectAgent(agent: Agent): void {
    this.selectedAgent.set(agent);
    this.agentSelected.emit(agent);
    this.closeDropdown();
  }
}