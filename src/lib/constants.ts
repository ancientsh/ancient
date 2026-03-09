/**
 * @description Property metadata type for landing page
 * Contract is SOT for: location, currentValuation, isActive
 * JSON metadata provides: name, imageUrl, networkInvestment (except listPrice), availability
 */
export interface LandingProperty {
  id: number;
  name: string;
  location?: string; // Comes from contract, optional in JSON
  imageUrl: string;
  description?: string;
  networkInvestment: {
    citizenshipCost: number;
    monthlyNetworkYield: number;
    tenYearVillageValue: number;
    totalTenYearReturn: number;
    access: string;
  };
  availability?: {
    sold: number;
    total: number;
  };
}

/**
 * @description Format currency as USD
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * @description Format number with multiplier (e.g., 10.1x)
 */
export const formatMultiplier = (value: number): string => {
  return `${value.toFixed(1)}x`;
};

/**
 * @description Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value}%`;
};
