import type { Candidate, CandidateRecommendation, CandidateSource, Job } from '../types'

const sources: CandidateSource[] = [
  'LinkedIn',
  'Indeed',
  'Referral',
  'Company Website',
  'Wellfound',
]

const jobKeywordMap: Record<string, string[]> = {
  'Frontend Developer': ['React', 'TypeScript', 'UI Architecture', '3+ yrs experience', 'Performance'],
  'Product Designer': ['Figma', 'User Research', 'Design Systems', 'B2B SaaS', 'Wireframing'],
  'Marketing Manager': ['Growth', 'Paid Ads', 'Funnel Analytics', 'B2B Campaigns', 'SEO'],
  'Backend Engineer': ['Node.js', 'Distributed Systems', 'PostgreSQL', 'AWS', 'System Design'],
}

function hashString(input: string) {
  return Array.from(input).reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function recommendationByScore(score: number): CandidateRecommendation {
  if (score >= 78) return 'recommended'
  if (score >= 60) return 'maybe'
  return 'not_recommended'
}

function randomName(seed: number) {
  const first = ['Alex', 'Taylor', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Avery', 'Skyler']
  const last = ['Chen', 'Wang', 'Davis', 'Ng', 'Martinez', 'Foster', 'Lopez', 'Kim']
  return `${first[seed % first.length]} ${last[(seed + 3) % last.length]}`
}

export function buildCandidatesFromFiles(job: Job, fileNames: string[]): Candidate[] {
  const requirements =
    jobKeywordMap[job.title] ?? ['Communication', 'Ownership', 'Problem Solving', 'Execution']

  return fileNames.map((fileName, index) => {
    const seed = hashString(`${job.id}-${fileName}-${index}`)
    const score = 38 + (seed % 58)
    const recommendation = recommendationByScore(score)
    const matchedCount = 2 + (seed % 3)
    const matchedKeywords = requirements.slice(0, matchedCount)
    const missingKeywords = requirements.slice(matchedCount)
    const source = sources[seed % sources.length]
    const name = randomName(seed)
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`

    return {
      id: `cand-${crypto.randomUUID()}`,
      jobId: job.id,
      name,
      email,
      uploadedAt: new Date().toISOString(),
      score,
      recommendation,
      matchedKeywords,
      missingKeywords,
      summary:
        recommendation === 'recommended'
          ? 'Strong profile with relevant skill alignment and enough practical experience to move forward to interview.'
          : recommendation === 'maybe'
            ? 'Shows partial fit with role requirements. Additional interview signal is needed before making a final decision.'
            : 'Major gaps against role requirements make this profile a low-priority option for current hiring needs.',
      dimensionScores: {
        skills: Math.max(40, score + ((seed % 7) - 3)),
        experience: Math.max(38, score + ((seed % 11) - 5)),
        education: Math.max(45, Math.min(90, 58 + (seed % 32))),
        culture: Math.max(42, Math.min(95, 60 + (seed % 30))),
      },
      dimensionNotes: {
        skills: 'Skill match estimated from detected keywords and stack overlap.',
        experience: 'Experience score inferred from tenure and project scope hints in resume text.',
        education: 'Education score reflects role relevance rather than pure degree ranking.',
        culture: 'Culture fit is estimated from communication style and ownership signals.',
      },
      source,
      inviteStatus: 'not_sent',
      dismissed: false,
    }
  })
}
