<div align="center">
  <h1>GitStuff 🐱</h1>
  <p>
    <strong>Identify unfollowers, track growth, and protect your social circle.</strong>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <br />

  ![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-5.0-emerald?style=for-the-badge&logo=prisma&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-cyan?style=for-the-badge&logo=tailwindcss&logoColor=white)
</div>

<br />

## 📖 About

**GitStuff** is a powerful yet simple tool designed for developers who want to keep track of their GitHub connections. Whether you want to see who unfollowed you, find people you follow who don't follow back, or manage a "whitelist" of users to never flag, GitStuff has you covered.

Built with **privacy in mind**, your data stays yours, synced securely via Better Auth & PostgreSQL.

## ✨ Features

- 🕵️ **Follower Tracking**\
  Instantly identify who unfollowed you or who isn't following you back.

- 🛡️ **Whitelist System (Shield)**\
  Mark specific users as "safe" so they never appear in your unfollow lists (perfect for bot accounts or inactive friends).

- 💎 **Supporter Tier**\
  Unlock advanced features like unlimited whitelists and deeper analytics.

- 🔒 **Privacy First**\
  Secure authentication via GitHub OAuth. No shady data practices.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack enabled)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with Persistence
- **Testing**: [Vitest](https://vitest.dev/)

## � Getting Started

Follow these steps to get the project running locally.

### Prerequisites

Ensure you have the following installed:
- **Node.js**: `v20` or higher
- **Package Manager**: [pnpm](https://pnpm.io/) (Recommended)
- **Database**: PostgreSQL instance

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/raptr45/gitstuff.git
   cd gitstuff
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add the following keys:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/gitstuff"

   # Authentication (GitHub OAuth)
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"
   BETTER_AUTH_SECRET="your_generated_secret"
   BETTER_AUTH_URL="http://localhost:3000"

   # Public URL
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Initialize the database**
   ```bash
   pnpm prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   Visit `http://localhost:3000` to see the app in action.

## � Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server with Turbopack |
| `pnpm build` | Builds the application for production |
| `pnpm start` | Starts the production server |
| `pnpm lint` | Runs ESLint to check for code issues |
| `pnpm test` | Runs the Vitest test suite |
| `pnpm test:ui` | Opens the Vitest UI for interactive testing |

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
