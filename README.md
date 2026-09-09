# Sabi Learn

AI-powered personalized learning platform. Generate structured courses, explanatory videos, and practice quizzes tailored to how you learn best.

**Live:** [sabilearn.online](https://sabilearn.online)

---

## Features

- **Instant Course Generation** — Type any topic and get a structured, multi-module course in seconds
- **AI Explanatory Videos** — Transform concepts into visual slideshows with narration *(beta)*
- **Practice Quizzes** — Auto-generated multiple choice, true/false, and fill-in-the-blank questions
- **AI Tutor** — Ask anything and get answers adapted to your level and learning style
- **Document Analysis** — Upload PDFs and documents to generate courses and quizzes from your own material
- **Billing** — Website: Paystack. iOS/Android: App Store / Google Play In-App Purchases (RevenueCat)

## Project Structure

```
sabilearn/
├── frontend/   # Next.js user-facing application
└── admin/      # Next.js admin dashboard
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion, GSAP |
| Database | MongoDB |
| Auth | Firebase + JWT |
| AI | DeepSeek API |
| Payments | Paystack (web), RevenueCat + IAP (mobile) |
| Storage | Cloudflare R2 (with local fallback) |
| Video | Remotion |

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/installation)
- MongoDB instance (local or Atlas)
- DeepSeek API key
- Paystack account
- Firebase project

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in your environment variables (see below)
pnpm install
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Admin

```bash
cd admin
cp .env .env.local
# Fill in your environment variables
pnpm install
pnpm dev
```

Opens at [http://localhost:3001](http://localhost:3001) (or the next available port).

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local` and fill in the values:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name |
| `JWT_SECRET` | Long random secret for signing tokens |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI features |
| `DEEPSEEK_MODEL` | DeepSeek model for text generation |
| `DEEPSEEK_VISION_MODEL` | DeepSeek model for vision/document tasks |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `PAYSTACK_CALLBACK_URL` | URL Paystack redirects to after payment |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `CLOUDFLARE_R2_*` | Cloudflare R2 credentials *(optional, falls back to local disk)* |

The admin app requires its own `.env.local` with `MONGODB_URI`, `MONGODB_DB`, and `JWT_SECRET`.

### Seed Admin User

```bash
# POST /api/auth/seed
# Creates the initial admin account (run once, then disable the route)
```

## Database Indexes

```bash
cd frontend
pnpm db:indexes
```

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

MIT — see [LICENSE](./LICENSE) for details.
