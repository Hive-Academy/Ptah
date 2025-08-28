import { Injectable } from '@angular/core';
import { VSCodeService } from './vscode.service';
import { AppStateManager, ViewType } from './app-state.service';

export interface VSCodeMessage {
  type: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MessageHandlerService {
  constructor(
    private vscodeService: VSCodeService,
    private appState: AppStateManager
  ) {
    this.setupMessageHandling();
  }

  private setupMessageHandling(): void {
    this.vscodeService.onMessage().subscribe((message: VSCodeMessage) => {
      this.handleMessage(message);
    });
  }

  private handleMessage(message: VSCodeMessage): void {
    try {
      switch (message.type) {
        case 'switchView':
          this.handleSwitchView(message.payload);
          break;

        case 'initialData':
          this.handleInitialData(message.payload);
          break;

        case 'error':
          this.handleError(message.payload);
          break;

        case 'workspaceChanged':
          this.handleWorkspaceChanged(message.payload);
          break;

        case 'themeChanged':
          this.handleThemeChanged(message.payload);
          break;

        // Chat-specific messages
        case 'chat:sessionCreated':
        case 'chat:sessionSwitched':
        case 'chat:messageAdded':
        case 'chat:messageChunk':
        case 'chat:messageComplete':
        case 'chat:error':
        case 'chat:sessionsUpdated':
          // These are handled directly by ChatComponent
          // We just log them here for debugging
          console.log('Chat message received:', message.type, message.payload);
          break;

        default:
          console.log('Unhandled message type:', message.type, message);
      }
    } catch (error) {
      console.error('Error handling VS Code message:', error, message);
      this.appState.handleError(`Failed to handle message: ${message.type}`);
    }
  }

  private handleSwitchView(payload: any): void {
    if (payload?.view && this.isValidViewType(payload.view)) {
      this.appState.handleViewSwitch(payload.view);
    }
  }

  private handleInitialData(payload: any): void {
    if (payload) {
      this.appState.handleInitialData(payload);
    }
  }

  private handleError(payload: any): void {
    const errorMessage = payload?.message || payload?.error || 'Unknown error';
    this.appState.handleError(errorMessage);
  }

  private handleWorkspaceChanged(payload: any): void {
    if (payload?.workspaceInfo) {
      this.appState.setWorkspaceInfo(payload.workspaceInfo);
    }
  }

  private handleThemeChanged(payload: any): void {
    // Handle theme changes if needed
    console.log('Theme changed:', payload);
  }

  private isValidViewType(view: string): view is ViewType {
    return ['chat', 'command-builder', 'analytics'].includes(view);
  }

  // Public methods for sending messages to VS Code
  notifyViewChanged(view: ViewType): void {
    this.vscodeService.postMessage('viewChanged', { view });
  }

  notifyReady(): void {
    const state = this.appState.getStateSnapshot();
    this.vscodeService.postMessage('ready', { currentView: state.currentView });
  }

  requestInitialData(): void {
    this.vscodeService.postMessage('requestInitialData');
  }

  // Chat-specific message senders
  sendChatMessage(content: string): void {
    this.vscodeService.postMessage('chat:sendMessage', { content });
  }

  createNewSession(): void {
    this.vscodeService.postMessage('chat:newSession');
  }

  switchToSession(sessionId: string): void {
    this.vscodeService.postMessage('chat:switchSession', { sessionId });
  }

  requestChatSessions(): void {
    this.vscodeService.postMessage('chat:requestSessions');
  }
}
