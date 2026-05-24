// src/App.tsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ThemeProvider } from './contexts/ThemeContext'

// ─── Components ───────────────────────────────────────────────────────────────
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ChatInterface } from './components/ChatInterface'
import { ScrollToTop } from './components/ScrollToTop'
import { ProtectedRoute } from './components/ProtectedRoute'

// ─── Pages ────────────────────────────────────────────────────────────────────
import { LandingPage } from './pages/LandingPage'
import { PropertiesPage } from './pages/PropertiesPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { TenantDashboard } from './pages/TenantDashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { FavoritesPage } from './pages/FavoritesPage'
import { ContactPage } from './pages/ContactPage'
import { AboutPage } from './pages/AboutPage'
import { FindRoommatePage } from './pages/FindRoommatePage'
import { SafetyTips } from './pages/SafetyTips'
import { SuccessStoriesPage } from './pages/SuccessStoriesPage'
import { RentingGuidePage } from './pages/RentingGuidePage'
import { CityPage } from './pages/CityPage'
import { BeOwnerPage } from './pages/BeOwnerPage'
import { OwnerDashboard } from './pages/OwnerDashboard'
import { VerifyEmail } from './pages/VerifyEmail'
import { MessagesPage } from './pages/MessagesPage'
import { RoommateProfilePage } from './pages/RoommateProfilePage'
import { MatchSuggestionsPage } from './pages/MatchSuggestionsPage'
import { CompatibilityQuizPage } from './pages/CompatibilityQuizPage'
import { SavedRoommatesPage } from './pages/SavedRoommatesPage'
import { CategoryPage } from './pages/CategoryPage'
import { ProfileSettingsPage } from './pages/ProfileSettingsPage'
import { PostPropertyPage } from './pages/PostPropertyPage'
import { PaymentVerifyPage } from './pages/PaymentVerifyPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'

// ─── Layout wrapper ────────────────────────────────────────────────────────────
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <ChatInterface />
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export function App() {
  console.log('🚀 App component rendering');
  console.log('🚀 ThemeProvider imported:', ThemeProvider);
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Toaster
              position="top-right"
              duration={4000}
              visibleToasts={5}
              closeButton={false}
              toastOptions={{
                style: {
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                },
              }}
            />
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
              <Routes>

                {/* ── Full-screen (no header/footer) ── */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/be-owner" element={<BeOwnerPage />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* ── Dashboards (no header/footer) ── */}
                <Route path="/dashboard/tenant" element={
                  <ProtectedRoute allowedRoles={['tenant']}>
                    <TenantDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/owner" element={
                  <ProtectedRoute allowedRoles={['landlord', 'owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/landlord" element={
                  <ProtectedRoute allowedRoles={['landlord', 'owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* ── Main pages with Header + Footer ── */}
                <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
                <Route path="/properties" element={<MainLayout><PropertiesPage /></MainLayout>} />
                <Route path="/property/:id" element={<MainLayout><PropertyDetailPage /></MainLayout>} />
                <Route path="/category/:categoryId" element={<MainLayout><CategoryPage /></MainLayout>} />
                <Route path="/city/:citySlug" element={<MainLayout><CityPage /></MainLayout>} />
                <Route path="/profile" element={<MainLayout><ProfileSettingsPage /></MainLayout>} />
                <Route path="/post-property" element={<MainLayout><PostPropertyPage /></MainLayout>} />
                <Route path="/payment/verify" element={<MainLayout><PaymentVerifyPage /></MainLayout>} />

                {/* Guide & Safety */}
                <Route path="/renting-guide" element={<MainLayout><RentingGuidePage /></MainLayout>} />
                <Route path="/property-safety-tips" element={<MainLayout><SafetyTips /></MainLayout>} />

                {/* Roommate section */}
                <Route path="/find-roommate" element={<MainLayout><FindRoommatePage /></MainLayout>} />
                <Route path="/roommate/:id" element={<MainLayout><RoommateProfilePage /></MainLayout>} />
                <Route path="/match-suggestions" element={<MainLayout><MatchSuggestionsPage /></MainLayout>} />
                <Route path="/roommate-quiz" element={<MainLayout><CompatibilityQuizPage /></MainLayout>} />
                <Route path="/saved-roommates" element={<MainLayout><SavedRoommatesPage /></MainLayout>} />
                <Route path="/roommate-safety" element={<MainLayout><SafetyTips /></MainLayout>} />
                <Route path="/success-stories" element={<MainLayout><SuccessStoriesPage /></MainLayout>} />

                {/* User routes */}
                <Route path="/favorites" element={<MainLayout><FavoritesPage /></MainLayout>} />
                <Route path="/messages" element={<MainLayout><MessagesPage /></MainLayout>} />

                {/* Static pages */}
                <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
                <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />

              </Routes>
            </div>
          </BrowserRouter>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
