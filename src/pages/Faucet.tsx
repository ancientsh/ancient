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
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>MockUSD Faucet</CardTitle>
          <CardDescription>Connecting to local chain...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>MockUSD Faucet</CardTitle>
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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>MockUSD Faucet</CardTitle>
        <CardDescription>
          Get test tokens for the Ancient Protocol MVP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account info */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Connected Account</p>
          <p className="font-mono text-sm bg-muted px-3 py-2 rounded break-all">
            {address}
          </p>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-3xl font-bold">
            {balance !== null ? `$${formatUSD(balance)}` : "Loading..."}
          </p>
          <p className="text-sm text-muted-foreground">mUSD</p>
        </div>

        {/* Faucet info */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount per claim</span>
            <span className="font-semibold">
              {faucetAmount ? `$${formatUSD(faucetAmount)}` : "10,000"} mUSD
            </span>
          </div>

          <Button
            onClick={claimTokens}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Claiming..." : "Claim Test Tokens"}
          </Button>

          {/* Transaction result */}
          {txHash && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded">
              <p className="font-medium">Transaction confirmed!</p>
              <p className="font-mono text-xs break-all mt-1">{txHash}</p>
            </div>
          )}

          {txError && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
              <p className="font-medium">Transaction failed</p>
              <p className="text-xs mt-1">{txError}</p>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground text-center">
          These are test tokens on a local Anvil chain.
          <br />
          They have no real value.
        </p>
      </CardContent>
    </Card>
  );
}

export default Faucet;
