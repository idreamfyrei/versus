import mongoose, { Schema, type Document } from "mongoose";

export interface IOption {
  _id: mongoose.Types.ObjectId;
  text: string;
}

export interface IQuestion {
  _id: mongoose.Types.ObjectId;
  text: string;
  options: IOption[];
  isMandatory: boolean;
  order: number;
}

export interface IPoll extends Document {
  title: string;
  description?: string;
  creator: mongoose.Types.ObjectId | null;
  shareId: string;
  slug?: string;
  adminKeyHash?: string;
  questions: IQuestion[];
  isAnonymous: boolean;
  isPublished: boolean;
  showCreatorName: boolean;
  enableToast: boolean;
  status: "draft" | "active" | "expired" | "closed";
  expiresAt: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const QuestionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [OptionSchema],
      validate: {
        validator: (v: IOption[]) => v.length >= 2,
        message: "At least 2 options required",
      },
    },
    isMandatory: { type: Boolean, default: true },
    order: { type: Number, required: true },
  },
  { _id: true },
);

const PollSchema = new Schema<IPoll>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    creator: { type: Schema.Types.ObjectId, ref: "user", default: null },
    shareId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    adminKeyHash: { type: String },
    questions: {
      type: [QuestionSchema],
      validate: {
        validator: (v: IQuestion[]) => v.length >= 1,
        message: "At least 1 question required",
      },
    },
    isAnonymous: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    showCreatorName: { type: Boolean, default: false },
    enableToast: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "active", "expired", "closed"],
      default: "draft",
    },
    expiresAt: { type: Date, required: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PollSchema.index({ creator: 1 }, { sparse: true });
PollSchema.index({ expiresAt: 1 });

export const Poll = mongoose.model<IPoll>("Poll", PollSchema);
