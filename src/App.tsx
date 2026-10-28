import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { Sidebar } from './components/common/Sidebar.tsx';
import { DatabaseBanner } from './components/common/DatabaseBanner.tsx';
import { GeminiChatbot } from './components/chat/GeminiChatbot.tsx';

// 21 Required Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { StudentLoginPage } from './pages/auth/StudentLoginPage.tsx';
import { StudentRegisterPage } from './pages/auth/StudentRegisterPage.tsx';
import { AdminLoginPage } from './pages/auth/AdminLoginPage.tsx';
import { PendingApprovalPage } from './pages/status/PendingApprovalPage.tsx';
import { AccountStatusPage } from './pages/status/AccountStatusPage.tsx';
import { NotFoundPage } from './pages/status/NotFoundPage.tsx';
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { QuizListPage } from './pages/student/QuizListPage.tsx';
import { QuizInstructionsPage } from './pages/student/QuizInstructionsPage.tsx';
import { LiveQuizPage } from './pages/student/LiveQuizPage.tsx';
import { QuizResultPage } from './pages/student/QuizResultPage.tsx';
import { LeaderboardPage } from './pages/student/LeaderboardPage.tsx';
import { StudentProfilePage } from './pages/student/StudentProfilePage.tsx';
import { AiStudyAssistantPage } from './pages/student/AiStudyAssistantPage.tsx';
import { AnnouncementsPage } from './pages/student/AnnouncementsPage.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage.tsx';
import { AdminQuizManagementPage } from './pages/admin/AdminQuizManagementPage.tsx';
import { AdminResultsAnalyticsPage } from './pages/admin/AdminResultsAnalyticsPage.tsx';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage.tsx';

function MainRouter() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParams, setViewParams] = useState<any>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-route on initial login or load
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // If unauthenticated and on a protected route, route to landing
        const publicViews = ['landing', 'student-login', 'student-register', 'admin-login', 'leaderboard'];
        if (!publicViews.includes(currentView)) {
          setCurrentView('landing');
        }
      } else if (user.role === 'admin') {
        if (currentView === 'landing' || currentView === 'student-login' || currentView === 'admin-login') {
          setCurrentView('admin-dashboard');
        }
      } else if (user.role === 'student') {
        if (user.status === 'suspended' || user.status === 'rejected') {
          setCurrentView('account-status');
        } else {
          if (currentView === 'landing' || currentView === 'student-login' || currentView === 'student-register' || currentView === 'pending-approval') {
            setCurrentView('student-dashboard');
          }
        }
      }
    }
  }, [user, isLoading]);

  const handleNavigate = (view: string, params: any = {}) => {
    setViewParams(params);

    // Route Protection Enforcement
    if (!user) {
      const publicViews = ['landing', 'student-login', 'student-register', 'admin-login', 'admin-approvals', 'leaderboard', 'not-found'];
      if (!publicViews.includes(view)) {
        setCurrentView('student-login');
        return;
      }
    } else if (user.role === 'student') {
      // Allow student to navigate to admin-login or admin-approvals so they can sign in or switch to admin
      if (view === 'admin-login' || view === 'admin-approvals') {
        setCurrentView(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      // Suspended or rejected students are directed to account status
      if ((user.status === 'suspended' || user.status === 'rejected') && view !== 'account-status') {
        setCurrentView('account-status');
        return;
      }
      // Students cannot access other admin routes
      if (view.startsWith('admin-')) {
        setCurrentView('student-dashboard');
        return;
      }
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500 border-t-transparent animate-spin"></div>
        <p className="font-display font-bold text-amber-400 text-sm tracking-widest uppercase">
          QUIZUP Loading...
        </p>
      </div>
    );
  }

  const isPortalLayout =
    user &&
    ![
      'landing',
      'student-login',
      'student-register',
      'admin-login',
      'pending-approval',
      'account-status',
      'live-quiz',
    ].includes(currentView);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* MongoDB Atlas Real-Time Health & Status Banner */}
      <DatabaseBanner />

      {/* Primary Navigation Header */}
      {currentView !== 'live-quiz' && (
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
      )}

      {/* Main Container */}
      <div className="flex-1 flex w-full">
        {/* Collapsible Sidebar for authenticated Dashboards */}
        {isPortalLayout && (
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Viewport Content */}
        <main className={`flex-1 ${isPortalLayout ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full' : ''}`}>
          {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
          {currentView === 'student-login' && <StudentLoginPage onNavigate={handleNavigate} />}
          {currentView === 'student-register' && <StudentRegisterPage onNavigate={handleNavigate} />}
          {currentView === 'admin-login' && <AdminLoginPage onNavigate={handleNavigate} />}
          {currentView === 'pending-approval' && <PendingApprovalPage onNavigate={handleNavigate} />}
          {currentView === 'account-status' && <AccountStatusPage onNavigate={handleNavigate} />}

          {/* Student Protected Views */}
          {currentView === 'student-dashboard' && <StudentDashboard onNavigate={handleNavigate} />}
          {currentView === 'quiz-list' && <QuizListPage onNavigate={handleNavigate} />}
          {currentView === 'quiz-instructions' && (
            <QuizInstructionsPage quizId={viewParams.quizId} onNavigate={handleNavigate} />
          )}
          {currentView === 'live-quiz' && (
            <LiveQuizPage
              quizId={viewParams.quizId}
              attempt={viewParams.attempt}
              questions={viewParams.questions}
              serverTime={viewParams.serverTime || Date.now()}
              onNavigate={handleNavigate}
            />
          )}
          {currentView === 'results' && (
            <QuizResultPage attemptId={viewParams.attemptId} onNavigate={handleNavigate} />
          )}
          {currentView === 'leaderboard' && (
            <LeaderboardPage quizId={viewParams.quizId} onNavigate={handleNavigate} />
          )}
          {currentView === 'student-profile' && <StudentProfilePage />}
          {currentView === 'ai-assistant' && <AiStudyAssistantPage />}
          {currentView === 'announcements' && <AnnouncementsPage />}

          {/* Administrator Protected Views */}
          {currentView === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
          {currentView === 'admin-approvals' && (
            <AdminApprovalsPage onNavigate={handleNavigate} initialFilter={viewParams.initialFilter} />
          )}
          {currentView === 'admin-quizzes' && <AdminQuizManagementPage />}
          {currentView === 'admin-analytics' && <AdminResultsAnalyticsPage />}
          {currentView === 'admin-announcements' && <AdminAnnouncementsPage />}

          {/* Not Found View */}
          {currentView === 'not-found' && <NotFoundPage onNavigate={handleNavigate} />}
        </main>
      </div>

      {/* Institutional Footer */}
      {currentView !== 'live-quiz' && (
        <footer className="bg-[#050811] border-t border-amber-500/10 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-white">QUIZ<span className="text-amber-400">UP</span></span>
              <span>• College Quiz Platform</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Persistent MongoDB Atlas Storage • Deterministic Leaderboards • Gemini AI Mentor
            </p>
          </div>
        </footer>
      )}

      {/* Floating Gemini Chatbot */}
      {currentView !== 'live-quiz' && <GeminiChatbot />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
