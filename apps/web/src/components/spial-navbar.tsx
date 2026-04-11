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

            {/* Hamburger / Close toggle */}
            <button
              className="flex text-white bg-transparent border-none cursor-pointer"
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

      {/* Full-screen overlay menu */}
      <div
        className={`fixed inset-0 z-[999] bg-[#1a2b32] flex flex-col transition-all duration-300 ease-in-out ${
          mobileOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
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
          <button
            className="w-full py-3 rounded-full border border-white bg-transparent text-white text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-white/10"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </button>
        </div>
      </div>
    </>
  );
}
