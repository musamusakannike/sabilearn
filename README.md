# SabiLearn Monorepo

> **"Learn a skill. Sabi it for life."**  
> An AI-powered, mobile-first learning ecosystem tailored for ambitious learners and university students (with dedicated Unilorin SWEP practice). Combines structured courses, interactive chapter exercises, flashcards, MCQs, an in-browser code playground, multi-timeframe XP leaderboards, and AI study assistants.

**Live Web App:** [sabilearn.online](https://sabilearn.online) • [sabilearn.com](https://sabilearn.com)  
**API Endpoint:** [api.sabilearn.online/api/v1](https://api.sabilearn.online/api/v1)

---

## 🏛️ Project Architecture & Monorepo Structure

```text
synapse/
├── frontend/     # Next.js 16 (React 19) Web Application & Admin Dashboard
├── mobile/       # Expo SDK 57 (React Native 0.86) iOS & Android Native App
└── server/       # Express 5 & Node.js REST API Server with MongoDB & Cron Scheduler
```

---

## ✨ Features by Subsystem

### 📱 1. Mobile App (`mobile/`)
Built with **React Native 0.86**, **Expo SDK 57**, and **Expo Router** with a premium glassmorphic UI, haptic feedback, and offline resiliency:
- **Authentication & Onboarding**:
  - Email/Password sign up & login
  - Native Google Sign-In (`@react-native-google-signin/google-signin`)
  - Apple Authentication (`expo-apple-authentication`)
  - Password reset and secure JWT session management via `expo-secure-store`
- **Dashboard & Learning Resumption**:
  - Resumption cards to pick up incomplete topics or flashcards where you stopped
  - Daily study streaks, XP counter, and streak status alerts
  - Quick-action shortcuts to AI Study Tools, Saved Courses, and Code Playground
- **Course Exploration & Interactive Learning**:
  - Browse courses by level and category (Free vs. Premium)
  - Chapter & topic navigation with completion tracking
  - Topic reading modes with formatted text and syntax highlighting
  - Interactive multiple-choice quizzes (MCQs) with instant answer explanations
  - Interactive flip flashcards with "known" / "review again" tracking
  - Chapter-level assessments and exercises
- **AI Study Assistant (DeepSeek)**:
  - **Text Summarizer**: Condense lengthy lecture notes or concepts
  - **AI Quiz Generator**: Generate custom quizzes from any topic or study note
  - **AI Flashcard Generator**: Produce flashcard decks from user prompts
  - **Q&A Tutor**: Instant contextual answers to tricky study questions
  - AI Quiz history and session review
- **Community & Gamification**:
  - Competitive XP leaderboard across 24 hours, 3 days, 1 week, and 1 month
  - Milestone celebrations with haptics and confetti cannon
- **In-App Purchases & Monetization**:
  - Native Mobile IAP via **RevenueCat** (`react-native-purchases`) for App Store & Google Play
  - Paystack payment gateway callback support for subscriptions and course unlocks
  - App Store Review Guard (`/api/v1/app-review/status`) for smooth App Store approvals
- **Notifications & Profile Management**:
  - Push notifications via **Expo Notifications** for daily study reminders and streak risks
  - Avatar image picker and upload to Cloudflare R2 / S3
  - Study reminder preference settings and account deletion

---

### 💻 2. Frontend Web Application (`frontend/`)
Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Framer Motion**, and **GSAP**:
- **Public Experience & SEO**:
  - High-converting landing page with modern typography, smooth scroll animations (Lenis), testimonials, and interactive pricing
  - Fully indexed Blog (`/blog`) with category filters, search, and JSON-LD structured data
  - Dedicated **SWEP 2026 Past Questions & Workshop Practice Hub** (`/swep`) for University of Ilorin engineering students
- **Web Student Dashboard (`/dashboard`)**:
  - Resumption dashboard with progress metrics, weekly study time, accuracy tracking, and streak counts
  - Course directory and dedicated course viewer with markdown rendering and syntax highlighting
  - Chapter exercise modal and topic test modules
  - Standalone AI Tools dialogs (Summarizer, Quiz Generator, Flashcard Generator, Q&A Assistant)
  - Dedicated AI Quiz practice runner (`/dashboard/ai/quiz/[id]`)
  - Global XP Leaderboard (`/dashboard/leaderboard`) with timeframe filtering
  - In-browser multi-language **Code Playground** (`/dashboard/playground`) supporting HTML, CSS, JavaScript, and Python
  - User profile settings, avatar management, and subscription checkout
- **Integrated Admin Dashboard (`/dashboard/admin`)**:
  - Course, chapter, topic, and exercise management (creation, reordering, publishing)
  - User management and privilege controls
  - Blog post authoring, editing, and publishing
  - Push announcement dispatcher and scheduled broadcast management
  - Mobile App Store Review configuration toggle (`inReview`, review version, hidden components)

---

### ⚙️ 3. Backend API Server (`server/`)
Built with **Express 5**, **Node.js**, **TypeScript**, and **MongoDB (Mongoose)**:
- **Authentication & Security**:
  - JWT authentication with secure password hashing (`bcryptjs`)
  - Firebase Admin integration for verifying Google and Apple identity tokens
  - Helmet security headers, CORS origin whitelisting, and Morgan logging
- **Core APIs (`/api/v1`)**:
  - `/auth`: Registration, login, Google/Apple OAuth, password resets, token refresh
  - `/courses`, `/chapters`, `/topics`: Hierarchical course catalog with access-control guards
  - `/mcqs` & `/flashcards`: Interactive study content querying and submission endpoints
  - `/progress`: Granular user analytics, session logging, topic completion, and resumption state
  - `/leaderboard`: Aggregated XP leaderboards across multiple time intervals
  - `/ai`: DeepSeek API integration with prompt engineering for summaries, quizzes, flashcards, and Q&A (with generation history)
  - `/payments`: Paystack checkout & recurring subscriptions, Paystack raw-body webhook signature verification, and RevenueCat mobile IAP webhook sync
  - `/notifications`: In-app notification center and Expo push token registration
  - `/media`: Cloudflare R2 / AWS S3 presigned asset uploads (with local disk fallback)
  - `/blog`: Headless blog articles with category tagging and search
  - `/app-review`: Remote feature flag engine for Apple/Google app store review compliance
  - `/admin`: Administrative analytics, content management, and user auditing
- **Automated Background Jobs (`node-cron`)**:
  - Timezone-aware daily study reminders (dispatched via Expo push)
  - Streak lapse cleanup and streak preservation alerts
  - Scheduled broadcast notification delivery

---

## 🛠️ Tech Stack Matrix

| Area | Technologies |
|---|---|
| **Mobile** | React Native 0.86, Expo SDK 57, Expo Router, TypeScript, Tabler Icons, Reanimated, RevenueCat |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, GSAP, Lenis, Recharts, Zustand |
| **Backend** | Express 5, Node.js, TypeScript, Mongoose 9 / MongoDB 7, Firebase Admin |
| **AI Integration** | DeepSeek API (`deepseek-chat`) |
| **Payments** | Paystack (Web & Mobile Redirects) + RevenueCat (iOS & Android In-App Purchases) |
| **Storage & Media**| Cloudflare R2 (S3-compatible API) with fallback storage |
| **Push & Emails**  | Expo Server SDK, Resend, Nodemailer (SMTP fallback) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & [pnpm](https://pnpm.io/installation) (or npm)
- MongoDB instance (local or Atlas)
- DeepSeek API key
- Firebase Service Account (for Firebase Auth)
- Paystack & RevenueCat credentials (for billing)

---

### 1. Server Setup

```bash
cd server
cp .env.example .env
# Configure MONGODB_URI, JWT_SECRET, DEEPSEEK_API_KEY, PAYSTACK_SECRET_KEY, etc.
npm install
npm run dev
```
Runs at `http://localhost:5000`. Test health at `http://localhost:5000/health`.

---

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
pnpm install
pnpm dev
```
Runs at `http://localhost:3000`.

---

### 3. Mobile Setup

```bash
cd mobile
# Ensure dependencies are installed
npm install

# Start development bundler
npx expo start

# Or launch on target platforms
npm run android
npm run ios
```

---

## 📦 Key NPM / PNPM Scripts

### Server
- `npm run dev`: Start development server with hot-reload via `tsx watch`
- `npm run build`: Compile TypeScript into `dist/`
- `npm run seed`: Seed initial database courses and content
- `npm run seed:aiml` / `npm run seed:git`: Seed specific learning modules

### Frontend
- `pnpm dev`: Start Next.js development server
- `pnpm build`: Build production Next.js application
- `pnpm lint`: Run ESLint checks

### Mobile
- `npm run start`: Start Expo dev server
- `npm run android`: Run on Android device or emulator
- `npm run ios`: Run on iOS simulator

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.
