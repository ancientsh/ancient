// Payments page - Create position and make payments
import { useState, useEffect, useCallback } from "react";
import { encodeFunctionData } from "viem";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Input,
  PrettyAmount,
} from "liquidcn";
import { Label } from "liquidcn/client";
import {
  useWeb3,
  formatUSD,
  formatBps,
  parseBps,
  PropertyOracleAbi,
  MortgageFactoryAbi,
  MortgagePositionNFTAbi,
  MockUSDAbi,
  getContractAddresses,
  anvilChain,
} from "../contracts";
import { PropertyCard, type PropertyMetadata } from "@/components/properties/PropertyCard";
import {
  Building2,
  Calculator,
  CreditCard,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Clock,
  Percent,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Banknote,
} from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface Property {
  id: number;
  location: string;
  currentValuation: bigint;
  isActive: boolean;
}


interface MortgagePreview {
  principal: bigint;
  downPayment: bigint;
  rateBps: bigint;
  paymentPerPeriod: bigint;
  totalPayment: bigint;
  totalInterest: bigint;
}

interface Position {
  tokenId: number;
  propertyId: bigint;
  principal: bigint;
  paymentPerPeriod: bigint;
  remainingPrincipal: bigint;
  paymentsCompleted: bigint;
  termPeriods: bigint;
  isActive: boolean;
}

