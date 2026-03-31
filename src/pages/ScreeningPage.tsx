import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  CircleX,
  FileUp,
  LoaderCircle,
  ScanLine,
  Search,
  Send,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react'
import { Modal } from '../components/Modal'
import { useHiring } from '../context/HiringContext'
import { useToast } from '../context/ToastContext'
import type { Candidate } from '../types'
import { buildCandidatesFromFiles } from '../utils/candidateFactory'
import { formatFullDate, formatRelativeTime } from '../utils/date'

type RecommendationFilter = 'all' | 'recommended' | 'not_recommended'

type UploadItem = {
  name: string
  progress: number
  status: 'pending' | 'uploading' | 'done'
}

function scoreTone(score: number) {
  if (score >= 80) return { label: 'Excellent Match', color: 'bg-emerald-500', text: 'text-emerald-700' }
  if (score >= 60) return { label: 'Good Match', color: 'bg-amber-500', text: 'text-amber-700' }
  return { label: 'Weak Match', color: 'bg-rose-500', text: 'text-rose-700' }
}

function recommendationBadge(candidate: Candidate) {
  if (candidate.recommendation === 'recommended') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (candidate.recommendation === 'maybe') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-rose-100 text-rose-700'
}

function recommendationText(candidate: Candidate) {
  if (candidate.recommendation === 'recommended') return 'Recommended'
  if (candidate.recommendation === 'maybe') return 'Maybe'
  return 'Not Recommended'
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
]

function avatarClass(name: string) {
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarColors[seed % avatarColors.length]
}

