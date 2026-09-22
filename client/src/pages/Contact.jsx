import { useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../lib/axios";

// Route page for `/contact`: a controlled support form that posts to the public
// storefront endpoint; dashboard Support later reads and manages these messages.
const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email, and message.");
      return;
    }
    try {
      const { data } = await axiosInstance.post("/storefront/contact", form);
      toast.success(data.message);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send your message.");
    }
  };

  return (
    <div className="page-shell">
      <div className="ambient-orb -right-16 top-40 h-80 w-80 animate-drift" />

      <div className="h-16" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8">
        <section className="grid gap-14 pb-20 pt-10 md:grid-cols-12 md:gap-10 md:pt-16">
          <div className="md:col-span-5">
            <p className="animate-fade-up text-xs uppercase tracking-[0.28em] text-accent">
              Contact
            </p>
            <h1 className="animate-fade-up-delay mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              Let’s talk
              <br />
              clearly.
            </h1>
            <p className="animate-fade-up-delay-2 mt-6 max-w-md text-lg leading-relaxed text-stone">
              Orders, product questions, or partnerships — send a note and our
              team will get back within one business day.
            </p>

            <div className="mt-12 space-y-6 border-t border-ink/10 pt-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone">
                  Email
                </p>
                <a
                  href="mailto:hello@lumera.shop"
                  className="mt-2 inline-block text-lg text-ink transition hover:text-accent"
                >
                  hello@lumera.shop
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone">
                  Hours
                </p>
                <p className="mt-2 text-lg text-ink">Mon–Fri, 9:00–18:00</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone">
                  Studio
                </p>
                <p className="mt-2 text-lg text-ink">
                  18 Atelier Lane
                  <br />
                  Dubai, UAE
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 md:pl-8">
            <form
              onSubmit={onSubmit}
              className="animate-fade-up-delay border border-ink/10 bg-white/50 p-6 backdrop-blur-sm md:p-10"
            >
              <div className="grid gap-8 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-stone">
                    Name
                  </span>
                  <input
                    className="field mt-2"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-stone">
                    Email
                  </span>
                  <input
                    className="field mt-2"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="you@email.com"
                  />
                </label>
              </div>

              <label className="mt-8 block">
                <span className="text-xs uppercase tracking-[0.18em] text-stone">
                  Subject
                </span>
                <input
                  className="field mt-2"
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  placeholder="How can we help?"
                />
              </label>

              <label className="mt-8 block">
                <span className="text-xs uppercase tracking-[0.18em] text-stone">
                  Message
                </span>
                <textarea
                  className="field mt-2 min-h-[140px] resize-y"
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  placeholder="Write your message..."
                />
              </label>

              <button type="submit" className="btn-primary mt-10 w-full md:w-auto">
                Send message
              </button>
            </form>
          </div>
        </section>
      </main>

    </div>
  );
};

export default Contact;
