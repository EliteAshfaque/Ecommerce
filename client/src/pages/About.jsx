import { Link } from "react-router-dom";

const values = [
  {
    title: "Material honesty",
    text: "We choose finishes and fabrics that age with intention, not disposable trends.",
  },
  {
    title: "Quiet utility",
    text: "Every piece earns its place — designed to work hard without visual noise.",
  },
  {
    title: "Lasting craft",
    text: "Small-batch partners, careful construction, and details you feel every day.",
  },
];

const About = () => {
  return (
    <div className="page-shell">
      <div className="ambient-orb -left-24 top-24 h-72 w-72 animate-drift" />
      <div className="ambient-orb right-0 top-80 h-80 w-80 opacity-70" />

      <div className="h-16" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8">
        <section className="grid min-h-[70vh] items-end gap-10 pb-16 pt-10 md:grid-cols-12 md:pb-24 md:pt-16">
          <div className="md:col-span-7">
            <p className="animate-fade-up text-xs uppercase tracking-[0.28em] text-accent">
              About LUMERA
            </p>
            <h1 className="animate-fade-up-delay mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-ink md:text-7xl">
              Design that
              <br />
              stays with you.
            </h1>
          </div>
          <div className="animate-fade-up-delay-2 md:col-span-5 md:pb-2">
            <p className="text-lg leading-relaxed text-stone md:text-xl">
              LUMERA is a modern commerce house for people who want fewer, better
              things — objects with presence, clarity, and a longer life.
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div
            className="h-[48vh] w-full bg-cover bg-center md:h-[58vh]"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(20,18,56,0.52), rgba(120,83,255,0.30)), url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80')",
            }}
          />
          <p className="mt-4 text-sm text-stone">
            Our studio language — calm rooms, tactile materials, lasting form.
          </p>
        </section>

        <section className="mt-24 grid gap-12 md:mt-32 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              What we believe
            </h2>
          </div>
          <div className="space-y-10 md:col-span-8">
            {values.map((item, index) => (
              <div
                key={item.title}
                className="border-t border-ink/10 pt-8"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <h3 className="font-display text-xl font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 flex flex-col items-start gap-6 border-t border-ink/10 py-16 md:mt-32 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl font-display text-2xl font-medium tracking-tight md:text-3xl">
            Ready to explore the collection?
          </p>
          <Link to="/products" className="btn-primary">
            Browse products
          </Link>
        </section>
      </main>

    </div>
  );
};

export default About;
