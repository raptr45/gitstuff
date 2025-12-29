import { LoginForm } from "@/components/login-form";
import { Heart, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Brand Story */}
        <div className="hidden lg:flex flex-col gap-8 pr-12">
          <div className="space-y-4">
            <h2 className="text-5xl font-black tracking-tightest leading-tight text-zinc-900 dark:text-zinc-50">
              Master your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 italic">
                GitHub Circle.
              </span>
            </h2>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed">
              The only platform that gives you real-time intelligence on your
              followers with a premium, focused experience.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex gap-4 items-start p-4 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm ring-1 ring-zinc-500/10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-zinc-100">
                  Smart Shielding
                </h4>
                <p className="text-sm text-zinc-500 font-medium">
                  Protect your most valued connections from accidental tracking
                  metrics.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm ring-1 ring-zinc-500/10">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-zinc-100">
                  Instant Unfollow
                </h4>
                <p className="text-sm text-zinc-500 font-medium">
                  Clean up your non-reciprocal connections with a single
                  authenticated tap.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-zinc-400 font-bold text-sm uppercase tracking-widest">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            Trusted by premium developers
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-500/10 ring-1 ring-zinc-500/10 backdrop-blur-xl relative overflow-hidden">
            {/* Card detail */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
