# GitStuff 🐱

Identify unfollowers, track growth, and bulk manage your GitHub social circle.

## Features

- **Follower Tracking** — See who unfollowed you and who isn't following back
- **Bulk Follow / Unfollow** — Process hundreds of users in the background with live progress
- **Target Import** — Follow the followers or following list of any GitHub user
- **Whitelist / Shield** — Mark users as protected so they're never touched by bulk actions
- **Activity Feed** — Real-time background task tracker with auto-resume on page reload
- **Pro Tier** — Expanded limits for power users

## Stack

Next.js · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL · Better Auth · Zustand

## Getting Started

```bash
git clone https://github.com/raptr45/gitstuff.git
cd gitstuff
pnpm install
```

Copy `.env.example` to `.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gitstuff"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
BETTER_AUTH_SECRET="your_generated_secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

```bash
pnpm prisma migrate dev
pnpm db:generate
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Migrate database |
| `pnpm db:push` | Push database |
| `pnpm db:studio` | Open database studio |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |

## License

MIT
