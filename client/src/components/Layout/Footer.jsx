import { Link } from "react-router-dom";

const navLinks = [
  { to: "/about", label: "About" },
  { to: "/products", label: "Shop" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const socials = [
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor">
        <path d="M18.9 2H22l-6.8 7.8L23 22h-6.5l-4.5-5.9L6.4 22H3.3l7.3-8.3L1 2h6.6l4.1 5.4L18.9 2zm-1.1 18h1.8L6.3 3.9H4.4L17.8 20z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
        <path d="M23 12.2s0-3.4-.4-5c-.2-1-.9-1.7-1.8-1.9C19 5 12 5 12 5s-7 0-8.8.3c-1 .2-1.6.9-1.8 1.9C1 8.8 1 12.2 1 12.2s0 3.4.4 5c.2 1 .9 1.7 1.8 1.9C5 19.4 12 19.4 12 19.4s7 0 8.8-.3c1-.2 1.6-.9 1.8-1.9.4-1.6.4-5 .4-5zM9.8 15.5v-6.6l5.8 3.3-5.8 3.3z" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
        <path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.2-.1-.8-.2-2 0-2.9.2-.8 1.3-5.4 1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.6 2-2.6.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.5-.3 1.1.5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3.1 0-5 2.3-5 4.8 0 .9.3 1.5.7 2 .1.1.1.2.1.3l-.3 1c0 .1-.2.2-.3.1-1.3-.6-1.9-2.1-1.9-3.8 0-2.8 2.4-6.2 7.1-6.2 3.8 0 6.3 2.7 6.3 5.7 0 3.9-2.2 6.8-5.4 6.8-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2-1.3 2.7.9.3 2 .4 3 .4 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
      </svg>
    ),
  },
];

// Shared presentational footer mounted by App after every route. Router Links avoid
// a full browser reload while navigating customer pages.
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-24 overflow-hidden border-t border-white/50 bg-white/25 backdrop-blur-md dark:bg-white/[.02]">
      <div className="ambient-orb -left-20 bottom-0 h-48 w-48 opacity-40" />
      <div className="ambient-orb -right-16 top-0 h-40 w-40 opacity-30" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-14 md:px-8 md:py-16">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <p className="font-display text-3xl font-semibold tracking-tight text-ink">
              LUMERA
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone">
              A luminous edit of objects for everyday living. Elevated design,
              joyful details, and pieces you will keep reaching for.
            </p>

            {/* Social icons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="glass-card group flex h-11 w-11 items-center justify-center rounded-xl text-stone transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-3 md:col-start-7">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-stone transition hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact blurb */}
          <div className="md:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
              Stay close
            </p>
            <p className="mt-4 text-sm leading-relaxed text-stone">
              Questions about an order or a piece? We&apos;re here.
            </p>
            <a
              href="mailto:hello@lumera.shop"
              className="mt-3 inline-block text-sm font-medium text-ink transition hover:text-primary"
            >
              hello@lumera.shop
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-3 border-t border-ink/10 pt-6 text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} LUMERA. All rights reserved.</p>
          <div className="flex gap-5">
            <span className="transition hover:text-ink">Privacy</span>
            <span className="transition hover:text-ink">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
