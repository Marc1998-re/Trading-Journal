import React, { lazy, Suspense } from 'react';
import { Route, Routes, createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { AccountProvider } from '@/contexts/AccountContext.jsx';
import { FilterProvider } from '@/contexts/FilterContext.jsx';
import { NavigationGuardProvider } from '@/contexts/NavigationGuardContext.jsx';
import { JournalPeriodProvider } from '@/contexts/JournalPeriodContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import HomePage from '@/pages/HomePage.jsx';
const DashboardPage=lazy(()=>import('@/pages/DashboardPage.jsx'));
const LoginPage=lazy(()=>import('@/pages/LoginPage.jsx'));
const SignupPage=lazy(()=>import('@/pages/SignupPage.jsx'));
const TradesPage=lazy(()=>import('@/pages/TradesPage.jsx'));
const AnalysisPage=lazy(()=>import('@/pages/AnalysisPage.jsx'));
const ChartsPage=lazy(()=>import('@/pages/ChartsPage.jsx'));
const ReviewPage=lazy(()=>import('@/pages/ReviewPage.jsx'));
const ResetPasswordPage=lazy(()=>import('@/pages/ResetPasswordPage.jsx'));
const SettingsPage=lazy(()=>import('@/pages/SettingsPage.jsx'));
const PrivacyPolicyPage=lazy(()=>import('@/pages/PrivacyPolicyPage.jsx'));
const TermsOfServicePage=lazy(()=>import('@/pages/TermsOfServicePage.jsx'));
const DisclaimerPage=lazy(()=>import('@/pages/DisclaimerPage.jsx'));
const ImpressumPage=lazy(()=>import('@/pages/ImpressumPage.jsx'));
const VerifyPendingPage=lazy(()=>import('@/pages/VerifyPendingPage.jsx'));
import CookieConsentBanner from '@/components/CookieConsentBanner.jsx';
import { Toaster } from '@/components/ui/sonner';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics.js';

const AppContent = () => {
  useGoogleAnalytics();
  const {pathname}=useLocation();
  const workspace=pathname.startsWith('/demo')||['/home','/dashboard','/analysis','/charts','/trades','/review','/settings'].includes(pathname);

  return (
    <div className={`trading-app min-h-screen flex flex-col transition-theme${pathname === '/' ? ' landing-theme' : ''}`}>
      <Header />
      <main className={workspace?'workspace-main':'flex-1'}>
        <Suspense fallback={<div role="status" className="p-10 text-sm text-muted-foreground">Ansicht wird geladen…</div>}><Routes>
          <Route path="/reset-password" element={<ResetPasswordPage/>}/>
          <Route path="/demo" element={<DashboardPage/>}/>
          <Route path="/demo/trades" element={<TradesPage/>}/>
          <Route path="/demo/analysis" element={<AnalysisPage/>}/>
          <Route path="/demo/charts" element={<ChartsPage/>}/>
          <Route path="/demo/review" element={<ReviewPage/>}/>
          <Route path="/review" element={<ProtectedRoute><ReviewPage/></ProtectedRoute>}/>
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
        </Routes></Suspense>
      </main>
      {!workspace&&<Footer />}
      <CookieConsentBanner />
    </div>
  );
};

function AppProviders() {
  return (
    <NavigationGuardProvider>
      <AuthProvider>
        <ThemeProvider>
          <AccountProvider>
            <FilterProvider>
              <JournalPeriodProvider>
              <ScrollToTop />
              <AppContent />
              <Toaster />
              </JournalPeriodProvider>
            </FilterProvider>
          </AccountProvider>
        </ThemeProvider>
      </AuthProvider>
    </NavigationGuardProvider>
  );
}

const router = createBrowserRouter([{ path: '*', element: <AppProviders /> }]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
