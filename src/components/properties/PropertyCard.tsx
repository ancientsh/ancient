import { Card } from "@/components/ui/card";
import { formatUSD } from "@/contracts";

// Property images mapping - use public folder images
const propertyImages = [
  "/public/tulum.jpeg",
  "/public/mexico_beachfront.jpg",
  "/public/a-frame.jpeg",
  "/public/tony-stark.jpeg",
];

interface PropertyData {
  id: number;
  location: string;
  originalValuation: bigint;
  currentValuation: bigint;
  registeredAt: bigint;
  isActive: boolean;
  metadataURI: string;
}

interface PropertyCardProps {
  property: PropertyData;
  onClick?: () => void;
}

/**
 * Property card with image background and glassmorphism badges
 */
export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { id, location, currentValuation, isActive } = property;

  // Cycle through available images based on property ID
  const imageUrl = propertyImages[id % propertyImages.length];

  return (
    <Card
      className="group relative aspect-[4/5] w-full cursor-pointer overflow-hidden border-0 shadow-xl transition-all hover:shadow-2xl"
      onClick={onClick}
    >
      {/* Property Image */}
      <img
        src={imageUrl}
        alt={`Property #${id}`}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Status Badge - glassmorphism style */}
      <div className="absolute right-4 top-4 rounded-lg border border-primary/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm shadow-lg">
        {isActive ? "Available" : "Sold"}
      </div>

      {/* Value Badge - glassmorphism style */}
      <div className="absolute left-4 top-4 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm shadow-lg">
        ${formatUSD(currentValuation)}
      </div>

      {/* Property Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="rounded-xl border border-white/20 bg-black/50 p-4 backdrop-blur-md">
          <h3 className="mb-1 text-lg font-bold text-white">Property #{id}</h3>
          <p className="text-sm text-white/80 line-clamp-2">{location}</p>
        </div>
      </div>
    </Card>
  );
}

export default PropertyCard;
