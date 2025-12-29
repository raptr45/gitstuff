"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Cat, Github } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const handleGithubLogin = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 animate-in zoom-in duration-500">
            <Cat className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
              Welcome to <span className="italic">gitstuff</span> 🐱
            </h1>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest opacity-60">
              The premium follower intelligence platform
            </p>
          </div>
        </div>

        <Field className="space-y-4">
          <Button
            onClick={handleGithubLogin}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] gap-3"
          >
            <Github className="w-6 h-6" />
            Continue with GitHub
          </Button>
          <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-8 leading-relaxed">
            Protect your circle. By proceeding, you agree to our premium
            connection integrity standards.
          </p>
        </Field>
      </FieldGroup>
    </div>
  );
}
