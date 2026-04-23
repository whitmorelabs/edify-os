"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

const archetypes = [
  { label: "Executive Assistant", href: "/agents/executive-assistant" },
  { label: "Events Director", href: "/agents/events-director" },
  { label: "Development Director", href: "/agents/development-director" },
  { label: "Marketing Director", href: "/agents/marketing-director" },
  { label: "Programs Director", href: "/agents/programs-director" },
  { label: "HR & Volunteer Coordinator", href: "/agents/hr-volunteer-coordinator" },
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
      <header
        className="sticky top-0 z-[1000] py-4 border-b border-[var(--line-1)]"
        style={{
          background: "rgba(10,10,15,0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div className="spial-container">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link
              href="/"
              className="text-xl font-bold flex items-center gap-2.5 no-underline"
              style={{ color: "var(--fg-1)" }}
            >
              Edify
            </Link>

            {/* Desktop inline nav links (xl and above) */}
            <nav className="hidden xl:flex items-center gap-8">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm font-normal no-underline transition-colors duration-300"
                  style={{ color: "var(--fg-2)" }}
                >
                  {l.label}
                </Link>
              ))}

              {/* Your AI Team dropdown */}
              <div className="relative" onMouseLeave={() => setTeamOpen(false)}>
                <button
                  className="text-sm font-normal flex items-center gap-1 cursor-pointer transition-colors duration-300 bg-transparent border-0 font-[inherit]"
                  style={{ color: "var(--fg-2)" }}
                  onMouseEnter={() => setTeamOpen(true)}
                  onClick={() => setTeamOpen(!teamOpen)}
                >
                  Your AI Team
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {teamOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-64 rounded-lg py-2 z-[1001]"
                    style={{
                      background: "var(--bg-2)",
                      boxShadow: "var(--elev-3)",
                    }}
                  >
                    {archetypes.map((a) => (
                      <Link
                        key={a.label}
                        href={a.href}
                        className="block px-4 py-2.5 text-sm no-underline transition-colors duration-200 hover:bg-[var(--bg-3)]"
                        style={{ color: "var(--fg-2)" }}
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
              className="flex xl:hidden cursor-pointer"
              style={{ color: "var(--fg-1)" }}
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
        className={`fixed inset-0 z-[998] transition-opacity duration-300 xl:hidden ${
          mobileOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drop-down panel from top */}
      <div
        className={`fixed top-0 left-0 w-full z-[999] flex flex-col transition-transform duration-300 ease-in-out xl:hidden ${
          mobileOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{
          background: "var(--bg-1)",
          borderBottom: "1px solid var(--line-2)",
          boxShadow: "var(--elev-3)",
        }}
      >
        <div className="pt-[72px]" />
        <nav className="flex flex-col items-center gap-2 px-6 py-8">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-lg font-medium uppercase tracking-wide no-underline py-3 transition-colors duration-300"
              style={{ color: "var(--fg-1)" }}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 pb-8">
          <Link
            href="/signup"
            className="block w-full py-3 rounded-full text-base font-medium text-center no-underline transition-colors duration-300"
            style={{
              boxShadow: "inset 0 0 0 1px var(--line-2)",
              color: "var(--fg-1)",
            }}
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}
