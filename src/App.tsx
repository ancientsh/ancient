import { useState } from "react";
import { Web3Provider, useWeb3, useAnvilAccounts } from "./contracts";
import { Faucet } from "./pages/Faucet";
import { Dashboard } from "./pages/Dashboard";
import { Mortgage } from "./pages/Mortgage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "./index.css";

type Page = "faucet" | "dashboard" | "mortgage";

function Navigation({ currentPage, setPage }: { currentPage: Page; setPage: (p: Page) => void }) {
  const { address, accountIndex, switchAccount, isConnected } = useWeb3();
  const accounts = useAnvilAccounts();

  return (
    <nav className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">Ancient Protocol</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded">MVP</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          <Button
            variant={currentPage === "faucet" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPage("faucet")}
          >
            Faucet
          </Button>
          <Button
            variant={currentPage === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </Button>
          <Button
            variant={currentPage === "mortgage" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPage("mortgage")}
          >
            Mortgage
          </Button>
        </div>

        {/* Account Selector */}
        {isConnected && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Account:</span>
            <Select
              value={accountIndex.toString()}
              onValueChange={(v) => switchAccount(parseInt(v))}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs font-mono">
                <SelectValue>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map(({ address: addr, index }) => (
                  <SelectItem key={index} value={index.toString()} className="text-xs font-mono">
                    #{index}: {addr.slice(0, 6)}...{addr.slice(-4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const [currentPage, setPage] = useState<Page>("faucet");

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation currentPage={currentPage} setPage={setPage} />

      <main className="flex-1 container mx-auto p-8">
        {currentPage === "faucet" && <Faucet />}
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "mortgage" && <Mortgage />}
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        Ancient Protocol MVP - Local Anvil Chain
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
