import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="page-shell">
      <div className="ambient-orb left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 animate-drift" />

      <div className="h-16" aria-hidden="true" />

      <main className="relative z-10 mx-auto flex min-h-[75vh] w-full max-w-6xl flex-col items-start justify-center px-6 pb-24 md:px-8">
        <p className="animate-fade-in font-display text-[clamp(6rem,22vw,14rem)] font-bold leading-none tracking-tight text-ink/[0.06]">
          404
        </p>

        <div className="-mt-10 md:-mt-16">
          <p className="animate-fade-up text-xs uppercase tracking-[0.28em] text-accent">
            Page missing
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
            This page drifted off the map.
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-md text-lg text-stone">
            The link may be outdated, or the page was moved. Let’s get you back
            to something solid.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/" className="btn-primary">
              Back home
            </Link>
            <Link to="/products" className="btn-ghost">
              Browse products
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