export function Payments() {
  const { isConnected, isConnecting, error } = useWeb3();
  const [activeTab, setActiveTab] = useState<"create" | "pay">("create");

  if (isConnecting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card isGlass className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <CardTitle className="text-2xl">Payments</CardTitle>
              <CardDescription className="mt-2">Connecting to local chain...</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card isGlass className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Payments</CardTitle>
              <CardDescription className="text-destructive mt-2">
                {error || "Not connected to local chain. Make sure Anvil is running."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Start Anvil with:</p>
              <code className="block bg-background px-3 py-2 rounded-md text-sm font-mono border border-border">
                anvil
              </code>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Deploy contracts with:</p>
              <code className="block bg-background px-3 py-2 rounded-md text-xs font-mono border border-border break-all">
                forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="text-center space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Payments</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Create mortgages or make payments</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 sm:gap-2 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
            activeTab === "create"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Create</span> Mortgage
        </button>
        <button
          onClick={() => setActiveTab("pay")}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
            activeTab === "pay"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Make</span> Payments
        </button>
      </div>

      {activeTab === "create" && <CreateMortgageForm />}
      {activeTab === "pay" && <MakePaymentsForm />}
    </div>
  );
}

/**
 * Swiper-based property selector for mortgage creation
 */
function PropertySwiperSelector({
  properties,
  selectedPropertyId,
  onPropertySelect,
  propertyMetadata,
}: {
  properties: Property[];
  selectedPropertyId: string;
  onPropertySelect: (id: number) => void;
  propertyMetadata: Map<number, PropertyMetadata>;
}) {
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);

  // Find initial slide index based on selected property
  const initialSlide = selectedPropertyId
    ? properties.findIndex((p) => p.id.toString() === selectedPropertyId)
    : 0;

  const handleSlideChange = (swiper: SwiperType) => {
    const property = properties[swiper.activeIndex];
    if (property) {
      onPropertySelect(property.id);
    }
  };

  // Sync swiper position when selectedPropertyId changes externally
  useEffect(() => {
    if (swiperRef && selectedPropertyId) {
      const index = properties.findIndex((p) => p.id.toString() === selectedPropertyId);
      if (index !== -1 && swiperRef.activeIndex !== index) {
        swiperRef.slideTo(index);
      }
    }
  }, [selectedPropertyId, properties, swiperRef]);

  // Auto-select first property if none selected
  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0 && properties[0]) {
      onPropertySelect(properties[0].id);
    }
  }, [properties, selectedPropertyId, onPropertySelect]);

  return (
    <div className="space-y-4">
      {/* Mobile: Card Stack Effect */}
      <div className="lg:hidden">
        <Swiper
          effect="cards"
          grabCursor
          modules={[EffectCards]}
          className="mortgage-property-swiper"
          cardsEffect={{
            perSlideOffset: 6,
            perSlideRotate: 1.5,
            slideShadows: true,
          }}
          onSlideChange={handleSlideChange}
          onSwiper={setSwiperRef}
          initialSlide={initialSlide >= 0 ? initialSlide : 0}
        >
          {properties.map((property) => (
            <SwiperSlide key={property.id}>
              <PropertyCard property={property} isSelected={property.id.toString() === selectedPropertyId} metadata={propertyMetadata.get(property.id)} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop: Horizontal Slider with Navigation */}
      <div className="hidden lg:block relative">
        <Swiper
          slidesPerView={1.5}
          spaceBetween={16}
          centeredSlides={true}
          grabCursor
          modules={[Navigation, Pagination]}
          navigation={{
            prevEl: ".property-swiper-prev",
            nextEl: ".property-swiper-next",
          }}
          pagination={{ clickable: true }}
          className="mortgage-property-swiper-horizontal"
          onSlideChange={handleSlideChange}
          onSwiper={setSwiperRef}
          initialSlide={initialSlide >= 0 ? initialSlide : 0}
        >
          {properties.map((property) => (
            <SwiperSlide key={property.id}>
              <PropertyCard property={property} isSelected={property.id.toString() === selectedPropertyId} metadata={propertyMetadata.get(property.id)} />
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Custom Navigation Buttons */}
        <button className="property-swiper-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-muted transition-colors disabled:opacity-50">
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <button className="property-swiper-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-muted transition-colors disabled:opacity-50">
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="text-center text-sm text-muted-foreground">
        {selectedPropertyId && (
          <span>
            Property {properties.findIndex((p) => p.id.toString() === selectedPropertyId) + 1} of {properties.length}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Swiper-based position selector for mortgage payments
 */
function PositionSwiperSelector({
  positions,
  selectedPositionId,
  onPositionSelect,
  propertyMetadata,
}: {
  positions: Position[];
  selectedPositionId: string;
  onPositionSelect: (id: number) => void;
  propertyMetadata: Map<number, PropertyMetadata>;
}) {
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);

  // Find initial slide index based on selected position
  const initialSlide = selectedPositionId
    ? positions.findIndex((p) => p.tokenId.toString() === selectedPositionId)
    : 0;

  const handleSlideChange = (swiper: SwiperType) => {
    const position = positions[swiper.activeIndex];
    if (position) {
      onPositionSelect(position.tokenId);
    }
  };

  // Sync swiper position when selectedPositionId changes externally
  useEffect(() => {
    if (swiperRef && selectedPositionId) {
      const index = positions.findIndex((p) => p.tokenId.toString() === selectedPositionId);
      if (index !== -1 && swiperRef.activeIndex !== index) {
        swiperRef.slideTo(index);
      }
    }
  }, [selectedPositionId, positions, swiperRef]);

  // Auto-select first position if none selected
  useEffect(() => {
    if (!selectedPositionId && positions.length > 0 && positions[0]) {
      onPositionSelect(positions[0].tokenId);
    }
  }, [positions, selectedPositionId, onPositionSelect]);

  const selectedPosition = positions.find((p) => p.tokenId.toString() === selectedPositionId);
  const progressPercent = selectedPosition
    ? Number(selectedPosition.paymentsCompleted) / Number(selectedPosition.termPeriods) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Mobile: Card Stack Effect */}
      <div className="lg:hidden">
        <Swiper
          effect="cards"
          grabCursor
          modules={[EffectCards]}
          className="mortgage-property-swiper"
          cardsEffect={{
            perSlideOffset: 6,
            perSlideRotate: 1.5,
            slideShadows: true,
          }}
          onSlideChange={handleSlideChange}
          onSwiper={setSwiperRef}
          initialSlide={initialSlide >= 0 ? initialSlide : 0}
        >
          {positions.map((position) => (
            <SwiperSlide key={position.tokenId}>
              <PropertyCard
                position={position}
                isSelected={position.tokenId.toString() === selectedPositionId}
                metadata={propertyMetadata.get(Number(position.propertyId))}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop: Horizontal Slider with Navigation */}
      <div className="hidden lg:block relative">
        <Swiper
          slidesPerView={1.5}
          spaceBetween={16}
          centeredSlides={true}
          grabCursor
          modules={[Navigation, Pagination]}
          navigation={{
            prevEl: ".position-swiper-prev",
            nextEl: ".position-swiper-next",
          }}
          pagination={{ clickable: true }}
          className="mortgage-property-swiper-horizontal"
          onSlideChange={handleSlideChange}
          onSwiper={setSwiperRef}
          initialSlide={initialSlide >= 0 ? initialSlide : 0}
        >
          {positions.map((position) => (
            <SwiperSlide key={position.tokenId}>
              <PropertyCard
                position={position}
                isSelected={position.tokenId.toString() === selectedPositionId}
                metadata={propertyMetadata.get(Number(position.propertyId))}
              />
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Custom Navigation Buttons */}
        <button className="position-swiper-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-muted transition-colors disabled:opacity-50">
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <button className="position-swiper-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-muted transition-colors disabled:opacity-50">
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="text-center text-sm text-muted-foreground">
        {selectedPositionId && (
          <span>
            Position {positions.findIndex((p) => p.tokenId.toString() === selectedPositionId) + 1} of {positions.length}
          </span>
        )}
      </div>

      {/* Position details - shown below swiper */}
      {selectedPosition && (
        <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4 space-y-3">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Number(selectedPosition.paymentsCompleted)}/{Number(selectedPosition.termPeriods)} payments
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span><PrettyAmount amountFormatted={progressPercent} variant="percentage" size="xs" normalPrecision={0} /> complete</span>
              <span>{Number(selectedPosition.termPeriods - selectedPosition.paymentsCompleted)} remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Original</div>
              <div className="font-semibold">$<PrettyAmount amountFormatted={formatUSD(selectedPosition.principal)} size="base" /></div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div className="font-bold text-primary">$<PrettyAmount amountFormatted={formatUSD(selectedPosition.remainingPrincipal)} size="base" /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TERM_OPTIONS = [10, 15, 20, 25, 30];

/**
 * Button-based term period selector
 */
function TermSelector({
  termPeriods,
  onTermChange,
}: {
  termPeriods: string;
  onTermChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {TERM_OPTIONS.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => onTermChange(term.toString())}
          className={`rounded-lg border-2 py-2.5 px-2 text-center transition-all ${
            term.toString() === termPeriods
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border bg-card hover:border-primary/50"
          }`}
        >
          <span className={`text-base sm:text-lg font-bold block ${term.toString() === termPeriods ? "text-primary" : "text-foreground"}`}>
            {term}
          </span>
        </button>
      ))}
    </div>
  );
}

function CreateMortgageForm() {
  const { address, publicClient, walletClient, account } = useWeb3();
  const addresses = getContractAddresses();

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyMetadata, setPropertyMetadata] = useState<Map<number, PropertyMetadata>>(new Map());
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [downPaymentPercent, setDownPaymentPercent] = useState("20");
  const [termPeriods, setTermPeriods] = useState("15");
  const [preview, setPreview] = useState<MortgagePreview | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [allowance, setAllowance] = useState<bigint | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Fetch properties and metadata from contract
  const fetchProperties = useCallback(async () => {
    if (!publicClient) return;
    try {
      const totalCount = await publicClient.readContract({
        address: addresses.propertyOracle,
        abi: PropertyOracleAbi,
        functionName: "totalProperties",
      }) as bigint;

      const props: Property[] = [];
      let metadataUri: string | null = null;

      for (let i = 0; i < Number(totalCount); i++) {
        const property = await publicClient.readContract({
          address: addresses.propertyOracle,
          abi: PropertyOracleAbi,
          functionName: "getProperty",
          args: [BigInt(i)],
        }) as { location: string; currentValuation: bigint; isActive: boolean; metadataURI: string };

        if (property.isActive) {
          props.push({ id: i, location: property.location, currentValuation: property.currentValuation, isActive: property.isActive });
        }

        // Get metadataURI from first property (all share same URI)
        if (!metadataUri && property.metadataURI) {
          metadataUri = property.metadataURI;
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
    }
  }, [publicClient, addresses.propertyOracle]);

  // Fetch whitelist status
  const fetchWhitelistStatus = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const status = await publicClient.readContract({
        address: addresses.whitelistRegistry,
        abi: [{ type: "function", name: "isWhitelisted", inputs: [{ type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" }],
        functionName: "isWhitelisted",
        args: [address],
      }) as boolean;
      setIsWhitelisted(status);
    } catch (err) {
      console.error("Failed to check whitelist:", err);
    }
  }, [publicClient, address, addresses.whitelistRegistry]);

  // Fetch balance and allowance
  const fetchBalanceAndAllowance = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const bal = await publicClient.readContract({
        address: addresses.mockUSD,
        abi: MockUSDAbi,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
      setBalance(bal);

      const allow = await publicClient.readContract({
        address: addresses.mockUSD,
        abi: MockUSDAbi,
        functionName: "allowance",
        args: [address, addresses.mortgageFactory],
      }) as bigint;
      setAllowance(allow);
    } catch (err) {
      console.error("Failed to fetch balance/allowance:", err);
    }
  }, [publicClient, address, addresses.mockUSD, addresses.mortgageFactory]);

  // Fetch mortgage preview
  const fetchPreview = useCallback(async () => {
    if (!publicClient || !selectedPropertyId) {
      setPreview(null);
      return;
    }
    try {
      const downPaymentBps = parseBps(parseFloat(downPaymentPercent));
      const result = await publicClient.readContract({
        address: addresses.mortgageFactory,
        abi: MortgageFactoryAbi,
        functionName: "previewMortgage",
        args: [BigInt(selectedPropertyId), BigInt(downPaymentBps), BigInt(termPeriods)],
      }) as [bigint, bigint, bigint, bigint, bigint, bigint];
      setPreview({
        principal: result[0],
        downPayment: result[1],
        rateBps: result[2],
        paymentPerPeriod: result[3],
        totalPayment: result[4],
        totalInterest: result[5],
      });
    } catch (err) {
      console.error("Failed to fetch preview:", err);
      setPreview(null);
    }
  }, [publicClient, selectedPropertyId, downPaymentPercent, termPeriods, addresses.mortgageFactory]);

  useEffect(() => {
    fetchProperties();
    fetchWhitelistStatus();
    fetchBalanceAndAllowance();
  }, [fetchProperties, fetchWhitelistStatus, fetchBalanceAndAllowance]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Approve tokens
  const approveTokens = async () => {
    if (!walletClient || !account || !preview) return;
    setIsApproving(true);
    setTxError(null);
    try {
      const data = encodeFunctionData({
        abi: MockUSDAbi,
        functionName: "approve",
        args: [addresses.mortgageFactory, preview.downPayment * 2n], // Approve extra for payments
      });
      const hash = await walletClient.sendTransaction({
        to: addresses.mockUSD,
        data,
        account,
        chain: anvilChain,
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchBalanceAndAllowance();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  // Create mortgage
  const createMortgage = async () => {
    if (!walletClient || !account || !selectedPropertyId || !preview) return;
    setIsLoading(true);
    setTxHash(null);
    setTxError(null);
    try {
      const downPaymentBps = parseBps(parseFloat(downPaymentPercent));
      const data = encodeFunctionData({
        abi: MortgageFactoryAbi,
        functionName: "createMortgage",
        args: [
          BigInt(selectedPropertyId),
          BigInt(downPaymentBps),
          BigInt(termPeriods),
          "ipfs://mock-legal-contract-uri",
        ],
      });
      const hash = await walletClient.sendTransaction({
        to: addresses.mortgageFactory,
        data,
        account,
        chain: anvilChain,
      });
      setTxHash(hash);
      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchBalanceAndAllowance();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id.toString() === selectedPropertyId);
  const needsApproval = !!(preview && allowance !== null && allowance < preview.downPayment);
  const insufficientBalance = !!(preview && balance !== null && balance < preview.downPayment);

  return (
    <Card isGlass className="shadow-xl border-border/50 transition-shadow hover:shadow-2xl">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Create New Mortgage</CardTitle>
            <CardDescription>Select a property and configure your mortgage terms</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Whitelist check */}
        {isWhitelisted === false && (
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-yellow-500">Not Whitelisted</p>
                <p className="text-sm text-muted-foreground">You must be whitelisted to create mortgages. Contact an admin.</p>
              </div>
            </div>
          </div>
        )}

        {/* Property selection with Swiper */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Select Property
          </Label>
          {properties.length === 0 ? (
            <div className="rounded-lg bg-muted/30 border border-border p-6 text-center">
              <p className="text-muted-foreground">No properties available</p>
            </div>
          ) : (
            <PropertySwiperSelector
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onPropertySelect={(id) => setSelectedPropertyId(id.toString())}
              propertyMetadata={propertyMetadata}
            />
          )}
        </div>

        {/* Down payment and Term in grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Down payment */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Percent className="w-4 h-4 text-muted-foreground" />
              Down Payment
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="20"
                max="80"
                step="1"
                value={downPaymentPercent}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for typing, but clamp on blur
                  if (value === "") {
                    setDownPaymentPercent(value);
                    return;
                  }
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    // Clamp value between 20 and 80
                    const clampedValue = Math.min(80, Math.max(20, numValue));
                    setDownPaymentPercent(clampedValue.toString());
                  }
                }}
                onBlur={() => {
                  // Ensure valid value on blur
                  const numValue = parseFloat(downPaymentPercent);
                  if (isNaN(numValue) || numValue < 20) {
                    setDownPaymentPercent("20");
                  } else if (numValue > 80) {
                    setDownPaymentPercent("80");
                  }
                }}
                className="h-12 bg-muted/30 border-border pr-8 hover:bg-muted/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">20% - 80%</p>
          </div>

          {/* Term */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Term Length
            </Label>
            <TermSelector
              termPeriods={termPeriods}
              onTermChange={setTermPeriods}
            />
            <p className="text-xs text-muted-foreground">1 period = 1 minute (MVP testing)</p>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calculator className="w-4 h-4 text-primary" />
              Mortgage Preview
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" />
                  Down Payment
                </div>
                <div className="text-xl font-bold text-primary">$<PrettyAmount amountFormatted={formatUSD(preview.downPayment)} size="xl" /></div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Banknote className="w-3 h-3" />
                  Loan Principal
                </div>
                <div className="text-xl font-bold">$<PrettyAmount amountFormatted={formatUSD(preview.principal)} size="xl" /></div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Percent className="w-3 h-3" />
                  Interest Rate
                </div>
                <div className="text-lg font-semibold">{formatBps(preview.rateBps)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Payment/Period
                </div>
                <div className="text-lg font-semibold">$<PrettyAmount amountFormatted={formatUSD(preview.paymentPerPeriod)} size="lg" /></div>
              </div>
            </div>
            <div className="pt-3 border-t border-primary/20 grid sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Payment</span>
                <span className="font-semibold">$<PrettyAmount amountFormatted={formatUSD(preview.totalPayment)} size="sm" /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Interest</span>
                <span className="font-semibold text-primary">$<PrettyAmount amountFormatted={formatUSD(preview.totalInterest)} size="sm" /></span>
              </div>
            </div>
          </div>
        )}

        {/* Balance info */}
        {balance !== null && (
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="w-4 h-4" />
                Your Balance
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${insufficientBalance ? "text-red-500" : "text-foreground"}`}>
                  $<PrettyAmount amountFormatted={formatUSD(balance)} size="sm" /> mUSD
                </span>
                {insufficientBalance && (
                  <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Insufficient</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transaction status */}
        {txHash && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-green-500">Mortgage created successfully!</p>
                <p className="font-mono text-xs text-muted-foreground break-all">{txHash}</p>
              </div>
            </div>
          </div>
        )}
        {txError && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-red-500">Transaction failed</p>
                <p className="text-xs text-muted-foreground">{txError}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
        {needsApproval && (
          <Button
            onClick={approveTokens}
            disabled={isApproving || !isWhitelisted}
            variant="outline"
            className="w-full sm:w-auto h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base hover:shadow-md transition-all"
          >
            {isApproving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Tokens
              </>
            )}
          </Button>
        )}
        <Button
          onClick={createMortgage}
          disabled={isLoading || !preview || isWhitelisted !== true || insufficientBalance === true || needsApproval}
          className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
          size="lg"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Create Mortgage
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function MakePaymentsForm() {
  const { address, publicClient, walletClient, account } = useWeb3();
  const addresses = getContractAddresses();

  const [positions, setPositions] = useState<Position[]>([]);
  const [propertyMetadata, setPropertyMetadata] = useState<Map<number, PropertyMetadata>>(new Map());
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [numPayments, setNumPayments] = useState("1");
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Fetch property metadata from contract
  const fetchPropertyMetadata = useCallback(async () => {
    if (!publicClient) return;
    try {
      // Get metadataURI from first property (all share same URI)
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

  // Fetch user's positions
  const fetchPositions = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const tokenIds = await publicClient.readContract({
        address: addresses.mortgagePositionNFT,
        abi: MortgagePositionNFTAbi,
        functionName: "getUserPositions",
        args: [address],
      }) as bigint[];

      const positionList: Position[] = [];
      for (const tokenId of tokenIds) {
        const position = await publicClient.readContract({
          address: addresses.mortgagePositionNFT,
          abi: MortgagePositionNFTAbi,
          functionName: "getPosition",
          args: [tokenId],
        }) as {
          propertyId: bigint;
          principal: bigint;
          paymentPerPeriod: bigint;
          remainingPrincipal: bigint;
          paymentsCompleted: bigint;
          termPeriods: bigint;
          isActive: boolean;
        };
        if (position.isActive) {
          positionList.push({ tokenId: Number(tokenId), ...position });
        }
      }
      setPositions(positionList);
    } catch (err) {
      console.error("Failed to fetch positions:", err);
    }
  }, [publicClient, address, addresses.mortgagePositionNFT]);

  // Fetch balance and allowance
  const fetchBalanceAndAllowance = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const bal = await publicClient.readContract({
        address: addresses.mockUSD,
        abi: MockUSDAbi,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
      setBalance(bal);

      const allow = await publicClient.readContract({
        address: addresses.mockUSD,
        abi: MockUSDAbi,
        functionName: "allowance",
        args: [address, addresses.mortgageFactory],
      }) as bigint;
      setAllowance(allow);
    } catch (err) {
      console.error("Failed to fetch balance/allowance:", err);
    }
  }, [publicClient, address, addresses.mockUSD, addresses.mortgageFactory]);

  useEffect(() => {
    fetchPropertyMetadata();
    fetchPositions();
    fetchBalanceAndAllowance();
  }, [fetchPropertyMetadata, fetchPositions, fetchBalanceAndAllowance]);

  const selectedPosition = positions.find(p => p.tokenId.toString() === selectedPositionId);
  const totalPaymentNeeded = selectedPosition ? selectedPosition.paymentPerPeriod * BigInt(numPayments) : 0n;
  const needsApproval = allowance !== null && allowance < totalPaymentNeeded;
  const insufficientBalance = balance !== null && balance < totalPaymentNeeded;

  // Approve tokens
  const approveTokens = async () => {
    if (!walletClient || !account) return;
    setIsApproving(true);
    setTxError(null);
    try {
      const data = encodeFunctionData({
        abi: MockUSDAbi,
        functionName: "approve",
        args: [addresses.mortgageFactory, totalPaymentNeeded * 10n], // Approve more for future payments
      });
      const hash = await walletClient.sendTransaction({
        to: addresses.mockUSD,
        data,
        account,
        chain: anvilChain,
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchBalanceAndAllowance();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  // Make payment(s)
  const makePayment = async () => {
    if (!walletClient || !account || !selectedPositionId) return;
    setIsLoading(true);
    setTxHash(null);
    setTxError(null);
    try {
      const num = parseInt(numPayments);
      let data: `0x${string}`;
      if (num === 1) {
        data = encodeFunctionData({
          abi: MortgageFactoryAbi,
          functionName: "makePayment",
          args: [BigInt(selectedPositionId)],
        });
      } else {
        data = encodeFunctionData({
          abi: MortgageFactoryAbi,
          functionName: "makeMultiplePayments",
          args: [BigInt(selectedPositionId), BigInt(num)],
        });
      }
      const hash = await walletClient.sendTransaction({
        to: addresses.mortgageFactory,
        data,
        account,
        chain: anvilChain,
      });
      setTxHash(hash);
      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchPositions();
      await fetchBalanceAndAllowance();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress percentage
  const progressPercent = selectedPosition
    ? Number(selectedPosition.paymentsCompleted) / Number(selectedPosition.termPeriods) * 100
    : 0;

  return (
    <Card isGlass className="shadow-xl border-border/50 transition-shadow hover:shadow-2xl">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Make Payments</CardTitle>
            <CardDescription>Pay down your mortgage positions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {positions.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground font-medium">No Active Positions</p>
              <p className="text-sm text-muted-foreground">You don't have any active mortgage positions yet.</p>
              <p className="text-sm text-muted-foreground">Create a mortgage to get started.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Position selection with Swiper */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Select Position
              </Label>
              <PositionSwiperSelector
                positions={positions}
                selectedPositionId={selectedPositionId}
                onPositionSelect={(id) => setSelectedPositionId(id.toString())}
                propertyMetadata={propertyMetadata}
              />
            </div>

            {/* Number of payments */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="w-4 h-4 text-muted-foreground" />
                Number of Payments
              </Label>
              <Input
                type="number"
                min="1"
                max={selectedPosition ? Number(selectedPosition.termPeriods - selectedPosition.paymentsCompleted) : 30}
                value={numPayments}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setNumPayments(value);
                    return;
                  }
                  const numValue = parseInt(value, 10);
                  const maxPayments = selectedPosition
                    ? Number(selectedPosition.termPeriods - selectedPosition.paymentsCompleted)
                    : 30;
                  if (!isNaN(numValue)) {
                    const clampedValue = Math.min(maxPayments, Math.max(1, numValue));
                    setNumPayments(clampedValue.toString());
                  }
                }}
                onBlur={() => {
                  const numValue = parseInt(numPayments, 10);
                  if (isNaN(numValue) || numValue < 1) {
                    setNumPayments("1");
                  }
                }}
                className="h-12 bg-muted/30 border-border hover:bg-muted/50 transition-colors"
              />
              {selectedPosition && (
                <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Payment</span>
                  <div className="text-right">
                    <span className="font-semibold text-primary">$<PrettyAmount amountFormatted={formatUSD(totalPaymentNeeded)} size="sm" /></span>
                    {parseInt(numPayments) > 1 && (
                      <span className="text-xs text-muted-foreground block">
                        {numPayments} x $<PrettyAmount amountFormatted={formatUSD(selectedPosition.paymentPerPeriod)} size="xs" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Balance info */}
            {balance !== null && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="w-4 h-4" />
                    Your Balance
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${insufficientBalance ? "text-red-500" : "text-foreground"}`}>
                      $<PrettyAmount amountFormatted={formatUSD(balance)} size="sm" /> mUSD
                    </span>
                    {insufficientBalance && (
                      <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Insufficient</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction status */}
            {txHash && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-green-500">Payment successful!</p>
                    <p className="font-mono text-xs text-muted-foreground break-all">{txHash}</p>
                  </div>
                </div>
              </div>
            )}
            {txError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-red-500">Transaction failed</p>
                    <p className="text-xs text-muted-foreground">{txError}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      {positions.length > 0 && (
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
          {needsApproval && (
            <Button
              onClick={approveTokens}
              disabled={isApproving}
              variant="outline"
              className="w-full sm:w-auto h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base hover:shadow-md transition-all"
            >
              {isApproving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Tokens
                </>
              )}
            </Button>
          )}
          <Button
            onClick={makePayment}
            disabled={isLoading || !selectedPositionId || insufficientBalance || needsApproval}
            className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
            size="lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Make {numPayments} Payment{parseInt(numPayments) > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default Payments;
