export default function SpialFooter() {
  return (
    <footer className="bg-[#1a2b32] text-white py-[60px] pb-5 text-sm">
      <div className="spial-container">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 mb-10">
          {/* Brand */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">Spial</h4>
            <p className="leading-[1.6] text-white/70">
              Innovative SaaS solutions empowering businesses to thrive in the
              digital age. From custom platforms to seamless integrations, we
              transform your vision into reality.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">Product</h4>
            <ul className="list-none">
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Features
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Pricing
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Security
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">Company</h4>
            <ul className="list-none">
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  About Us
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Blog
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Careers
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Utilities */}
          <div>
            <h4 className="text-sm font-semibold mb-5 uppercase">Utilities</h4>
            <ul className="list-none">
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Resources
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Documentation
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  API Docs
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Support
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
                  href="mailto:hello@spial.com"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  hello@spial.com
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="tel:+1234567890"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  +1 (234) 567-890
                </a>
              </li>
              <li className="mb-3">
                <a
                  href="#"
                  className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
                >
                  Schedule Demo
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-white/10 pt-[30px] flex flex-col md:flex-row justify-between items-center flex-wrap gap-5">
          <div className="text-center md:text-left">
            &copy; 2025 Spial. Designed by Nixar. Powered by Webflow.
          </div>
          <div className="flex gap-5">
            <a
              href="#"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
            >
              Facebook
            </a>
            <a
              href="#"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
            >
              Instagram
            </a>
          </div>
          <div className="flex gap-5">
            <a
              href="#"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-white/70 no-underline transition-colors duration-300 hover:text-[#d2b4fe]"
            >
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
