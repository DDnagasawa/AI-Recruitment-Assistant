export type PageKey = 'dashboard' | 'screening' | 'analytics'

export type JobStatus = 'active' | 'closed'

export interface Job {
  id: string
  title: string
  postedAt: string
  applicants: number
  status: JobStatus
  interviewCompleted?: boolean
}

export type CandidateRecommendation = 'recommended' | 'maybe' | 'not_recommended'
export type InviteStatus = 'not_sent' | 'sent'

export type CandidateSource =
  | 'LinkedIn'
  | 'Indeed'
  | 'Referral'
  | 'Company Website'
  | 'Wellfound'

export interface Candidate {
  id: string
  jobId: string
  name: string
  email: string
  uploadedAt: string
  score: number
  recommendation: CandidateRecommendation
  matchedKeywords: string[]
  missingKeywords: string[]
  summary: string
  dimensionScores: {
    skills: number
    experience: number
    education: number
    culture: number
  }
  dimensionNotes: {
    skills: string
    experience: string
    education: string
    culture: string
  }
  source: CandidateSource
  inviteStatus: InviteStatus
  dismissed: boolean
}

export type ActivityType = 'applicant' | 'ai' | 'interview' | 'position'

export interface ActivityItem {
  id: string
  text: string
  timestamp: string
  type: ActivityType
}

export interface HiringState {
  jobs: Job[]
  candidates: Candidate[]
  activities: ActivityItem[]
  selectedJobId: string
}

export interface JobWithMetrics extends Job {
  aiRecommended: number
  interviewsScheduled: number
}

export interface HiringStats {
  totalApplicants: number
  aiScreened: number
  interviewsScheduled: number
}
