// Payments page - Make mortgage payments
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
  Button,
  Input,
  PrettyAmount,
} from "liquidcn";
import { Label } from "liquidcn/client";
import {
  useWeb3,
  formatUSD,
  PropertyOracleAbi,
  MortgageFactoryAbi,
  MortgagePositionNFTAbi,
  MockUSDAbi,
  getContractAddresses,
  anvilChain,
} from "../contracts";
import { PropertyCard, type PropertyMetadata } from "@/components/properties/PropertyCard";
import {
  Calculator,
  CreditCard,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";

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
      <MakePaymentsForm />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Make Payments</h2>
          <p className="text-sm text-muted-foreground">Pay down your mortgage positions</p>
        </div>
      </div>

      {/* Content */}
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

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
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
          </div>
        </>
      )}
    </div>
  );
}

export default Payments;
