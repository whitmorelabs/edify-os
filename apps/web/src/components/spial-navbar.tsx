"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

const archetypes = [
  { label: "Development Director", href: "/agents/development-director" },
  { label: "Marketing Director", href: "/agents/marketing-director" },
  { label: "Executive Assistant", href: "/agents/executive-assistant" },
  { label: "Programs Director", href: "/agents/programs-director" },
  { label: "HR & Volunteer Coordinator", href: "/agents/hr-volunteer-coordinator" },
  { label: "Events Director", href: "/agents/events-director" },
];

const links = [
  { label: "About", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "Demo", href: "/demo" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function SpialNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  return (
    <>
      <header className="bg-[#1a2b32] py-5 sticky top-0 z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
        <div className="spial-container">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold text-white flex items-center gap-2.5 no-underline"
            >
              Edify OS
            </Link>

            {/* Desktop inline nav links (xl and above) */}
            <nav className="hidden xl:flex items-center gap-8">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-white text-sm font-normal no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  {l.label}
                </Link>
              ))}

              {/* Your AI Team dropdown */}
              <div className="relative" onMouseLeave={() => setTeamOpen(false)}>
                <button
                  className="text-white text-sm font-normal flex items-center gap-1 cursor-pointer transition-colors duration-300 hover:text-[#8B5CF6] bg-transparent border-0 font-[inherit]"
                  onMouseEnter={() => setTeamOpen(true)}
                  onClick={() => setTeamOpen(!teamOpen)}
                >
                  Your AI Team
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {teamOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a2b32] border border-white/10 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.3)] py-2 z-[1001]">
                    {archetypes.map((a) => (
                      <Link
                        key={a.label}
                        href={a.href}
                        className="block px-4 py-2.5 text-sm text-white/80 no-underline transition-colors duration-200 hover:text-[#8B5CF6] hover:bg-white/5"
                        onClick={() => setTeamOpen(false)}
                      >
                        {a.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/signup" className="spial-btn no-underline">
                Get Started
              </Link>
            </nav>

            {/* Hamburger / Close toggle (below xl) */}
            <button
              className="flex xl:hidden text-white cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop overlay (click to close) */}
      <div
        className={`fixed inset-0 z-[998] bg-black/50 transition-opacity duration-300 xl:hidden ${
          mobileOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drop-down panel from top */}
      <div
        className={`fixed top-0 left-0 w-full z-[999] bg-[#1a2b32] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-b border-white/10 transition-transform duration-300 ease-in-out xl:hidden ${
          mobileOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Spacer for the sticky header */}
        <div className="pt-[72px]" />

        {/* Nav links */}
        <nav className="flex flex-col items-center gap-2 px-6 py-8">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-white text-lg font-medium uppercase tracking-wide no-underline py-3 transition-colors duration-300 hover:text-[#8B5CF6]"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="w-full border-t border-white/10 mt-2 pt-4">
            <p className="text-white/40 text-xs uppercase tracking-wider text-center mb-3">Your AI Team</p>
            {archetypes.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="block text-white/70 text-base font-normal text-center no-underline py-2 transition-colors duration-300 hover:text-[#8B5CF6]"
                onClick={() => setMobileOpen(false)}
              >
                {a.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Get Started button */}
        <div className="px-6 pb-8">
          <Link
            href="/signup"
            className="block w-full py-3 rounded-full border border-white/30 text-white text-base font-medium text-center no-underline transition-colors duration-300 hover:bg-white/10"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}
