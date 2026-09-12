import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

// Banners are supplied exclusively by the storefront table, so campaign changes publish without a client release.
const HeroSlider = ({ banners = [] }) => {
  const slides = banners;
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((value) => slides.length ? (value + 1) % slides.length : 0), [slides.length]);
  useEffect(() => { if (slides.length < 2) return undefined; const timer = setInterval(next, 8000); return () => clearInterval(timer); }, [next, slides.length]);
  const activeIndex = slides.length ? current % slides.length : 0;
  const banner = slides[activeIndex];
  if (!banner) return <section className="relative flex min-h-[680px] items-end overflow-hidden bg-[#151331] px-6 pb-14 pt-16 text-white md:min-h-[720px] md:px-8"><div className="mx-auto w-full max-w-7xl animate-pulse"><div className="h-3 w-36 rounded bg-white/20" /><div className="mt-6 h-16 max-w-xl rounded bg-white/15 md:h-24" /><div className="mt-5 h-5 max-w-md rounded bg-white/10" /></div></section>;
  const image = banner.image_url;

  return <section className="relative isolate min-h-[680px] overflow-hidden bg-[#151331] pt-16 text-white md:min-h-[720px]">
    <img src={image} alt={banner.title} className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,12,36,.97)_0%,rgba(20,18,55,.82)_40%,rgba(23,18,55,.28)_76%,rgba(23,18,55,.22)_100%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(160,131,255,.24),transparent_28%),linear-gradient(0deg,rgba(9,8,25,.52),transparent_42%)]" />
    <div className="relative mx-auto flex min-h-[calc(680px-4rem)] max-w-7xl items-end px-6 pb-14 pt-24 md:min-h-[calc(720px-4rem)] md:px-8 md:pb-16 md:pt-28"><div className="grid w-full items-end gap-12 lg:grid-cols-12"><div className="max-w-2xl lg:col-span-7" key={banner.id}><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.28em] text-violet-200 md:text-[11px]"><Sparkles className="h-3.5 w-3.5" /> {banner.eyebrow}</p><h1 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[.92] tracking-[-.05em] sm:text-6xl md:text-7xl">{banner.title}</h1><p className="mt-6 max-w-lg text-base leading-relaxed text-white/72 md:text-lg">{banner.description}</p><Link to={banner.cta_url} className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.18em] text-[#191638] transition hover:-translate-y-0.5 hover:bg-violet-100">{banner.cta_label}<ArrowUpRight className="h-4 w-4" /></Link></div><aside className="hidden border-l border-white/20 pl-7 lg:col-span-5 lg:block"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/50">The promise</p><div className="mt-5 space-y-4">{["AED pricing", "Secure checkout", "UAE delivery"].map((signal) => <p key={signal} className="flex items-center gap-3 text-sm text-white/80"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/12"><Check className="h-3.5 w-3.5 text-violet-200" /></span>{signal}</p>)}</div><div className="mt-9 flex gap-2">{slides.map((slide, index) => <button key={slide.id} onClick={() => setCurrent(index)} className={`h-1.5 rounded-full transition ${activeIndex === index ? "w-12 bg-white" : "w-5 bg-white/30 hover:bg-white/60"}`} aria-label={`Show ${slide.title}`} />)}</div></aside></div></div>
    {slides.length > 1 && <><button onClick={() => setCurrent((value) => (value - 1 + slides.length) % slides.length)} aria-label="Previous campaign" className="absolute left-5 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-white/20 bg-black/10 p-3 backdrop-blur-md hover:bg-white/15 md:block"><ChevronLeft className="h-5 w-5" /></button><button onClick={next} aria-label="Next campaign" className="absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-white/20 bg-black/10 p-3 backdrop-blur-md hover:bg-white/15 md:block"><ChevronRight className="h-5 w-5" /></button></>}
  </section>;
};

export default HeroSlider;
