# ZenFlow

ZenFlow is a responsive mental-wellness web application for guided breathing, grounding exercises, journaling, exposure-therapy planning, ambient audio, AI-assisted chat, and voluntary mantra practice.

The application combines a React/Vite interface with an Express API, Firebase Authentication and Firestore, MongoDB-backed mantra sessions, and Google Gemini-powered guidance.

> ZenFlow is a wellness and educational tool, not a substitute for a licensed mental-health professional or emergency services. If you or someone else may be in immediate danger, contact local emergency services.

## Features

- **Breathing and relief exercises** - 5-minute mindful breathing, box breathing, guided meditation, voice prompts, and calming visuals.
- **Crisis support mode** - A distraction-free panic-response flow with 4-7-8 breathing, 5-4-3-2-1 grounding, timed recovery guidance, audio controls, and SOS contact actions.
- **ZenBot chat** - Gemini-backed empathetic wellness support with local fallback responses when AI is unavailable.
- **Daily insights** - Resilience visualization, sleep/mood/caffeine logging, and a CBT-inspired exposure-step tracker.
- **Panic diary** - Create and delete reflective journal entries stored in Firestore.
- **Sanctuary library** - Searchable guided meditations and ambient tracks for focus, sleep, nature, and relaxation.
- **Spiritual mantra calm** - Predefined and custom mantras, configurable durations, repetition counting, breathing cadence, ambient audio, haptic feedback, completion reflections, and session history.
- **Personalization** - Persistent light/dark themes, accent colors, profile settings, emergency contacts, voice phrases, notifications, and privacy preferences.
- **Offline-friendly mantra logging** - Completed sessions are saved locally and queued for API synchronization when a backend connection is unavailable.
- **Dual persistence** - Firebase/Firestore for user profiles and therapy data, plus MongoDB for the authenticated mantra-session API.

## Technology Stack

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Animation | Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Frontend tooling | Vite 6, `@vitejs/plugin-react` |
| Authentication | Firebase Authentication |
| Cloud data | Firebase/Google Cloud Firestore |
| API | Express 4 |
| Session data | MongoDB and Mongoose 9 |
| AI | Google Gemini via `@google/genai` |
| Authentication tokens | JSON Web Tokens |
| Runtime | Node.js, `tsx` development runner |

## Application Structure

```text
src/
  App.tsx                 # Top-level providers, tabs, and crisis/settings routing
  main.tsx                # React entry point
  components/
    Navigation.tsx        # Top bar and bottom navigation
    UI.tsx                # Shared cards, buttons, and progress rings
  context/
    AppContext.tsx        # Authentication, profile, diary, exposure, and mantra state
    ThemeContext.tsx      # Theme and accent-color state
  screens/                # Home, relief, insights, therapy, library, chat, and settings
  services/               # Gemini, audio, and mantra-session services
  hooks/                  # Lifecycle-aware mantra-session timer
  backend/
    controllers/          # Mantra session REST handlers
    middleware/           # Bearer-token authentication
    models/               # Mongoose session schema
    routes/               # Mantra session routes
  lib/firebase.ts         # Firebase initialization and demo fallback
  data/mantras.ts         # Built-in mantra catalogue
server.ts                 # Express API and Vite/production server
firestore.rules           # Firestore owner-only access rules
firebase-blueprint.json   # Documented logical data model
```

## Prerequisites

- Node.js 20 or newer
- npm
- A Google/Firebase project for authentication and Firestore
- A MongoDB deployment for mantra-session persistence
- A Google Gemini API key for server-side AI responses

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill in the variables described below.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Environment Variables

### Gemini

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | For AI chat and mantra guidance | Server-side Gemini API access |

Without a Gemini key, ZenBot and mantra guidance return safe built-in fallback responses.

