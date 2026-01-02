# GitStuff 🐱

**GitStuff** is a easy GitHub follower management tool. Identify unfollowers, track growth, and protect your social circle.

## ✨ Features

- **Follower Tracking**: See who unfollowed you or followed you back instantly.
- **Whitelist (Shield)**: Protect specific users from being flagged as "unfollowed".
- **Supporter Tier**: Unlock unlimited whitelists and advanced tracking.
- **Privacy First**: Your data stays yours, synced via Better Auth & PostgreSQL.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **Database**: PostgreSQL + Prisma
- **Auth**: Better Auth (GitHub OAuth)
- **State**: Zustand with Persistence
- **UI**: Tailwind CSS 4 + shadcn/ui

## 🚀 Getting Started

### Prerequisites

- Node.js & pnpm
- PostgreSQL database
- GitHub OAuth App credentials

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/raptr45/gitstuff.git
   cd gitstuff
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env` file with the following:

   ```env
   DATABASE_URL=postgresql://...
   GITHUB_CLIENT_ID=your_id
   GITHUB_CLIENT_SECRET=your_secret
   BETTER_AUTH_SECRET=your_secret
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Initialize database:**

   ```bash
   pnpm prisma migrate dev
   ```

5. **Run development server:**
   ```bash
   pnpm dev
   ```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
