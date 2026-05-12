import type { QuestionSummary } from "./poll.js";

export interface AnalyticsData {
  totalResponses: number;
  views: number;
  completionRate: number;
  responseRate: number;
  questionSummaries: QuestionSummary[];
  deviceBreakdown: DeviceBreakdownItem[];
  platformBreakdown: PlatformBreakdownItem[];
  responseVelocity: VelocityBucket[];
  peakTime: string | null;
  questionEngagement: QuestionEngagementItem[];
}

export interface DeviceBreakdownItem {
  type: string;
  count: number;
  percentage: number;
}

export interface PlatformBreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface VelocityBucket {
  timestamp: string;
  count: number;
}

export interface QuestionEngagementItem {
  questionId: string;
  questionText: string;
  isMandatory: boolean;
  responseCount: number;
  percentage: number;
}

export interface SocketResponsePayload {
  totalResponses: number;
  questionSummaries: QuestionSummary[];
}

export interface SocketToastPayload {
  message: string;
}

export interface SocketStatusPayload {
  status: string;
}
