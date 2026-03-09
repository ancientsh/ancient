// Create Mortgage Form - Shared component for creating mortgages
import { useState, useEffect, useCallback } from "react";
import { encodeFunctionData } from "viem";
import { toast } from "sonner";
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
  MockUSDAbi,
  getContractAddresses,
  anvilChain,
} from "../../contracts";
import { PropertyCard, type PropertyMetadata } from "@/components/properties/PropertyCard";
import { KycModal } from "@/components/mortgage/KycModal";
import {
  Building2,
  Calculator,
  Wallet,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Clock,
  Percent,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Shield,
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

const TERM_OPTIONS = [10, 15, 20, 25, 30];

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

interface CreateMortgageFormProps {
  /** Whether to wrap the form in a Card container */
  showCard?: boolean;
  /** Callback fired after successful mortgage creation */
  onSuccess?: () => void;
}

export function CreateMortgageForm({ showCard = true, onSuccess }: CreateMortgageFormProps) {
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
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);

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
      toast.success("Tokens approved!");
    } catch (err) {
      toast.error("Approval failed", {
        description: err instanceof Error ? err.message : "Approval failed",
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Create mortgage
  const createMortgage = async () => {
    // Show KYC modal first if not verified
    if (!kycVerified) {
      setKycModalOpen(true);
      return;
    }

    if (!walletClient || !account || !selectedPropertyId || !preview) return;
    setIsLoading(true);
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
      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchBalanceAndAllowance();
      toast.success("Mortgage created successfully!", {
        description: hash,
      });
      onSuccess?.();
    } catch (err) {
      toast.error("Transaction failed", {
        description: err instanceof Error ? err.message : "Transaction failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle KYC completion
  const handleKycContinue = () => {
    setKycVerified(true);
    setKycModalOpen(false);
    // Proceed with mortgage creation after KYC
    createMortgage();
  };

  const selectedProperty = properties.find(p => p.id.toString() === selectedPropertyId);
  const needsApproval = !!(preview && allowance !== null && allowance < preview.downPayment);
  const insufficientBalance = !!(preview && balance !== null && balance < preview.downPayment);

  // Form content (shared between Card and non-Card variants)
  const formContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Create New Mortgage</h2>
          <p className="text-sm text-muted-foreground">Select a property and configure your mortgage terms</p>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6 pt-4">
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

      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
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
        <div className="flex-1 flex flex-col gap-2">
          <Button
            onClick={createMortgage}
            disabled={isLoading || !preview || isWhitelisted !== true || insufficientBalance === true || needsApproval}
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
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
                {kycVerified ? "Create Mortgage" : "Verify Identity & Create Mortgage"}
              </>
            )}
          </Button>
          {!kycVerified && (
            <p className="text-xs text-muted-foreground text-center">
              <Shield className="w-3 h-3 inline mr-1" />
              Quick identity verification required before purchase
            </p>
          )}
        </div>
      </div>
    </>
  );

  if (showCard) {
    return (
      <>
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
                    if (value === "") {
                      setDownPaymentPercent(value);
                      return;
                    }
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      const clampedValue = Math.min(80, Math.max(20, numValue));
                      setDownPaymentPercent(clampedValue.toString());
                    }
                  }}
                  onBlur={() => {
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
          <div className="flex-1 flex flex-col gap-2 w-full sm:w-auto">
            <Button
              onClick={createMortgage}
              disabled={isLoading || !preview || isWhitelisted !== true || insufficientBalance === true || needsApproval}
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
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
                  {kycVerified ? "Create Mortgage" : "Verify Identity & Create Mortgage"}
                </>
              )}
            </Button>
            {!kycVerified && (
              <p className="text-xs text-muted-foreground text-center">
                <Shield className="w-3 h-3 inline mr-1" />
                Quick identity verification required before purchase
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
      <KycModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        onContinue={handleKycContinue}
      />
    </>
  );
  }

  // Non-card variant
  return (
    <>
      <div className="space-y-6">
        {formContent}
      </div>
      <KycModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        onContinue={handleKycContinue}
      />
    </>
  );
}

export default CreateMortgageForm;
