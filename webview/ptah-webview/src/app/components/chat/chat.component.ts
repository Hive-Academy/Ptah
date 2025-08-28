import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, filter } from 'rxjs';
import { LucideAngularModule, SendIcon, PlusIcon, SettingsIcon, HistoryIcon, FileTextIcon, ZapIcon, CodeIcon, RefreshCwIcon, EditIcon, FileIcon, SearchIcon, FlaskConicalIcon, BookOpenIcon, TrendingUpIcon } from 'lucide-angular';

import { MatTooltipModule } from '@angular/material/tooltip';
import { EgyptianButtonComponent } from '../../shared/components/egyptian-button.component';
import { EgyptianInputComponent } from '../../shared/components/egyptian-input.component';
import { EgyptianThemeService } from '../../core/services/egyptian-theme.service';
import { MessageHandlerService } from '../../core/services/message-handler.service';
import { VSCodeService, VSCodeMessage } from '../../core/services/vscode.service';
import { AppStateManager } from '../../core/services/app-state.service';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isError?: boolean;
  files?: string[];
  streaming?: boolean;
}

interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  tokenUsage?: {
    total: number;
    percentage: number;
  };
}

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    EgyptianButtonComponent,
    EgyptianInputComponent
  ],
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private messageHandler = inject(MessageHandlerService);
  private vscode = inject(VSCodeService);
  private appState = inject(AppStateManager);
  private themeService = inject(EgyptianThemeService);

  // Lucide Icons for template
  readonly SendIcon = SendIcon;
  readonly PlusIcon = PlusIcon;
  readonly SettingsIcon = SettingsIcon;
  readonly HistoryIcon = HistoryIcon;
  readonly FileTextIcon = FileTextIcon;
  readonly ZapIcon = ZapIcon;
  readonly CodeIcon = CodeIcon;
  readonly RefreshCwIcon = RefreshCwIcon;
  readonly EditIcon = EditIcon;
  readonly FileIcon = FileIcon;
  readonly SearchIcon = SearchIcon;
  readonly FlaskConicalIcon = FlaskConicalIcon;
  readonly BookOpenIcon = BookOpenIcon;
  readonly TrendingUpIcon = TrendingUpIcon;

  // Signals
  currentMessage = signal('');
  isLoading = signal(true);
  isStreaming = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentSession = signal<ChatSession | null>(null);
  workspaceInfo = signal<any>(null);

  // Computed
  canSendMessage = computed(() =>
    this.currentMessage().trim().length > 0 && !this.isStreaming()
  );

  ngOnInit(): void {
    this.setupMessageHandlers();
    this.initializeChat();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupMessageHandlers(): void {
    // Listen for chat-specific messages from VS Code
    this.vscode.onMessage()
      .pipe(
        filter((message: VSCodeMessage) => message.type.startsWith('chat:') || message.type === 'initialData'),
        takeUntil(this.destroy$)
      )
      .subscribe((message: VSCodeMessage) => {
        switch (message.type) {
          case 'chat:sessionCreated':
          case 'chat:sessionSwitched':
            this.handleSessionUpdate(message.data?.session);
            break;

          case 'chat:messageAdded':
            this.addMessage(message.data?.message);
            break;

          case 'chat:messageChunk':
            this.handleMessageChunk(message.data);
            break;

          case 'chat:messageComplete':
            this.handleMessageComplete(message.data?.message);
            break;

          case 'chat:error':
            this.handleError(message.data?.error || 'Unknown error');
            break;

          case 'initialData':
            this.handleInitialData(message.data);
            break;
        }
      });
  }

  private async initializeChat(): Promise<void> {
    try {
      // Request initial data
      this.vscode.postMessage('ready');

      // Set loading timeout
      setTimeout(() => {
        if (this.isLoading()) {
          this.isLoading.set(false);
        }
      }, 3000);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      this.isLoading.set(false);
    }
  }

  private handleSessionUpdate(session: ChatSession): void {
    this.currentSession.set(session);
    this.messages.set(session.messages || []);
    this.isLoading.set(false);
  }

  private handleInitialData(data: any): void {
    if (data.session) {
      this.currentSession.set(data.session);
      this.messages.set(data.session.messages || []);
    }

    if (data.workspaceInfo) {
      this.workspaceInfo.set(data.workspaceInfo);
    }

    this.isLoading.set(false);
  }

  private addMessage(message: ChatMessage): void {
    const currentMessages = this.messages();
    this.messages.set([...currentMessages, message]);
    this.scrollToBottom();
  }

  private handleMessageChunk(data: { content: string; isComplete: boolean }): void {
    if (!this.isStreaming()) {
      this.isStreaming.set(true);
      // Add a streaming message placeholder
      this.addMessage({
        id: 'streaming',
        type: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
        streaming: true
      });
    } else {
      // Update the streaming message
      const currentMessages = this.messages();
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage && lastMessage.streaming) {
        lastMessage.content += data.content;
        this.messages.set([...currentMessages]);
      }
    }

    if (data.isComplete) {
      this.isStreaming.set(false);
    }

    this.scrollToBottom();
  }

  private handleMessageComplete(message: ChatMessage): void {
    const currentMessages = this.messages();
    const streamingMessageIndex = currentMessages.findIndex(m => m.streaming);

    if (streamingMessageIndex !== -1) {
      // Replace streaming message with complete message
      const updatedMessages = [...currentMessages];
      updatedMessages[streamingMessageIndex] = { ...message, streaming: false };
      this.messages.set(updatedMessages);
    } else {
      // Add as new message
      this.addMessage(message);
    }

    this.isStreaming.set(false);
    this.scrollToBottom();
  }

  private handleError(errorMessage: string): void {
    this.addMessage({
      id: Date.now().toString(),
      type: 'system',
      content: errorMessage,
      timestamp: new Date().toISOString(),
      isError: true
    });

    this.isStreaming.set(false);
  }

  sendMessage(): void {
    const content = this.currentMessage().trim();
    if (!content || this.isStreaming()) return;

    // Add user message immediately
    this.addMessage({
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    });

    // Clear input
    this.currentMessage.set('');

    // Send to VS Code
    this.vscode.postMessage('chat:sendMessage', { content });
  }

  sendQuickMessage(content: string): void {
    if (this.isStreaming()) return;

    this.currentMessage.set(content);
    this.sendMessage();
  }

  newSession(): void {
    this.vscode.postMessage('chat:newSession');
  }

  switchSession(): void {
    this.vscode.postMessage('chat:switchSession', {});
  }

  showSettings(): void {
    this.vscode.postMessage('chat:showSettings', {});
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  formatMessageContent(content: string): string {
    // Basic markdown-like formatting for safety
    return content
      .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  getTokenUsageClasses(): string {
    const session = this.currentSession();
    if (!session?.tokenUsage) return '';

    // Generate width class based on percentage without inline styles
    const percentage = session.tokenUsage.percentage;
    const width = Math.round(percentage);

    // Create dynamic width class - this avoids CSP violation
    return `token-usage-width-${width}`;
  }

  private scrollToBottom(): void {
    // Use setTimeout to ensure DOM updates are processed
    setTimeout(() => {
      const messageContainer = document.querySelector('main');
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }, 50);
  }
}
