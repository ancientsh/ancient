import { useState, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation, Pagination } from "swiper/modules";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle, Button, PrettyAmount } from "liquidcn";
import { MapPin, TrendingUp, Users, RefreshCw } from "lucide-react";
import { formatMultiplier, type LandingProperty } from "@/lib/constants";
import { useWeb3, PropertyOracleAbi, getContractAddresses, formatUSD } from "@/contracts";
import { PropertyCard } from "@/components/properties/PropertyCard";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Extended property with contract data - location is required (from contract)
interface PropertyWithContractData extends Omit<LandingProperty, 'location'> {
  location: string; // Always from contract
  currentValuation: bigint;
}

interface PropertySwiperSectionProps {
  onPropertySelect?: (property: LandingProperty) => void;
}

/**
 * @description Swiper component for property listings on landing page
 */
export function PropertySwiperSection({ onPropertySelect }: PropertySwiperSectionProps) {
  const { publicClient } = useWeb3();
  const addresses = getContractAddresses();
  const [activeIndex, setActiveIndex] = useState(0);
  const [properties, setProperties] = useState<PropertyWithContractData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      // Get total number of properties from contract
      const totalCount = await publicClient.readContract({
        address: addresses.propertyOracle,
        abi: PropertyOracleAbi,
        functionName: "totalProperties",
      }) as bigint;

      // Fetch all properties from contract
      const contractProperties: Array<{
        id: number;
        location: string;
        currentValuation: bigint;
        isActive: boolean;
        metadataURI: string;
      }> = [];

      let metadataUri: string | null = null;

      for (let i = 0; i < Number(totalCount); i++) {
        const property = await publicClient.readContract({
          address: addresses.propertyOracle,
          abi: PropertyOracleAbi,
          functionName: "getProperty",
          args: [BigInt(i)],
        }) as { location: string; currentValuation: bigint; isActive: boolean; metadataURI: string };

        contractProperties.push({
          id: i,
          location: property.location,
          currentValuation: property.currentValuation,
          isActive: property.isActive,
          metadataURI: property.metadataURI,
        });

        // Get metadataURI from first property (all share same URI)
        if (!metadataUri && property.metadataURI) {
          metadataUri = property.metadataURI;
        }
      }

      // Fetch metadata JSON
      if (metadataUri) {
        const res = await fetch(metadataUri);
        const metadataList: LandingProperty[] = await res.json();

        // Create a map for quick lookup
        const metadataMap = new Map<number, LandingProperty>();
        metadataList.forEach((m) => metadataMap.set(m.id, m));

        // Merge contract data with metadata - contract is SOT for valuation and location
        const mergedProperties: PropertyWithContractData[] = contractProperties
          .filter((p) => p.isActive)
          .map((contractProp) => {
            const metadata = metadataMap.get(contractProp.id);
            return {
              id: contractProp.id,
              name: metadata?.name ?? `Property #${contractProp.id}`,
              location: contractProp.location, // Use contract location as SOT
              imageUrl: metadata?.imageUrl ?? "/public/tulum.jpeg",
              currentValuation: contractProp.currentValuation, // From contract
              networkInvestment: metadata?.networkInvestment ?? {
                listPrice: 0,
                citizenshipCost: 0,
                monthlyNetworkYield: 0,
                tenYearVillageValue: 0,
                totalTenYearReturn: 0,
                access: "Entire Ancient archipelago",
              },
              availability: metadata?.availability,
            };
          });

        setProperties(mergedProperties);
      }
    } catch (err) {
      console.error("Failed to fetch properties from contract:", err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, addresses.propertyOracle]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.activeIndex);
  };

  const activeProperty = properties[activeIndex] ?? properties[0];

  if (isLoading) {
    return (
      <Section
        id="properties"
        fullHeight
        className="property-swiper-section flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-12"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading properties...</span>
        </div>
      </Section>
    );
  }

  if (!activeProperty) {
    return null;
  }

  return (
    <Section
      id="properties"
      fullHeight
      className="property-swiper-section flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-12"
    >
      <div className="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-6 sm:gap-8 py-6 sm:py-8 lg:flex-row lg:gap-12 lg:py-0">
        {/* Property Images Swiper */}
        <div className="flex w-full max-w-sm sm:max-w-md items-center justify-center lg:max-w-none lg:w-1/2">
          {/* Mobile: Card Stack */}
          <div className="w-full max-w-sm sm:max-w-md lg:hidden">
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
                  <PropertyCard
                    metadata={{
                      id: property.id,
                      name: property.name,
                      location: property.location,
                      imageUrl: property.imageUrl,
                      availability: property.availability,
                    }}
                    variant="minimal"
                  />
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
                  <PropertyCard
                    metadata={{
                      id: property.id,
                      name: property.name,
                      location: property.location,
                      imageUrl: property.imageUrl,
                      availability: property.availability,
                    }}
                    variant="minimal"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* Property Details Card */}
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-none lg:w-1/2">
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
 * Property details card shown alongside the swiper
 * Uses contract's currentValuation as source of truth for list price
 */
function LandingPropertyDetailsCard({
  property,
  onSelect,
}: {
  property: PropertyWithContractData;
  onSelect?: (property: LandingProperty) => void;
}) {
  const { name, location, networkInvestment, currentValuation } = property;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-xl sm:text-2xl">{name}</CardTitle>
        <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>{location}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">List Price</p>
            <p className="text-lg sm:text-2xl font-bold">
              $<PrettyAmount amountFormatted={formatUSD(currentValuation)} size="2xl" />
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Citizenship Cost</p>
            <p className="text-lg sm:text-2xl font-bold">
              $<PrettyAmount amountFormatted={networkInvestment.citizenshipCost} size="2xl" />
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Monthly Yield</p>
            <p className="flex items-center gap-1 text-lg sm:text-2xl font-bold">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              $<PrettyAmount amountFormatted={networkInvestment.monthlyNetworkYield} size="2xl" />
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">10-Year Return</p>
            <p className="text-lg sm:text-2xl font-bold text-primary">
              {formatMultiplier(networkInvestment.totalTenYearReturn)}
            </p>
          </div>
        </div>

        {/* Access Info */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 sm:px-4 py-2 sm:py-3">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          <span className="text-xs sm:text-sm font-medium">
            Access: {networkInvestment.access}
          </span>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onSelect?.(property)}
          className="h-10 sm:h-12 w-full text-sm sm:text-base font-semibold"
          size="lg"
        >
          Become a Citizen
        </Button>
      </CardContent>
    </Card>
  );
}
