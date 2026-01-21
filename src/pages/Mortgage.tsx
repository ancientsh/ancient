// Mortgage page - Create position and make payments
import { useState, useEffect, useCallback } from "react";
import { encodeFunctionData } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Building2,
  Calculator,
  CreditCard,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Clock,
  Percent,
  AlertTriangle,
  FileText,
  Banknote,
} from "lucide-react";

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

export function Mortgage() {
  const { isConnected, isConnecting, error } = useWeb3();
  const [activeTab, setActiveTab] = useState<"create" | "pay">("create");

  if (isConnecting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <CardTitle className="text-2xl">Mortgage Portal</CardTitle>
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
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Mortgage Portal</CardTitle>
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
    <div className="max-w-3xl mx-auto space-y-8 px-4 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Mortgage Portal</h1>
        <p className="text-muted-foreground">Create new mortgages or make payments on existing positions</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "create"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Create Mortgage
        </button>
        <button
          onClick={() => setActiveTab("pay")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "pay"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Make Payments
        </button>
      </div>

      {activeTab === "create" && <CreateMortgageForm />}
      {activeTab === "pay" && <MakePaymentsForm />}
    </div>
  );
}

function CreateMortgageForm() {
  const { address, publicClient, walletClient, account } = useWeb3();
  const addresses = getContractAddresses();

  const [properties, setProperties] = useState<Property[]>([]);
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

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    if (!publicClient) return;
    try {
      const totalCount = await publicClient.readContract({
        address: addresses.propertyOracle,
        abi: PropertyOracleAbi,
        functionName: "totalProperties",
      }) as bigint;

      const props: Property[] = [];
      for (let i = 0; i < Number(totalCount); i++) {
        const property = await publicClient.readContract({
          address: addresses.propertyOracle,
          abi: PropertyOracleAbi,
          functionName: "getProperty",
          args: [BigInt(i)],
        }) as { location: string; currentValuation: bigint; isActive: boolean };
        if (property.isActive) {
          props.push({ id: i, ...property });
        }
      }
      setProperties(props);
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
    <Card className="shadow-xl border-border/50 transition-shadow hover:shadow-2xl">
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

        {/* Property selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Select Property
          </Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="h-12 bg-muted/30 border-border hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="Choose a property to finance" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id.toString()}>
                  #{prop.id}: ${formatUSD(prop.currentValuation)} - {prop.location.slice(0, 30)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProperty && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Property Value</span>
                <span className="font-semibold text-primary">${formatUSD(selectedProperty.currentValuation)}</span>
              </div>
            </div>
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
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(e.target.value)}
                className="h-12 bg-muted/30 border-border pr-8 hover:bg-muted/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 20%</p>
          </div>

          {/* Term */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Term Length
            </Label>
            <Select value={termPeriods} onValueChange={setTermPeriods}>
              <SelectTrigger className="h-12 bg-muted/30 border-border hover:bg-muted/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 25, 30].map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    {t} periods
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <div className="text-xl font-bold text-primary">${formatUSD(preview.downPayment)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Banknote className="w-3 h-3" />
                  Loan Principal
                </div>
                <div className="text-xl font-bold">${formatUSD(preview.principal)}</div>
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
                <div className="text-lg font-semibold">${formatUSD(preview.paymentPerPeriod)}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-primary/20 grid sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Payment</span>
                <span className="font-semibold">${formatUSD(preview.totalPayment)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Interest</span>
                <span className="font-semibold text-primary">${formatUSD(preview.totalInterest)}</span>
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
                  ${formatUSD(balance)} mUSD
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
      <CardFooter className="flex gap-3 pt-4 border-t border-border/50">
        {needsApproval && (
          <Button
            onClick={approveTokens}
            disabled={isApproving || !isWhitelisted}
            variant="outline"
            className="h-12 px-6 hover:shadow-md transition-all"
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
          className="flex-1 h-12 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
          size="lg"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Creating Mortgage...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-5 w-5" />
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
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [numPayments, setNumPayments] = useState("1");
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

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
    fetchPositions();
    fetchBalanceAndAllowance();
  }, [fetchPositions, fetchBalanceAndAllowance]);

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
    <Card className="shadow-xl border-border/50 transition-shadow hover:shadow-2xl">
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
            {/* Position selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Select Position
              </Label>
              <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                <SelectTrigger className="h-12 bg-muted/30 border-border hover:bg-muted/50 transition-colors">
                  <SelectValue placeholder="Choose a mortgage position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.tokenId} value={pos.tokenId.toString()}>
                      #{pos.tokenId}: ${formatUSD(pos.remainingPrincipal)} remaining ({Number(pos.paymentsCompleted)}/{Number(pos.termPeriods)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position details */}
            {selectedPosition && (
              <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Position Details
                  </div>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                    #{selectedPosition.tokenId}
                  </span>
                </div>

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
                    <span>{progressPercent.toFixed(0)}% complete</span>
                    <span>{Number(selectedPosition.termPeriods - selectedPosition.paymentsCompleted)} remaining</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Banknote className="w-3 h-3" />
                      Original Principal
                    </div>
                    <div className="text-lg font-semibold">${formatUSD(selectedPosition.principal)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3" />
                      Remaining Balance
                    </div>
                    <div className="text-lg font-bold text-primary">${formatUSD(selectedPosition.remainingPrincipal)}</div>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Payment Amount
                    </div>
                    <div className="text-lg font-semibold">${formatUSD(selectedPosition.paymentPerPeriod)} <span className="text-sm font-normal text-muted-foreground">per period</span></div>
                  </div>
                </div>
              </div>
            )}

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
                onChange={(e) => setNumPayments(e.target.value)}
                className="h-12 bg-muted/30 border-border hover:bg-muted/50 transition-colors"
              />
              {selectedPosition && (
                <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Payment</span>
                  <div className="text-right">
                    <span className="font-semibold text-primary">${formatUSD(totalPaymentNeeded)}</span>
                    {parseInt(numPayments) > 1 && (
                      <span className="text-xs text-muted-foreground block">
                        {numPayments} x ${formatUSD(selectedPosition.paymentPerPeriod)}
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
                      ${formatUSD(balance)} mUSD
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
        <CardFooter className="flex gap-3 pt-4 border-t border-border/50">
          {needsApproval && (
            <Button
              onClick={approveTokens}
              disabled={isApproving}
              variant="outline"
              className="h-12 px-6 hover:shadow-md transition-all"
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
            className="flex-1 h-12 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
            size="lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Make {numPayments} Payment{parseInt(numPayments) > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default Mortgage;
