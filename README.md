<p align="center">
  <img src="docs/logo.svg" alt="Versus Logo" width="80" height="80" />
</p>

<h1 align="center">Versus</h1>

<p align="center">
  <strong>Polls that settle it.</strong><br/>
  Create a poll in seconds, share a link, and watch your group decide in real time.
</p>

<p align="center">
  <a href="https://versus.saumyagrawal.in">
    <img src="https://img.shields.io/badge/live-versus.saumyagrawal.in-0a0a0a?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9Ijk2IiBmaWxsPSIjMGEwYTBhIi8+PHRleHQgeD0iMjU2IiB5PSIzMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMjgwIiBmb250LXdlaWdodD0iODAwIiBmaWxsPSIjZmFmYWZhIiBsZXR0ZXItc3BhY2luZz0iLTEwIj52L3M8L3RleHQ+PC9zdmc+" alt="Live Site" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
</p>

---

Versus is a full-stack survey/poll platform. No sign-up is required to create or vote - just share a link and collect answers. Authenticated users get a dashboard, view live analytics, and full control over their polls.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Why I Built It This Way](#why-i-built-it-this-way)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Application Flow](#application-flow)
- [API Reference](#api-reference)
- [Real-Time Events](#real-time-events)
- [Future Improvements](#future-improvements)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite 8, React Router 7 | SPA with client-side routing |
|  **Styling** | Tailwind CSS v4, Geist Sans | oklch color system, Vercel's typeface |
|  **Backend** | Express 5, TypeScript | REST API + WebSocket server |
|  **Database** | MongoDB, Mongoose ODM | Document store with aggregation pipelines |
|  **Auth** | better-auth | Google + GitHub OAuth (cookie sessions) |
|  **Real-time** | Socket.io | WebSocket rooms per poll for live updates |
|  **Validation** | Zod | Shared schemas between frontend and backend |
|  **Charts** | Recharts | Bar charts, donut charts, sparklines |
|  **Icons** | Lucide React | Consistent icon set |
|  **Monorepo** | pnpm workspaces | Shared package across apps |

---

## Features

- **Instant poll creation** — no account required. Fill a form, get a shareable link.
- **Two modes** — anonymous polls (anyone votes, IP+UA fingerprint dedup) or authenticated polls (OAuth login, one vote per account).
- **Multi-step creation flow** — edit → review (preview as respondents see it) → go public. Drafts auto-save.
- **Custom slugs** — optional vanity URLs like `/vs/team-lunch` instead of random share IDs.
- **Anonymous creator support** — get a one-time admin key to manage your poll without an account. Claim it later by signing in.
- **Live analytics dashboard** — response momentum chart, device/platform breakdown, per-question bar charts, consensus indicators, completion rate, activity feed. All update in real time via Socket.io.
- **Adaptive time bucketing** — analytics charts auto-adjust granularity: per-minute for fresh polls, per-hour after 6 hours, per-day after 48 hours.
- **Duplicate prevention** — database-level unique indexes for both auth (poll + user) and anonymous (poll + fingerprint) responses. Can't be bypassed by replaying requests.
- **FOMO toasts** — optional "Someone just voted!" notifications for poll viewers to drive engagement.
- **Poll lifecycle** — draft → active → expired/closed → published. Auto-expiry on page visit. Publish is irreversible.
- **Rate limiting** — per-IP throttling on create, respond, and read endpoints.
- **Shared validation** — Zod schemas in a shared workspace package, used by both frontend and backend.
- **Real-time everywhere** — Socket.io rooms per poll. New votes, poll closures, publishes, and deletes broadcast instantly to all viewers.

---

## Project Structure

```
versus/
├── apps/
│   ├── backend/                        # Express API server
│   │   └── src/
│   │       ├── common/
│   │       │   ├── config/
│   │       │   │   ├── auth.ts             # better-auth (Google + GitHub OAuth)
│   │       │   │   └── env.ts              # Environment variable loader
│   │       │   ├── database/
│   │       │   │   └── mongoose.ts         # MongoDB connection
│   │       │   ├── middleware/
│   │       │   │   ├── auth.middleware.ts   # requireAuth / optionalAuth
│   │       │   │   ├── rateLimiter.middleware.ts
│   │       │   │   └── validate.middleware.ts
│   │       │   ├── models/
│   │       │   │   ├── poll.model.ts       # Poll + Question + Option schemas
│   │       │   │   └── response.model.ts   # Response + Answer + device schemas
│   │       │   └── utils/
│   │       │       ├── fingerprint.ts      # IP + UA hash for anon
│   │       │       └── response.ts         # sendSuccess / ApiError helpers
│   │       ├── modules/
│   │       │   ├── socket/index.ts         # Socket.io init + room management
│   │       │   └── vs/
│   │       │       ├── vs.controller.ts    # All business logic
│   │       │       └── vs.routes.ts        # Route definitions
│   │       ├── types/express.d.ts          # Request augmentation
│   │       ├── app.ts                      # Express app setup
│   │       ├── routes.ts                   # Route wiring
│   │       └── server.ts                   # HTTP + Socket.io bootstrap
│   │
│   └── frontend/                       # React SPA
│       ├── public/                     # Favicons, PWA manifest, icons
│       └── src/
│           ├── components/layout/      # Navbar, RootLayout, ProtectedRoute
│           ├── hooks/                  # useAuth, useSocket
│           ├── lib/                    # api client, auth client, socket instance
│           ├── pages/
│           │   ├── Landing.tsx         # Hero 
│           │   ├── Login.tsx           # Google + GitHub OAuth
│           │   ├── Dashboard.tsx       # Poll list, filters, stats
│           │   ├── CreatePoll.tsx      # Multi-step form (Edit > Review > Go Public)
│           │   ├── PollPage.tsx        # Public respond / results page
│           │   ├── Analytics.tsx       # Live charts, device breakdown, activity feed
│           │   └── NotFound.tsx        # 404
│           ├── App.tsx                 # Route definitions
│           ├── main.tsx                # Entry 
│           └── index.css               
│
├── packages/
│   └── shared/                         # @versus/shared
│       └── src/
│           ├── constants/errorCodes.ts # Standardized error codes
│           ├── types/                  # Poll, Response, Analytics, API types
│           ├── validators/             # Zod schemas (createPoll, submitResponse, etc.)
│           └── index.ts                # Barrel export
│
└── docs/                               # README assets
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | >= 20 |
| pnpm | >= 10 |
| MongoDB | Local or Atlas |
| Google OAuth credentials | [console.cloud.google.com](https://console.cloud.google.com) |
| GitHub OAuth credentials | [github.com/settings/developers](https://github.com/settings/developers) |

### Install & Run

```bash
# 1. Clone and install
git clone https://github.com/idreamfyrei/versus.git
cd versus
pnpm install

# 2. Build the shared package (backend + frontend depend on it)
cd packages/shared && pnpm build && cd ../..

# 3. Set up environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.development
# Edit both .env files with your values (see table below)

# 4. Start development servers (in separate terminals)
cd apps/backend && pnpm dev     # Express on :8000
cd apps/frontend && pnpm dev    # Vite on :5173 (proxies /api to :8000)
```

### Environment Variables

#### Backend (`apps/backend/.env`)

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `PORT` | | Express server port | `8000` |
| `NODE_ENV` | | Environment mode | `development` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/versus` |
| `CLIENT_URL` | Yes | Frontend origin (CORS + auth redirects) | `http://localhost:5173` |
| `BETTER_AUTH_SECRET` | Yes | Auth encryption key (32+ chars) | Random string |
| `BETTER_AUTH_URL` | Yes | Server base URL | `http://localhost:8000` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | From Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret | From Cloud Console |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app ID | From Developer Settings |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app secret | From Developer Settings |

> **Important:** `BETTER_AUTH_URL` must be the **base server URL** (e.g. `https://localhost:${port}`)

#### Frontend (`apps/frontend/.env.development`)

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `VITE_API_URL` | Yes | Backend URL for auth client | `http://localhost:8000` |

---

### OAuth Callback URLs

| Provider | Callback URL |
|----------|-------------|
| Google | `http://localhost:8000/api/auth/callback/google` |
| GitHub | `http://localhost:8000/api/auth/callback/github` |

---

## Why I Built It This Way

Building Versus meant making a lot of "this or that" calls under hackathon pressure. Here's what I considered, what I tried, and why I landed to what is being done.

### Auth: better-auth with OAuth only (no email/password)

I wanted sign-in to be fast and frictionless. Email/password means building a signup form, email verification, password reset flow, and dealing with weak passwords - that's a lot of surface area for a tool where half the users never need an account at all.

**What I considered:**
- **NextAuth / Auth.js** - tightly coupled to Next.js. We're on Express + Vite, so it'd be swimming upstream.
- **Clerk / Auth0** - managed auth services. Great DX, but adds an external dependency
- **better-auth** - lightweight, framework-agnostic, first-class MongoDB adapter, social providers work out of the box with a few lines of config.

I went with better-auth. Two OAuth providers (Google + GitHub) cover the audience, and it slots cleanly into Express without fighting the framework. Accounts are created on first login automatically - no signup form needed.

### Database: MongoDB over SQL

Polls have variable numbers of questions, each with variable numbers of options. In SQL, that's three normalized tables (`polls`, `questions`, `options`) with JOINs on every read. In MongoDB, it's one document with embedded subdocuments - a single read gives you the whole poll.

**What I considered:**
- **PostgreSQL + Prisma** - typed, relational, great for structured data. But polls are inherently document-shaped, and the analytics aggregation pipeline in MongoDB is hard to beat for the kind of group-by-unwind queries I run.

MongoDB also gave us the aggregation framework for analytics (unwind answers, group by question/option, compute percentages) in a single pipeline instead of multiple SQL queries with window functions.

### Anonymous polls: admin key vs. requiring auth

The whole point of Versus is that anyone can create a poll in seconds. Requiring login first kills that. But anonymous polls still need some way for the creator to manage them (activate, close, publish).

**What I considered:**
- **Magic links / email-based ownership** - send a management link to an email. But then we need an email input, a sending service, and what if they mistype?
- **Browser localStorage tokens** - store a secret in the browser. Works until they clear cookies or switch devices. Too fragile.
- **Admin key (nanoid)** - generate a 32-character key, hash it server-side, show it once. The creator copies it. Simple, stateless, works across devices.

The admin key approach is the most honest: "here's your key, save it or lose it." No email infrastructure, no cookie dependency. And if they later sign in, they can **claim** the poll by proving they have the key - bridging the anonymous and authenticated worlds.

### Duplicate prevention: fingerprint hashing vs. cookies vs. IP-only

Anonymous polls can't use user IDs to prevent double-voting. I needed something else.

**What I considered:**
- **IP address only** -- everyone behind a university/office NAT shares one IP. Would block entire buildings from voting after one person.
- **Browser cookies** - easily cleared. Open incognito, vote again. No real protection.
- **Device fingerprinting libraries (FingerprintJS)** - accurate but heavyweight, adds a client-side dependency, and raises privacy concerns.
- **IP + User-Agent hash** - combines network identity with browser identity. Not bulletproof (same browser on same network = same fingerprint), but good enough to stop casual double-voting without adding client-side libraries.

I hash `IP + User-Agent` with SHA-256 server-side. It's a single line of code, no client dependency, and stops the "let me just submit again" impulse. Determined users can still circumvent it (VPN + different browser), but that's an acceptable tradeoff for a poll tool.

### Real-time: full state broadcast vs. delta updates

When someone votes, the analytics dashboard should update instantly. The question is what to send over the socket.

**What I considered:**
- **Delta updates** - send only what changed ("option X got +1"). Smaller payload, but clients need merge logic. If a client misses a message or joins mid-stream, their state drifts. Need a reconciliation mechanism.
- **Full summary broadcast** - recompute the entire summary server-side, send the whole thing. Clients just replace their state. No merge, no drift, no edge cases.

I went with full broadcast. The summary payload for a poll with 5 questions and 4 options each is maybe 2KB - trivial over WebSocket. The simplicity of "server is always right, client always replaces" eliminated an entire class of bugs around stale state and missed events.

### Monorepo: pnpm workspaces

I planned the entire skeleton first — types and validations — to prevent myself from getting overwhelmed by the shared package setup.

### Analytics: adaptive time bucketing

Server-side adaptive bucketing based on poll age: under 6 hours = per minute, under 48 hours = per hour, over 48 hours = per day. Keeps payloads small and charts readable at any poll age.

---

## Architecture & Design Decisions

### Duplicate prevention

| Poll Type | Strategy | Index |
|-----------|----------|-------|
| **Authenticated** | One response per `(poll, respondent)` pair | Unique compound, sparse |
| **Anonymous** | SHA-256 hash of `IP + User-Agent` | Unique compound on `(poll, fingerprint)`, sparse |

### Poll lifecycle

```
┌───────┐   activate   ┌────────┐   expires/close   ┌─────────────────┐   publish   ┌───────────┐
│ Draft │ ────────────> │ Active │ ────────────────> │ Expired / Closed │ ──────────> │ Published │
└───────┘               └────────┘                   └─────────────────┘             └───────────┘
  editable           accepting votes              creator sees results           everyone sees results
                                                                                    (irreversible)
```

Auto-expiry: when a `GET` request hits an active poll past its `expiresAt`, the server atomically updates it to `expired`.

### Analytics dashboard

The creator-only analytics page (`/vs/:id/analytics`) updates live via Socket.io.

| Section | What it shows |
|---------|---------------|
| Overview cards | Total responses, unique views, completion rate, responses/hour. Counter pulses on new votes. |
| Response momentum | Area chart of vote volume over time with adaptive time bucketing. Displays peak time. |
| Device breakdown | Donut chart of mobile/desktop/tablet split, parsed from User-Agent via `ua-parser-js`. |
| Question breakdown | Horizontal bar charts per question with vote counts, percentages, and consensus indicators (clear winner / tight race / split). |
| Question engagement | Progress bars showing answer rate for optional (non-mandatory) questions. |
| Platform breakdown | Browser and OS distribution across respondents. |
| Activity feed | Rolling list of last 20 events, live-updated with fade-in animation. |
| Creator actions | Copy link, close poll, publish results (irreversible), delete. All broadcast via Socket.io. |

### Frontend design system

| Feature | Implementation |
|---------|---------------|
| Color system | Tailwind v4 with oklch color space |
| Typography | Geist Sans via `@fontsource` |
| Card depth | Gradients + colored borders + inset light highlights |
| Landing cards | 3D parallax tilt (CSS `perspective` + `rotateX/Y` on mousemove) |
| Animations | CSS `@keyframes`: slide-up, bar growth, counter pulse, shimmer |
| Toasts | Sonner for errors and FOMO vote notifications |

---

## Application Flow

### Creating a Poll

```
User fills form (title, questions, options, settings)
    │
    ├─ Logged in ──> POST /api/vs ──> Poll saved as draft (tied to account)
    │                                   │
    │                                   ▼
    │                            Review screen (preview as respondent sees it)
    │                                   │
    │                            PATCH /api/vs/:id/activate ──> Status: active
    │
    └─ Anonymous ──> POST /api/vs ──> Poll saved as draft + admin key returned
                                       │
                                       ▼
                                "Save this key!" warning
                                       │
                                PATCH /api/vs/:id/activate (key in body) ──> active
```

### Responding to a Poll

```
Visitor opens /vs/:slugOrId
    │
    ├─ Active + auth required + not logged in ──> "Log in to respond" banner
    │
    ├─ Active + already responded ──> "Already responded" + live percentages
    │
    ├─ Active + can respond ──> Questions with radio buttons
    │       │
    │       └─ Submit ──> POST /api/vs/:slugOrId/respond
    │                       ├─ Validate mandatory questions
    │                       ├─ Check duplicate (auth or fingerprint)
    │                       ├─ Parse User-Agent → device info
    │                       ├─ Save response
    │                       └─ Emit Socket.io response:new to room
    │
    ├─ Expired / Closed ──> "Poll closed" + results (if published)
    │
    └─ Draft ──> 404
```

---

## API Reference

All routes prefixed with `/api/vs`. Auth via cookies (better-auth session).

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/` | optional | Create poll (auth'd = account, anon = returns admin key) |
| `GET` | `/` | required | List user's polls (dashboard) |
| `GET` | `/:slugOrId` | -- | Get poll by slug or shareId (increments views) |
| `PATCH` | `/:id` | required | Edit draft poll (draft status only) |
| `POST` | `/:slugOrId/respond` | optional | Submit response |
| `PATCH` | `/:id/activate` | optional | Draft -> active |
| `PATCH` | `/:id/close` | optional | Stop accepting responses |
| `PATCH` | `/:id/publish` | optional | Publish results (irreversible) |
| `DELETE` | `/:id` | required | Delete poll + all responses |
| `POST` | `/claim` | required | Claim anonymous poll with admin key |
| `GET` | `/:id/analytics` | required | Full analytics aggregation |

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| Create poll (`POST /`) | 3 req/min per IP |
| Submit response (`POST /:slugOrId/respond`) | 5 req/min per IP |
| Get poll (`GET /:slugOrId`) | 30 req/min per IP |

---

## Real-Time Events

Rooms scoped per poll: `vs:{pollId}`

| Event | Direction | Payload | Trigger |
|-------|:---------:|---------|---------|
| `join:poll` | Client -> Server | `{ pollId }` | Page opens |
| `leave:poll` | Client -> Server | `{ pollId }` | Page closes |
| `response:new` | Server -> Client | `{ totalResponses, questionSummaries }` | New vote |
| `poll:closed` | Server -> Client | `{ status }` | Creator closes |
| `poll:published` | Server -> Client | `{ status }` | Creator publishes |
| `poll:deleted` | Server -> Client | `{}` | Creator deletes |
| `toast:vote:updates` | Server -> Client | `{ message }` | FOMO toast (if enabled) |

---


## Future Improvements

| Feature | Description |
|---------|-------------|
| Email/password auth | Third sign-in option alongside Google and GitHub |
| Poll templates | Pre-built question sets (team lunch, sprint retro, event planning) |
| Scheduled activation | Create now, go live at a specific time |
| CSV/PDF export | Download analytics data for reporting |
| Embeddable polls | `<iframe>` snippet to embed on any website |
| Collaborative polls | Multiple creators/admins per poll |
| Rich question types | Ranking, text input, scale (1-10), image options |
| Notifications | Email or push alerts at response milestones |
| Poll branching | Conditional questions based on previous answers |
| Response comments | Optional text field for qualitative feedback |
| Poll comparison | Compare results across multiple polls side by side |

---
