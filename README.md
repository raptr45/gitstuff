# GitStuff 🐱

**GitStuff** is a powerful yet simple tool to track your GitHub followers. It helps you identify who unfollowed you, track new followers, and manage your social circle on GitHub with ease.

## ✨ Features

- **Follower Tracking**: Instantly see who unfollowed you and who followed you back since your last visit.
- **Whitelisting**: Mark specific users as "safe" to prevent them from appearing in your unfollow lists (e.g., bots or friends).
- **Smart Sync**: Automatically keeps your profile data in sync with GitHub.
- **Privacy First**: All history tracking is local or user-controlled. You can delete all your data with one click.
- **Dark Mode**: Fully supported dark/light themes for a comfortable viewing experience.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database**: PostgreSQL (via [Prisma](https://www.prisma.io/))
- **Authentication**: [better-auth](https://better-auth.com/) (GitHub OAuth)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with persistence

## 🚀 Getting Started

### Prerequisites

- Node.js & pnpm
- PostgreSQL database
- GitHub OAuth App credentials

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/gitstuff.git
    cd gitstuff
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="postgresql://..."
    GITHUB_CLIENT_ID="your_client_id"
    GITHUB_CLIENT_SECRET="your_client_secret"
    BETTER_AUTH_SECRET="your_auth_secret"
    BETTER_AUTH_URL="http://localhost:3000"
    ```

4.  **Initialize the database:**
    ```bash
    pnpm prisma generate
    pnpm prisma db push
    ```

5.  **Run the development server:**
    ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🧪 Running Tests

Run the test suite using Vitest:

```bash
pnpm test
```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
