import { motion } from 'framer-motion'
import { CalendarClock, CheckCircle2, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MetricCard } from '../components/MetricCard'
import { Modal } from '../components/Modal'
import { useHiring } from '../context/HiringContext'
import { useToast } from '../context/ToastContext'
import { formatFullDate, formatRelativeTime } from '../utils/date'

type FilterKey = 'all' | 'active' | 'closed'

interface DashboardPageProps {
  onViewCandidates: (jobId: string) => void
  onOpenJobDetail: (jobId: string) => void
}

function interviewStatusLabel(interviewsScheduled: number, interviewCompleted?: boolean) {
  if (interviewCompleted) {
    return { label: 'All Completed', className: 'bg-emerald-100 text-emerald-700' }
  }
  if (interviewsScheduled > 0) {
    return {
      label: `${interviewsScheduled} Scheduled`,
      className: 'bg-blue-100 text-blue-700',
    }
  }
  return { label: 'No Interviews', className: 'bg-slate-100 text-slate-600' }
}

const metricChanges = [
  { changeText: '12% vs last week', changePositive: true },
  { changeText: '8% vs last week', changePositive: true },
  { changeText: '3% vs last week', changePositive: false },
]

export function DashboardPage({ onViewCandidates, onOpenJobDetail }: DashboardPageProps) {
  const { stats, jobsWithMetrics, state, addPosition, closePosition } = useHiring()
  const { pushToast } = useToast()

  const [filter, setFilter] = useState<FilterKey>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const visibleJobs = useMemo(() => {
    if (filter === 'all') return jobsWithMetrics
    return jobsWithMetrics.filter((job) => job.status === filter)
  }, [filter, jobsWithMetrics])

  const handleCreatePosition = () => {
    const clean = newTitle.trim()
    if (!clean) {
      pushToast('error', 'Please enter a position title')
      return
    }
    addPosition(clean)
    pushToast('success', 'New position created')
    setNewTitle('')
    setCreateOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Applicants"
          value={stats.totalApplicants}
          changeText={metricChanges[0].changeText}
          changePositive={metricChanges[0].changePositive}
          icon={Users}
          iconBgClass="bg-blue-100"
        />
        <MetricCard
          title="AI Screened"
          value={stats.aiScreened}
          changeText={metricChanges[1].changeText}
          changePositive={metricChanges[1].changePositive}
          icon={CheckCircle2}
          iconBgClass="bg-emerald-100"
        />
        <MetricCard
          title="Interviews Scheduled"
          value={stats.interviewsScheduled}
          changeText={metricChanges[2].changeText}
          changePositive={metricChanges[2].changePositive}
          icon={CalendarClock}
          iconBgClass="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
              {(['all', 'active', 'closed'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                    key === filter
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {key === 'all' ? 'All Positions' : key === 'active' ? 'Active Only' : 'Closed'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New Position
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Job Title</th>
                  <th className="px-4 py-3">Posted</th>
                  <th className="px-4 py-3">Applicants</th>
                  <th className="px-4 py-3">AI Recommended</th>
                  <th className="px-4 py-3">Interview Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.06,
                    },
                  },
                }}
                className="divide-y divide-slate-100 bg-white"
              >
                {visibleJobs.map((job) => {
                  const status = interviewStatusLabel(
                    job.interviewsScheduled,
                    job.interviewCompleted,
                  )

                  return (
                    <motion.tr
                      key={job.id}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onOpenJobDetail(job.id)}
                          className="font-semibold text-slate-800 underline-offset-2 transition hover:text-blue-700 hover:underline"
                        >
                          {job.title}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600" title={formatFullDate(job.postedAt)}>
                        {formatRelativeTime(job.postedAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{job.applicants}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {job.aiRecommended}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onViewCandidates(job.id)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            View Candidates
                          </button>
                          <button
                            type="button"
                            disabled={job.status === 'closed'}
                            onClick={() => {
                              closePosition(job.id)
                              pushToast('info', `${job.title} marked as closed`)
                            }}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Close Position
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </motion.tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {state.activities.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-sm text-slate-700">{item.text}</p>
                <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(item.timestamp)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Position">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="position-title">
            Position Title
          </label>
          <input
            id="position-title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="e.g. Customer Success Manager"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-400 transition focus:ring-2"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePosition}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Create Position
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
