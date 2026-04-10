import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">Edify OS</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Hire your AI team in minutes.
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Your nonprofit gets a Director of Development, Marketing Director,
              and Executive Assistant — all powered by AI, all working for you.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-white/70">AI Leaders</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-white/70">Subagents</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-white/70">Always On</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/50">
            Trusted by 500+ nonprofit organizations
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
