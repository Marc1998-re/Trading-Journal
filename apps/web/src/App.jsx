import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { AccountProvider } from '@/contexts/AccountContext.jsx';
import { FilterProvider } from '@/contexts/FilterContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import HomePage from '@/pages/HomePage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import TradesPage from '@/pages/TradesPage.jsx';
import AnalysisPage from '@/pages/AnalysisPage.jsx';
import ChartsPage from '@/pages/ChartsPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage.jsx';
import TermsOfServicePage from '@/pages/TermsOfServicePage.jsx';
import DisclaimerPage from '@/pages/DisclaimerPage.jsx';
import ImpressumPage from '@/pages/ImpressumPage.jsx';
import VerifyPendingPage from '@/pages/VerifyPendingPage.jsx';
import CookieConsentBanner from '@/components/CookieConsentBanner.jsx';
import { Toaster } from '@/components/ui/sonner';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics.js';

const AppContent = () => {
  useGoogleAnalytics();

  return (
    <div className="min-h-screen flex flex-col transition-theme">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/verify-pending" element={<VerifyPendingPage />} />
          
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/home" replace />}
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/charts"
            element={
              <ProtectedRoute>
                <ChartsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trades"
            element={
              <ProtectedRoute>
                <TradesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AccountProvider>
            <FilterProvider>
              <ScrollToTop />
              <AppContent />
              <Toaster />
            </FilterProvider>
          </AccountProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;