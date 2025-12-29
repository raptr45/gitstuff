import { LoginForm } from "@/components/login-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-500/10 ring-1 ring-zinc-500/10 backdrop-blur-xl relative overflow-hidden">
        <LoginForm />
      </div>
    </div>
  );
}
