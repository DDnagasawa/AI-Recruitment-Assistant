import { useEffect, useMemo, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { HiringProvider, useHiring } from './context/HiringContext'
import { ToastProvider } from './context/ToastContext'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { ScreeningPage } from './pages/ScreeningPage'

function ScreeningRoute() {
  const [searchParams] = useSearchParams()
  const { state, setSelectedJob, activeJobs } = useHiring()

  const queryJobId = searchParams.get('job')

  useEffect(() => {
    if (!queryJobId) return
    const inAllJobs = state.jobs.some((job) => job.id === queryJobId)
    const inActiveJobs = activeJobs.some((job) => job.id === queryJobId)
    if (inAllJobs && inActiveJobs) {
      setSelectedJob(queryJobId)
    }
  }, [activeJobs, queryJobId, setSelectedJob, state.jobs])

  return <ScreeningPage />
}

function DashboardRoute() {
  const navigate = useNavigate()
  const { setSelectedJob } = useHiring()

  return (
    <DashboardPage
      onOpenJobDetail={(jobId) => {
        navigate(`/positions/${jobId}`)
      }}
      onViewCandidates={(jobId) => {
        setSelectedJob(jobId)
        navigate(`/screening?job=${jobId}`)
      }}
    />
  )
}

function useHeaderMeta() {
  const location = useLocation()
  const { jobsWithMetrics } = useHiring()

  return useMemo(() => {
    if (location.pathname.startsWith('/screening')) {
      return {
        title: 'AI Resume Screening',
        subtitle: 'Upload resumes and act on AI recommendations',
      }
    }
    if (location.pathname.startsWith('/analytics')) {
      return {
        title: 'Hiring Analytics',
        subtitle: 'Understand conversion, speed, and channel quality',
      }
    }
    if (location.pathname.startsWith('/settings')) {
      return {
        title: 'Settings',
        subtitle: 'Configure profile, AI behavior, workflows, and integrations',
      }
    }
    if (location.pathname.startsWith('/positions/')) {
      const jobId = location.pathname.split('/positions/')[1] ?? ''
      const currentJob = jobsWithMetrics.find((job) => job.id === jobId)
      return {
        title: currentJob ? `${currentJob.title} Details` : 'Position Details',
        subtitle: 'Track role progress, candidate quality, and next actions',
      }
    }
    return {
      title: 'Dashboard',
      subtitle: 'Track hiring momentum at a glance',
    }
  }, [jobsWithMetrics, location.pathname])
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerMeta = useHeaderMeta()

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onNavigate={() => {
            setMobileOpen(false)
          }}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <Header
            title={headerMeta.title}
            subtitle={headerMeta.subtitle}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 px-4 py-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/screening" element={<ScreeningRoute />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/positions/:jobId" element={<JobDetailPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <HiringProvider>
        <AppShell />
      </HiringProvider>
    </ToastProvider>
  )
}
