import {
  HeroSection,
  PropertySwiperSection,
  AboutSection,
  ComparisonSection,
  JourneySection,
  BenefitsSection,
  Footer,
} from "@/components/sections";

interface LandingProps {
  onNavigateToMVP?: () => void;
}

/**
 * @description Landing page matching the reference design
 */
export function Landing({ onNavigateToMVP }: LandingProps) {
  const scrollToProperties = () => {
    const element = document.getElementById("properties");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleJoinWaitlist = () => {
    // For now, navigate to MVP to test the protocol
    onNavigateToMVP?.();
  };

  const handlePropertySelect = () => {
    // Navigate to MVP mortgage page
    onNavigateToMVP?.();
  };

  return (
    <>
      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <HeroSection
          onScrollToProperties={scrollToProperties}
          onJoinWaitlist={handleJoinWaitlist}
        />

        {/* Property Listings */}
        <PropertySwiperSection onPropertySelect={handlePropertySelect} />

        {/* About Section */}
        <AboutSection />

        {/* Comparison Section */}
        <ComparisonSection />

        {/* Journey Section */}
        <JourneySection />

        {/* Benefits Section */}
        <BenefitsSection />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}

export default Landing;
