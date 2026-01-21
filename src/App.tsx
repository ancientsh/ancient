import { useState } from "react";
import { Web3Provider, useWeb3, useAnvilAccounts } from "./contracts";
import { Faucet } from "./pages/Faucet";
import { Dashboard } from "./pages/Dashboard";
import { Mortgage } from "./pages/Mortgage";
import { Landing } from "./pages/Landing";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "./index.css";

type Page = "landing" | "faucet" | "dashboard" | "mortgage";

function Navigation({ currentPage, setPage }: { currentPage: Page; setPage: (p: Page) => void }) {
  const { address, accountIndex, switchAccount, isConnected } = useWeb3();
  const accounts = useAnvilAccounts();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 w-full items-center justify-between px-4 lg:px-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage("landing")}
            className="text-xl font-bold text-foreground transition-colors hover:text-primary cursor-pointer"
          >
            Ancient
          </button>
          {currentPage !== "landing" && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
              MVP
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          {currentPage === "landing" ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setPage("faucet")}
            >
              Launch App
            </Button>
          ) : (
            <>
              <Button
                variant={currentPage === "faucet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage("faucet")}
                className="text-foreground"
              >
                Faucet
              </Button>
              <Button
                variant={currentPage === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage("dashboard")}
                className="text-foreground"
              >
                Dashboard
              </Button>
              <Button
                variant={currentPage === "mortgage" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage("mortgage")}
                className="text-foreground"
              >
                Mortgage
              </Button>
            </>
          )}
        </div>

        {/* Account Selector - only show in MVP pages */}
        {isConnected && currentPage !== "landing" && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">Account:</span>
            <Select
              value={accountIndex.toString()}
              onValueChange={(v) => switchAccount(parseInt(v))}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs font-mono bg-muted/50 border-border hover:bg-muted transition-colors">
                <SelectValue>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
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
  const [currentPage, setPage] = useState<Page>("landing");

  if (currentPage === "landing") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation currentPage={currentPage} setPage={setPage} />
        <Landing onNavigateToMVP={() => setPage("faucet")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation currentPage={currentPage} setPage={setPage} />

      {/* Main content with top padding to account for fixed navbar */}
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8 lg:px-12">
          {currentPage === "faucet" && <Faucet />}
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "mortgage" && <Mortgage />}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground bg-card/50">
        <div className="container mx-auto px-4">
          Ancient Protocol MVP — Local Anvil Chain
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Web3Provider>
      <div className="flex flex-col min-h-screen">
        <AppContent />
      </div>
    </Web3Provider>
  );
}

export default App;