export function ScreeningPage() {
  const {
    state,
    activeJobs,
    setSelectedJob,
    uploadCandidates,
    sendInvite,
    dismissCandidate,
  } = useHiring()
  const { pushToast } = useToast()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<RecommendationFilter>('all')
  const [scoreOrder, setScoreOrder] = useState<'desc' | 'asc'>('desc')
  const [expandedKeywords, setExpandedKeywords] = useState<Record<string, boolean>>({})
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('')

  const [uploadOpen, setUploadOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [confirmInvite, setConfirmInvite] = useState<Candidate | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!activeJobs.length) return
    const stillValid = activeJobs.some((job) => job.id === state.selectedJobId)
    if (!stillValid) {
      setSelectedJob(activeJobs[0].id)
    }
  }, [activeJobs, setSelectedJob, state.selectedJobId])

  const selectedJob = useMemo(
    () => activeJobs.find((job) => job.id === state.selectedJobId) ?? activeJobs[0],
    [activeJobs, state.selectedJobId],
  )

  const jobCandidates = useMemo(
    () =>
      state.candidates.filter(
        (candidate) => candidate.jobId === selectedJob?.id && !candidate.dismissed,
      ),
    [selectedJob?.id, state.candidates],
  )

  const visibleCandidates = useMemo(() => {
    return jobCandidates
      .filter((candidate) => {
        const matchSearch = candidate.name.toLowerCase().includes(search.toLowerCase())
        if (!matchSearch) return false

        if (filter === 'recommended') {
          return candidate.recommendation === 'recommended' || candidate.recommendation === 'maybe'
        }

        if (filter === 'not_recommended') {
          return candidate.recommendation === 'not_recommended'
        }

        return true
      })
      .sort((left, right) =>
        scoreOrder === 'desc' ? right.score - left.score : left.score - right.score,
      )
  }, [filter, jobCandidates, scoreOrder, search])

  useEffect(() => {
    if (!visibleCandidates.length) {
      setSelectedCandidateId('')
      return
    }

    const found = visibleCandidates.some((item) => item.id === selectedCandidateId)
    if (!found) {
      setSelectedCandidateId(visibleCandidates[0].id)
    }
  }, [selectedCandidateId, visibleCandidates])

  const selectedCandidate = useMemo(
    () => visibleCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? null,
    [selectedCandidateId, visibleCandidates],
  )

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)

    const files = Array.from(event.dataTransfer.files)
    if (!files.length) return

    setUploadItems(
      files.map((file) => ({
        name: file.name,
        progress: 0,
        status: 'pending',
      })),
    )
  }, [])

  const handleSelectFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).map((file) => ({
      name: file.name,
      progress: 0,
      status: 'pending' as const,
    }))
    setUploadItems(next)
  }, [])

  const runUploadSimulation = () => {
    if (!selectedJob) return
    if (!uploadItems.length) {
      pushToast('error', 'Select at least one resume file first')
      return
    }

    setIsUploading(true)
    setUploadItems((prev) => prev.map((item) => ({ ...item, status: 'uploading' })))

    const interval = window.setInterval(() => {
      let allDone = true
      setUploadItems((prev) =>
        prev.map((item) => {
          const nextProgress = Math.min(100, item.progress + 18)
          if (nextProgress < 100) {
            allDone = false
          }
          return {
            ...item,
            progress: nextProgress,
            status: nextProgress === 100 ? 'done' : 'uploading',
          }
        }),
      )

      if (allDone) {
        window.clearInterval(interval)
        setIsUploading(false)
        setUploadOpen(false)
        setIsAnalyzing(true)

        window.setTimeout(() => {
          const names = uploadItems.map((item) => item.name)
          const generated = buildCandidatesFromFiles(selectedJob, names)
          uploadCandidates(selectedJob.id, generated)
          setSelectedCandidateId(generated[0]?.id ?? '')
          pushToast('success', `${generated.length} resumes analyzed successfully`)
          setUploadItems([])
          setIsAnalyzing(false)
        }, 2200)
      }
    }, 160)
  }

  const columns = useMemo<ColumnDef<Candidate>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Candidate',
        cell: ({ row }) => {
          const candidate = row.original
          return (
            <button
              type="button"
              onClick={() => setSelectedCandidateId(candidate.id)}
              className="flex w-full items-center gap-3 text-left"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${avatarClass(
                  candidate.name,
                )}`}
              >
                {initials(candidate.name)}
              </div>
              <div>
                <p className="font-medium text-slate-900">{candidate.name}</p>
                <p className="text-xs text-slate-500">{candidate.email}</p>
              </div>
            </button>
          )
        },
      },
      {
        accessorKey: 'score',
        header: 'Match Score',
        cell: ({ row }) => {
          const candidate = row.original
          const tone = scoreTone(candidate.score)
          return (
            <div className="w-44">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{candidate.score}</span>
                <span className={tone.text}>{tone.label}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${tone.color}`}
                  style={{ width: `${candidate.score}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        id: 'keywords',
        header: 'Keyword Match',
        cell: ({ row }) => {
          const candidate = row.original
          const expanded = expandedKeywords[candidate.id]
          const matched = expanded
            ? candidate.matchedKeywords
            : candidate.matchedKeywords.slice(0, 2)
          const missing = expanded
            ? candidate.missingKeywords
            : candidate.missingKeywords.slice(0, 1)

          return (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {matched.map((item) => (
                  <span
                    key={`${candidate.id}-m-${item}`}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                  >
                    {item} ✓
                  </span>
                ))}
                {missing.map((item) => (
                  <span
                    key={`${candidate.id}-x-${item}`}
                    className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                  >
                    {item} ✗
                  </span>
                ))}
              </div>
              {(candidate.matchedKeywords.length > 2 || candidate.missingKeywords.length > 1) && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedKeywords((prev) => ({
                      ...prev,
                      [candidate.id]: !prev[candidate.id],
                    }))
                  }
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  {expanded ? 'Hide Details' : 'Show Details'}
                </button>
              )}
            </div>
          )
        },
      },
      {
        id: 'recommendation',
        header: 'Recommendation',
        cell: ({ row }) => {
          const candidate = row.original
          return (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${recommendationBadge(
                candidate,
              )}`}
            >
              {recommendationText(candidate)}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const candidate = row.original
          const inviteDisabled =
            candidate.inviteStatus === 'sent' || candidate.recommendation === 'not_recommended'
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={inviteDisabled}
                onClick={() => setConfirmInvite(candidate)}
                className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-emerald-600"
              >
                {candidate.inviteStatus === 'sent' ? 'Invite Sent ✓' : 'Send Interview Invite'}
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissCandidate(candidate.id)
                  pushToast('info', `${candidate.name} dismissed`)
                }}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Dismiss
              </button>
            </div>
          )
        },
      },
    ],
    [dismissCandidate, expandedKeywords, pushToast],
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: visibleCandidates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!selectedJob) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No active positions. Create a new position from Dashboard to start screening.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="job-select">
              Current Position
            </label>
            <div className="relative">
              <select
                id="job-select"
                className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pr-8 pl-3 text-sm font-medium text-slate-700"
                value={selectedJob.id}
                onChange={(event) => setSelectedJob(event.target.value)}
              >
                {activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <FileUp className="h-4 w-4" />
            Upload Resumes
          </button>
        </div>

        <AnimatePresence>
          {isAnalyzing ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <ScanLine className="h-4 w-4 animate-pulse" />
                AI is analyzing resumes... This may take a moment.
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidate"
                className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: 'all', label: 'All' },
                { key: 'recommended', label: 'Recommended Only' },
                { key: 'not_recommended', label: 'Not Recommended' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    filter === item.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <select
                value={scoreOrder}
                onChange={(event) => setScoreOrder(event.target.value as 'desc' | 'asc')}
                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="desc">Score High → Low</option>
                <option value="asc">Score Low → High</option>
              </select>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={
                      selectedCandidateId === row.original.id
                        ? 'bg-blue-50/60'
                        : 'hover:bg-slate-50'
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))}
                {!table.getRowModel().rows.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No candidates match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {selectedCandidate ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${avatarClass(
                    selectedCandidate.name,
                  )}`}
                >
                  {initials(selectedCandidate.name)}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{selectedCandidate.name}</p>
                  <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">Uploaded:</span>{' '}
                  {formatRelativeTime(selectedCandidate.uploadedAt)}
                </p>
                <p title={formatFullDate(selectedCandidate.uploadedAt)}>
                  <span className="font-semibold text-slate-700">Timestamp:</span>{' '}
                  {formatFullDate(selectedCandidate.uploadedAt)}
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Summary</p>
                <p className="mt-2 text-sm text-slate-700">{selectedCandidate.summary}</p>
              </div>

              <div className="mt-4 space-y-3">
                {([
                  ['Skills Match', 'skills'],
                  ['Experience Level', 'experience'],
                  ['Education', 'education'],
                  ['Culture Fit', 'culture'],
                ] as const).map(([label, key]) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <p className="font-medium text-slate-700">{label}</p>
                      <p className="font-semibold text-slate-800">
                        {selectedCandidate.dimensionScores[key]}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${selectedCandidate.dimensionScores[key]}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {selectedCandidate.dimensionNotes[key]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={
                    selectedCandidate.inviteStatus === 'sent' ||
                    selectedCandidate.recommendation === 'not_recommended'
                  }
                  onClick={() => setConfirmInvite(selectedCandidate)}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-600"
                >
                  {selectedCandidate.inviteStatus === 'sent'
                    ? 'Invite Sent ✓'
                    : 'Send Interview Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissCandidate(selectedCandidate.id)
                    pushToast('info', `${selectedCandidate.name} dismissed`)
                  }}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
                >
                  Dismiss
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
              Select a candidate to view detailed AI report.
            </div>
          )}
        </section>
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => {
          if (!isUploading) {
            setUploadOpen(false)
          }
        }}
        title="Upload Resumes"
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                fileInputRef.current?.click()
              }
            }}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-blue-400'
            }`}
          >
            <FileUp className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Drag & drop resumes here, or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500">Supports PDF, DOCX</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={(event) => handleSelectFiles(event.target.files)}
          />

          <div className="space-y-2">
            {uploadItems.map((item) => (
              <div key={item.name} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <p className="font-medium text-slate-700">{item.name}</p>
                  <p className="text-slate-500">
                    {item.status === 'done' ? 'Done' : `${item.progress}%`}
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
            {!uploadItems.length && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                No files selected yet.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              disabled={isUploading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={runUploadSimulation}
              disabled={isUploading}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-65"
            >
              {isUploading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Start Upload'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmInvite)}
        onClose={() => setConfirmInvite(null)}
        title="Confirm Interview Invitation"
      >
        {confirmInvite && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Send interview invitation to{' '}
              <span className="font-semibold text-slate-900">{confirmInvite.name}</span> at{' '}
              <span className="font-semibold text-slate-900">{confirmInvite.email}</span>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmInvite(null)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
              >
                <CircleX className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sendInvite(confirmInvite.id)
                  pushToast('success', `Interview invite sent to ${confirmInvite.name}`)
                  setConfirmInvite(null)
                }}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              >
                <Send className="h-4 w-4" />
                Send Invite
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
