export interface PollResponse {
  _id: string;
  poll: string;
  respondent: string | null;
  fingerprint?: string;
  device: DeviceInfo;
  answers: ResponseAnswer[];
  submittedAt: string;
  createdAt: string;
}

export interface DeviceInfo {
  type: string;
  browser: string;
  os: string;
}

export interface ResponseAnswer {
  questionId: string;
  optionId: string;
}

export interface SubmitResponseInput {
  answers: ResponseAnswer[];
}
