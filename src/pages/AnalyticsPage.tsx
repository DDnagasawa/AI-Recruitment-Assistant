import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useHiring } from '../context/HiringContext'
import { useToast } from '../context/ToastContext'

type RangeKey = '7' | '30' | '90' | 'all'

const rangeOptions: Array<{ key: RangeKey; label: string }> = [
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'Last 30 Days' },
  { key: '90', label: 'Last 90 Days' },
  { key: 'all', label: 'All Time' },
]

const funnelColors = ['#93c5fd', '#60a5fa', '#3b82f6', '#10b981', '#047857']
const sourceOrder = ['LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Wellfound'] as const

function rangeMultiplier(range: RangeKey) {
  if (range === '7') return 0.35
  if (range === '30') return 1
  if (range === '90') return 2.2
  return 4.4
}

function roleBasedTimeline(title?: string) {
  if (!title) return [2, 1, 3, 5, 2]
  if (title.includes('Developer') || title.includes('Engineer')) return [2, 1, 4, 6, 3]
  if (title.includes('Marketing') || title.includes('Operations')) return [1, 1, 2, 4, 2]
  return [2, 1, 3, 5, 2]
}

export function AnalyticsPage() {
  const { state } = useHiring()
  const { pushToast } = useToast()

  const [range, setRange] = useState<RangeKey>('30')
  const [jobFilter, setJobFilter] = useState<'all' | string>('all')

  const selectedJobs = useMemo(() => {
    if (jobFilter === 'all') return state.jobs
    return state.jobs.filter((job) => job.id === jobFilter)
  }, [jobFilter, state.jobs])

  const selectedCandidates = useMemo(() => {
    const selectedIds = new Set(selectedJobs.map((job) => job.id))
    return state.candidates.filter((candidate) => selectedIds.has(candidate.jobId))
  }, [selectedJobs, state.candidates])

  const funnelData = useMemo(() => {
    const scale = rangeMultiplier(range)
    const appliedBase = selectedJobs.reduce((sum, job) => sum + job.applicants, 0)
    const screenedBase = selectedCandidates.length
    const invitedBase = selectedCandidates.filter((item) => item.inviteStatus === 'sent').length

    const raw = [
      Math.max(1, Math.round(appliedBase * scale)),
      Math.max(1, Math.round(screenedBase * scale)),
      Math.max(1, Math.round(Math.max(invitedBase, screenedBase * 0.36) * scale)),
      Math.max(1, Math.round(Math.max(invitedBase, screenedBase * 0.36) * 0.27 * scale)),
      Math.max(1, Math.round(Math.max(invitedBase, screenedBase * 0.36) * 0.27 * 0.62 * scale)),
    ]

    for (let index = 1; index < raw.length; index += 1) {
      raw[index] = Math.min(raw[index], raw[index - 1])
    }

    return [
      { stage: 'Applied', value: raw[0] },
      { stage: 'AI Screened', value: raw[1] },
      { stage: 'Interviewed', value: raw[2] },
      { stage: 'Offered', value: raw[3] },
      { stage: 'Hired', value: raw[4] },
    ]
  }, [range, selectedCandidates, selectedJobs])

  const conversionSummary = useMemo(() => {
    const transitions = funnelData.slice(0, -1).map((item, index) => {
      const next = funnelData[index + 1]
      const rate = item.value === 0 ? 0 : (next.value / item.value) * 100
      return {
        label: `${item.stage} → ${next.stage}`,
        rate,
        drop: 100 - rate,
      }
    })

    const largestDrop = transitions.reduce(
      (max, entry) => (entry.drop > max.drop ? entry : max),
      transitions[0],
    )

    const overall =
      funnelData[0].value === 0
        ? 0
        : Number(((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1))

    return {
      transitions,
      overall,
      largestDrop,
    }
  }, [funnelData])

  const timelineData = useMemo(() => {
    const selectedSingle = jobFilter === 'all' ? undefined : selectedJobs[0]?.title
    const values = roleBasedTimeline(selectedSingle)
    const labels = [
      'Posting → First App',
      'First App → Screening',
      'Screening → Interview',
      'Interview → Offer',
      'Offer → Hired',
    ]

    return labels.map((label, index) => ({
      stage: label,
      days: values[index],
    }))
  }, [jobFilter, selectedJobs])

  const trendData = useMemo(() => {
    const total = timelineData.reduce((sum, item) => sum + item.days, 0)
    const monthLabels = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
    return monthLabels.map((month, index) => ({
      month,
      value: Math.max(7, Math.round(total + (index - 2) * 0.8 - (range === '7' ? 1 : 0))),
    }))
  }, [range, timelineData])

  const sourceData = useMemo(() => {
    const scale = rangeMultiplier(range)
    const totalApplied = funnelData[0]?.value ?? 1
    const countBySource = sourceOrder.reduce<Record<string, { applicants: number; recommended: number }>>(
      (acc, source) => {
        const relevant = selectedCandidates.filter((candidate) => candidate.source === source)
        acc[source] = {
          applicants: relevant.length,
          recommended: relevant.filter((candidate) => candidate.recommendation === 'recommended').length,
        }
        return acc
      },
      {},
    )

    const baseTotal = Object.values(countBySource).reduce(
      (sum, item) => sum + item.applicants,
      0,
    )
    const fitScale = baseTotal > 0 ? totalApplied / baseTotal : scale

    const hiredBoost: Record<string, number> = {
      Referral: 0.35,
      LinkedIn: 0.2,
      'Company Website': 0.24,
      Wellfound: 0.18,
      Indeed: 0.12,
    }

    return sourceOrder.map((source) => {
      const raw = countBySource[source]
      const applicants = Math.max(1, Math.round(raw.applicants * fitScale))
      const recommended = Math.min(
        applicants,
        Math.max(0, Math.round(raw.recommended * fitScale)),
      )
      const hired = Math.min(
        recommended,
        Math.max(0, Math.round(recommended * (hiredBoost[source] ?? 0.18))),
      )

      return { source, applicants, recommended, hired }
    })
  }, [funnelData, range, selectedCandidates])

  const aiInsight = useMemo(() => {
    const ranked = sourceData
      .map((item) => ({
        source: item.source,
        conversion: item.applicants === 0 ? 0 : item.hired / item.applicants,
      }))
      .sort((left, right) => right.conversion - left.conversion)

    const best = ranked[0]
    const percentage = Math.round(best.conversion * 100)

    return `${best.source} has the highest conversion rate at ${percentage}%. Consider investing more in this channel.`
  }, [sourceData])

  const averageTime = timelineData.reduce((sum, item) => sum + item.days, 0)
  const stringifyTooltipValue = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => (Array.isArray(value) ? value.join(', ') : value ?? 0)
  const formatTooltipCount = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => [
    `${stringifyTooltipValue(value)}`,
    'Count',
  ] as [string, string]
  const formatTooltipDays = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => [
    `${stringifyTooltipValue(value)} days`,
    'Duration',
  ] as [string, string]
  const formatTooltipCycle = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => [
    `${stringifyTooltipValue(value)} days`,
    'Average Cycle',
  ] as [string, string]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRange(item.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  range === item.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={jobFilter}
              onChange={(event) => setJobFilter(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All Positions</option>
              {state.jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => pushToast('success', 'Report exported successfully')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Hiring Funnel</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" width={96} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip formatter={formatTooltipCount} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={entry.stage} fill={funnelColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Overall Conversion Rate: {conversionSummary.overall}%
            </p>
            <p className="text-xs text-slate-600">
              Biggest Drop-off: {conversionSummary.largestDrop.label} ({Math.round(conversionSummary.largestDrop.drop)}% drop)
            </p>
            <div className="space-y-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
              {conversionSummary.transitions.map((item) => (
                <p key={item.label}>
                  <span className="font-medium text-slate-700">{item.label}:</span>{' '}
                  {item.rate.toFixed(1)}%
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-900">Average Time to Hire</p>
          <p className="mt-1 text-sm text-slate-500">Average: {averageTime} days</p>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={formatTooltipDays} />
                <Bar dataKey="days" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-900">Cycle Time Trend</p>
          <p className="mt-1 text-sm text-slate-500">Past months average hiring cycle</p>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={formatTooltipCycle} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Source Effectiveness</h3>

        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="source" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="applicants" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="recommended" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="hired" fill="#065f46" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          AI Insight: {aiInsight}
        </p>
      </section>
    </div>
  )
}
