"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "About us", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "Blogs", href: "/#blogs" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Integrations", href: "/#integrations" },
  { label: "Contact us", href: "/#contact" },
];

export default function SpialNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
              SPIAL
            </Link>

            {/* Desktop inline nav links (xl and above) */}
            <nav className="hidden xl:flex items-center gap-8">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-white text-sm font-normal no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  {l.label}
                </Link>
              ))}
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

      {/* Half-screen side panel (slides in from right) */}
      <div
        className={`fixed top-0 right-0 h-full w-1/2 z-[999] bg-[#1a2b32] flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.3)] border-l border-white/10 transition-transform duration-300 ease-in-out xl:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Spacer for the sticky header */}
        <div className="pt-[72px]" />

        {/* Nav links — centered vertically in available space */}
        <nav className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-white text-lg font-medium uppercase tracking-wide no-underline py-3 transition-colors duration-300 hover:text-[#d2b4fe]"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Get Started button at bottom */}
        <div className="px-6 pb-10">
          <Link
            href="/signup"
            className="block w-full py-3 rounded-full border border-white text-white text-base font-medium text-center no-underline transition-colors duration-300 hover:bg-white/10"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}
