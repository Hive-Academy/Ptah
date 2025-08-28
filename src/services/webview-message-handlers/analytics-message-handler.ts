import {
  BaseWebviewMessageHandler,
  StrictPostMessageFunction,
  IWebviewMessageHandler,
} from './base-message-handler';
import {
  StrictMessageType,
  MessagePayloadMap,
  MessageResponse,
  AnalyticsEventPayload,
} from '../../types/message.types';
import { CorrelationId } from '../../types/branded.types';
import { SessionManager } from '../session-manager';
import { CommandBuilderService } from '../command-builder.service';

/**
 * Analytics Message Types - Strict type definition
 */
type AnalyticsMessageTypes = 'analytics:trackEvent' | 'analytics:getData';

/**
 * AnalyticsMessageHandler - Single Responsibility: Handle analytics and reporting messages
 */
export class AnalyticsMessageHandler
  extends BaseWebviewMessageHandler<AnalyticsMessageTypes>
  implements IWebviewMessageHandler<AnalyticsMessageTypes>
{
  readonly messageType = 'analytics:';

  constructor(
    postMessage: StrictPostMessageFunction,
    private sessionManager: SessionManager,
    private commandBuilderService: CommandBuilderService
  ) {
    super(postMessage);
  }

  async handle<K extends AnalyticsMessageTypes>(
    messageType: K,
    payload: MessagePayloadMap[K]
  ): Promise<MessageResponse> {
    try {
      switch (messageType) {
        case 'analytics:trackEvent':
          return await this.handleTrackEvent(payload as AnalyticsEventPayload);
        case 'analytics:getData':
          return await this.handleGetAnalyticsData();
        default:
          throw new Error(`Unknown analytics message type: ${messageType}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analytics handler error';
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'ANALYTICS_HANDLER_ERROR',
          message: errorMessage,
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0',
        },
      };
    }
  }

  private async handleTrackEvent(payload: AnalyticsEventPayload): Promise<MessageResponse> {
    try {
      // Here you would implement event tracking logic
      // For now, just log the event
      console.log('Tracking analytics event:', payload.event, payload.properties);

      const responseData = { tracked: true, event: payload.event };
      this.sendSuccessResponse('analytics:eventTracked', responseData);

      return {
        requestId: CorrelationId.create(),
        success: true,
        data: responseData,
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to track event';
      this.sendErrorResponse('analytics:trackEvent', errorMessage);
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'TRACK_EVENT_ERROR',
          message: errorMessage,
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0',
        },
      };
    }
  }

  private async handleGetAnalyticsData(): Promise<MessageResponse> {
    try {
      const analyticsData = await this.calculateAnalyticsData();
      const responseData = { data: analyticsData };
      this.sendSuccessResponse('analytics:data', responseData);
      return {
        requestId: CorrelationId.create(),
        success: true,
        data: responseData,
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get analytics data';
      this.sendErrorResponse('analytics:getData', errorMessage);
      return {
        requestId: CorrelationId.create(),
        success: false,
        error: {
          code: 'GET_ANALYTICS_ERROR',
          message: errorMessage,
        },
        metadata: {
          timestamp: Date.now(),
          source: 'extension',
          version: '1.0.0',
        },
      };
    }
  }

  private async calculateAnalyticsData(): Promise<any> {
    const sessions = this.sessionManager.getAllSessions();

    // Calculate total messages across all sessions
    const totalMessages = sessions.reduce((total, session) => total + session.messages.length, 0);

    // Calculate total tokens across all sessions
    const totalTokens = sessions.reduce((total, session) => total + session.tokenUsage.total, 0);

    // Calculate average messages per session
    const avgMessagesPerSession = sessions.length > 0 ? totalMessages / sessions.length : 0;

    // Calculate session statistics
    const sessionStats = {
      total: sessions.length,
      active: sessions.filter((s) => s.messages.length > 0).length,
      recentlyUsed: sessions.filter((s) => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return s.lastActiveAt > dayAgo;
      }).length,
    };

    // Get command usage statistics (if available)
    let commandStats: {
      topCommands: Array<{ name: string; category: string; usageCount: number }>;
    } = {
      topCommands: [],
    };
    try {
      // This might not be implemented yet in CommandBuilderService
      const templates = await this.commandBuilderService.getTemplates();
      commandStats = {
        topCommands: templates.slice(0, 5).map((t) => ({
          name: t.name,
          category: t.category,
          usageCount: (t as any).usageCount || 0,
        })),
      };
    } catch (error) {
      // Ignore if command stats aren't available
    }

    return {
      sessions: sessionStats,
      messages: {
        total: totalMessages,
        avgPerSession: Math.round(avgMessagesPerSession * 100) / 100,
      },
      tokens: {
        total: totalTokens,
        avgPerMessage:
          totalMessages > 0 ? Math.round((totalTokens / totalMessages) * 100) / 100 : 0,
      },
      commands: commandStats,
      performance: {
        avgResponseTime: 1.2, // TODO: Implement real response time tracking
        successRate: 0.95, // TODO: Implement real success rate tracking
      },
    };
  }
}
