/**
 * @description Property data type for landing page
 * availability is optional as it may come from contracts
 */
export interface LandingProperty {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  networkInvestment: {
    listPrice: number;
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
