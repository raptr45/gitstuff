# GitStuff 🐱

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

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

## 📂 Project Structure

```text
├── app/              # Next.js App Router & API routes
├── components/       # Shadcn UI & custom components
├── lib/              # Utilities (Auth, DB, Utils)
├── prisma/           # Database schema
├── public/           # Static assets
└── package.json      # Project dependencies
```

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

6. **Run tests:**
   ```bash
   pnpm test
   ```

## 🚢 Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new).

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add your environment variables (`DATABASE_URL`, `GITHUB_CLIENT_ID`, etc.).
4. Click **Deploy**.

## 🤝 Contributing

Contributions are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
