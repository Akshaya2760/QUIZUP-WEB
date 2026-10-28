import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestionResult {
  questionId: string;
  questionText: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number;
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
}

export interface IAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  id?: string;
  quizId: mongoose.Types.ObjectId;
  quizTitle: string;
  quizCategory: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  studentYear: number;
  answers: Record<string, number>; // questionId -> selected index
  markedForReview: string[]; // questionIds
  startedAt: Date;
  submittedAt?: Date;
  durationSeconds: number;
  status: 'in_progress' | 'submitted' | 'timed_out';
  score: number;
  totalPossibleMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercent: number;
  isPassed: boolean;
  questionResults: IQuestionResult[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionResultSchema = new Schema<IQuestionResult>(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    selectedOption: { type: Number, default: null },
    correctOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    marksAwarded: { type: Number, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const AttemptSchema = new Schema<IAttempt>(
  {
    id: {
      type: String,
      default: () => 'att-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8),
    },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    quizTitle: { type: String, required: true },
    quizCategory: { type: String, default: 'General' },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentDepartment: { type: String, default: '' },
    studentYear: { type: Number, default: 1 },
    answers: {
      type: Map,
      of: Number,
      default: {},
    },
    markedForReview: {
      type: [String],
      default: [],
    },
    startedAt: { type: Date, required: true, default: Date.now },
    submittedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'timed_out'],
      default: 'in_progress',
      index: true,
    },
    score: { type: Number, default: 0 },
    totalPossibleMarks: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    accuracyPercent: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    questionResults: [QuestionResultSchema],
  },
  {
    timestamps: true,
  }
);

// Deterministic ranking index: Highest score first, then lowest duration, then earliest submission
AttemptSchema.index({ quizId: 1, status: 1, score: -1, durationSeconds: 1, submittedAt: 1 });
AttemptSchema.index({ studentId: 1, status: 1, createdAt: -1 });

export const Attempt: Model<IAttempt> =
  mongoose.models.Attempt || mongoose.model<IAttempt>('Attempt', AttemptSchema);
