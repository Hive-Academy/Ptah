import { BaseWebviewMessageHandler } from './base-message-handler';
import { SessionManager } from '../session-manager';
import { CommandBuilderService } from '../command-builder.service';

/**
 * AnalyticsMessageHandler - Single Responsibility: Handle analytics and reporting messages
 */
export class AnalyticsMessageHandler extends BaseWebviewMessageHandler {
  readonly messageType = 'analytics:';

  constructor(
    postMessage: (message: any) => void,
    private sessionManager: SessionManager,
    private commandBuilderService: CommandBuilderService
  ) {
    super(postMessage);
  }

  async handle(messageType: string, payload: any): Promise<any> {
    const action = messageType.replace(this.messageType, '');
    
    switch (action) {
      case 'getData':
        return await this.handleGetAnalyticsData();
      default:
        throw new Error(`Unknown analytics action: ${action}`);
    }
  }

  private async handleGetAnalyticsData(): Promise<void> {
    try {
      const analyticsData = await this.calculateAnalyticsData();
      this.sendSuccessResponse('analytics:data', { data: analyticsData });
    } catch (error) {
      this.sendErrorResponse('analytics:getData', error instanceof Error ? error.message : 'Failed to get analytics data');
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
      active: sessions.filter(s => s.messages.length > 0).length,
      recentlyUsed: sessions.filter(s => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return s.lastActiveAt > dayAgo;
      }).length
    };

    // Get command usage statistics (if available)
    let commandStats: { topCommands: Array<{ name: string; category: string; usageCount: number }> } = { 
      topCommands: [] 
    };
    try {
      // This might not be implemented yet in CommandBuilderService
      const templates = await this.commandBuilderService.getTemplates();
      commandStats = {
        topCommands: templates.slice(0, 5).map(t => ({
          name: t.name,
          category: t.category,
          usageCount: (t as any).usageCount || 0
        }))
      };
    } catch (error) {
      // Ignore if command stats aren't available
    }

    return {
      sessions: sessionStats,
      messages: {
        total: totalMessages,
        avgPerSession: Math.round(avgMessagesPerSession * 100) / 100
      },
      tokens: {
        total: totalTokens,
        avgPerMessage: totalMessages > 0 ? Math.round((totalTokens / totalMessages) * 100) / 100 : 0
      },
      commands: commandStats,
      performance: {
        avgResponseTime: 1.2, // TODO: Implement real response time tracking
        successRate: 0.95 // TODO: Implement real success rate tracking
      }
    };
  }
}
