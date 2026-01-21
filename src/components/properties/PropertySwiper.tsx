import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation, Pagination } from "swiper/modules";
import { PropertyCard } from "./PropertyCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Building2 } from "lucide-react";
import { formatUSD } from "@/contracts";
import { PrettyDate } from "@/components/ui/pretty-date";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface PropertyData {
  id: number;
  location: string;
  originalValuation: bigint;
  currentValuation: bigint;
  registeredAt: bigint;
  isActive: boolean;
  metadataURI: string;
}

interface PropertySwiperProps {
  properties: PropertyData[];
  onPropertySelect?: (property: PropertyData) => void;
}

/**
 * @description Swiper component for property listings
 * Mobile: Card stack effect
 * Desktop: Horizontal slider with navigation
 */
export function PropertySwiper({ properties, onPropertySelect }: PropertySwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.activeIndex);
  };

  if (properties.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-lg text-muted-foreground">No properties available.</p>
      </div>
    );
  }

  const activeProperty = properties[activeIndex] ?? properties[0];

  // Extra guard in case properties array changed after rendering
  if (!activeProperty) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-lg text-muted-foreground">No properties available.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-8 py-8 lg:flex-row lg:gap-12 lg:py-0 mx-auto">
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
                <PropertyCard property={property} />
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
                <PropertyCard property={property} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Property Details Card */}
      <div className="w-full max-w-md lg:max-w-none lg:w-1/2">
        <PropertyDetailsCard
          property={activeProperty}
          onSelect={onPropertySelect}
        />
      </div>
    </div>
  );
}

/**
 * Property details card shown alongside the swiper
 */
function PropertyDetailsCard({
  property,
  onSelect,
}: {
  property: PropertyData;
  onSelect?: (property: PropertyData) => void;
}) {
  const valuationChange = property.currentValuation - property.originalValuation;
  const changePercent = property.originalValuation > 0n
    ? Number((valuationChange * 10000n) / property.originalValuation) / 100
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Property #{property.id}</CardTitle>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{property.location}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-2xl font-bold">
              ${formatUSD(property.currentValuation)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Original Value</p>
            <p className="text-2xl font-bold">
              ${formatUSD(property.originalValuation)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Value Change</p>
            <p className={`flex items-center gap-1 text-2xl font-bold ${changePercent >= 0 ? "text-primary" : "text-destructive"}`}>
              <TrendingUp className={`h-5 w-5 ${changePercent < 0 ? "rotate-180" : ""}`} />
              {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Registered</p>
            <PrettyDate date={Number(property.registeredAt) * 1000} format="date" size="xl" className="font-bold" />
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-3">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Status: {property.isActive ? "Available for Mortgage" : "Not Available"}
          </span>
        </div>

        {/* CTA Button */}
        {onSelect && property.isActive && (
          <Button
            onClick={() => onSelect(property)}
            className="h-12 w-full text-base font-semibold"
            size="lg"
          >
            Apply for Mortgage
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default PropertySwiper;
