import React, { useEffect, Suspense, lazy } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./services/api";
import { AuthProvider, useAuth } from "./services/AuthContext";
import { AcademyProvider, useAcademy } from "./services/AcademyContext";
import { Login } from "./pages/auth/Login";
import { Layout } from "./components/Layout";
import { useTranslation } from "react-i18next";
import { LandingPage } from "./pages/public/LandingPage";

// Lazy-loaded pages for high performance code-splitting
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Players = lazy(() => import("./pages/Players").then(m => ({ default: m.Players })));
const Teams = lazy(() => import("./pages/Teams").then(m => ({ default: m.Teams })));
const Training = lazy(() => import("./pages/Training").then(m => ({ default: m.Training })));
const PlayerStats = lazy(() => import("./pages/PlayerStats").then(m => ({ default: m.PlayerStats })));
const Subscriptions = lazy(() => import("./pages/Subscriptions").then(m => ({ default: m.Subscriptions })));
const Reports = lazy(() => import("./pages/Reports").then(m => ({ default: m.Reports })));
const Injuries = lazy(() => import("./pages/Injuries").then(m => ({ default: m.Injuries })));
const Evaluations = lazy(() => import("./pages/Evaluations").then(m => ({ default: m.Evaluations })));
const Coaches = lazy(() => import("./pages/Coaches").then(m => ({ default: m.Coaches })));
const StaffManagement = lazy(() => import("./pages/StaffManagement").then(m => ({ default: m.StaffManagement })));
const PhysicalMetrics = lazy(() => import("./pages/PhysicalMetrics").then(m => ({ default: m.PhysicalMetrics })));
const Leaderboard = lazy(() => import("./pages/Leaderboard").then(m => ({ default: m.Leaderboard })));
const PlayerBadges = lazy(() => import("./pages/PlayerBadges").then(m => ({ default: m.PlayerBadges })));
const Attendance = lazy(() => import("./pages/Attendance").then(m => ({ default: m.Attendance })));
const Payments = lazy(() => import("./pages/Payments").then(m => ({ default: m.Payments })));
const StockEntries = lazy(() => import("./pages/StockEntries").then(m => ({ default: m.StockEntries })));
const StockOutputs = lazy(() => import("./pages/StockOutputs").then(m => ({ default: m.StockOutputs })));
const Inventory = lazy(() => import("./pages/Inventory").then(m => ({ default: m.Inventory })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const PlayerRegister = lazy(() => import("./pages/PlayerRegister").then(m => ({ default: m.PlayerRegister })));
const PlayerRequests = lazy(() => import("./pages/PlayerRequests").then(m => ({ default: m.PlayerRequests })));
const Finances = lazy(() => import("./pages/Finances").then(m => ({ default: m.Finances })));
const KitManagement = lazy(() => import("./pages/KitManagement").then(m => ({ default: m.KitManagement })));
const MatchCenter = lazy(() => import("./pages/MatchCenter").then(m => ({ default: m.MatchCenter })));
const EMSMatchSquad = lazy(() => import("./pages/EMSMatchSquad").then(m => ({ default: m.EMSMatchSquad })));
const EMSMatchSheet = lazy(() => import("./pages/EMSMatchSheet").then(m => ({ default: m.EMSMatchSheet })));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard").then(m => ({ default: m.ParentDashboard })));
const ParentPlayerDetails = lazy(() => import("./pages/ParentPlayerDetails").then(m => ({ default: m.ParentPlayerDetails })));
const ParentSignup = lazy(() => import("./pages/ParentSignup").then(m => ({ default: m.ParentSignup })));
const Parents = lazy(() => import("./pages/Parents").then(m => ({ default: m.Parents })));
const CoachNotebook = lazy(() => import("./pages/CoachNotebook").then(m => ({ default: m.CoachNotebook })));
const CoachPayroll = lazy(() => import("./pages/CoachPayroll").then(m => ({ default: m.CoachPayroll })));
const TournamentPro = lazy(() => import("./pages/TournamentPro").then(m => ({ default: m.TournamentPro })));
const PlayerPublicProfile = lazy(() => import("./pages/PlayerPublicProfile").then(m => ({ default: m.PlayerPublicProfile })));
const SquadBuilder = lazy(() => import("./pages/SquadBuilder").then(m => ({ default: m.SquadBuilder })));

const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-zinc-400">
    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
    <span className="text-sm font-medium">جاري التحميل...</span>
  </div>
);


function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-50">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
}

function ProtectedRouteWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-50">جاري التحميل...</div>;
  if (!user) return <LandingPage />;
  return <>{children}</>;
}

function LayoutSwitcher() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  
  // Specific landing pages for each role to "divide the program" effectively
  switch (user.role) {
    case 'parent': return <Navigate to="/parent-dashboard" replace />;
    case 'coach': return <Navigate to="/academy/notebook" replace />;
    case 'staff_storekeeper': return <Navigate to="/admin/inventory" replace />;
    case 'staff_doctor': return <Navigate to="/academy/injuries" replace />;
    case 'staff_assistant': return <Navigate to="/admin/players" replace />;
    default: return <Navigate to="/dashboard" replace />;
  }
}

// Define Application Modes: 'ADMIN' | 'COACH' | 'REGISTRATION' | 'PARENT'
const APP_MODE = (import.meta.env.VITE_APP_MODE || 'ADMIN') as 'ADMIN' | 'COACH' | 'REGISTRATION' | 'PARENT';

export default function App() {
  return (
    <AcademyProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AcademyProvider>
  );
}

function AppContent() {
  const { i18n } = useTranslation();
  const { settings } = useAcademy();

  useEffect(() => {
    // Handle document direction globally
    const isRTL = i18n.language === "ar";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* COMMON PUBLIC ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/:type" element={<Login />} />
          <Route path="/parent-signup" element={<ParentSignup />} />

          {/* PARENT SPECIFIC ROUTES (Global) */}
          <Route path="/parent-dashboard" element={<ProtectedRoute roles={['parent']}><ParentDashboard /></ProtectedRoute>} />
          <Route path="/player/:playerId" element={<ProtectedRoute roles={['parent']}><ParentPlayerDetails /></ProtectedRoute>} />
          <Route path="/player-register" element={<ProtectedRoute roles={['parent']}><PlayerRegister /></ProtectedRoute>} />

          {/* MODE-SPECIFIC ROOT REDIRECTION */}
          <Route path="/" element={
            <ProtectedRouteWrapper>
              <LayoutSwitcher />
            </ProtectedRouteWrapper>
          } />

          {/* DASHBOARD ROUTES */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['admin', 'coach']}><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
          </Route>

          {/* ADMIN & COACH INNER ROUTES */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
            <Route path="players" element={<Players />} />
            <Route path="parents" element={<Parents />} />
            <Route path="player-requests" element={<PlayerRequests />} />
            <Route path="categories" element={<Teams />} />
            <Route path="coaches" element={<Coaches />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="stock-entries" element={<StockEntries />} />
            <Route path="stock-outputs" element={<StockOutputs />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="finances" element={<Finances />} />
            <Route path="coach-payroll" element={<CoachPayroll />} />
            <Route path="kits" element={<KitManagement />} />
            <Route path="tournament-pro" element={<TournamentPro />} />
          </Route>

          <Route path="/player/profile/:id" element={<PlayerPublicProfile />} />

          <Route path="/academy" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="training" element={<Training />} />
            <Route path="notebook" element={<CoachNotebook />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="matches" element={<MatchCenter />} />
            <Route path="player-stats" element={<PlayerStats />} />
            <Route path="injuries" element={<Injuries />} />
            <Route path="evaluations" element={<Evaluations />} />
            <Route path="physical-metrics" element={<PhysicalMetrics />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="badges" element={<PlayerBadges />} />
            <Route path="squad-builder" element={<SquadBuilder />} />
            <Route path="settings" element={<Settings />} />
            <Route path="matches/:matchId/squad" element={<EMSMatchSquad />} />
            <Route path="matches/:matchId/sheet" element={<EMSMatchSheet />} />
          </Route>

          {/* FALLBACKS */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
