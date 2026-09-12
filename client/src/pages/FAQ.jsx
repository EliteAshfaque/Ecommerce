import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Most orders ship within 2 business days. Standard delivery arrives in 3–6 days depending on your location. You’ll receive tracking as soon as your parcel leaves our studio.",
  },
  {
    q: "What is your return policy?",
    a: "Unworn items can be returned within 14 days of delivery. Start a return from your Orders page — we’ll email a prepaid label where available.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes. International shipping is available to selected regions at checkout. Duties and taxes may apply based on your country’s customs rules.",
  },
  {
    q: "How do I track my order?",
    a: "After checkout, use Orders in your account for live status. Tracking details are also emailed once the carrier scans your package.",
  },
  {
    q: "Can I change or cancel an order?",
    a: "If your order hasn’t shipped yet, contact us as soon as possible and we’ll help adjust or cancel it. Once it’s in transit, we’ll guide you through a return instead.",
  },
  {
    q: "Are products made to last?",
    a: "We design for longevity — quality materials, considered construction, and finishes meant to improve with use rather than wear out quickly.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="page-shell">
      <div className="ambient-orb left-1/3 top-16 h-64 w-64 animate-drift opacity-80" />

      <div className="h-16" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8">
        <section className="max-w-3xl pb-14 pt-10 md:pb-20 md:pt-16">
          <p className="animate-fade-up text-xs uppercase tracking-[0.28em] text-accent">
            Support
          </p>
          <h1 className="animate-fade-up-delay mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Questions,
            <br />
            answered.
          </h1>
          <p className="animate-fade-up-delay-2 mt-6 max-w-xl text-lg text-stone">
            Clear answers about shipping, returns, and how LUMERA works — so you
            can shop with confidence.
          </p>
        </section>

        <section className="mx-auto max-w-3xl border-t border-ink/10">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q} className="border-b border-ink/10">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left transition"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-lg font-medium tracking-tight md:text-xl">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-stone transition duration-300 ${
                      isOpen ? "rotate-180 text-accent" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl text-base leading-relaxed text-stone">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mx-auto mt-20 max-w-3xl pb-8">
          <p className="text-stone">Still need help?</p>
          <Link to="/contact" className="mt-4 btn-primary">
            Contact support
          </Link>
        </section>
      </main>

    </div>
  );
};

export default FAQ;
