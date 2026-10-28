import {
  User,
  Quiz,
  Attempt,
  Announcement,
  AuditLog,
  LeaderboardEntry,
  HealthStatus,
} from '../types/index.ts';

const API_BASE = '/api';

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'undefined' &&
      value !== 'null'
    ) {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('quizup_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}`, 'x-quizup-session': token } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data.error || 'ERROR';
    error.data = data;
    throw error;
  }

  // If a fresh token is received, persist it
  if (data && typeof data === 'object' && 'token' in data && typeof data.token === 'string') {
    try {
      localStorage.setItem('quizup_token', data.token);
    } catch {}
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<HealthStatus>('/health'),
  connectDb: (mongoUri: string) =>
    request<{ message: string; database: any }>('/health/connect-db', {
      method: 'POST',
      body: JSON.stringify({ mongoUri }),
    }),

  // Auth
  registerStudent: async (data: {
    name: string;
    email: string;
    studentId: string;
    department: string;
    yearOfStudy: number;
    password: string;
  }) => {
    const res = await request<{ message: string; user: User; token?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) localStorage.setItem('quizup_token', res.token);
    return res;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await request<{ message: string; user: User; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) localStorage.setItem('quizup_token', res.token);
    return res;
  },

  bootstrapAdmin: async (data: { setupSecret: string; name: string; email: string; password: string }) => {
    const res = await request<{ message: string; user: User; token?: string }>('/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) localStorage.setItem('quizup_token', res.token);
    return res;
  },

  getCurrentUser: async () => {
    const res = await request<{ user: User | null; token?: string }>('/auth/me');
    if (res.token) localStorage.setItem('quizup_token', res.token);
    return res;
  },

  updateProfile: (data: { name?: string; department?: string; yearOfStudy?: number }) =>
    request<{ message: string; user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  logout: async () => {
    try {
      localStorage.removeItem('quizup_token');
    } catch {}
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  // Quizzes (Student)
  getQuizzes: (params?: { category?: string; difficulty?: string; search?: string }) => {
    return request<{ quizzes: Quiz[] }>(`/quizzes${buildQuery(params)}`);
  },

  getQuizDetails: (id: string) =>
    request<{ quiz: Quiz; myAttempt: Attempt | null }>(`/quizzes/${id}`),

  startQuiz: (id: string) =>
    request<{ attempt: Attempt; questions: any[]; serverTime: number }>(`/quizzes/${id}/start`, {
      method: 'POST',
    }),

  saveQuizProgress: (quizId: string, attemptId: string, answers: Record<string, number>, markedForReview: string[]) =>
    request<{ message: string }>(`/quizzes/${quizId}/attempts/${attemptId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ answers, markedForReview }),
    }),

  submitQuiz: (quizId: string, attemptId: string, answers: Record<string, number>) =>
    request<{ message: string; result: Attempt }>(`/quizzes/${quizId}/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Results & Leaderboard
  getAttemptResult: (attemptId: string) =>
    request<{ attempt: Attempt; rank: number; totalParticipants: number; quizDetails: any }>(
      `/results/attempt/${attemptId}`
    ),

  getMyHistory: () =>
    request<{
      history: Attempt[];
      stats: { totalQuizzes: number; totalScore: number; avgAccuracy: number; passedCount: number; passRate: number };
    }>('/results/my-history'),

  getLeaderboard: (params?: { quizId?: string; category?: string }) => {
    return request<{ leaderboard: LeaderboardEntry[] }>(`/results/leaderboard${buildQuery(params)}`);
  },

  // Announcements
  getAnnouncements: () => request<{ announcements: Announcement[] }>('/announcements'),

  // AI Assistant & Chatbot
  chatWithAi: (data: { message: string; history?: Array<{ role: 'user' | 'model'; text: string }> }) =>
    request<{ available: boolean; reply?: string; error?: string; message?: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  askAi: (data: { prompt: string; topic?: string; context?: any }) =>
    request<{ available: boolean; answer?: string; error?: string; message?: string }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  explainQuestionAi: (data: {
    questionText: string;
    options: string[];
    selectedOption: number | null;
    correctOption: number;
    explanation?: string;
    topic?: string;
  }) =>
    request<{ available: boolean; explanation?: string; error?: string }>('/ai/explain-question', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generatePracticeAi: (data: { topic: string; difficulty?: string; count?: number }) =>
    request<{ available: boolean; questions?: any[]; raw?: string; error?: string }>(
      '/ai/generate-practice',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  generateStudyPlanAi: (data: { history: any[]; studentName: string; department: string }) =>
    request<{ available: boolean; plan?: string; error?: string }>('/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin APIs
  getAdminStats: () =>
    request<{
      students: { total: number; pending: number; approved: number; rejected: number; suspended: number };
      quizzes: { total: number; published: number; drafts: number };
      submissions: { total: number; averageScore: number; averageAccuracy: number; passRate: number };
      recentActivity: AuditLog[];
      recentSubmissions: Attempt[];
    }>('/admin/stats'),

  getAdminStudents: (params?: { search?: string; status?: string; department?: string; limit?: number; skip?: number }) => {
    return request<{ students: User[]; total: number; limit: number; skip: number }>(`/admin/students${buildQuery(params)}`);
  },

  approveStudent: (id: string) =>
    request<{ message: string; student: User }>(`/admin/students/${id}/approve`, { method: 'POST' }),

  rejectStudent: (id: string, reason?: string) =>
    request<{ message: string; student: User }>(`/admin/students/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  suspendStudent: (id: string, reason?: string) =>
    request<{ message: string; student: User }>(`/admin/students/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  reactivateStudent: (id: string) =>
    request<{ message: string; student: User }>(`/admin/students/${id}/reactivate`, { method: 'POST' }),

  getAdminAuditLogs: () => request<{ logs: AuditLog[] }>('/admin/audit-logs'),

  getAdminQuizzes: () => request<{ quizzes: Quiz[] }>('/quizzes/admin/all'),

  generateAdminQuizAi: (data: {
    topic: string;
    questionCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string;
    durationMinutes?: number;
    marksPerCorrect?: number;
    negativeMarks?: number;
    passingScore?: number;
    isPublished?: boolean;
    instructions?: string;
  }) =>
    request<{ message: string; quiz: Quiz }>('/quizzes/admin/generate-ai-quiz', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createAdminQuiz: (quizData: Partial<Quiz>) =>
    request<{ message: string; quiz: Quiz }>('/quizzes/admin/create', {
      method: 'POST',
      body: JSON.stringify(quizData),
    }),

  updateAdminQuiz: (id: string, quizData: Partial<Quiz>) =>
    request<{ message: string; quiz: Quiz }>(`/quizzes/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quizData),
    }),

  togglePublishQuiz: (id: string, isPublished: boolean) =>
    request<{ message: string; quiz: Quiz }>(`/quizzes/admin/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    }),

  deleteAdminQuiz: (id: string) =>
    request<{ message: string }>(`/quizzes/admin/${id}`, { method: 'DELETE' }),

  getAdminSubmissions: (params?: { quizId?: string; search?: string; status?: string }) => {
    return request<{ submissions: any[] }>(`/results/admin/all-submissions${buildQuery(params)}`);
  },

  createAnnouncement: (data: {
    title: string;
    message: string;
    priority: string;
    targetAudience: string;
    targetDepartment?: string;
  }) =>
    request<{ message: string; announcement: Announcement }>('/announcements/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAnnouncement: (id: string) =>
    request<{ message: string }>(`/announcements/admin/${id}`, { method: 'DELETE' }),
};
