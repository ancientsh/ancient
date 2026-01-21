// Dashboard page - View properties and user's mortgages
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useWeb3,
  formatUSD,
  formatBps,
  PropertyOracleAbi,
  MortgagePositionNFTAbi,
  MortgageFactoryAbi,
  getContractAddresses,
} from "../contracts";

interface Property {
  id: number;
  location: string;
  originalValuation: bigint;
  currentValuation: bigint;
  registeredAt: bigint;
  isActive: boolean;
  metadataURI: string;
}

interface Position {
  tokenId: number;
  propertyId: bigint;
  principal: bigint;
  downPayment: bigint;
  rateBps: bigint;
  termPeriods: bigint;
  paymentPerPeriod: bigint;
  createdAt: bigint;
  remainingPrincipal: bigint;
  totalPaid: bigint;
  paymentsCompleted: bigint;
  isActive: boolean;
}

export function Dashboard() {
  const { isConnected, isConnecting, error, address, publicClient } = useWeb3();
  const [properties, setProperties] = useState<Property[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  const addresses = getContractAddresses();

  // Fetch all properties
  const fetchProperties = useCallback(async () => {
    if (!publicClient) return;

    setIsLoadingProperties(true);
    try {
      const totalCount = await publicClient.readContract({
        address: addresses.propertyOracle,
        abi: PropertyOracleAbi,
        functionName: "totalProperties",
      }) as bigint;

      const props: Property[] = [];
      for (let i = 0; i < Number(totalCount); i++) {
        try {
          const property = await publicClient.readContract({
            address: addresses.propertyOracle,
            abi: PropertyOracleAbi,
            functionName: "getProperty",
            args: [BigInt(i)],
          }) as {
            location: string;
            originalValuation: bigint;
            registeredAt: bigint;
            currentValuation: bigint;
            isActive: boolean;
            metadataURI: string;
          };

          props.push({
            id: i,
            location: property.location,
            originalValuation: property.originalValuation,
            currentValuation: property.currentValuation,
            registeredAt: property.registeredAt,
            isActive: property.isActive,
            metadataURI: property.metadataURI,
          });
        } catch {
          // Property might not exist
        }
      }
      setProperties(props);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setIsLoadingProperties(false);
    }
  }, [publicClient, addresses.propertyOracle]);

  // Fetch user's mortgage positions
  const fetchPositions = useCallback(async () => {
    if (!publicClient || !address) return;

    setIsLoadingPositions(true);
    try {
      const tokenIds = await publicClient.readContract({
        address: addresses.mortgagePositionNFT,
        abi: MortgagePositionNFTAbi,
        functionName: "getUserPositions",
        args: [address],
      }) as bigint[];

      const positionList: Position[] = [];
      for (const tokenId of tokenIds) {
        try {
          const position = await publicClient.readContract({
            address: addresses.mortgagePositionNFT,
            abi: MortgagePositionNFTAbi,
            functionName: "getPosition",
            args: [tokenId],
          }) as {
            factory: string;
            propertyId: bigint;
            legalContractURI: string;
            principal: bigint;
            downPayment: bigint;
            rateBps: bigint;
            termPeriods: bigint;
            paymentPerPeriod: bigint;
            createdAt: bigint;
            remainingPrincipal: bigint;
            totalPaid: bigint;
            paymentsCompleted: bigint;
            isActive: boolean;
          };

          positionList.push({
            tokenId: Number(tokenId),
            propertyId: position.propertyId,
            principal: position.principal,
            downPayment: position.downPayment,
            rateBps: position.rateBps,
            termPeriods: position.termPeriods,
            paymentPerPeriod: position.paymentPerPeriod,
            createdAt: position.createdAt,
            remainingPrincipal: position.remainingPrincipal,
            totalPaid: position.totalPaid,
            paymentsCompleted: position.paymentsCompleted,
            isActive: position.isActive,
          });
        } catch {
          // Position might not exist
        }
      }
      setPositions(positionList);
    } catch (err) {
      console.error("Failed to fetch positions:", err);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [publicClient, address, addresses.mortgagePositionNFT]);

  useEffect(() => {
    fetchProperties();
    fetchPositions();
  }, [fetchProperties, fetchPositions]);

  if (isConnecting) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Connecting to local chain...</p>
      </div>
    );
  }

  if (error || !isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription className="text-destructive">
            {error || "Not connected to local chain. Make sure Anvil is running."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Start Anvil with: <code className="bg-muted px-2 py-1 rounded">anvil</code>
          </p>
          <p className="text-sm text-muted-foreground">
            Deploy contracts with:
          </p>
          <code className="block bg-muted px-2 py-1 rounded text-xs mt-1">
            forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
          </code>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* User's Mortgages Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Mortgages</h2>
          <Button variant="outline" size="sm" onClick={fetchPositions} disabled={isLoadingPositions}>
            {isLoadingPositions ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {isLoadingPositions ? (
          <div className="text-center py-8 text-muted-foreground">Loading positions...</div>
        ) : positions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>You don't have any mortgage positions yet.</p>
              <p className="text-sm mt-2">Go to the Mortgage page to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {positions.map((pos) => (
              <PositionCard key={pos.tokenId} position={pos} />
            ))}
          </div>
        )}
      </section>

      {/* Available Properties Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Available Properties</h2>
          <Button variant="outline" size="sm" onClick={fetchProperties} disabled={isLoadingProperties}>
            {isLoadingProperties ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {isLoadingProperties ? (
          <div className="text-center py-8 text-muted-foreground">Loading properties...</div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No properties registered yet.</p>
              <p className="text-sm mt-2">Deploy the contracts to register sample properties.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.filter(p => p.isActive).map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const registeredDate = new Date(Number(property.registeredAt) * 1000).toLocaleDateString();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Property #{property.id}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{property.location}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Current Value</span>
          <span className="font-bold text-lg">${formatUSD(property.currentValuation)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Original Value</span>
          <span className="text-sm">${formatUSD(property.originalValuation)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Registered</span>
          <span className="text-sm">{registeredDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className={`text-sm font-medium ${property.isActive ? "text-green-600" : "text-red-600"}`}>
            {property.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PositionCard({ position }: { position: Position }) {
  const createdDate = new Date(Number(position.createdAt) * 1000).toLocaleDateString();
  const progress = Number(position.paymentsCompleted) / Number(position.termPeriods) * 100;
  const isPaidOff = position.remainingPrincipal === 0n || position.paymentsCompleted >= position.termPeriods;

  return (
    <Card className={!position.isActive ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Mortgage #{position.tokenId}</CardTitle>
            <CardDescription>Property #{Number(position.propertyId)}</CardDescription>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${
            isPaidOff ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            position.isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
          }`}>
            {isPaidOff ? "Paid Off" : position.isActive ? "Active" : "Closed"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Principal</span>
          <span className="font-medium">${formatUSD(position.principal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Remaining</span>
          <span className="font-bold text-lg">${formatUSD(position.remainingPrincipal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Interest Rate</span>
          <span className="text-sm">{formatBps(position.rateBps)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Payment/Period</span>
          <span className="text-sm">${formatUSD(position.paymentPerPeriod)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm">
            {Number(position.paymentsCompleted)}/{Number(position.termPeriods)} payments
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Started: {createdDate}</span>
          <span>Total Paid: ${formatUSD(position.totalPaid)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
