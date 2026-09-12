import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { heroSlides } from "../../data/heroSlides";

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = heroSlides;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
      <div
        key={slide.id}
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${slide.image})` }}
      />

      <div className="glass absolute inset-0" />
      <div className="hero-aurora absolute -right-24 top-20 h-80 w-80 rounded-full" />
      <div className="hero-aurora absolute -bottom-24 -left-20 h-72 w-72 rounded-full [animation-delay:-5s]" />

      <div className="relative flex h-full items-center justify-center px-6 text-center">
        <div key={`content-${slide.id}`} className="max-w-3xl animate-fade-in-up">
          <p className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md md:text-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#d8cbff]" />
            Lumera selects
          </p>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-[#ded5ff] md:text-base">{slide.subtitle}</h3>
          <h1 className="mb-5 font-display text-5xl font-bold leading-[.95] text-white md:text-7xl">
            {slide.title}
          </h1>
          <p className="mx-auto mb-9 max-w-2xl text-base leading-relaxed text-white/75 md:text-xl">
            {slide.description}
          </p>
          <Link
            to={slide.url}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-4 gradient-primary text-sm font-semibold text-primary-foreground shadow-[0_14px_34px_rgb(94_73_223_/_0.45)] transition duration-300 hover:-translate-y-1 hover:brightness-110"
          >
            {slide.cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-6 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md transition hover:scale-110 hover:bg-white/20 sm:block"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-6 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md transition hover:scale-110 hover:bg-white/20 sm:block"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 space-x-3">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 w-2.5 transition-all duration-300 ${
              index === currentSlide
                ? "w-8 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,.75)]"
                : "rounded-full bg-white/35 hover:bg-white/55"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
