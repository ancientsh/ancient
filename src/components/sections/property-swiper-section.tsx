import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation, Pagination } from "swiper/modules";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Users } from "lucide-react";
import { MOCK_PROPERTIES, formatCurrency, formatMultiplier, type LandingProperty } from "@/lib/constants";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface PropertySwiperSectionProps {
  onPropertySelect?: (property: LandingProperty) => void;
}

/**
 * @description Swiper component for property listings on landing page
 */
export function PropertySwiperSection({ onPropertySelect }: PropertySwiperSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const properties = MOCK_PROPERTIES;

  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.activeIndex);
  };

  const activeProperty = properties[activeIndex] ?? properties[0];

  if (!activeProperty) {
    return null;
  }

  return (
    <Section
      id="properties"
      fullHeight
      className="property-swiper-section flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-8 py-8 lg:flex-row lg:gap-12 lg:py-0">
        {/* Property Images Swiper */}
        <div className="flex w-full max-w-md items-center justify-center lg:max-w-none lg:w-1/2">
          {/* Mobile: Card Stack */}
          <div className="w-full max-w-md lg:hidden">
            <Swiper
              effect="cards"
              grabCursor
              modules={[EffectCards]}
              className="property-swiper"
              cardsEffect={{
                perSlideOffset: 8,
                perSlideRotate: 2,
                slideShadows: true,
              }}
              onSlideChange={handleSlideChange}
            >
              {properties.map((property) => (
                <SwiperSlide key={property.id}>
                  <LandingPropertyCard property={property} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop: Horizontal Slider */}
          <div className="hidden w-full lg:block">
            <Swiper
              slidesPerView={1.2}
              spaceBetween={20}
              centeredSlides={true}
              grabCursor
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              className="property-swiper-horizontal"
              onSlideChange={handleSlideChange}
            >
              {properties.map((property) => (
                <SwiperSlide key={property.id}>
                  <LandingPropertyCard property={property} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* Property Details Card */}
        <div className="w-full max-w-md lg:max-w-none lg:w-1/2">
          <LandingPropertyDetailsCard
            property={activeProperty}
            onSelect={onPropertySelect}
          />
        </div>
      </div>
    </Section>
  );
}

/**
 * Property card showing image and sold badge
 */
function LandingPropertyCard({ property }: { property: LandingProperty }) {
  const { name, imageUrl, availability } = property;

  return (
    <Card className="group relative aspect-[4/5] w-full cursor-pointer overflow-hidden border-0 shadow-xl transition-all hover:shadow-2xl">
      {/* Property Image */}
      <img
        src={imageUrl}
        alt={name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Sold Badge */}
      <div className="absolute right-4 top-4 rounded-lg border border-primary/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm shadow-lg">
        {availability.sold}/{availability.total} sold
      </div>
    </Card>
  );
}

/**
 * Property details card shown alongside the swiper
 */
function LandingPropertyDetailsCard({
  property,
  onSelect,
}: {
  property: LandingProperty;
  onSelect?: (property: LandingProperty) => void;
}) {
  const { name, location, networkInvestment } = property;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">List Price</p>
            <p className="text-2xl font-bold">
              {formatCurrency(networkInvestment.listPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Citizenship Cost</p>
            <p className="text-2xl font-bold">
              {formatCurrency(networkInvestment.citizenshipCost)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly Yield</p>
            <p className="flex items-center gap-1 text-2xl font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              {formatCurrency(networkInvestment.monthlyNetworkYield)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">10-Year Return</p>
            <p className="text-2xl font-bold text-primary">
              {formatMultiplier(networkInvestment.totalTenYearReturn)}
            </p>
          </div>
        </div>

        {/* Access Info */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Access: {networkInvestment.access}
          </span>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onSelect?.(property)}
          className="h-12 w-full text-base font-semibold"
          size="lg"
        >
          Become a Citizen
        </Button>
      </CardContent>
    </Card>
  );
}
