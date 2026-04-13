import Link from "next/link";

export default function SpialFooter() {
  return (
    <footer className="bg-[#1a2b32] text-white py-[60px] pb-5 text-sm">
      <div className="spial-container">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-10">
          {/* Brand */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">Edify OS</h4>
            <p className="leading-[1.6] text-white/70">
              AI-powered team members built for nonprofits. Six directors working around the clock so you can focus on what only you can do: leading.
            </p>
            <p className="mt-4 text-white/50 text-xs">
              Built by{" "}
              <a
                href="https://edifyanother.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B5CF6] no-underline hover:underline"
              >
                Edify
              </a>{" "}
              -- a creative impact studio in Beaufort, SC.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">Product</h4>
            <ul className="list-none">
              <li className="mb-3">
                <Link
                  href="/features"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  Features
                </Link>
              </li>
              <li className="mb-3">
                <Link
                  href="/pricing"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  Pricing
                </Link>
              </li>
              <li className="mb-3">
                <Link
                  href="/demo"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  Demo
                </Link>
              </li>
              <li className="mb-3">
                <Link
                  href="/integrations-page"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">Company</h4>
            <ul className="list-none">
              <li className="mb-3">
                <Link
                  href="/about"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  About Us
                </Link>
              </li>
              <li className="mb-3">
                <Link
                  href="/blog"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  Blog
                </Link>
              </li>
              <li className="mb-3">
                <Link
                  href="/contact"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  Contact
                </Link>
              </li>
              <li className="mb-3">
                <a
                  href="https://edifyanother.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  Edify Studio
                </a>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">
              Get in Touch
            </h4>
            <ul className="list-none">
              <li className="mb-3">
                <a
                  href="mailto:connect@edifyanother.com"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  connect@edifyanother.com
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="tel:+18439294185"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  (843) 929-4185
                </a>
              </li>
              <li className="mb-3 text-white/70">
                500 Carteret St, Beaufort, SC 29902
              </li>
              <li className="mb-3">
                <Link
                  href="/demo"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
                >
                  See the Demo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-white/10 pt-[30px] flex flex-col md:flex-row justify-between items-center flex-wrap gap-5">
          <div className="text-center md:text-left text-white/50">
            &copy; 2026 Edify OS. Built by{" "}
            <a
              href="https://edifyanother.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B5CF6] no-underline hover:underline"
            >
              Edify
            </a>
            .
          </div>
          <div className="flex gap-5">
            <a
              href="https://facebook.com/edifyanother"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com/edifyanother"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
            >
              Instagram
            </a>
            <a
              href="https://youtube.com/@edifyanother"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
            >
              YouTube
            </a>
          </div>
          <div className="flex gap-5">
            <a
              href="/legal/privacy"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
            >
              Privacy Policy
            </a>
            <a
              href="/legal/terms"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#8B5CF6]"
            >
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
