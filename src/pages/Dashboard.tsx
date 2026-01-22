// Dashboard page - View properties and user's mortgages
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  PrettyAmount,
} from "liquidcn";
import { PrettyDate } from "liquidcn/client";
import { PropertySwiper, type PropertyMetadata } from "@/components/properties";
import { TrendingUp, Calendar, DollarSign, Clock, RefreshCw } from "lucide-react";
import {
  useWeb3,
  formatUSD,
  formatBps,
  PropertyOracleAbi,
  MortgagePositionNFTAbi,
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
  const [propertyMetadata, setPropertyMetadata] = useState<Map<number, PropertyMetadata>>(new Map());
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
      let metadataUri: string | null = null;

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

          // Get metadataURI from first property (all share same URI)
          if (!metadataUri && property.metadataURI) {
            metadataUri = property.metadataURI;
          }
        } catch {
          // Property might not exist
        }
      }
      setProperties(props);

      // Fetch metadata from the URI stored in contract
      if (metadataUri) {
        try {
          const res = await fetch(metadataUri);
          const data: PropertyMetadata[] = await res.json();
          const metadataMap = new Map<number, PropertyMetadata>();
          data.forEach((prop) => metadataMap.set(prop.id, prop));
          setPropertyMetadata(metadataMap);
        } catch (err) {
          console.error("Failed to fetch property metadata from URI:", err);
        }
      }
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
      <Card isGlass className="max-w-md mx-auto">
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
    <div className="space-y-12">
      {/* User's Mortgages Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Mortgages</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your active mortgage positions</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPositions}
            disabled={isLoadingPositions}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPositions ? "animate-spin" : ""}`} />
            {isLoadingPositions ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {isLoadingPositions ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading positions...</p>
            </div>
          </div>
        ) : positions.length === 0 ? (
          <Card isGlass className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No mortgage positions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse properties below and apply for a mortgage to get started.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {positions.map((pos) => (
              <MortgagePositionCard key={pos.tokenId} position={pos} />
            ))}
          </div>
        )}
      </section>

      {/* Available Properties Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Available Properties</h2>
            <p className="text-sm text-muted-foreground mt-1">Browse tokenized real estate</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProperties}
            disabled={isLoadingProperties}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingProperties ? "animate-spin" : ""}`} />
            {isLoadingProperties ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {isLoadingProperties ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading properties...</p>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <Card isGlass className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No properties registered yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deploy the contracts to register sample properties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <PropertySwiper properties={properties.filter(p => p.isActive)} propertyMetadata={propertyMetadata} />
        )}
      </section>
    </div>
  );
}

/**
 * Styled mortgage position card with progress bar, status badges, and hover effects
 */
function MortgagePositionCard({ position }: { position: Position }) {
  const progress = Number(position.paymentsCompleted) / Number(position.termPeriods) * 100;
  const isPaidOff = position.remainingPrincipal === 0n || position.paymentsCompleted >= position.termPeriods;
  const periodsRemaining = Number(position.termPeriods) - Number(position.paymentsCompleted);

  return (
    <Card isGlass className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${!position.isActive ? "opacity-60" : ""}`}>
      {/* Status Badge */}
      <div className={`absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ${
        isPaidOff
          ? "bg-green-500/20 text-green-400 border border-green-500/40"
          : position.isActive
            ? "bg-primary/20 text-primary border border-primary/40"
            : "bg-muted text-muted-foreground border border-border"
      }`}>
        {isPaidOff ? "Paid Off" : position.isActive ? "Active" : "Closed"}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Mortgage #{position.tokenId}</CardTitle>
        <p className="text-sm text-muted-foreground">Property #{Number(position.propertyId)}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Principal</p>
            <p className="text-lg font-bold">$<PrettyAmount amountFormatted={formatUSD(position.principal)} size="lg" /></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Remaining</p>
            <p className="text-lg font-bold text-primary">$<PrettyAmount amountFormatted={formatUSD(position.remainingPrincipal)} size="lg" /></p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-medium">
              {Number(position.paymentsCompleted)}/{Number(position.termPeriods)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span><PrettyAmount amountFormatted={progress} variant="percentage" size="xs" normalPrecision={1} /> complete</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {periodsRemaining} periods left
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2 rounded-lg border bg-muted/50 px-3 py-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Interest Rate
            </span>
            <span className="font-medium">{formatBps(position.rateBps)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Payment/Period
            </span>
            <span className="font-medium">$<PrettyAmount amountFormatted={formatUSD(position.paymentPerPeriod)} size="sm" /></span>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Started: <PrettyDate date={Number(position.createdAt) * 1000} format="date" size="xs" />
          </span>
          <span className="font-medium text-foreground">
            Total Paid: $<PrettyAmount amountFormatted={formatUSD(position.totalPaid)} size="xs" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
