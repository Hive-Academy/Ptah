import { BaseWebviewMessageHandler } from './base-message-handler';
import { SessionManager } from '../session-manager';
import { ClaudeCliService } from '../claude-cli.service';
import { Logger } from '../../core/logger';

/**
 * ChatMessageHandler - Single Responsibility: Handle all chat-related webview messages
 * Implements real Claude CLI streaming integration
 */
export class ChatMessageHandler extends BaseWebviewMessageHandler {
  readonly messageType = 'chat:';

  constructor(
    postMessage: (message: any) => void,
    private sessionManager: SessionManager,
    private claudeService: ClaudeCliService
  ) {
    super(postMessage);
  }

  async handle(messageType: string, payload: any): Promise<any> {
    const action = messageType.replace(this.messageType, '');
    
    switch (action) {
      case 'sendMessage':
        return await this.handleSendMessage(payload);
      case 'newSession':
        return await this.handleNewSession();
      case 'switchSession':
        return await this.handleSwitchSession(payload);
      case 'getHistory':
        return await this.handleGetHistory(payload);
      default:
        throw new Error(`Unknown chat action: ${action}`);
    }
  }

  private async handleSendMessage(data: { content: string; files?: string[] }): Promise<void> {
    try {
      // Ensure we have a session
      let currentSession = this.sessionManager.getCurrentSession();
      if (!currentSession) {
        currentSession = await this.sessionManager.createSession();
        this.sendSuccessResponse('chat:sessionCreated', { session: currentSession });
      }

      // Add user message to UI immediately
      this.sendSuccessResponse('chat:messageAdded', {
        message: {
          id: Date.now().toString(),
          type: 'user',
          content: data.content,
          files: data.files,
          timestamp: new Date().toISOString(),
          sessionId: currentSession.id
        }
      });

      // Add user message to session
      await this.sessionManager.sendMessage(data.content, data.files);

      // Verify Claude CLI is available
      const isAvailable = await this.claudeService.verifyInstallation();
      if (!isAvailable) {
        throw new Error('Claude CLI not available. Please install Claude Code CLI first.');
      }

      // Start real Claude CLI streaming session
      Logger.info(`Starting Claude CLI streaming for session: ${currentSession.id}`);
      
      const messageIterator = await this.claudeService.startChatSession(
        currentSession.id,
        currentSession.workspaceId
      );

      // Send the user message to Claude CLI process
      await this.claudeService.sendMessageToSession(currentSession.id, data.content);

      // Process streaming response from Claude CLI
      let assistantMessageContent = '';
      let messageId = Date.now().toString();

      // Convert AsyncIterator to AsyncIterable for for-await-of loop
      const messageIterable = {
        [Symbol.asyncIterator]: () => messageIterator
      };

      for await (const message of messageIterable) {
        if (message.type === 'assistant') {
          assistantMessageContent += message.content;
          
          // Send streaming chunk to Angular
          this.sendSuccessResponse('chat:messageChunk', {
            messageId,
            content: message.content,
            isComplete: false
          });
        }
      }

      // Mark streaming as complete and save the complete message
      if (assistantMessageContent) {
        await this.sessionManager.addAssistantMessage(currentSession.id, assistantMessageContent);
        
        this.sendSuccessResponse('chat:messageComplete', {
          message: {
            id: messageId,
            type: 'assistant',
            content: assistantMessageContent,
            timestamp: new Date().toISOString(),
            sessionId: currentSession.id
          }
        });
      }

      Logger.info(`Claude CLI streaming completed for session: ${currentSession.id}`);

    } catch (error) {
      Logger.error('Error in Claude CLI streaming:', error);
      this.sendErrorResponse('chat:sendMessage', error instanceof Error ? error.message : 'Failed to send message');
    }
  }

  private async handleNewSession(): Promise<void> {
    try {
      const session = await this.sessionManager.createSession();
      this.sendSuccessResponse('chat:sessionCreated', { session });
    } catch (error) {
      this.sendErrorResponse('chat:newSession', error instanceof Error ? error.message : 'Failed to create session');
    }
  }

  private async handleSwitchSession(data: { sessionId: string }): Promise<void> {
    try {
      await this.sessionManager.switchSession(data.sessionId);
      const session = this.sessionManager.getCurrentSession();
      this.sendSuccessResponse('chat:sessionSwitched', { session });
    } catch (error) {
      this.sendErrorResponse('chat:switchSession', error instanceof Error ? error.message : 'Failed to switch session');
    }
  }

  private async handleGetHistory(data: { sessionId: string }): Promise<void> {
    try {
      const sessions = this.sessionManager.getAllSessions();
      const session = sessions.find(s => s.id === data.sessionId);
      const messages = session?.messages || [];
      this.sendSuccessResponse('chat:historyLoaded', { messages });
    } catch (error) {
      this.sendErrorResponse('chat:getHistory', error instanceof Error ? error.message : 'Failed to load history');
    }
  }
}
