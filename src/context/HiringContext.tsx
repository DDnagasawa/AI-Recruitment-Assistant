import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react'
import { initialActivities, initialCandidates, initialJobs } from '../data/mockData'
import type {
  ActivityItem,
  Candidate,
  HiringState,
  HiringStats,
  Job,
  JobWithMetrics,
} from '../types'

type HiringAction =
  | { type: 'SET_SELECTED_JOB'; payload: { jobId: string } }
  | { type: 'ADD_POSITION'; payload: { title: string } }
  | { type: 'CLOSE_POSITION'; payload: { jobId: string } }
  | { type: 'UPLOAD_CANDIDATES'; payload: { jobId: string; candidates: Candidate[] } }
  | { type: 'SEND_INVITE'; payload: { candidateId: string } }
  | { type: 'DISMISS_CANDIDATE'; payload: { candidateId: string } }

const initialState: HiringState = {
  jobs: initialJobs,
  candidates: initialCandidates,
  activities: initialActivities,
  selectedJobId: initialJobs[0]?.id ?? '',
}

const makeActivity = (
  text: string,
  type: ActivityItem['type'],
): ActivityItem => ({
  id: `act-${crypto.randomUUID()}`,
  text,
  timestamp: new Date().toISOString(),
  type,
})

const prependActivity = (items: ActivityItem[], activity: ActivityItem) => [
  activity,
  ...items,
].slice(0, 30)

function hiringReducer(state: HiringState, action: HiringAction): HiringState {
  switch (action.type) {
    case 'SET_SELECTED_JOB': {
      return { ...state, selectedJobId: action.payload.jobId }
    }

    case 'ADD_POSITION': {
      const newJob: Job = {
        id: `job-${crypto.randomUUID()}`,
        title: action.payload.title,
        postedAt: new Date().toISOString(),
        applicants: 0,
        status: 'active',
      }
      return {
        ...state,
        jobs: [newJob, ...state.jobs],
        selectedJobId: newJob.id,
        activities: prependActivity(
          state.activities,
          makeActivity(`${newJob.title} position created`, 'position'),
        ),
      }
    }

    case 'CLOSE_POSITION': {
      const job = state.jobs.find((item) => item.id === action.payload.jobId)
      if (!job || job.status === 'closed') {
        return state
      }

      return {
        ...state,
        jobs: state.jobs.map((item) =>
          item.id === action.payload.jobId ? { ...item, status: 'closed' } : item,
        ),
        activities: prependActivity(
          state.activities,
          makeActivity(`${job.title} position closed`, 'position'),
        ),
      }
    }

    case 'UPLOAD_CANDIDATES': {
      if (action.payload.candidates.length === 0) {
        return state
      }
      const job = state.jobs.find((item) => item.id === action.payload.jobId)
      const updatedJobs = state.jobs.map((item) =>
        item.id === action.payload.jobId
          ? {
              ...item,
              applicants: item.applicants + action.payload.candidates.length,
            }
          : item,
      )

      const uploadActivity = makeActivity(
        `New applicant batch uploaded for ${job?.title ?? 'selected role'}`,
        'applicant',
      )
      const aiActivity = makeActivity(
        `AI screening completed for ${action.payload.candidates.length} resumes in ${
          job?.title ?? 'selected role'
        }`,
        'ai',
      )

      return {
        ...state,
        jobs: updatedJobs,
        candidates: [...action.payload.candidates, ...state.candidates],
        activities: prependActivity(
          prependActivity(state.activities, aiActivity),
          uploadActivity,
        ),
      }
    }

    case 'SEND_INVITE': {
      const target = state.candidates.find(
        (candidate) => candidate.id === action.payload.candidateId,
      )
      if (!target || target.inviteStatus === 'sent') {
        return state
      }

      const nextCandidates = state.candidates.map((candidate) =>
        candidate.id === action.payload.candidateId
          ? { ...candidate, inviteStatus: 'sent' as const }
          : candidate,
      )

      return {
        ...state,
        candidates: nextCandidates,
        activities: prependActivity(
          state.activities,
          makeActivity(`Interview scheduled with ${target.name}`, 'interview'),
        ),
      }
    }

    case 'DISMISS_CANDIDATE': {
      const target = state.candidates.find(
        (candidate) => candidate.id === action.payload.candidateId,
      )
      if (!target || target.dismissed) {
        return state
      }

      return {
        ...state,
        candidates: state.candidates.map((candidate) =>
          candidate.id === action.payload.candidateId
            ? { ...candidate, dismissed: true }
            : candidate,
        ),
        activities: prependActivity(
          state.activities,
          makeActivity(`${target.name} marked as not moving forward`, 'ai'),
        ),
      }
    }

    default:
      return state
  }
}

