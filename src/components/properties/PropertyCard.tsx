import { MapPin } from "lucide-react";
import { Card, PrettyAmount } from "liquidcn";
import { formatUSD } from "@/contracts";

export interface PropertyMetadata {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  availability?: {
    sold: number;
    total: number;
  };
}

export interface PropertyCardData {
  id: number;
  location: string;
  currentValuation: bigint;
  isActive: boolean;
}

export interface PositionData {
  tokenId: number;
  propertyId: bigint;
  principal: bigint;
  remainingPrincipal: bigint;
  paymentsCompleted: bigint;
  termPeriods: bigint;
  paymentPerPeriod: bigint;
  isActive?: boolean;
}

interface PropertyCardProps {
  property?: PropertyCardData;
  position?: PositionData;
  metadata?: PropertyMetadata;
  isSelected?: boolean;
  onClick?: () => void;
  /** "default" shows full info overlay, "minimal" shows image only with optional badge (for landing page) */
  variant?: "default" | "minimal";
}

/**
 * Property card component used across landing, mortgage, and payments pages
 */
export function PropertyCard({
  property,
  position,
  metadata,
  isSelected = false,
  onClick,
  variant = "default",
}: PropertyCardProps) {
  const imageUrl = metadata?.imageUrl ?? "/public/tulum.jpeg";
  const propertyName = metadata?.name ?? `Property #${property?.id ?? position?.propertyId ?? 0}`;
  const location = metadata?.location ?? property?.location ?? "Unknown location";

  // For position cards, calculate progress
  const progressPercent = position
    ? (Number(position.paymentsCompleted) / Number(position.termPeriods)) * 100
    : null;

  // Minimal variant for landing page - image only with optional sold badge
  if (variant === "minimal") {
    return (
      <Card
        className="group relative aspect-[4/5] w-full cursor-pointer overflow-hidden border-0 shadow-xl transition-all hover:shadow-2xl"
        onClick={onClick}
      >
        {/* Property Image */}
        <img
          src={imageUrl}
          alt={propertyName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Sold Badge - only show if availability data is present */}
        {metadata?.availability && (
          <div className="absolute right-2 sm:right-4 top-2 sm:top-4 rounded-lg border border-primary bg-primary px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground backdrop-blur-sm shadow-lg">
            {metadata.availability.sold}/{metadata.availability.total} sold
          </div>
        )}
      </Card>
    );
  }

  // Default variant - full card with all info overlays
  return (
    <Card
      className={`group relative aspect-[4/5] w-full h-full cursor-pointer overflow-hidden border-2 shadow-xl transition-all hover:shadow-2xl ${
        isSelected
          ? "border-primary shadow-2xl ring-2 ring-primary/30"
          : "border-transparent hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      {/* Property Image */}
      <img
        src={imageUrl}
        alt={propertyName}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex justify-between items-start">
        {/* Value Badge */}
        {property && (
          <div className="rounded-lg border border-white/30 bg-black/50 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm shadow-lg">
            $<PrettyAmount amountFormatted={formatUSD(property.currentValuation)} size="sm" />
          </div>
        )}

        {/* Position Badge - show position number for payments */}
        {position && (
          <div className="rounded-lg border border-white/30 bg-black/50 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm shadow-lg">
            Position #{position.tokenId}
          </div>
        )}

        {/* Status Badge */}
        {position?.isActive === false ? (
          <div className="rounded-lg border border-green-500 bg-green-500 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm shadow-lg">
            Paid Off
          </div>
        ) : position ? (
          <div className="rounded-lg border border-primary bg-primary px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm shadow-lg">
            In Progress
          </div>
        ) : (
          <div className="rounded-lg border border-primary bg-primary px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm shadow-lg">
            {property?.isActive !== false ? "Available" : "Sold"}
          </div>
        )}
      </div>

      {/* Property Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
        <div
          className={`rounded-xl border p-2 sm:p-3 backdrop-blur-md ${
            isSelected ? "border-primary/40 bg-primary/20" : "border-white/20 bg-black/50"
          }`}
        >
          <h3 className="mb-0.5 sm:mb-1 text-sm sm:text-base font-bold text-white line-clamp-1">
            {propertyName}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 line-clamp-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
            {location}
          </p>

          {/* Position-specific info */}
          {position && progressPercent !== null && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-white/70">Progress</span>
                <span className="text-white font-medium">
                  {Number(position.paymentsCompleted)}/{Number(position.termPeriods)}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between items-center">
                <span className="text-xs text-white/60">Remaining</span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  $<PrettyAmount amountFormatted={formatUSD(position.remainingPrincipal)} size="sm" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default PropertyCard;
