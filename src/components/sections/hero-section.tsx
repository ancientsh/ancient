import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  onScrollToProperties?: () => void;
  onJoinWaitlist?: () => void;
}

/**
 * @description Hero section component with CTA
 */
export function HeroSection({ onScrollToProperties, onJoinWaitlist }: HeroSectionProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Section
      fullHeight
      variant="hero"
      background="transparent"
      className="relative flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 transition-transform duration-100 ease-out"
          style={{
            transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.0002})`,
          }}
        >
          <img
            src="/public/mexico_beachfront.jpg"
            alt="Mexico Beachfront"
            className="h-full w-full object-cover"
          />
        </div>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center px-4">
        {/* Main Headline */}
        <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
          Welcome to the Borderless Nation
        </h1>

        {/* Subheadline */}
        <p className="mb-2 text-base leading-snug text-white/90 sm:text-lg md:mb-3 md:text-xl lg:text-2xl">
          50M digital nomads. Zero mortgage infrastructure.
        </p>

        {/* Key Statement */}
        <p className="mb-4 text-xl font-bold text-primary sm:text-2xl md:mb-5 md:text-3xl lg:text-4xl">
          We solve that.
        </p>

        {/* Supporting Text */}
        <p className="mb-1 text-sm text-white/80 sm:text-base md:mb-2 md:text-lg lg:text-xl">
          Tokenized neighborhoods powered by crypto.
        </p>

        {/* Tagline */}
        <p className="mb-6 text-base font-semibold text-white sm:text-lg md:mb-8 md:text-xl lg:mb-10 lg:text-2xl">
          No banks. No bullshit.
        </p>

        {/* CTA Button */}
        <div className="mb-6 flex w-full max-w-md justify-center sm:mb-8 md:mb-10">
          <Button
            size="lg"
            className="h-11 w-full text-sm font-semibold sm:h-12 sm:text-base md:h-13 md:px-8 md:text-lg lg:h-14 lg:text-xl"
            onClick={onJoinWaitlist}
          >
            Join Waitlist
          </Button>
        </div>

        {/* Scroll Indicator with Ping Animation */}
        <button
          onClick={onScrollToProperties}
          className="flex animate-bounce justify-center transition-opacity hover:opacity-80"
          aria-label="Scroll to properties"
        >
          <div className="relative flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11 md:h-12 md:w-12">
            <span className="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-primary opacity-75 sm:h-11 sm:w-11 md:h-12 md:w-12" />
            <ChevronDown className="relative z-10 h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8" />
          </div>
        </button>
      </div>
    </Section>
  );
}
