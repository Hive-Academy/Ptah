import { BaseWebviewMessageHandler, StrictPostMessageFunction, IWebviewMessageHandler } from './base-message-handler';
import { StrictMessageType, MessagePayloadMap, MessageResponse, MessageError, ChatSendMessagePayload, ChatMessageChunkPayload, ChatSessionCreatedPayload, StrictChatMessage } from '../../types/message.types';
import { SessionId, MessageId, CorrelationId } from '../../types/branded.types';
import { SessionManager } from '../session-manager';
import { ClaudeCliService } from '../claude-cli.service';
import { Logger } from '../../core/logger';

/**
 * Chat Message Types - Strict type definition
 */
type ChatMessageTypes = 'chat:sendMessage' | 'chat:newSession' | 'chat:switchSession' | 'chat:getHistory';

/**
 * ChatMessageHandler - Single Responsibility: Handle all chat-related webview messages
 * Implements real Claude CLI streaming integration with strict typing
 */
export class ChatMessageHandler extends BaseWebviewMessageHandler<ChatMessageTypes> 
  implements IWebviewMessageHandler<ChatMessageTypes> {
  readonly messageType = 'chat:';

  constructor(
    postMessage: StrictPostMessageFunction,
    private sessionManager: SessionManager,
    private claudeService: ClaudeCliService
  ) {
    super(postMessage);
  }

  async handle<K extends ChatMessageTypes>(messageType: K, payload: MessagePayloadMap[K]): Promise<MessageResponse> {
    try {
      switch (messageType) {
        case 'chat:sendMessage':
          return await this.handleSendMessage(payload as ChatSendMessagePayload);
        case 'chat:newSession':
          return await this.handleNewSession();
        case 'chat:switchSession':
          return await this.handleSwitchSession(payload as { sessionId: SessionId });
        case 'chat:getHistory':
          return await this.handleGetHistory(payload as { sessionId: SessionId });
        default:
          throw new Error(`Unknown chat message type: ${messageType}`);
      }
    } catch (error) {
      Logger.error(`Error handling chat message ${messageType}:`, error);
      throw error;
    }
  }

  private async handleSendMessage(data: ChatSendMessagePayload): Promise<MessageResponse> {
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
      await this.sessionManager.sendMessage(data.content, data.files ? [...data.files] : []);

      // Verify Claude CLI is available
      const isAvailable = await this.claudeService.verifyInstallation();
      if (!isAvailable) {
        throw new Error('Claude CLI not available. Please install Claude Code CLI first.');
      }

      // Start real Claude CLI streaming session with high-performance streams
      Logger.info(`Starting Claude CLI streaming for session: ${currentSession.id}`);
      
      const messageStream = await this.claudeService.startChatSession(
        currentSession.id,
        currentSession.workspaceId
      );

      // Send the user message to Claude CLI process
      await this.claudeService.sendMessageToSession(currentSession.id, data.content);

      // Process streaming response from Claude CLI using streams
      let assistantMessageContent = '';
      let messageId: MessageId | null = null;

      // Set up stream event handlers with backpressure management and circuit breaker handling
      messageStream.on('data', (messageResponse: MessageResponse<StrictChatMessage>) => {
        if (!messageResponse.success) {
          // Handle circuit breaker errors specially
          if (messageResponse.error?.code === 'CIRCUIT_BREAKER_OPEN' || 
              messageResponse.error?.code === 'CIRCUIT_BREAKER_BLOCKED' ||
              messageResponse.error?.code === 'CIRCUIT_BREAKER_HALF_OPEN_LIMIT') {
            Logger.warn('Circuit breaker blocking operation', {
              error: messageResponse.error,
              sessionId: currentSession?.id
            });
            
            // Send circuit breaker status to UI
            this.sendCircuitBreakerStatus(currentSession?.id as SessionId, messageResponse.error);
            return;
          }
          
          Logger.error('Received error response from stream', messageResponse.error);
          return;
        }

        const chatMessage = messageResponse.data;
        if (!chatMessage) {
          Logger.warn('Received empty message data from stream');
          return;
        }

        if (chatMessage.type === 'assistant') {
          // Set messageId from first chunk
          if (!messageId) {
            messageId = chatMessage.id;
          }

          assistantMessageContent += chatMessage.content;
          
          // Send streaming chunk to Angular with proper typing
          this.sendSuccessResponse('chat:messageChunk', {
            sessionId: chatMessage.sessionId,
            messageId: chatMessage.id,
            content: chatMessage.content,
            isComplete: chatMessage.isComplete,
            streaming: chatMessage.streaming
          });
        }
      });

      // Handle stream completion
      await new Promise<void>((resolve, reject) => {
        messageStream.on('end', () => {
          Logger.info(`Stream completed for session: ${currentSession?.id}`);
          resolve();
        });

        messageStream.on('error', (error) => {
          Logger.error(`Stream error in chat handler for session: ${currentSession?.id}`, error);
          reject(error);
        });
      });

      // Mark streaming as complete and save the complete message
      if (assistantMessageContent && messageId) {
        await this.sessionManager.addAssistantMessage(currentSession.id, assistantMessageContent);
        
        // Send final completion message with proper typing
        this.sendSuccessResponse('chat:messageComplete', {
          message: {
            type: 'assistant' as const,
            id: messageId,
            sessionId: currentSession?.id as any,
            content: assistantMessageContent,
            timestamp: Date.now(),
            streaming: false,
            isComplete: true
          }
        });
      }

      Logger.info(`Claude CLI streaming completed for session: ${currentSession.id}`);
      
      return {
        requestId: CorrelationId.create(),
        success: true,
        data: { messageId: messageId || 'unknown', content: assistantMessageContent },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          sessionId: currentSession?.id as any,
          version: '1.0.0'
        }
      };

    } catch (error) {
      Logger.error('Error in Claude CLI streaming:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      this.sendErrorResponse('chat:sendMessage', errorMessage);
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'MESSAGE_SEND_ERROR',
          message: errorMessage
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    }
  }

  private async handleNewSession(): Promise<MessageResponse> {
    try {
      const session = await this.sessionManager.createSession();
      this.sendSuccessResponse('chat:sessionCreated', { session });
      return {
        requestId: CorrelationId.create(),
        success: true,
        data: { session },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      this.sendErrorResponse('chat:newSession', errorMessage);
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'SESSION_CREATION_ERROR',
          message: errorMessage
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    }
  }

  private async handleSwitchSession(data: { sessionId: string }): Promise<MessageResponse> {
    try {
      await this.sessionManager.switchSession(data.sessionId);
      const session = this.sessionManager.getCurrentSession();
      this.sendSuccessResponse('chat:sessionSwitched', { session });
      return {
        requestId: CorrelationId.create(),
        success: true,
        data: { session },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch session';
      this.sendErrorResponse('chat:switchSession', errorMessage);
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'SESSION_SWITCH_ERROR',
          message: errorMessage
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    }
  }

  private async handleGetHistory(data: { sessionId: string }): Promise<MessageResponse> {
    try {
      const sessions = this.sessionManager.getAllSessions();
      const session = sessions.find(s => s.id === data.sessionId);
      const messages = session?.messages || [];
      this.sendSuccessResponse('chat:historyLoaded', { messages });
      return {
        requestId: CorrelationId.create(),
        success: true,
        data: { messages },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load history';
      this.sendErrorResponse('chat:getHistory', errorMessage);
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'HISTORY_LOAD_ERROR',
          message: errorMessage
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    }
  }

  /**
   * Send circuit breaker status to Angular UI
   */
  private sendCircuitBreakerStatus(sessionId: SessionId | undefined, error: MessageError | undefined): void {
    if (!sessionId) return;

    const circuitStatus = this.claudeService.getCircuitBreakerStatus(sessionId);
    
    this.sendErrorResponse('chat:circuitBreakerOpen', 
      `Circuit breaker is ${circuitStatus.state}. Service temporarily unavailable.`);
      
    // Send additional circuit breaker status as a separate message
    this.postMessage({
      type: 'chat:circuitBreakerOpen',
      payload: {
        circuitState: circuitStatus.state,
        failureCount: circuitStatus.failureCount,
        nextAttemptTime: circuitStatus.nextAttemptTime,
        canRetry: circuitStatus.state === 'HALF_OPEN' || Date.now() >= circuitStatus.nextAttemptTime,
        retryIn: Math.max(0, circuitStatus.nextAttemptTime - Date.now()),
        sessionId
      },
      metadata: {
        timestamp: Date.now(),
        source: 'extension' as const,
        sessionId,
        version: '1.0'
      }
    });
  }

  /**
   * Handle circuit breaker recovery attempt
   */
  async handleCircuitBreakerRecovery(sessionId: SessionId): Promise<MessageResponse> {
    try {
      Logger.info(`Attempting circuit breaker recovery for session: ${sessionId}`);
      
      const recovered = await this.claudeService.attemptCircuitBreakerRecovery(sessionId);
      
      if (recovered) {
        Logger.info(`Circuit breaker recovery successful for session: ${sessionId}`);
        
        // Send recovery success to UI
        this.sendSuccessResponse('chat:circuitBreakerRecovered', {
          sessionId,
          recovered: true,
          timestamp: new Date().toISOString()
        });
        
        return {
          requestId: CorrelationId.create(),
          success: true,
          data: { recovered: true },
          metadata: {
            timestamp: Date.now(),
            source: 'extension',
            sessionId: sessionId as any,
            version: '1.0.0'
          }
        };
      } else {
        Logger.warn(`Circuit breaker recovery failed for session: ${sessionId}`);
        
        const circuitStatus = this.claudeService.getCircuitBreakerStatus(sessionId);
        
        return {
          requestId: CorrelationId.create(),
          success: false,
          error: {
            code: 'CIRCUIT_BREAKER_RECOVERY_FAILED',
            message: `Recovery attempt failed. Circuit breaker is in ${circuitStatus.state} state.`,
            context: {
              sessionId,
              circuitState: circuitStatus.state,
              failureCount: circuitStatus.failureCount,
              nextAttemptTime: circuitStatus.nextAttemptTime
            }
          },
          metadata: {
            timestamp: Date.now(),
            source: 'extension',
            sessionId: sessionId as any,
            version: '1.0.0'
          }
        };
      }
    } catch (error) {
      Logger.error(`Error during circuit breaker recovery for session: ${sessionId}`, error);
      
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_RECOVERY_ERROR',
          message: `Recovery attempt failed: ${(error as Error).message}`,
          context: {
            sessionId,
            error: (error as Error).message
          },
          stack: (error as Error).stack
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          sessionId: sessionId as any,
          version: '1.0.0'
        }
      };
    }
  }

  /**
   * Handle manual circuit breaker reset
   */
  handleCircuitBreakerReset(sessionId?: SessionId): MessageResponse {
    try {
      Logger.info(`Manual circuit breaker reset${sessionId ? ` for session: ${sessionId}` : ' (global)'}`);
      
      this.claudeService.resetCircuitBreaker(sessionId);
      
      // Send reset confirmation to UI
      this.sendSuccessResponse('chat:circuitBreakerReset', {
        sessionId,
        reset: true,
        timestamp: new Date().toISOString()
      });
      
      return {
        requestId: CorrelationId.create(),
        success: true,
        data: { reset: true },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          sessionId: sessionId as any,
          version: '1.0.0'
        }
      };
    } catch (error) {
      Logger.error(`Error during circuit breaker reset${sessionId ? ` for session: ${sessionId}` : ' (global)'}`, error);
      
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_RESET_ERROR',
          message: `Reset failed: ${(error as Error).message}`,
          context: {
            sessionId,
            error: (error as Error).message
          }
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          sessionId: sessionId as any,
          version: '1.0.0'
        }
      };
    }
  }

  /**
   * Get circuit breaker health status
   */
  getCircuitBreakerHealth(): MessageResponse {
    try {
      const healthStatus = this.claudeService.getHealthStatus();
      
      return {
        requestId: CorrelationId.create(),
        success: true,
        data: healthStatus,
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    } catch (error) {
      Logger.error('Error getting circuit breaker health status', error);
      
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_HEALTH_ERROR',
          message: `Health check failed: ${(error as Error).message}`
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0'
        }
      };
    }
  }
}
