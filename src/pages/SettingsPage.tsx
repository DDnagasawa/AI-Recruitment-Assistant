import {
  Bell,
  CalendarClock,
  Copy,
  Link2,
  Mail,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Modal } from '../components/Modal'
import { useHiring } from '../context/HiringContext'
import { useToast } from '../context/ToastContext'

type SectionKey =
  | 'profile'
  | 'ai'
  | 'interview'
  | 'notifications'
  | 'templates'
  | 'team'
  | 'integrations'
  | 'privacy'

type Weights = {
  skills: number
  experience: number
  education: number
  culture: number
}

type Frequency = 'each' | 'hourly' | 'daily'

type Template = {
  id: string
  name: string
  updatedAt: string
  usage: number
  jobTitle: string
  department: string
  locationType: 'Remote' | 'Hybrid' | 'On-site'
  location: string
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  salaryMin: string
  salaryMax: string
  currency: 'USD' | 'HKD'
  showSalary: boolean
  description: string
  requirements: string[]
  niceToHave: string[]
  benefits: string[]
}

type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
type SlotKey = `${DayKey}-${string}`

const sections: Array<{ key: SectionKey; label: string; icon: typeof User }> = [
  { key: 'profile', label: 'Profile & Company', icon: User },
  { key: 'ai', label: 'AI Preferences', icon: Sparkles },
  { key: 'interview', label: 'Interview & Scheduling', icon: CalendarClock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'templates', label: 'Job Post Templates', icon: Mail },
  { key: 'team', label: 'Team & Permissions', icon: Users },
  { key: 'integrations', label: 'Integrations', icon: Link2 },
  { key: 'privacy', label: 'Data & Privacy', icon: Shield },
]

const weightPalette: Record<keyof Weights, string> = {
  skills: '#2563eb',
  experience: '#10b981',
  education: '#f59e0b',
  culture: '#8b5cf6',
}

const defaultWeights: Weights = {
  skills: 35,
  experience: 30,
  education: 15,
  culture: 20,
}

const days: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const timeSlots = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

function updateWeightSet(current: Weights, target: keyof Weights, next: number) {
  const clamped = Math.max(0, Math.min(100, next))
  const others = (Object.keys(current) as Array<keyof Weights>).filter((key) => key !== target)
  const remaining = 100 - clamped
  const base = others.reduce((sum, key) => sum + current[key], 0)
  const nextWeights: Weights = { ...current, [target]: clamped }

  if (base === 0) {
    const each = Math.floor(remaining / others.length)
    others.forEach((key, index) => {
      nextWeights[key] = index === 0 ? remaining - each * (others.length - 1) : each
    })
    return nextWeights
  }

  let allocated = 0
  others.forEach((key, index) => {
    if (index === others.length - 1) {
      nextWeights[key] = remaining - allocated
      return
    }
    const value = Math.round((current[key] / base) * remaining)
    nextWeights[key] = value
    allocated += value
  })

  return nextWeights
}

function WeightRing({ weights }: { weights: Weights }) {
  const segments = (Object.keys(weights) as Array<keyof Weights>).reduce<
    Array<{ key: keyof Weights; from: number; to: number }>
  >((acc, key) => {
    const from = acc.length ? acc[acc.length - 1].to : 0
    const to = from + weights[key]
    return [...acc, { key, from, to }]
  }, [])

  const background = `conic-gradient(${segments
    .map((segment) => `${weightPalette[segment.key]} ${segment.from}% ${segment.to}%`)
    .join(', ')})`

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 rounded-full" style={{ background }}>
        <div className="absolute inset-3 rounded-full bg-white" />
      </div>
      <div className="space-y-1 text-xs">
        {(Object.keys(weights) as Array<keyof Weights>).map((key) => (
          <p key={key} className="flex items-center gap-2 text-slate-600">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: weightPalette[key] }}
            />
            <span className="capitalize">{key}</span>
            <span className="font-semibold text-slate-800">{weights[key]}%</span>
          </p>
        ))}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function TagEditor({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')
  return (
    <div className="rounded-lg border border-slate-300 p-2">
      <div className="mb-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
          >
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))}>
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          const next = draft.trim()
          if (!next || tags.includes(next)) return
          onChange([...tags, next])
          setDraft('')
        }}
        className="w-full border-0 p-0 text-sm outline-none"
        placeholder={placeholder}
      />
    </div>
  )
}

