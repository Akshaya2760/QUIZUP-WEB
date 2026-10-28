import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion {
  _id: mongoose.Types.ObjectId;
  questionText: string;
  options: string[];
  correctOption: number; // 0, 1, 2, 3
  explanation?: string;
  marks?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  totalQuestions: number;
  marksPerCorrect: number;
  negativeMarks: number;
  passingScore: number;
  instructions: string;
  isPublished: boolean;
  randomizeQuestions: boolean;
  startTime?: Date;
  endTime?: Date;
  questions: IQuestion[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => Array.isArray(v) && v.length >= 2,
      message: 'A question must have at least 2 options',
    },
  },
  correctOption: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 1 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
});

const QuizSchema = new Schema<IQuiz>(
  {
    id: {
      type: String,
      default: () => 'quiz-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8),
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, default: 'General Computer Science' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    durationMinutes: { type: Number, required: true, min: 1, default: 15 },
    totalQuestions: { type: Number, required: true, min: 1, default: 10 },
    marksPerCorrect: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    passingScore: { type: Number, default: 50 }, // percentage
    instructions: {
      type: String,
      default: 'Read each question carefully. Do not refresh or navigate away during the quiz. Timer is enforced strictly.',
    },
    isPublished: { type: Boolean, default: false, index: true },
    randomizeQuestions: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    questions: [QuestionSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

QuizSchema.index({ isPublished: 1, category: 1, createdAt: -1 });

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
