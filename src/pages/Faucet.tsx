// Faucet page - Get MockUSD test tokens
import { useState, useEffect, useCallback } from "react";
import { encodeFunctionData } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeb3, formatUSD, MockUSDAbi, getContractAddresses, anvilChain } from "../contracts";
import { PrettyAmount } from "@/components/ui/pretty-amount";
import { Coins, Wallet, RefreshCw, CheckCircle2, AlertCircle, Droplets } from "lucide-react";

export function Faucet() {
  const { isConnected, isConnecting, error, address, publicClient, walletClient, account } = useWeb3();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [faucetAmount, setFaucetAmount] = useState<bigint | null>(null);

  const addresses = getContractAddresses();

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicClient || !address) return;

    try {
      const bal = await publicClient.readContract({
        address: addresses.mockUSD,
        abi: MockUSDAbi,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
      setBalance(bal);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [publicClient, address, addresses.mockUSD]);

  // Fetch faucet amount
  const fetchFaucetAmount = useCallback(async () => {
    if (!publicClient) return;

    try {
      const amount = await publicClient.readContract({
        address: addresses.mockUSD,
        abi: MockUSDAbi,
        functionName: "FAUCET_AMOUNT",
      }) as bigint;
      setFaucetAmount(amount);
    } catch (err) {
      console.error("Failed to fetch faucet amount:", err);
    }
  }, [publicClient, addresses.mockUSD]);

  useEffect(() => {
    fetchBalance();
    fetchFaucetAmount();
  }, [fetchBalance, fetchFaucetAmount]);

  // Claim tokens from faucet
  const claimTokens = async () => {
    if (!walletClient || !account) return;

    setIsLoading(true);
    setTxHash(null);
    setTxError(null);

    try {
      const data = encodeFunctionData({
        abi: MockUSDAbi,
        functionName: "faucet",
      });

      const hash = await walletClient.sendTransaction({
        to: addresses.mockUSD,
        data,
        account,
        chain: anvilChain,
      });

      setTxHash(hash);

      // Wait for confirmation
      await publicClient?.waitForTransactionReceipt({ hash });

      // Refresh balance
      await fetchBalance();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setTxError(message);
      console.error("Faucet claim failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <CardTitle className="text-2xl">MockUSD Faucet</CardTitle>
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
              <CardTitle className="text-2xl">MockUSD Faucet</CardTitle>
              <CardDescription className="text-destructive mt-2">
                {error || "Not connected to local chain. Make sure Anvil is running."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Start Anvil with:
              </p>
              <code className="block bg-background px-3 py-2 rounded-md text-sm font-mono border border-border">
                anvil
              </code>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Deploy contracts with:
              </p>
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
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-border/50 transition-shadow hover:shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Droplets className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">MockUSD Faucet</CardTitle>
            <CardDescription className="mt-2">
              Get test tokens for the Ancient Protocol MVP
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Account info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Wallet className="w-3.5 h-3.5" />
              Connected Account
            </div>
            <p className="font-mono text-sm bg-background px-3 py-2 rounded-md break-all border border-border">
              {address}
            </p>
          </div>

          {/* Balance */}
          <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Coins className="w-3.5 h-3.5" />
              Current Balance
            </div>
            <p className="text-4xl font-bold text-primary">
              {balance !== null ? <>$<PrettyAmount amountFormatted={formatUSD(balance)} size="2xl" /></> : "Loading..."}
            </p>
            <p className="text-sm text-muted-foreground">mUSD</p>
          </div>

          {/* Faucet info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-sm text-muted-foreground">Amount per claim</span>
              <span className="font-semibold text-primary">
                {faucetAmount ? <>$<PrettyAmount amountFormatted={formatUSD(faucetAmount)} size="sm" /></> : "$10,000"} mUSD
              </span>
            </div>

            <Button
              onClick={claimTokens}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Droplets className="mr-2 h-5 w-5" />
                  Claim Test Tokens
                </>
              )}
            </Button>

            {/* Transaction result */}
            {txHash && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-green-500">Transaction confirmed!</p>
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
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            These are test tokens on a local Anvil chain.
            <br />
            They have no real value.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Faucet;
