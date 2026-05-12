export type PollStatus = "draft" | "active" | "expired" | "closed";

export interface PollOption {
  _id: string;
  text: string;
}

export interface PollQuestion {
  _id: string;
  text: string;
  options: PollOption[];
  isMandatory: boolean;
  order: number;
}

export interface Poll {
  _id: string;
  title: string;
  description?: string;
  creator: string | null;
  shareId: string;
  slug?: string;
  questions: PollQuestion[];
  isAnonymous: boolean;
  isPublished: boolean;
  showCreatorName: boolean;
  enableToast: boolean;
  status: PollStatus;
  expiresAt: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface PollListItem {
  _id: string;
  title: string;
  status: PollStatus;
  shareId: string;
  slug?: string;
  isAnonymous: boolean;
  isPublished: boolean;
  expiresAt: string;
  responseCount: number;
  createdAt: string;
}

export interface CreatePollInput {
  title: string;
  description?: string;
  questions: {
    text: string;
    options: { text: string }[];
    isMandatory?: boolean;
  }[];
  isAnonymous?: boolean;
  showCreatorName?: boolean;
  enableToast?: boolean;
  slug?: string;
  expiresAt: string;
}

export interface CreatePollResponse {
  poll: Poll;
  adminKey?: string;
}

export interface PublicPollView {
  poll: Poll;
  hasResponded: boolean;
  canClaim: boolean;
  results?: PollResults;
}

export interface PollResults {
  totalResponses: number;
  questionSummaries: QuestionSummary[];
  summary: string;
}

export interface QuestionSummary {
  questionId: string;
  questionText: string;
  totalAnswers: number;
  options: OptionCount[];
  consensus: "clear_winner" | "tight_race" | "split_decision";
}

export interface OptionCount {
  optionId: string;
  optionText: string;
  count: number;
  percentage: number;
}
