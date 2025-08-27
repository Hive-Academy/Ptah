import { Injectable, signal, computed } from '@angular/core';
import { AnalyticsData, TokenUsageData, SessionMetrics, CommandUsageData, TimeRange, ProductivityInsight, UsageGoal } from './analytics.types';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // Signals for reactive state
  private _analyticsData = signal<AnalyticsData | null>(null);
  private _timeRange = signal<TimeRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date(),
    preset: 'week'
  });
  private _goals = signal<UsageGoal[]>([]);
  private _isLoading = signal(false);

  // Public readonly signals
  readonly analyticsData = this._analyticsData.asReadonly();
  readonly timeRange = this._timeRange.asReadonly();
  readonly goals = this._goals.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed insights
  readonly productivityInsights = computed(() => {
    const data = this._analyticsData();
    if (!data) return [];

    const insights: ProductivityInsight[] = [];

    // Token usage insights
    if (data.tokenUsage.weeklyTrend > 20) {
      insights.push({
        type: 'warning',
        title: 'High Token Usage',
        description: `Your token usage increased by ${data.tokenUsage.weeklyTrend}% this week. Consider optimizing your prompts.`,
        actionable: true,
        action: 'View optimization tips'
      });
    } else if (data.tokenUsage.weeklyTrend < -10) {
      insights.push({
        type: 'achievement',
        title: 'Efficient Usage',
        description: `Great job! You reduced token usage by ${Math.abs(data.tokenUsage.weeklyTrend)}% this week.`,
        value: Math.abs(data.tokenUsage.weeklyTrend)
      });
    }

    // Session insights
    if (data.sessionMetrics.avgMessagesPerSession > 15) {
      insights.push({
        type: 'tip',
        title: 'Long Conversations',
        description: 'You have longer conversations than average. Consider breaking complex tasks into smaller sessions.',
        actionable: true,
        action: 'Learn session optimization'
      });
    }

    // Productivity score insight
    if (data.sessionMetrics.productivityScore >= 80) {
      insights.push({
        type: 'achievement',
        title: 'High Productivity',
        description: `Excellent! Your productivity score is ${data.sessionMetrics.productivityScore}/100.`,
        value: data.sessionMetrics.productivityScore
      });
    } else if (data.sessionMetrics.productivityScore < 60) {
      insights.push({
        type: 'suggestion',
        title: 'Boost Productivity',
        description: 'Your productivity score could be improved. Try using command templates for common tasks.',
        actionable: true,
        action: 'Explore templates'
      });
    }

    // Command usage insights
    const topCommand = data.commandUsage.topCommands[0];
    if (topCommand && topCommand.usage > data.commandUsage.totalCommands * 0.4) {
      insights.push({
        type: 'tip',
        title: 'Diverse Command Usage',
        description: `You use "${topCommand.name}" frequently (${topCommand.usage} times). Explore other templates to enhance your workflow.`,
        actionable: true,
        action: 'Browse templates'
      });
    }

    return insights;
  });

  readonly tokenUsageTrend = computed(() => {
    const data = this._analyticsData();
    if (!data) return 'stable';

    const trend = data.tokenUsage.weeklyTrend;
    if (trend > 10) return 'increasing';
    if (trend < -10) return 'decreasing';
    return 'stable';
  });

  readonly costProjection = computed(() => {
    const data = this._analyticsData();
    const timeRange = this._timeRange();

    if (!data || !data.tokenUsage.dailyUsage.length) return 0;

    // Calculate average daily cost
    const totalDays = data.tokenUsage.dailyUsage.length;
    const totalCost = data.tokenUsage.dailyUsage.reduce((sum, day) => sum + day.cost, 0);
    const avgDailyCost = totalCost / totalDays;

    // Project monthly cost
    return avgDailyCost * 30;
  });

  constructor() {
    this.loadMockData(); // For development
  }

  // Actions
  setTimeRange(range: TimeRange): void {
    this._timeRange.set(range);
    this.refreshData();
  }

  setTimeRangePreset(preset: TimeRange['preset']): void {
    let start: Date;
    const end = new Date();

    switch (preset) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start = new Date();
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    this._timeRange.set({ start, end, preset });
    this.refreshData();
  }

  addGoal(goal: UsageGoal): void {
    this._goals.update(goals => [...goals, goal]);
  }

  updateGoal(index: number, goal: UsageGoal): void {
    this._goals.update(goals => {
      const newGoals = [...goals];
      newGoals[index] = goal;
      return newGoals;
    });
  }

  removeGoal(index: number): void {
    this._goals.update(goals => goals.filter((_, i) => i !== index));
  }

  async refreshData(): Promise<void> {
    this._isLoading.set(true);

    try {
      // In real implementation, this would call VS Code extension
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockData = this.generateMockData();
      this._analyticsData.set(mockData);
    } catch (error) {
      console.error('Failed to refresh analytics data:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  exportData(format: 'json' | 'csv'): void {
    const data = this._analyticsData();
    if (!data) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      this.downloadFile(blob, 'ptah-analytics.json');
    } else if (format === 'csv') {
      const csv = this.convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      this.downloadFile(blob, 'ptah-analytics.csv');
    }
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private convertToCSV(data: AnalyticsData): string {
    const headers = ['Date', 'Tokens', 'Sessions', 'Cost'];
    const rows = data.tokenUsage.dailyUsage.map(day => [
      day.date,
      day.tokens.toString(),
      day.sessions.toString(),
      day.cost.toFixed(2)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private loadMockData(): void {
    const mockData = this.generateMockData();
    this._analyticsData.set(mockData);

    // Set initial goals
    this._goals.set([
      {
        type: 'daily_tokens',
        target: 50000,
        current: 35000,
        progress: 70,
        status: 'on_track'
      },
      {
        type: 'weekly_sessions',
        target: 20,
        current: 18,
        progress: 90,
        status: 'on_track'
      },
      {
        type: 'monthly_cost',
        target: 100,
        current: 75.50,
        progress: 75.5,
        status: 'on_track'
      }
    ]);
  }

  private generateMockData(): AnalyticsData {
    const now = new Date();
    const timeRange = this._timeRange();

    // Generate daily usage data
    const dailyUsage = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dailyUsage.push({
        date: date.toISOString().split('T')[0],
        tokens: Math.floor(Math.random() * 10000) + 5000,
        sessions: Math.floor(Math.random() * 8) + 2,
        cost: (Math.random() * 15) + 5
      });
    }

    // Generate session data
    const sessionsByDay = dailyUsage.map(day => ({
      date: day.date,
      sessions: day.sessions,
      duration: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
      messages: Math.floor(Math.random() * 20) + 5
    }));

    return {
      tokenUsage: {
        totalTokens: dailyUsage.reduce((sum, day) => sum + day.tokens, 0),
        inputTokens: Math.floor(dailyUsage.reduce((sum, day) => sum + day.tokens, 0) * 0.6),
        outputTokens: Math.floor(dailyUsage.reduce((sum, day) => sum + day.tokens, 0) * 0.4),
        dailyUsage,
        weeklyTrend: (Math.random() - 0.5) * 40, // -20% to +20%
        monthlyTrend: (Math.random() - 0.5) * 60, // -30% to +30%
        estimatedCost: dailyUsage.reduce((sum, day) => sum + day.cost, 0)
      },
      sessionMetrics: {
        totalSessions: dailyUsage.reduce((sum, day) => sum + day.sessions, 0),
        avgSessionDuration: sessionsByDay.reduce((sum, day) => sum + day.duration, 0) / sessionsByDay.length,
        avgMessagesPerSession: sessionsByDay.reduce((sum, day) => sum + day.messages, 0) / sessionsByDay.reduce((sum, day) => sum + day.sessions, 0),
        mostActiveTimeOfDay: '2:00 PM - 4:00 PM',
        sessionsByDay,
        productivityScore: Math.floor(Math.random() * 30) + 70 // 70-100
      },
      commandUsage: {
        totalCommands: 156,
        topCommands: [
          { name: 'Code Review', usage: 45, category: 'analysis', lastUsed: '2025-08-26' },
          { name: 'Generate Tests', usage: 32, category: 'testing', lastUsed: '2025-08-25' },
          { name: 'Explain Code', usage: 28, category: 'documentation', lastUsed: '2025-08-26' },
          { name: 'Find Bugs', usage: 21, category: 'analysis', lastUsed: '2025-08-24' },
          { name: 'Optimize Code', usage: 18, category: 'optimization', lastUsed: '2025-08-25' }
        ],
        commandsByCategory: [
          { category: 'analysis', count: 66, percentage: 42.3 },
          { category: 'testing', count: 32, percentage: 20.5 },
          { category: 'documentation', count: 28, percentage: 17.9 },
          { category: 'optimization', count: 18, percentage: 11.5 },
          { category: 'generation', count: 12, percentage: 7.7 }
        ],
        customCommandsCreated: 3
      },
      timeRange
    };
  }
}
