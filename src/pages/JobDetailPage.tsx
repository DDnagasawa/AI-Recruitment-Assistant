import { ArrowLeft, CalendarClock, Send, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHiring } from '../context/HiringContext'
import { useToast } from '../context/ToastContext'
import { formatFullDate, formatRelativeTime } from '../utils/date'

function recommendationTone(recommendation: 'recommended' | 'maybe' | 'not_recommended') {
  if (recommendation === 'recommended') return 'bg-emerald-100 text-emerald-700'
  if (recommendation === 'maybe') return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

function recommendationLabel(recommendation: 'recommended' | 'maybe' | 'not_recommended') {
  if (recommendation === 'recommended') return 'Recommended'
  if (recommendation === 'maybe') return 'Maybe'
  return 'Not Recommended'
}

export function JobDetailPage() {
  const navigate = useNavigate()
  const { jobId = '' } = useParams()
  const { jobsWithMetrics, state, setSelectedJob, sendInvite, closePosition } = useHiring()
  const { pushToast } = useToast()

  const job = jobsWithMetrics.find((item) => item.id === jobId)

  const candidates = useMemo(
    () =>
      state.candidates
        .filter((candidate) => candidate.jobId === jobId && !candidate.dismissed)
        .sort((left, right) => right.score - left.score),
    [jobId, state.candidates],
  )

  const recommendedCount = candidates.filter(
    (candidate) => candidate.recommendation === 'recommended',
  ).length

  const recentActivities = state.activities
    .filter((item) => (job?.title ? item.text.includes(job.title) : false))
    .slice(0, 5)

  if (!job) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Position not found or already removed.</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </button>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{job.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Posted {formatRelativeTime(job.postedAt)} • {job.status === 'active' ? 'Active' : 'Closed'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedJob(job.id)
                navigate(`/screening?job=${job.id}`)
              }}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open In AI Screening
            </button>
            <button
              type="button"
              disabled={job.status === 'closed'}
              onClick={() => {
                closePosition(job.id)
                pushToast('info', `${job.title} marked as closed`)
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Close Position
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Applicants</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{job.applicants}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">AI Recommended</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{job.aiRecommended}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Interviews Scheduled</p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">{job.interviewsScheduled}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Posted Date</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{formatFullDate(job.postedAt)}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Candidate Snapshot</h3>
            <p className="text-xs text-slate-500">
              {recommendedCount} recommended out of {candidates.length}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Recommendation</th>
                  <th className="px-4 py-3">Invite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {candidates.slice(0, 10).map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{candidate.name}</p>
                      <p className="text-xs text-slate-500">{candidate.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{candidate.score}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${recommendationTone(
                          candidate.recommendation,
                        )}`}
                      >
                        {recommendationLabel(candidate.recommendation)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {candidate.inviteStatus === 'sent' ? (
                        <span className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Sent
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={candidate.recommendation === 'not_recommended'}
                          onClick={() => {
                            sendInvite(candidate.id)
                            pushToast('success', `Interview invite sent to ${candidate.name}`)
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Invite
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!candidates.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      No candidates yet for this position.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Quick Progress</p>
            <div className="mt-3 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>{job.applicants} total applicants</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                <span>{job.interviewsScheduled} interviews scheduled</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Recent Activity</p>
            <div className="mt-3 space-y-2">
              {recentActivities.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-700">{item.text}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
              ))}
              {!recentActivities.length && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  No recent activity for this role yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
