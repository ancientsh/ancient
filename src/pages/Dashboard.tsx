// Dashboard page - View properties and user's mortgages
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "liquidcn";
import { DollarSign, RefreshCw } from "lucide-react";
import {
  useWeb3,
  MortgagePositionNFTAbi,
  PropertyOracleAbi,
  getContractAddresses,
} from "../contracts";
import { CreateMortgageForm } from "@/components/mortgage";
import { PropertyCard, type PropertyMetadata } from "@/components/properties/PropertyCard";

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

export function Dashboard({ onMortgageCreated }: { onMortgageCreated?: () => void } = {}) {
  const { isConnected, isConnecting, error, address, publicClient } = useWeb3();
  const [positions, setPositions] = useState<Position[]>([]);
  const [propertyMetadata, setPropertyMetadata] = useState<Map<number, PropertyMetadata>>(new Map());
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  const addresses = getContractAddresses();

  // Fetch property metadata from contract
  const fetchPropertyMetadata = useCallback(async () => {
    if (!publicClient) return;
    try {
      const property = await publicClient.readContract({
        address: addresses.propertyOracle,
        abi: PropertyOracleAbi,
        functionName: "getProperty",
        args: [BigInt(0)],
      }) as { metadataURI: string };

      if (property.metadataURI) {
        const res = await fetch(property.metadataURI);
        const data: PropertyMetadata[] = await res.json();
        const metadataMap = new Map<number, PropertyMetadata>();
        data.forEach((prop) => metadataMap.set(prop.id, prop));
        setPropertyMetadata(metadataMap);
      }
    } catch (err) {
      console.error("Failed to fetch property metadata:", err);
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
    fetchPositions();
    fetchPropertyMetadata();
  }, [fetchPositions, fetchPropertyMetadata]);

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
    <div className="max-w-2xl mx-auto">
      <CreateMortgageForm showCard={false} onSuccess={() => { fetchPositions(); onMortgageCreated?.(); }} />
    </div>
  );
}

/**
 * Mortgage position card using PropertyCard with metadata
 */
function MortgagePositionCard({ position, metadata }: { position: Position; metadata?: PropertyMetadata }) {
  return (
    <PropertyCard
      position={{
        tokenId: position.tokenId,
        propertyId: position.propertyId,
        principal: position.principal,
        remainingPrincipal: position.remainingPrincipal,
        paymentsCompleted: position.paymentsCompleted,
        termPeriods: position.termPeriods,
        paymentPerPeriod: position.paymentPerPeriod,
      }}
      metadata={metadata}
    />
  );
}

export default Dashboard;
