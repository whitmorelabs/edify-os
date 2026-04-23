import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg-1">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-bg-plum-1 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(159,78,243,0.15),transparent_70%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-fg-1">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Sparkles className="h-4 w-4 text-[var(--fg-on-purple)]" />
            </div>
            <span className="text-lg font-semibold text-fg-1">Edify OS</span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-semibold tracking-tight leading-[1.2]">
              Your nonprofit just hired an AI leadership team.
            </h1>
            <p className="mt-4 text-lg text-fg-2 leading-relaxed">
              Six AI directors. Deep expertise. Proactive check-ins. Brief them on your mission and watch what they build.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-bg-2 shadow-elev-1 p-4">
                <p className="text-2xl font-semibold text-brand-500">6</p>
                <p className="text-sm text-fg-3">AI directors</p>
              </div>
              <div className="rounded-xl bg-bg-2 shadow-elev-1 p-4">
                <p className="text-2xl font-semibold text-brand-500">24/7</p>
                <p className="text-sm text-fg-3">Always on</p>
              </div>
              <div className="rounded-xl bg-bg-2 shadow-elev-1 p-4">
                <p className="text-2xl font-semibold text-brand-500">BYOK</p>
                <p className="text-sm text-fg-3">Your API key</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {[
                "Grant research and donor cultivation",
                "Marketing campaigns and content",
                "Proactive heartbeat check-ins",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-fg-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-fg-4">
            Built for nonprofits by Edify, Beaufort SC.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-bg-1">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <Sparkles className="h-4 w-4 text-[var(--fg-on-purple)]" />
              </div>
              <span className="text-lg font-semibold text-fg-1">Edify OS</span>
            </Link>
          </div>
          {/* Card */}
          <div className="bg-bg-2 shadow-elev-3 rounded-2xl p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
