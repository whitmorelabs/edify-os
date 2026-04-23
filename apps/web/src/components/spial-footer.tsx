import Link from "next/link";

export default function SpialFooter() {
  return (
    <footer
      className="py-[60px] pb-5 text-sm"
      style={{
        background: "var(--bg-0)",
        color: "var(--fg-2)",
        borderTop: "1px solid var(--line-1)",
      }}
    >
      <div className="spial-container">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-10">
          {/* Brand */}
          <div>
            <h4
              className="text-xs font-semibold mb-5 uppercase tracking-[0.14em]"
              style={{ color: "var(--brand-tint)" }}
            >
              Edify OS
            </h4>
            <p className="leading-[1.6]" style={{ color: "var(--fg-3)" }}>
              AI-powered team members built for nonprofits. Six directors working
              around the clock so you can focus on what only you can do: leading.
            </p>
            <p className="mt-4 text-xs" style={{ color: "var(--fg-4)" }}>
              Built by{" "}
              <a
                href="https://edifyanother.com"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:underline"
                style={{ color: "var(--brand-tint)" }}
              >
                Edify
              </a>{" "}
              — a creative impact studio in Beaufort, SC.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="text-xs font-semibold mb-5 uppercase tracking-[0.14em]"
              style={{ color: "var(--brand-tint)" }}
            >
              Product
            </h4>
            <ul className="list-none">
              {[
                { label: "Features", href: "/features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Demo", href: "/demo" },
                { label: "Integrations", href: "/integrations-page" },
              ].map((l) => (
                <li key={l.label} className="mb-3">
                  <Link
                    href={l.href}
                    className="no-underline transition-colors duration-300"
                    style={{ color: "var(--fg-3)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-xs font-semibold mb-5 uppercase tracking-[0.14em]"
              style={{ color: "var(--brand-tint)" }}
            >
              Company
            </h4>
            <ul className="list-none">
              {[
                { label: "About Us", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Contact", href: "/contact" },
              ].map((l) => (
                <li key={l.label} className="mb-3">
                  <Link
                    href={l.href}
                    className="no-underline transition-colors duration-300"
                    style={{ color: "var(--fg-3)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mb-3">
                <a
                  href="https://edifyanother.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline transition-colors duration-300"
                  style={{ color: "var(--fg-3)" }}
                >
                  Edify Studio
                </a>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h4
              className="text-xs font-semibold mb-5 uppercase tracking-[0.14em]"
              style={{ color: "var(--brand-tint)" }}
            >
              Get in Touch
            </h4>
            <ul className="list-none">
              <li className="mb-3">
                <a
                  href="mailto:connect@edifyanother.com"
                  className="no-underline transition-colors duration-300"
                  style={{ color: "var(--fg-3)" }}
                >
                  connect@edifyanother.com
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="tel:+18439294185"
                  className="no-underline transition-colors duration-300"
                  style={{ color: "var(--fg-3)" }}
                >
                  (843) 929-4185
                </a>
              </li>
              <li className="mb-3" style={{ color: "var(--fg-3)" }}>
                500 Carteret St, Beaufort, SC 29902
              </li>
              <li className="mb-3">
                <Link
                  href="/demo"
                  className="no-underline transition-colors duration-300"
                  style={{ color: "var(--fg-3)" }}
                >
                  See the Demo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-[30px] flex flex-col md:flex-row justify-between items-center flex-wrap gap-5"
          style={{ borderTop: "1px solid var(--line-1)" }}
        >
          <div
            className="text-center md:text-left font-mono text-xs"
            style={{ color: "var(--fg-4)" }}
          >
            © 2026 EDIFY · STORIES MATTER
          </div>
          <div className="flex gap-5">
            {[
              { label: "Facebook", href: "https://facebook.com/edifyanother" },
              { label: "Instagram", href: "https://instagram.com/edifyanother" },
              { label: "YouTube", href: "https://youtube.com/@edifyanother" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline transition-colors duration-300"
                style={{ color: "var(--fg-3)" }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex gap-5">
            <a
              href="/legal/privacy"
              className="no-underline transition-colors duration-300"
              style={{ color: "var(--fg-3)" }}
            >
              Privacy Policy
            </a>
            <a
              href="/legal/terms"
              className="no-underline transition-colors duration-300"
              style={{ color: "var(--fg-3)" }}
            >
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