interface HiringContextValue {
  state: HiringState
  jobsWithMetrics: JobWithMetrics[]
  stats: HiringStats
  activeJobs: Job[]
  setSelectedJob: (jobId: string) => void
  addPosition: (title: string) => void
  closePosition: (jobId: string) => void
  uploadCandidates: (jobId: string, candidates: Candidate[]) => void
  sendInvite: (candidateId: string) => void
  dismissCandidate: (candidateId: string) => void
}

const HiringContext = createContext<HiringContextValue | null>(null)

export function HiringProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(hiringReducer, initialState)

  const jobsWithMetrics = useMemo<JobWithMetrics[]>(() => {
    return state.jobs.map((job) => {
      const related = state.candidates.filter(
        (candidate) => candidate.jobId === job.id && !candidate.dismissed,
      )
      const aiRecommended = related.filter(
        (candidate) => candidate.recommendation === 'recommended',
      ).length
      const interviewsScheduled = related.filter(
        (candidate) => candidate.inviteStatus === 'sent',
      ).length

      return {
        ...job,
        aiRecommended,
        interviewsScheduled,
      }
    })
  }, [state.candidates, state.jobs])

  const stats = useMemo<HiringStats>(() => {
    return {
      totalApplicants: jobsWithMetrics.reduce(
        (sum, job) => sum + job.applicants,
        0,
      ),
      aiScreened: jobsWithMetrics.reduce(
        (sum, job) => sum + job.aiRecommended,
        0,
      ),
      interviewsScheduled: jobsWithMetrics.reduce(
        (sum, job) => sum + job.interviewsScheduled,
        0,
      ),
    }
  }, [jobsWithMetrics])

  const activeJobs = useMemo(
    () => state.jobs.filter((job) => job.status === 'active'),
    [state.jobs],
  )

  const setSelectedJob = useCallback((jobId: string) => {
    dispatch({ type: 'SET_SELECTED_JOB', payload: { jobId } })
  }, [])

  const addPosition = useCallback((title: string) => {
    dispatch({ type: 'ADD_POSITION', payload: { title } })
  }, [])

  const closePosition = useCallback((jobId: string) => {
    dispatch({ type: 'CLOSE_POSITION', payload: { jobId } })
  }, [])

  const uploadCandidates = useCallback((jobId: string, candidates: Candidate[]) => {
    dispatch({ type: 'UPLOAD_CANDIDATES', payload: { jobId, candidates } })
  }, [])

  const sendInvite = useCallback((candidateId: string) => {
    dispatch({ type: 'SEND_INVITE', payload: { candidateId } })
  }, [])

  const dismissCandidate = useCallback((candidateId: string) => {
    dispatch({ type: 'DISMISS_CANDIDATE', payload: { candidateId } })
  }, [])

  const value = useMemo(
    () => ({
      state,
      jobsWithMetrics,
      stats,
      activeJobs,
      setSelectedJob,
      addPosition,
      closePosition,
      uploadCandidates,
      sendInvite,
      dismissCandidate,
    }),
    [
      state,
      jobsWithMetrics,
      stats,
      activeJobs,
      setSelectedJob,
      addPosition,
      closePosition,
      uploadCandidates,
      sendInvite,
      dismissCandidate,
    ],
  )

  return <HiringContext.Provider value={value}>{children}</HiringContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHiring() {
  const context = useContext(HiringContext)
  if (!context) {
    throw new Error('useHiring must be used inside HiringProvider')
  }
  return context
}
