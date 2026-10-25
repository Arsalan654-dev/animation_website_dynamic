import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LandingPage } from '@/pages/public/LandingPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'

const InvitationPage = lazy(() =>
  import('@/pages/public/InvitationPage').then((module) => ({ default: module.InvitationPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/admin/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/admin/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const InvitationsPage = lazy(() =>
  import('@/pages/admin/InvitationsPage').then((module) => ({ default: module.InvitationsPage })),
)
const InvitationCreatePage = lazy(() =>
  import('@/pages/admin/InvitationCreatePage').then((module) => ({
    default: module.InvitationCreatePage,
  })),
)
const InvitationEditorPage = lazy(() =>
  import('@/pages/admin/InvitationEditorPage').then((module) => ({
    default: module.InvitationEditorPage,
  })),
)
const InvitationPreviewPage = lazy(() =>
  import('@/pages/admin/InvitationPreviewPage').then((module) => ({
    default: module.InvitationPreviewPage,
  })),
)
const ThemesPage = lazy(() =>
  import('@/pages/admin/ThemesPage').then((module) => ({ default: module.ThemesPage })),
)
const TemplatesPage = lazy(() =>
  import('@/pages/admin/TemplatesPage').then((module) => ({ default: module.TemplatesPage })),
)
const AnimationsPage = lazy(() =>
  import('@/pages/admin/AnimationsPage').then((module) => ({ default: module.AnimationsPage })),
)
const MediaPage = lazy(() =>
  import('@/pages/admin/MediaPage').then((module) => ({ default: module.MediaPage })),
)
const RsvpsPage = lazy(() =>
  import('@/pages/admin/RsvpsPage').then((module) => ({ default: module.RsvpsPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/admin/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}

function RouteLoading() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#f7f1e6]">
      <span
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#4a1f2c]/20 border-t-[#4a1f2c]"
      />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/i/:slug" element={<InvitationPage />} />

          <Route path="/admin/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="invitations" element={<InvitationsPage />} />
            <Route path="invitations/new" element={<InvitationCreatePage />} />
            <Route path="invitations/:id/edit" element={<InvitationEditorPage />} />
            <Route path="themes" element={<ThemesPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="animations" element={<AnimationsPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="rsvps" element={<RsvpsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/admin/invitations/:id/preview"
            element={
              <ProtectedRoute>
                <InvitationPreviewPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
