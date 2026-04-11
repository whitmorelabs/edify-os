"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

function Placeholder({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-[#e5e5e5] rounded-xl flex items-center justify-center ${className}`}
    />
  );
}

export default function SpialNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { label: "About us", href: "/#about" },
    { label: "Features", href: "/#features" },
    { label: "Blogs", href: "/#blogs" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Integrations", href: "/#integrations" },
    { label: "Contact us", href: "/#contact" },
  ];

  return (
    <header className="bg-[#1a2b32] py-5 sticky top-0 z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
      <div className="spial-container">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-white flex items-center gap-2.5 no-underline"
          >
            <Placeholder className="h-8 w-8 !rounded-md" />
            SPIAL
          </Link>

          {/* Desktop nav */}
          <nav
            className={`${
              mobileOpen
                ? "flex flex-col absolute top-[60px] left-0 right-0 bg-[#1a2b32] p-5 gap-4 md:static md:flex-row md:p-0 md:gap-[30px] md:ml-10 md:flex-1 md:items-center"
                : "hidden md:flex"
            } md:flex md:gap-[30px] md:items-center md:flex-1 md:ml-10`}
          >
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-white text-sm no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA button */}
          <button className="spial-btn hidden md:inline-flex">
            Get Started
          </button>

          {/* Hamburger */}
          <button
            className="flex md:hidden text-white"
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
  );
}