export function SettingsPage() {
  const { state } = useHiring()
  const { pushToast } = useToast()

  const [activeSection, setActiveSection] = useState<SectionKey>('profile')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const [profile, setProfile] = useState({
    fullName: 'Dana Doe',
    title: 'CEO',
    email: 'dana@nexalabs.com',
    phone: '',
    companyName: 'Nexa Labs',
    companySize: '1-10',
    industry: 'Tech',
    website: 'https://nexalabs.com',
    location: 'Hong Kong',
    description: 'We build AI-first productivity software for modern teams.',
  })
  const [savedProfile, setSavedProfile] = useState(profile)

  const [recommendThreshold, setRecommendThreshold] = useState(70)
  const [autoRejectEnabled, setAutoRejectEnabled] = useState(true)
  const [autoRejectThreshold, setAutoRejectThreshold] = useState(30)
  const [weights, setWeights] = useState<Weights>(defaultWeights)
  const [mustHave, setMustHave] = useState(['React', '3+ years experience', 'English fluent'])
  const [niceToHave, setNiceToHave] = useState([
    'TypeScript',
    'Startup experience',
    'Remote work experience',
  ])

  const [interviewType, setInterviewType] = useState<'Video Call' | 'Phone Call' | 'In-Person' | 'Hybrid'>('Video Call')
  const [videoTool, setVideoTool] = useState('Zoom')
  const [meetingLink, setMeetingLink] = useState('https://zoom.us/my/nexalabs')
  const [timezone, setTimezone] = useState('Asia/Hong_Kong')
  const [duration, setDuration] = useState('45min')
  const [unavailableDates, setUnavailableDates] = useState('')
  const [templateBody, setTemplateBody] = useState(
    'Hi {{candidate_name}},\n\nThank you for applying to the {{job_title}} position at {{company_name}}.\nWe would like to invite you for an interview.\nDate & Time: {{interview_time}}\nFormat: {{interview_type}}\n{{meeting_link}}\n\nLooking forward to meeting you!\n{{sender_name}}, {{sender_title}}',
  )

  const [selectedSlots, setSelectedSlots] = useState<Set<SlotKey>>(
    new Set<SlotKey>(
      days.flatMap((day) =>
        day === 'Sat' || day === 'Sun'
          ? []
          : (['10:00', '11:00', '14:00', '15:00', '16:00'] as const).map(
              (time) => `${day}-${time}` as SlotKey,
            ),
      ),
    ),
  )
  const [drag, setDrag] = useState<{ active: boolean; mode: 'add' | 'remove' }>({
    active: false,
    mode: 'add',
  })

  const [notification, setNotification] = useState({
    emailChannel: true,
    pushChannel: false,
    digestEnabled: true,
    digestTime: '09:00',
    newApplicationEnabled: true,
    newApplicationFrequency: 'hourly' as Frequency,
    screeningDoneEnabled: true,
    highMatchEnabled: true,
    highMatchScore: 90,
    interviewReminderEnabled: true,
    interviewReminderLead: '30min',
    noReplyEnabled: true,
    noReplyDays: 3,
    weeklyReportEnabled: true,
    weeklyReportDay: 'Monday',
  })
  const [expandedNotice, setExpandedNotice] = useState<
    'new' | 'screening' | 'high' | 'reminder' | 'noreply' | 'weekly' | null
  >('new')

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 'tpl-fe',
      name: 'Frontend Developer - Standard',
      updatedAt: '2 days ago',
      usage: 14,
      jobTitle: 'Frontend Developer',
      department: 'Engineering',
      locationType: 'Remote',
      location: 'Hong Kong',
      employmentType: 'Full-time',
      salaryMin: '45000',
      salaryMax: '70000',
      currency: 'USD',
      showSalary: true,
      description: 'Build user-facing features with React and TypeScript.',
      requirements: ['3+ years React', 'TypeScript', 'API integration'],
      niceToHave: ['Design systems', 'Startup experience'],
      benefits: ['Medical', 'Flexible remote schedule'],
    },
    {
      id: 'tpl-pd',
      name: 'Product Designer - Standard',
      updatedAt: '5 days ago',
      usage: 8,
      jobTitle: 'Product Designer',
      department: 'Product',
      locationType: 'Hybrid',
      location: 'Hong Kong',
      employmentType: 'Full-time',
      salaryMin: '40000',
      salaryMax: '62000',
      currency: 'USD',
      showSalary: false,
      description: 'Own product UX across discovery, design and iteration.',
      requirements: ['Figma', 'User research', 'B2B SaaS experience'],
      niceToHave: ['Motion design', 'A/B testing'],
      benefits: ['Medical', 'Learning budget'],
    },
  ])
  const [activeTemplateId, setActiveTemplateId] = useState('tpl-fe')
  const activeTemplate = templates.find((item) => item.id === activeTemplateId) ?? templates[0]
  const [listDraft, setListDraft] = useState({ req: '', plus: '', benefit: '' })

  const [members, setMembers] = useState([
    { id: 'u-1', name: 'Dana Doe', email: 'dana@nexalabs.com', role: 'Admin', status: 'Active' },
    {
      id: 'u-2',
      name: 'Alex Chen',
      email: 'alex@nexalabs.com',
      role: 'Hiring Manager',
      status: 'Invited',
    },
    { id: 'u-3', name: 'Mia Wong', email: 'mia@nexalabs.com', role: 'Interviewer', status: 'Active' },
  ])

  const [integrations, setIntegrations] = useState([
    { id: 'google-calendar', name: 'Google Calendar', connected: true, lastSync: '5 min ago' },
    { id: 'outlook-calendar', name: 'Outlook Calendar', connected: false, lastSync: '-' },
    { id: 'linkedin', name: 'LinkedIn', connected: true, lastSync: '12 min ago' },
    { id: 'indeed', name: 'Indeed', connected: false, lastSync: '-' },
    { id: 'slack', name: 'Slack', connected: false, lastSync: '-' },
    { id: 'teams', name: 'Microsoft Teams', connected: false, lastSync: '-' },
  ])

  const [retention, setRetention] = useState('90 days')
  const [privacyNotice, setPrivacyNotice] = useState(
    'We collect candidate data for recruitment purposes and will retain data according to the selected policy.',
  )
  const [requireConsent, setRequireConsent] = useState(true)
  const [deleteQuery, setDeleteQuery] = useState('')

  const profileDirty = JSON.stringify(profile) !== JSON.stringify(savedProfile)
  const recommendedImpact = Math.round((recommendThreshold - 65) / 7)
  const slotCount = selectedSlots.size
  const totalWeight = Object.values(weights).reduce((sum, item) => sum + item, 0)

  const matchedCandidates = useMemo(() => {
    if (!deleteQuery.trim()) return []
    return state.candidates
      .filter((candidate) =>
        candidate.name.toLowerCase().includes(deleteQuery.trim().toLowerCase()),
      )
      .slice(0, 5)
  }, [deleteQuery, state.candidates])

  const previewMail = templateBody
    .replaceAll('{{candidate_name}}', 'John Lin')
    .replaceAll('{{job_title}}', 'Frontend Developer')
    .replaceAll('{{company_name}}', profile.companyName)
    .replaceAll('{{interview_time}}', 'Apr 2, 2026 10:30 AM')
    .replaceAll('{{interview_type}}', interviewType)
    .replaceAll('{{meeting_link}}', meetingLink)
    .replaceAll('{{sender_name}}', profile.fullName)
    .replaceAll('{{sender_title}}', profile.title)

  const updateTemplate = <K extends keyof Template>(key: K, value: Template[K]) => {
    setTemplates((prev) =>
      prev.map((item) =>
        item.id === activeTemplate.id
          ? {
              ...item,
              [key]: value,
              updatedAt: 'just now',
            }
          : item,
      ),
    )
  }

  const handleDragStart = (slot: SlotKey) => {
    const exists = selectedSlots.has(slot)
    const nextMode: 'add' | 'remove' = exists ? 'remove' : 'add'
    setDrag({ active: true, mode: nextMode })
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (nextMode === 'add') next.add(slot)
      if (nextMode === 'remove') next.delete(slot)
      return next
    })
  }

  const handleDragEnter = (slot: SlotKey) => {
    if (!drag.active) return
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (drag.mode === 'add') next.add(slot)
      if (drag.mode === 'remove') next.delete(slot)
      return next
    })
  }

  const notificationRow = (
    title: string,
    description: string,
    enabled: boolean,
    onToggle: (next: boolean) => void,
    openKey: 'new' | 'screening' | 'high' | 'reminder' | 'noreply' | 'weekly',
    detail: React.ReactNode,
  ) => (
    <div className="rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setExpandedNotice((prev) => (prev === openKey ? null : openKey))}
          className="text-left"
        >
          <p className="text-sm font-medium text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </button>
        <label className="inline-flex items-center gap-2 text-xs">
          <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
          {enabled ? 'On' : 'Off'}
        </label>
      </div>
      {expandedNotice === openKey && <div className="border-t border-slate-100 px-3 py-2">{detail}</div>}
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[250px_minmax(0,1fr)]" onMouseUp={() => setDrag({ ...drag, active: false })}>
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="px-2 pt-2 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Settings
        </p>
        <div className="space-y-1">
          {sections.map((item) => {
            const Icon = item.icon
            const active = activeSection === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                  active
                    ? 'bg-blue-600/10 font-semibold text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </aside>

      <div className="space-y-6">
        {activeSection === 'profile' && (
          <SectionCard
            title="Profile & Company"
            subtitle="Personal and company identity used in invitation emails and branding."
          >
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {profile.fullName
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{profile.fullName}</p>
                  <p className="text-xs text-slate-500">{profile.title}</p>
                </div>
              </div>
              <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium">
                Upload Avatar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <input
                className="rounded-md border p-2 text-sm"
                value={profile.fullName}
                onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                placeholder="Full Name"
              />
              <input
                className="rounded-md border p-2 text-sm"
                value={profile.title}
                onChange={(event) => setProfile({ ...profile, title: event.target.value })}
                placeholder="Title"
              />
              <input
                className="rounded-md border p-2 text-sm"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                placeholder="Email"
              />
              <input
                className="rounded-md border p-2 text-sm"
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                placeholder="Phone"
              />
              <input
                className="rounded-md border p-2 text-sm"
                value={profile.companyName}
                onChange={(event) => setProfile({ ...profile, companyName: event.target.value })}
                placeholder="Company Name"
              />
              <select
                className="rounded-md border p-2 text-sm"
                value={profile.companySize}
                onChange={(event) => setProfile({ ...profile, companySize: event.target.value })}
              >
                <option>1-10</option>
                <option>11-50</option>
                <option>51-200</option>
              </select>
              <select
                className="rounded-md border p-2 text-sm"
                value={profile.industry}
                onChange={(event) => setProfile({ ...profile, industry: event.target.value })}
              >
                <option>Tech</option>
                <option>Finance</option>
                <option>Healthcare</option>
                <option>E-commerce</option>
              </select>
              <input
                className="rounded-md border p-2 text-sm"
                value={profile.website}
                onChange={(event) => setProfile({ ...profile, website: event.target.value })}
                placeholder="Website URL"
              />
              <input
                className="rounded-md border p-2 text-sm lg:col-span-2"
                value={profile.location}
                onChange={(event) => setProfile({ ...profile, location: event.target.value })}
                placeholder="Office Location"
              />
              <textarea
                className="rounded-md border p-2 text-sm lg:col-span-2"
                rows={4}
                maxLength={200}
                value={profile.description}
                onChange={(event) => setProfile({ ...profile, description: event.target.value })}
                placeholder="Company Description (max 200 chars)"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!profileDirty}
                onClick={() => {
                  setSavedProfile(profile)
                  pushToast('success', 'Profile and company settings saved')
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save Changes
              </button>
            </div>
          </SectionCard>
        )}

        {activeSection === 'ai' && (
          <SectionCard
            title="AI Preferences"
            subtitle="Tune thresholds, scoring weights, and keyword rules to match your hiring style."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-800">Recommendation Threshold</p>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={recommendThreshold}
                    onChange={(event) => setRecommendThreshold(Number(event.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    className="w-16 rounded border px-2 py-1 text-xs"
                    value={recommendThreshold}
                    onChange={(event) => setRecommendThreshold(Number(event.target.value))}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Currently, candidates scoring above {recommendThreshold} will be recommended.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoRejectEnabled}
                    onChange={(event) => setAutoRejectEnabled(event.target.checked)}
                  />
                  Enable Auto-Reject Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    disabled={!autoRejectEnabled}
                    value={autoRejectThreshold}
                    onChange={(event) => setAutoRejectThreshold(Number(event.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    disabled={!autoRejectEnabled}
                    className="w-16 rounded border px-2 py-1 text-xs disabled:bg-slate-100"
                    value={autoRejectThreshold}
                    onChange={(event) => setAutoRejectThreshold(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                {(Object.keys(weights) as Array<keyof Weights>).map((key) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-700">{key}</span>
                      <input
                        type="number"
                        className="w-16 rounded border px-2 py-0.5 text-xs"
                        value={weights[key]}
                        onChange={(event) =>
                          setWeights(updateWeightSet(weights, key, Number(event.target.value)))
                        }
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights[key]}
                      onChange={(event) =>
                        setWeights(updateWeightSet(weights, key, Number(event.target.value)))
                      }
                      className="w-full"
                    />
                  </div>
                ))}
                <p className={`text-xs ${totalWeight === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Weight total: {totalWeight}%
                </p>
                <button
                  type="button"
                  onClick={() => setWeights(defaultWeights)}
                  className="text-xs font-semibold text-blue-600"
                >
                  Reset to Default
                </button>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <WeightRing weights={weights} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Must-Have Keywords</p>
                <TagEditor
                  tags={mustHave}
                  onChange={setMustHave}
                  placeholder="Type must-have keyword and press Enter"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Nice-to-Have Keywords</p>
                <TagEditor
                  tags={niceToHave}
                  onChange={setNiceToHave}
                  placeholder="Type nice-to-have keyword and press Enter"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm text-slate-700">
                Preview impact: recommended candidates {recommendedImpact >= 0 ? '+' : ''}
                {recommendedImpact}
              </p>
              <button
                type="button"
                onClick={() => pushToast('info', 'Re-scored existing candidates with current settings (mock)')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
              >
                Preview Impact
              </button>
            </div>
          </SectionCard>
        )}

        {activeSection === 'interview' && (
          <SectionCard
            title="Interview & Scheduling"
            subtitle="Define interview format, calendar availability, and reusable invite templates."
          >
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {(['Video Call', 'Phone Call', 'In-Person', 'Hybrid'] as const).map((option) => (
                <label key={option} className="rounded-lg border border-slate-200 p-2 text-sm">
                  <input
                    type="radio"
                    checked={interviewType === option}
                    onChange={() => setInterviewType(option)}
                  />{' '}
                  {option}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <select
                className="rounded-md border p-2 text-sm"
                value={videoTool}
                onChange={(event) => setVideoTool(event.target.value)}
              >
                <option>Zoom</option>
                <option>Google Meet</option>
                <option>Microsoft Teams</option>
              </select>
              <input
                className="rounded-md border p-2 text-sm lg:col-span-2"
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                placeholder="Meeting link template"
              />
              <select
                className="rounded-md border p-2 text-sm"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                <option>Asia/Hong_Kong</option>
                <option>America/Los_Angeles</option>
                <option>UTC</option>
              </select>
              <select
                className="rounded-md border p-2 text-sm"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
                <option>30min</option>
                <option>45min</option>
                <option>60min</option>
                <option>90min</option>
              </select>
              <input
                className="rounded-md border p-2 text-sm"
                value={unavailableDates}
                onChange={(event) => setUnavailableDates(event.target.value)}
                placeholder="Unavailable dates, e.g. 2026-04-10"
              />
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">
                  Weekly Availability ({slotCount} selected blocks)
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedSlots(new Set())}
                  className="text-xs font-medium text-slate-500"
                >
                  Clear
                </button>
              </div>
              <div className="overflow-auto">
                <div className="grid min-w-[760px] grid-cols-[70px_repeat(7,minmax(0,1fr))] gap-1">
                  <div />
                  {days.map((day) => (
                    <div key={day} className="rounded bg-slate-100 py-1 text-center text-xs font-semibold text-slate-600">
                      {day}
                    </div>
                  ))}
                  {timeSlots.map((time) => (
                    <div key={time} className="contents">
                      <div className="pt-1 text-xs text-slate-500">{time}</div>
                      {days.map((day) => {
                        const slot = `${day}-${time}` as SlotKey
                        const selected = selectedSlots.has(slot)
                        return (
                          <button
                            key={slot}
                            type="button"
                            onMouseDown={() => handleDragStart(slot)}
                            onMouseEnter={() => handleDragEnter(slot)}
                            className={`h-7 rounded border text-[10px] ${
                              selected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {selected ? 'Selected' : ''}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Interview Invite Template</p>
              <div className="flex flex-wrap gap-2">
                {['{{candidate_name}}', '{{job_title}}', '{{company_name}}', '{{interview_time}}'].map(
                  (token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => setTemplateBody((prev) => `${prev} ${token}`)}
                      className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                    >
                      {token}
                    </button>
                  ),
                )}
              </div>
              <textarea
                rows={8}
                className="w-full rounded-md border p-2 text-sm"
                value={templateBody}
                onChange={(event) => setTemplateBody(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
              >
                Preview
              </button>
            </div>
          </SectionCard>
        )}

        {activeSection === 'notifications' && (
          <SectionCard
            title="Notifications"
            subtitle="Control channels and event-level notification logic."
          >
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm font-medium text-slate-700">Global Channels</p>
              <button
                type="button"
                onClick={() =>
                  setNotification((prev) => ({
                    ...prev,
                    emailChannel: false,
                    pushChannel: false,
                    digestEnabled: false,
                    newApplicationEnabled: false,
                    screeningDoneEnabled: false,
                    highMatchEnabled: false,
                    interviewReminderEnabled: false,
                    noReplyEnabled: false,
                    weeklyReportEnabled: false,
                  }))
                }
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"
              >
                Mute All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <label className="rounded-lg border border-slate-200 p-2 text-sm">
                <input
                  type="checkbox"
                  checked={notification.emailChannel}
                  onChange={(event) =>
                    setNotification((prev) => ({ ...prev, emailChannel: event.target.checked }))
                  }
                />{' '}
                Email
              </label>
              <label className="rounded-lg border border-slate-200 p-2 text-sm">
                <input
                  type="checkbox"
                  checked={notification.pushChannel}
                  onChange={(event) =>
                    setNotification((prev) => ({ ...prev, pushChannel: event.target.checked }))
                  }
                />{' '}
                Browser Push
              </label>
              <label className="rounded-lg border border-slate-200 p-2 text-sm">
                <input
                  type="checkbox"
                  checked={notification.digestEnabled}
                  onChange={(event) =>
                    setNotification((prev) => ({ ...prev, digestEnabled: event.target.checked }))
                  }
                />{' '}
                Daily Digest at{' '}
                <input
                  className="w-16 rounded border px-1 py-0.5 text-xs"
                  value={notification.digestTime}
                  onChange={(event) =>
                    setNotification((prev) => ({ ...prev, digestTime: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="space-y-2">
              {notificationRow(
                '📥 New Application Received',
                'Notify when new resumes arrive.',
                notification.newApplicationEnabled,
                (next) => setNotification((prev) => ({ ...prev, newApplicationEnabled: next })),
                'new',
                <select
                  className="rounded border p-1 text-xs"
                  value={notification.newApplicationFrequency}
                  onChange={(event) =>
                    setNotification((prev) => ({
                      ...prev,
                      newApplicationFrequency: event.target.value as Frequency,
                    }))
                  }
                >
                  <option value="each">Each</option>
                  <option value="hourly">Hourly Summary</option>
                  <option value="daily">Daily Summary</option>
                </select>,
              )}

              {notificationRow(
                '🤖 AI Screening Completed',
                'Notify when a batch analysis completes.',
                notification.screeningDoneEnabled,
                (next) => setNotification((prev) => ({ ...prev, screeningDoneEnabled: next })),
                'screening',
                <p className="text-xs text-slate-500">
                  Trigger after each completed screening batch.
                </p>,
              )}

              {notificationRow(
                '⭐ High-Match Candidate Alert',
                'Alert when top candidate appears.',
                notification.highMatchEnabled,
                (next) => setNotification((prev) => ({ ...prev, highMatchEnabled: next })),
                'high',
                <label className="text-xs">
                  Score threshold:{' '}
                  <input
                    type="number"
                    className="w-14 rounded border px-1 py-0.5"
                    value={notification.highMatchScore}
                    onChange={(event) =>
                      setNotification((prev) => ({
                        ...prev,
                        highMatchScore: Number(event.target.value),
                      }))
                    }
                  />
                </label>,
              )}

              {notificationRow(
                '📅 Interview Reminder',
                'Remind before scheduled interviews.',
                notification.interviewReminderEnabled,
                (next) =>
                  setNotification((prev) => ({ ...prev, interviewReminderEnabled: next })),
                'reminder',
                <select
                  className="rounded border p-1 text-xs"
                  value={notification.interviewReminderLead}
                  onChange={(event) =>
                    setNotification((prev) => ({
                      ...prev,
                      interviewReminderLead: event.target.value,
                    }))
                  }
                >
                  <option>15min</option>
                  <option>30min</option>
                  <option>1hour</option>
                  <option>1day</option>
                </select>,
              )}

              {notificationRow(
                '⏰ No Response Alert',
                'Remind if candidate has not replied.',
                notification.noReplyEnabled,
                (next) => setNotification((prev) => ({ ...prev, noReplyEnabled: next })),
                'noreply',
                <label className="text-xs">
                  Days after invite:{' '}
                  <input
                    type="number"
                    className="w-14 rounded border px-1 py-0.5"
                    value={notification.noReplyDays}
                    onChange={(event) =>
                      setNotification((prev) => ({
                        ...prev,
                        noReplyDays: Number(event.target.value),
                      }))
                    }
                  />
                </label>,
              )}

              {notificationRow(
                '📊 Weekly Report',
                'Receive weekly hiring funnel summary.',
                notification.weeklyReportEnabled,
                (next) => setNotification((prev) => ({ ...prev, weeklyReportEnabled: next })),
                'weekly',
                <select
                  className="rounded border p-1 text-xs"
                  value={notification.weeklyReportDay}
                  onChange={(event) =>
                    setNotification((prev) => ({
                      ...prev,
                      weeklyReportDay: event.target.value,
                    }))
                  }
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                </select>,
              )}
            </div>
          </SectionCard>
        )}

        {activeSection === 'templates' && activeTemplate && (
          <SectionCard
            title="Job Post Templates"
            subtitle="Create reusable JD templates with structured fields."
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setActiveTemplateId(template.id)}
                  className={`rounded-lg border p-3 text-left ${
                    activeTemplateId === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Edited {template.updatedAt}</p>
                  <p className="text-xs text-slate-500">Used {template.usage} times</p>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const cloned: Template = {
                    ...activeTemplate,
                    id: `tpl-${crypto.randomUUID()}`,
                    name: `${activeTemplate.name} Copy`,
                    usage: 0,
                    updatedAt: 'just now',
                  }
                  setTemplates((prev) => [cloned, ...prev])
                  setActiveTemplateId(cloned.id)
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (templates.length === 1) return
                  const next = templates.filter((item) => item.id !== activeTemplate.id)
                  setTemplates(next)
                  setActiveTemplateId(next[0].id)
                }}
                className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <input
                className="rounded-md border p-2 text-sm"
                value={activeTemplate.name}
                onChange={(event) => updateTemplate('name', event.target.value)}
              />
              <input
                className="rounded-md border p-2 text-sm"
                value={activeTemplate.jobTitle}
                onChange={(event) => updateTemplate('jobTitle', event.target.value)}
                placeholder="Job Title"
              />
              <input
                className="rounded-md border p-2 text-sm"
                value={activeTemplate.department}
                onChange={(event) => updateTemplate('department', event.target.value)}
                placeholder="Department"
              />
              <select
                className="rounded-md border p-2 text-sm"
                value={activeTemplate.locationType}
                onChange={(event) =>
                  updateTemplate('locationType', event.target.value as Template['locationType'])
                }
              >
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>
              <input
                className="rounded-md border p-2 text-sm"
                value={activeTemplate.location}
                onChange={(event) => updateTemplate('location', event.target.value)}
                placeholder="Location"
              />
              <select
                className="rounded-md border p-2 text-sm"
                value={activeTemplate.employmentType}
                onChange={(event) =>
                  updateTemplate(
                    'employmentType',
                    event.target.value as Template['employmentType'],
                  )
                }
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
              <div className="grid grid-cols-3 gap-2 lg:col-span-2">
                <input
                  className="rounded-md border p-2 text-sm"
                  value={activeTemplate.salaryMin}
                  onChange={(event) => updateTemplate('salaryMin', event.target.value)}
                  placeholder="Min"
                />
                <input
                  className="rounded-md border p-2 text-sm"
                  value={activeTemplate.salaryMax}
                  onChange={(event) => updateTemplate('salaryMax', event.target.value)}
                  placeholder="Max"
                />
                <select
                  className="rounded-md border p-2 text-sm"
                  value={activeTemplate.currency}
                  onChange={(event) =>
                    updateTemplate('currency', event.target.value as Template['currency'])
                  }
                >
                  <option>USD</option>
                  <option>HKD</option>
                </select>
              </div>
              <label className="text-sm lg:col-span-2">
                <input
                  type="checkbox"
                  checked={activeTemplate.showSalary}
                  onChange={(event) => updateTemplate('showSalary', event.target.checked)}
                />{' '}
                Show salary range publicly
              </label>
              <textarea
                className="rounded-md border p-2 text-sm lg:col-span-2"
                rows={4}
                value={activeTemplate.description}
                onChange={(event) => updateTemplate('description', event.target.value)}
                placeholder="Job Description"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium">Requirements</p>
                <div className="space-y-1 text-xs text-slate-600">
                  {activeTemplate.requirements.map((item, index) => (
                    <p key={item}>{index + 1}. {item}</p>
                  ))}
                </div>
                <div className="mt-2 flex gap-1">
                  <input
                    className="flex-1 rounded border px-2 py-1 text-xs"
                    value={listDraft.req}
                    onChange={(event) =>
                      setListDraft((prev) => ({ ...prev, req: event.target.value }))
                    }
                    placeholder="Add item"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!listDraft.req.trim()) return
                      updateTemplate('requirements', [...activeTemplate.requirements, listDraft.req.trim()])
                      setListDraft((prev) => ({ ...prev, req: '' }))
                    }}
                    className="rounded border px-2 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium">Nice to Have</p>
                <div className="space-y-1 text-xs text-slate-600">
                  {activeTemplate.niceToHave.map((item, index) => (
                    <p key={item}>{index + 1}. {item}</p>
                  ))}
                </div>
                <div className="mt-2 flex gap-1">
                  <input
                    className="flex-1 rounded border px-2 py-1 text-xs"
                    value={listDraft.plus}
                    onChange={(event) =>
                      setListDraft((prev) => ({ ...prev, plus: event.target.value }))
                    }
                    placeholder="Add item"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!listDraft.plus.trim()) return
                      updateTemplate('niceToHave', [...activeTemplate.niceToHave, listDraft.plus.trim()])
                      setListDraft((prev) => ({ ...prev, plus: '' }))
                    }}
                    className="rounded border px-2 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium">Benefits</p>
                <div className="space-y-1 text-xs text-slate-600">
                  {activeTemplate.benefits.map((item, index) => (
                    <p key={item}>{index + 1}. {item}</p>
                  ))}
                </div>
                <div className="mt-2 flex gap-1">
                  <input
                    className="flex-1 rounded border px-2 py-1 text-xs"
                    value={listDraft.benefit}
                    onChange={(event) =>
                      setListDraft((prev) => ({ ...prev, benefit: event.target.value }))
                    }
                    placeholder="Add item"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!listDraft.benefit.trim()) return
                      updateTemplate('benefits', [...activeTemplate.benefits, listDraft.benefit.trim()])
                      setListDraft((prev) => ({ ...prev, benefit: '' }))
                    }}
                    className="rounded border px-2 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pushToast('info', 'AI generated JD draft (mock)')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
              >
                AI Generate
              </button>
              <button
                type="button"
                onClick={() => pushToast('info', 'AI suggested improvements (mock)')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
              >
                AI Improve
              </button>
            </div>
          </SectionCard>
        )}

        {activeSection === 'team' && (
          <SectionCard
            title="Team & Permissions"
            subtitle="Invite teammates and assign role-based access."
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Invite Member
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-2">{member.name}</td>
                      <td className="px-3 py-2">{member.email}</td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded border px-2 py-1 text-xs"
                          value={member.role}
                          onChange={(event) =>
                            setMembers((prev) =>
                              prev.map((item) =>
                                item.id === member.id ? { ...item, role: event.target.value } : item,
                              ),
                            )
                          }
                        >
                          <option>Admin</option>
                          <option>Hiring Manager</option>
                          <option>Interviewer</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">{member.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {activeSection === 'integrations' && (
          <SectionCard
            title="Integrations"
            subtitle="Connect calendars, hiring channels, and communication tools."
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {integrations.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.connected ? `Last sync: ${item.lastSync}` : 'Not connected'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setIntegrations((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  connected: !row.connected,
                                  lastSync: row.connected ? '-' : 'just now',
                                }
                              : row,
                          ),
                        )
                      }
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        item.connected
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeSection === 'privacy' && (
          <SectionCard
            title="Data & Privacy"
            subtitle="Manage retention policy, candidate deletion requests, and consent options."
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => pushToast('success', 'Export started (mock CSV/JSON)')}
                className="rounded-lg border border-slate-300 p-3 text-left text-sm"
              >
                Export All Data
              </button>
              <select
                className="rounded-lg border border-slate-300 p-3 text-sm"
                value={retention}
                onChange={(event) => setRetention(event.target.value)}
              >
                <option>30 days</option>
                <option>90 days</option>
                <option>180 days</option>
                <option>1 year</option>
                <option>Forever</option>
              </select>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-800">Delete Candidate Data</p>
              <input
                className="w-full rounded-md border p-2 text-sm"
                value={deleteQuery}
                onChange={(event) => setDeleteQuery(event.target.value)}
                placeholder="Search candidate by name"
              />
              <div className="space-y-1">
                {matchedCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between rounded bg-slate-50 px-2 py-1"
                  >
                    <p className="text-xs text-slate-700">{candidate.name}</p>
                    <button
                      type="button"
                      onClick={() => pushToast('info', `Deletion request logged for ${candidate.name}`)}
                      className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {!matchedCandidates.length && deleteQuery.trim() && (
                  <p className="text-xs text-slate-500">No candidate found.</p>
                )}
              </div>
            </div>

            <textarea
              rows={5}
              className="w-full rounded-md border p-2 text-sm"
              value={privacyNotice}
              onChange={(event) => setPrivacyNotice(event.target.value)}
            />
            <label className="text-sm text-slate-700">
              <input
                type="checkbox"
                checked={requireConsent}
                onChange={(event) => setRequireConsent(event.target.checked)}
              />{' '}
              Require candidate consent before submission
            </label>

            <button
              type="button"
              className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600"
            >
              Delete Account
            </button>
          </SectionCard>
        )}
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Interview Email Preview"
        maxWidthClass="max-w-2xl"
      >
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          {previewMail}
        </pre>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
        <div className="space-y-3">
          <input className="w-full rounded-md border p-2 text-sm" placeholder="Email address" />
          <select className="w-full rounded-md border p-2 text-sm">
            <option>Hiring Manager</option>
            <option>Interviewer</option>
            <option>Admin</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setMembers((prev) => [
                ...prev,
                {
                  id: `u-${prev.length + 1}`,
                  name: `Member ${prev.length + 1}`,
                  email: `member${prev.length + 1}@nexalabs.com`,
                  role: 'Hiring Manager',
                  status: 'Invited',
                },
              ])
              setInviteOpen(false)
              pushToast('success', 'Invitation sent')
            }}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Send Invite
          </button>
        </div>
      </Modal>
    </div>
  )
}
