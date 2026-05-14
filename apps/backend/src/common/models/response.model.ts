import mongoose, { Schema, type Document } from "mongoose";

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  optionId: mongoose.Types.ObjectId;
}

export interface IResponse extends Document {
  poll: mongoose.Types.ObjectId;
  respondent: mongoose.Types.ObjectId | null;
  fingerprint?: string;
  device: {
    type: string;
    browser: string;
    os: string;
  };
  answers: IAnswer[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    optionId: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

const ResponseSchema = new Schema<IResponse>(
  {
    poll: { type: Schema.Types.ObjectId, ref: "Poll", required: true, index: true },
    respondent: { type: Schema.Types.ObjectId, ref: "user", default: null },
    fingerprint: { type: String },
    device: {
      type: { type: String, default: "unknown" },
      browser: { type: String, default: "unknown" },
      os: { type: String, default: "unknown" },
    },
    answers: { type: [AnswerSchema], required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ResponseSchema.index(
  { poll: 1, respondent: 1 },
  { unique: true, partialFilterExpression: { respondent: { $type: "objectId" } } },
);
ResponseSchema.index(
  { poll: 1, fingerprint: 1 },
  { unique: true, partialFilterExpression: { fingerprint: { $type: "string" } } },
);

export const PollResponse = mongoose.model<IResponse>("Response", ResponseSchema);
