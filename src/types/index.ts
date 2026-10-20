export type UserRole = 'student' | 'admin';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  studentId?: string;
  department: string;
  yearOfStudy: number;
  role: UserRole;
  status: AccountStatus;
  statusReason?: string;
  badges: string[];
  createdAt?: string;
}

export interface Question {
  _id: string;
  questionText: string;
  options: string[];
  correctOption?: number; // Only present for admin or in results
  marks?: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  _id: string;
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
  questions?: Question[];
  createdAt?: string;
  myAttempt?: {
    _id: string;
    status: 'in_progress' | 'submitted' | 'timed_out';
    score: number;
    totalPossibleMarks: number;
    accuracyPercent: number;
    isPassed: boolean;
  } | null;
  attemptsCount?: number;
  averageScore?: number;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number;
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
}

export interface Attempt {
  _id: string;
  quizId: string;
  quizTitle: string;
  quizCategory: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  studentYear: number;
  answers: Record<string, number>;
  markedForReview: string[];
  startedAt: string;
  submittedAt?: string;
  durationSeconds: number;
  status: 'in_progress' | 'submitted' | 'timed_out';
  score: number;
  totalPossibleMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercent: number;
  isPassed: boolean;
  questionResults?: QuestionResult[];
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  studentName: string;
  studentDepartment: string;
  studentYear: number;
  quizTitle: string;
  quizCategory: string;
  score: number;
  totalPossibleMarks: number;
  accuracyPercent: number;
  durationSeconds: number;
  submittedAt: string;
  isPassed: boolean;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'students' | 'department';
  targetDepartment?: string;
  authorName: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  performedByName: string;
  targetUserName?: string;
  details: string;
  createdAt: string;
}

export interface HealthStatus {
  status: string;
  database: {
    connected: boolean;
    state: string;
    databaseName: string | null;
    uriConfigured: boolean;
    sanitizedTarget?: string;
  };
  aiConfigured: boolean;
  environment: string;
}
