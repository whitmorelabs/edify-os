import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#1a2b32]">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f1f26] relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Edify OS</span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.2]">
              Your nonprofit just hired an AI leadership team.
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              Six AI directors. Deep expertise. Proactive check-ins. Brief them on your mission and watch what they build.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/10 border border-white/10 p-4">
                <p className="text-2xl font-bold text-[#8B5CF6]">6</p>
                <p className="text-sm text-white/60">AI Directors</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/10 p-4">
                <p className="text-2xl font-bold text-[#8B5CF6]">24/7</p>
                <p className="text-sm text-white/60">Always On</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/10 p-4">
                <p className="text-2xl font-bold text-[#8B5CF6]">BYOK</p>
                <p className="text-sm text-white/60">Your API Key</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {[
                "Grant research and donor cultivation",
                "Marketing campaigns and content",
                "Proactive heartbeat check-ins",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/40">
            Built for nonprofits by Edify, Beaufort SC.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-[#1a2b32]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Edify OS</span>
            </Link>
          </div>
          {/* Card */}
          <div className="bg-[#243b44] rounded-2xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
