import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import SectionLabel from "@/components/section-label";

export const metadata = {
  title: "Contact | Edify OS",
  description: "Get in touch with the Edify team. We are in Beaufort, SC and we are happy to talk through whether Edify OS is the right fit for your organization.",
};

export default function ContactPage() {
  return (
    <div className="spial-page">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-[#1a2b32] py-20">
        <div className="spial-container mx-auto text-center">
          <SectionLabel text="Contact" />
          <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5">
            Let&apos;s talk.
          </h1>
          <p className="text-white/80 text-lg leading-[1.7] max-w-[700px] mx-auto">
            We are a small team in Beaufort, SC. We take every conversation seriously. Tell us about your organization and we&apos;ll be honest about whether Edify OS is a good fit.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-start">
            {/* Contact Info */}
            <div>
              <h2 className="text-[28px] font-medium text-black mb-6">Get in touch</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider mb-2">Email</h3>
                  <a href="mailto:connect@edifyanother.com" className="text-lg text-[#333] no-underline hover:text-[#8B5CF6] transition-colors">
                    connect@edifyanother.com
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider mb-2">Phone</h3>
                  <a href="tel:+18439294185" className="text-lg text-[#333] no-underline hover:text-[#8B5CF6] transition-colors">
                    (843) 929-4185
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider mb-2">Location</h3>
                  <p className="text-lg text-[#333]">
                    500 Carteret St<br />
                    Beaufort, SC 29902
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider mb-2">Social</h3>
                  <div className="flex gap-5">
                    <a
                      href="https://facebook.com/edifyanother"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#333] no-underline hover:text-[#8B5CF6] transition-colors font-medium"
                    >
                      Facebook
                    </a>
                    <a
                      href="https://instagram.com/edifyanother"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#333] no-underline hover:text-[#8B5CF6] transition-colors font-medium"
                    >
                      Instagram
                    </a>
                    <a
                      href="https://youtube.com/@edifyanother"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#333] no-underline hover:text-[#8B5CF6] transition-colors font-medium"
                    >
                      YouTube
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-white p-7 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#e5e5e5]">
                <h3 className="font-semibold text-black mb-3">Edify Studio</h3>
                <p className="text-[#666] text-sm leading-[1.7]">
                  Edify OS is built by Edify, a creative impact studio that makes cinematic films and immersive XR/VR for nonprofits. We have been embedded in the nonprofit world for years. We build what we build because we have sat across the table from the people it serves.
                </p>
                <a
                  href="https://edifyanother.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-[#8B5CF6] no-underline hover:underline font-medium"
                >
                  Visit edifyanother.com
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-10">
              <h2 className="text-[24px] font-medium text-black mb-2">Send us a message</h2>
              <p className="text-[#666] text-sm mb-8">We usually respond within one business day.</p>
              <form className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#333] mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-sm text-[#333] outline-none focus:border-[#8B5CF6] transition-colors placeholder-[#aaa]"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#333] mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="jane@yourorg.org"
                    className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-sm text-[#333] outline-none focus:border-[#8B5CF6] transition-colors placeholder-[#aaa]"
                  />
                </div>
                <div>
                  <label htmlFor="org" className="block text-sm font-medium text-[#333] mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    id="org"
                    placeholder="Community Youth Alliance"
                    className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-sm text-[#333] outline-none focus:border-[#8B5CF6] transition-colors placeholder-[#aaa]"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#333] mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us about your organization and what you are hoping to solve..."
                    className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-sm text-[#333] outline-none focus:border-[#8B5CF6] transition-colors placeholder-[#aaa] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="spial-btn w-full justify-center"
                >
                  Send Message
                </button>
                <p className="text-xs text-[#aaa] text-center">
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