### Firebase Client

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | Recommended | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Recommended | Firebase authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Recommended | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase messaging sender |
| `VITE_FIREBASE_APP_ID` | Recommended | Firebase Web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Analytics measurement ID |
| `VITE_FIREBASE_DATABASE_ID` | Optional | Named Firestore database; defaults to `(default)` |

If the Firebase client variables are absent or invalid, the app uses a demo account and local/demo behavior where Firebase operations cannot be completed.

Enable the **Email/Password** and/or **Google** providers in Firebase Authentication. Add the application's local and deployed origins to the authorized domains.

### Backend Data and Authentication

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | For MongoDB mantra sessions | MongoDB connection string |
| `JWT_SECRET` | Production recommendation | Bearer-token verification for mantra APIs |
| `NODE_ENV` | Optional | Set to `production` for static production serving |
| `DISABLE_HMR` | Optional | Set to `true` to disable Vite HMR |

`JWT_SECRET` is not used to mint application tokens here; configure the identity provider that supplies a compatible bearer token for `/api/mantra/sessions`.

## Firebase and Firestore

Deploy the included rules with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

The rules give authenticated users owner-only access to:

```text
users/{userId}
users/{userId}/diary/{entryId}
users/{userId}/exposureSteps/{stepId}
users/{userId}/mantraSessions/{sessionId}
```

`firebase-blueprint.json` documents the logical entities and fields used by the application.

## API

The Express server runs on port `3000`.

### AI endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/gemini/chat` | Send a wellness chat message |
| `POST` | `/api/gemini/mantra-guidance` | Generate structured mantra-session guidance |

Chat requests accept `{ "input": "..." }`.

Mantra-guidance requests accept `selectedMantra`, `duration`, `userMood`, and `optionalUserIntent`.

### Mantra-session endpoints

All routes require the application's bearer authorization header.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/mantra/sessions` | Create a session |
| `GET` | `/api/mantra/sessions?limit=20&skip=0` | List the authenticated user's sessions |
| `GET` | `/api/mantra/sessions/:id` | Retrieve one owned session |
| `PATCH` | `/api/mantra/sessions/:id` | Update duration, status, mood, or reflection |

Mantra sessions support `completed`, `interrupted`, and `abandoned` statuses.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Express and Vite in development mode |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run build` | Build the Vite frontend and bundle `server.ts` |
| `npm start` | Run the production Express server from `dist/server.cjs` |
| `npm run preview` | Preview the Vite output |
| `npm run clean` | Remove the `dist` directory |

## Production Build

```bash
npm run build
npm start
```

Set `NODE_ENV=production` before starting the server. The Express process then serves the built frontend from `dist` and exposes the API on `http://localhost:3000`.

## Persistence and Fallback Behavior

- Firebase Authentication controls access to the frontend experience.
- Firestore stores profiles, diary entries, exposure steps, and local mantra session records.
- MongoDB/Mongoose stores server-side mantra sessions created through the REST API.
- Browser local storage retains theme, accent color, vitals, SOS contacts, voice settings, and the latest mantra session.
- If the API or MongoDB is unavailable, mantra completion is queued in `localStorage` and retried on the next app session.
- If Gemini or Firebase configuration is unavailable, the app provides demo/local fallbacks rather than failing the entire interface.

## Data and Privacy

ZenFlow can store personally meaningful wellness information, including diary entries, mood/vital data, contacts, and session reflections.

Before production use:

- Use real secrets and restrict API keys by environment and provider.
- Configure Firebase and Firestore rules for the production data model.
- Use verified Firebase ID-token validation or a complete JWT issuance/verification flow for protected APIs.
- Encrypt data in transit and at rest through managed providers.
- Establish retention, deletion, consent, and incident-response policies.
- Review third-party audio and image assets and external network usage.
- Add accessibility, crash, performance, and privacy/security testing.

## Safety Notice

The crisis flow provides grounding support, but it does not provide diagnosis or emergency dispatch. Build and configure a jurisdiction-appropriate emergency flow before presenting the app as a crisis-response service.
