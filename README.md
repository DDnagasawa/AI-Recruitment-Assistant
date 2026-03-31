# AI Recruitment Assistant

A lightweight AI hiring assistant SPA for small startups (CEO + no dedicated HR), focused on resume screening, interview operations, and hiring analytics.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Recharts (analytics charts)
- TanStack React Table (screening table)
- Framer Motion (UI transitions)
- React Router (real routes)
- Lucide React (icons)

## What Is Implemented

### Core Pages

- Dashboard (`/dashboard`)
  - KPI cards with animated counters
  - Position list with filters and status badges
  - Position actions: `View Candidates`, `Close Position`
  - Recent activity feed

- AI Resume Screening (`/screening`)
  - Position selector
  - Resume upload mock (drag/drop + progress)
  - AI analysis simulation and result refresh
  - Candidate filtering/sorting/search
  - Invite flow with confirmation modal
  - Candidate detail panel

- Hiring Analytics (`/analytics`)
  - Time range + position filters
  - Hiring funnel visualization
  - Time-to-hire charts
  - Source effectiveness comparison
  - Export report mock action

- Position Details (`/positions/:jobId`)
  - Role-level overview metrics
  - Candidate snapshot and quick invite actions
  - Recent role activity

- Settings (`/settings`)
  - 8 sections:
    - Profile & Company
    - AI Preferences
    - Interview & Scheduling
    - Notifications
    - Job Post Templates
    - Team & Permissions
    - Integrations
    - Data & Privacy
  - Advanced interactions include:
    - AI weight auto-balancing + ring visualization
    - Weekly availability interactive grid (drag to select)
    - Expandable notification rules
    - Template copy/delete + structured JD editing

## State & Data

- Global state uses `Context + useReducer`
- Mock datasets drive jobs, candidates, analytics, and activity stream
- Cross-page state linkage is implemented, e.g.:
  - Sending invite updates Dashboard metrics/activity
  - Uploading resumes updates candidate pool and related stats

## Project Structure

```text
src/
  components/
  context/
  data/
  pages/
  utils/
```

## Getting Started

```bash
npm install
npm run dev
```

Then open the local Vite URL (default: `http://localhost:5173`).

## Quality Checks

```bash
npm run lint
npm run build
```

Both commands pass on the current codebase.

## Notes

- This is a frontend mock/demo stage project.
- Upload, AI scoring, email sending, integrations, and exports are simulated.
- Backend APIs and real auth/email/calendar integrations are not yet connected.

## Next Suggested Steps

- Connect backend APIs (positions, candidates, invites, settings persistence)
- Add authentication/authorization and role-based route guards
- Persist settings and templates to server/database
- Add E2E tests for key hiring workflows
