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
  parseUSD,
  formatBps,
  parseBps,
  PropertyOracleAbi,
  MortgageFactoryAbi,
  MortgagePositionNFTAbi,
  MockUSDAbi,
  getContractAddresses,
  anvilChain,
} from "../contracts";

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
  const { isConnected, isConnecting, error, address, publicClient, walletClient, account } = useWeb3();
  const [activeTab, setActiveTab] = useState<"create" | "pay">("create");

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
          <CardTitle>Mortgage</CardTitle>
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "create" ? "default" : "outline"}
          onClick={() => setActiveTab("create")}
        >
          Create Mortgage
        </Button>
        <Button
          variant={activeTab === "pay" ? "default" : "outline"}
          onClick={() => setActiveTab("pay")}
        >
          Make Payments
        </Button>
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
    <Card>
      <CardHeader>
        <CardTitle>Create New Mortgage</CardTitle>
        <CardDescription>Select a property and configure your mortgage terms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Whitelist check */}
        {isWhitelisted === false && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded">
            <p className="font-medium">Not Whitelisted</p>
            <p className="text-sm">You must be whitelisted to create mortgages. Contact an admin.</p>
          </div>
        )}

        {/* Property selection */}
        <div className="space-y-2">
          <Label>Property</Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a property" />
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
            <p className="text-sm text-muted-foreground">
              Value: ${formatUSD(selectedProperty.currentValuation)}
            </p>
          )}
        </div>

        {/* Down payment */}
        <div className="space-y-2">
          <Label>Down Payment (%)</Label>
          <Input
            type="number"
            min="20"
            max="80"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Minimum 20%</p>
        </div>

        {/* Term */}
        <div className="space-y-2">
          <Label>Term (Periods)</Label>
          <Select value={termPeriods} onValueChange={setTermPeriods}>
            <SelectTrigger>
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

        {/* Preview */}
        {preview && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">Mortgage Preview</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Down Payment:</span>
              <span className="font-medium">${formatUSD(preview.downPayment)}</span>
              <span className="text-muted-foreground">Loan Principal:</span>
              <span className="font-medium">${formatUSD(preview.principal)}</span>
              <span className="text-muted-foreground">Interest Rate:</span>
              <span className="font-medium">{formatBps(preview.rateBps)}</span>
              <span className="text-muted-foreground">Payment/Period:</span>
              <span className="font-medium">${formatUSD(preview.paymentPerPeriod)}</span>
              <span className="text-muted-foreground">Total Payment:</span>
              <span className="font-medium">${formatUSD(preview.totalPayment)}</span>
              <span className="text-muted-foreground">Total Interest:</span>
              <span className="font-medium">${formatUSD(preview.totalInterest)}</span>
            </div>
          </div>
        )}

        {/* Balance info */}
        {balance !== null && (
          <div className="text-sm">
            <span className="text-muted-foreground">Your Balance: </span>
            <span className={insufficientBalance ? "text-red-600 font-medium" : ""}>
              ${formatUSD(balance)} mUSD
            </span>
            {insufficientBalance && (
              <span className="text-red-600 ml-2">(Need more tokens - use Faucet)</span>
            )}
          </div>
        )}

        {/* Transaction status */}
        {txHash && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded">
            <p className="font-medium">Mortgage created successfully!</p>
            <p className="font-mono text-xs break-all mt-1">{txHash}</p>
          </div>
        )}
        {txError && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
            <p className="font-medium">Transaction failed</p>
            <p className="text-xs mt-1">{txError}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {needsApproval && (
          <Button onClick={approveTokens} disabled={isApproving || !isWhitelisted} variant="outline">
            {isApproving ? "Approving..." : "Approve Tokens"}
          </Button>
        )}
        <Button
          onClick={createMortgage}
          disabled={isLoading || !preview || isWhitelisted !== true || insufficientBalance === true || needsApproval}
          className="flex-1"
        >
          {isLoading ? "Creating..." : "Create Mortgage"}
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make Payments</CardTitle>
        <CardDescription>Pay down your mortgage positions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>You don't have any active mortgage positions.</p>
            <p className="text-sm mt-2">Create a mortgage first.</p>
          </div>
        ) : (
          <>
            {/* Position selection */}
            <div className="space-y-2">
              <Label>Mortgage Position</Label>
              <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
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
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Position Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Principal:</span>
                  <span className="font-medium">${formatUSD(selectedPosition.principal)}</span>
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium">${formatUSD(selectedPosition.remainingPrincipal)}</span>
                  <span className="text-muted-foreground">Payment Amount:</span>
                  <span className="font-medium">${formatUSD(selectedPosition.paymentPerPeriod)}</span>
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">
                    {Number(selectedPosition.paymentsCompleted)}/{Number(selectedPosition.termPeriods)} payments
                  </span>
                </div>
              </div>
            )}

            {/* Number of payments */}
            <div className="space-y-2">
              <Label>Number of Payments</Label>
              <Input
                type="number"
                min="1"
                max={selectedPosition ? Number(selectedPosition.termPeriods - selectedPosition.paymentsCompleted) : 30}
                value={numPayments}
                onChange={(e) => setNumPayments(e.target.value)}
              />
              {selectedPosition && (
                <p className="text-sm text-muted-foreground">
                  Total: ${formatUSD(totalPaymentNeeded)}
                  {parseInt(numPayments) > 1 && ` (${numPayments} x ${formatUSD(selectedPosition.paymentPerPeriod)})`}
                </p>
              )}
            </div>

            {/* Balance info */}
            {balance !== null && (
              <div className="text-sm">
                <span className="text-muted-foreground">Your Balance: </span>
                <span className={insufficientBalance ? "text-red-600 font-medium" : ""}>
                  ${formatUSD(balance)} mUSD
                </span>
                {insufficientBalance && (
                  <span className="text-red-600 ml-2">(Insufficient - use Faucet)</span>
                )}
              </div>
            )}

            {/* Transaction status */}
            {txHash && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded">
                <p className="font-medium">Payment successful!</p>
                <p className="font-mono text-xs break-all mt-1">{txHash}</p>
              </div>
            )}
            {txError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
                <p className="font-medium">Transaction failed</p>
                <p className="text-xs mt-1">{txError}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
      {positions.length > 0 && (
        <CardFooter className="flex gap-2">
          {needsApproval && (
            <Button onClick={approveTokens} disabled={isApproving} variant="outline">
              {isApproving ? "Approving..." : "Approve Tokens"}
            </Button>
          )}
          <Button
            onClick={makePayment}
            disabled={isLoading || !selectedPositionId || insufficientBalance || needsApproval}
            className="flex-1"
          >
            {isLoading ? "Processing..." : `Make ${numPayments} Payment${parseInt(numPayments) > 1 ? "s" : ""}`}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default Mortgage;
