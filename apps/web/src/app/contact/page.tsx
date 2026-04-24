import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button } from "@/components/ui";

export const metadata = {
  title: "Contact | Edify OS",
  description: "Get in touch with the Edify team. We are in Beaufort, SC and we are happy to talk through whether Edify OS is the right fit for your organization.",
};

export default function ContactPage() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Hero */}
      <section
        className="relative overflow-hidden py-28"
        style={{ background: "var(--hero-gradient-marketing), var(--bg-plum-1)" }}
      >
        <div className="spial-container mx-auto text-center relative z-10">
          <div className="eyebrow mb-4">Contact</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-6">
            Let&apos;s talk.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.75] max-w-[700px] mx-auto">
            We are a small team in Beaufort, SC. We take every conversation seriously. Tell us about your organization and we&apos;ll be honest about whether Edify OS is a good fit.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-28 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-start">
            {/* Contact Info */}
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.01em] text-fg-1 mb-6">Get in touch</h2>
              <div className="space-y-6">
                <div>
                  <div className="eyebrow mb-2">Email</div>
                  <a href="mailto:connect@edifyanother.com" className="text-lg text-fg-2 no-underline hover:text-brand-500 transition-colors">
                    connect@edifyanother.com
                  </a>
                </div>
                <div>
                  <div className="eyebrow mb-2">Phone</div>
                  <a href="tel:+18439294185" className="text-lg text-fg-2 no-underline hover:text-brand-500 transition-colors">
                    (843) 929-4185
                  </a>
                </div>
                <div>
                  <div className="eyebrow mb-2">Location</div>
                  <p className="text-lg text-fg-2">
                    500 Carteret St<br />
                    Beaufort, SC 29902
                  </p>
                </div>
                <div>
                  <div className="eyebrow mb-2">Social</div>
                  <div className="flex gap-5">
                    <a
                      href="https://facebook.com/edifyanother"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fg-2 no-underline hover:text-brand-500 transition-colors font-medium"
                    >
                      Facebook
                    </a>
                    <a
                      href="https://instagram.com/edifyanother"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fg-2 no-underline hover:text-brand-500 transition-colors font-medium"
                    >
                      Instagram
                    </a>
                    <a
                      href="https://youtube.com/@edifyanother"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fg-2 no-underline hover:text-brand-500 transition-colors font-medium"
                    >
                      YouTube
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-bg-2 shadow-elev-1 p-7 rounded-xl">
                <h3 className="font-semibold text-fg-1 mb-3">Edify Studio</h3>
                <p className="text-fg-3 text-sm leading-[1.7]">
                  Edify OS is built by Edify, a creative impact studio that makes cinematic films and immersive XR/VR for nonprofits. We have been embedded in the nonprofit world for years. We build what we build because we have sat across the table from the people it serves.
                </p>
                <a
                  href="https://edifyanother.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-brand-500 no-underline hover:underline font-medium"
                >
                  Visit edifyanother.com
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-bg-2 shadow-elev-2 rounded-2xl p-10">
              <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-fg-1 mb-2">Send us a message</h2>
              <p className="text-fg-3 text-sm mb-8">We usually respond within one business day.</p>
              <form className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wider text-fg-3 mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 rounded-lg border border-bg-3 bg-bg-3 text-sm text-fg-1 outline-none focus:border-brand-500 transition-colors placeholder:text-fg-4"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-fg-3 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="jane@yourorg.org"
                    className="w-full px-4 py-3 rounded-lg border border-bg-3 bg-bg-3 text-sm text-fg-1 outline-none focus:border-brand-500 transition-colors placeholder:text-fg-4"
                  />
                </div>
                <div>
                  <label htmlFor="org" className="block text-xs font-medium uppercase tracking-wider text-fg-3 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    id="org"
                    placeholder="Community Youth Alliance"
                    className="w-full px-4 py-3 rounded-lg border border-bg-3 bg-bg-3 text-sm text-fg-1 outline-none focus:border-brand-500 transition-colors placeholder:text-fg-4"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-xs font-medium uppercase tracking-wider text-fg-3 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us about your organization and what you are hoping to solve..."
                    className="w-full px-4 py-3 rounded-lg border border-bg-3 bg-bg-3 text-sm text-fg-1 outline-none focus:border-brand-500 transition-colors placeholder:text-fg-4 resize-none"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full justify-center">
                  Send message
                </Button>
                <p className="text-xs text-fg-4 text-center">
                  This form does not submit yet -- email us directly at connect@edifyanother.com
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
