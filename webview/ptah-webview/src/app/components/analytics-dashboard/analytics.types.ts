export interface AnalyticsData {
  tokenUsage: TokenUsageData;
  sessionMetrics: SessionMetrics;
  commandUsage: CommandUsageData;
  timeRange: TimeRange;
}

export interface TokenUsageData {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  dailyUsage: DailyUsage[];
  weeklyTrend: number; // percentage change
  monthlyTrend: number; // percentage change
  estimatedCost: number;
}

export interface DailyUsage {
  date: string;
  tokens: number;
  sessions: number;
  cost: number;
}

export interface SessionMetrics {
  totalSessions: number;
  avgSessionDuration: number; // in minutes
  avgMessagesPerSession: number;
  mostActiveTimeOfDay: string;
  sessionsByDay: DailySessionData[];
  productivityScore: number; // 0-100
}

export interface DailySessionData {
  date: string;
  sessions: number;
  duration: number;
  messages: number;
}

export interface CommandUsageData {
  totalCommands: number;
  topCommands: CommandStat[];
  commandsByCategory: CategoryStat[];
  customCommandsCreated: number;
}

export interface CommandStat {
  name: string;
  usage: number;
  category: string;
  lastUsed: string;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface ProductivityInsight {
  type: 'tip' | 'achievement' | 'warning' | 'suggestion';
  title: string;
  description: string;
  actionable?: boolean;
  action?: string;
  value?: number;
}

export interface UsageGoal {
  type: 'daily_tokens' | 'weekly_sessions' | 'monthly_cost';
  target: number;
  current: number;
  progress: number; // 0-100
  status: 'on_track' | 'behind' | 'exceeded';
}
