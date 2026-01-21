/**
 * @description Mock property data for demo landing page
 */
export interface LandingProperty {
  id: string;
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
  availability: {
    sold: number;
    total: number;
  };
}

export const MOCK_PROPERTIES: LandingProperty[] = [
  {
    id: "prop-2",
    name: "Hillside Villa",
    location: "Sacred Valley, Peru",
    imageUrl: "/public/tony-stark.jpeg",
    networkInvestment: {
      listPrice: 185000,
      citizenshipCost: 37000,
      monthlyNetworkYield: 1120,
      tenYearVillageValue: 352000,
      totalTenYearReturn: 9.8,
      access: "Entire Ancient archipelago",
    },
    availability: {
      sold: 3,
      total: 10,
    },
  },
  {
    id: "prop-1",
    name: "Art Deco Loft",
    location: "Mazunte, Mexico",
    imageUrl: "/public/tulum.jpeg",
    networkInvestment: {
      listPrice: 129000,
      citizenshipCost: 29670,
      monthlyNetworkYield: 764,
      tenYearVillageValue: 245745,
      totalTenYearReturn: 10.1,
      access: "Entire Ancient archipelago",
    },
    availability: {
      sold: 0,
      total: 15,
    },
  },
  {
    id: "prop-3",
    name: "Ocean Bungalow",
    location: "Bahia, Brazil",
    imageUrl: "/public/a-frame.jpeg",
    networkInvestment: {
      listPrice: 95000,
      citizenshipCost: 19000,
      monthlyNetworkYield: 580,
      tenYearVillageValue: 181000,
      totalTenYearReturn: 10.5,
      access: "Entire Ancient archipelago",
    },
    availability: {
      sold: 1,
      total: 20,
    },
  },
];

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
