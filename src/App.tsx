import { useState } from "react";
import { Web3Provider, useWeb3, useAnvilAccounts } from "./contracts";
import { Faucet } from "./pages/Faucet";
import { Dashboard } from "./pages/Dashboard";
import { Payments } from "./pages/Payments";
import { Landing } from "./pages/Landing";
import { Button, Footer } from "liquidcn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
  NavbarButton,
} from "liquidcn/client";
import { Github, Twitter, Landmark, ArrowRight } from "lucide-react";
import "./index.css";

type Page = "landing" | "faucet" | "dashboard" | "payments";

function AncientBrand({ onClick, showBadge = false }: { onClick: () => void; showBadge?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="group relative z-50 flex items-center gap-2.5 px-1 py-1 cursor-pointer"
    >
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 group-hover:scale-105 transition-all duration-200">
        <Landmark className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
        Ancient
      </span>
      {showBadge && (
        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold border border-primary/30">
          MVP
        </span>
      )}
    </button>
  );
}

function LaunchAppButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-100 transition-all duration-200 ${className}`}
    >
      <span>Launch App</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function Navigation({ currentPage, setPage }: { currentPage: Page; setPage: (p: Page) => void }) {
  const { address, accountIndex, switchAccount, isConnected } = useWeb3();
  const accounts = useAnvilAccounts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = currentPage === "landing"
    ? []
    : [
        { name: "Faucet", link: "faucet" },
        { name: "Dashboard", link: "dashboard" },
        { name: "Payments", link: "payments" },
      ];

  const handleNavClick = (link: string) => {
    setPage(link as Page);
    setMobileMenuOpen(false);
  };

  return (
    <Navbar className="px-4" menuOpen={mobileMenuOpen}>
      <NavBody>
        <AncientBrand onClick={() => setPage("landing")} showBadge={currentPage !== "landing"} />
        {currentPage !== "landing" && (
          <>
            <NavItems
              items={navItems}
              currentPath={currentPage}
              onItemClick={() => {}}
              LinkComponent={({ href, children, ...props }) => (
                <button {...props} onClick={() => handleNavClick(href as string)}>{children}</button>
              )}
            />
            <div className="flex items-center gap-3">
              {isConnected && (
                <Select
                  value={accountIndex.toString()}
                  onValueChange={(v) => switchAccount(parseInt(v))}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs font-mono bg-muted/50 border-border hover:bg-muted transition-colors">
                    <SelectValue>
                      {address?.slice(0, 4)}...{address?.slice(-3)}
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
              )}
            </div>
          </>
        )}
        {currentPage === "landing" && (
          <LaunchAppButton onClick={() => setPage("faucet")} />
        )}
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <AncientBrand onClick={() => setPage("landing")} showBadge={currentPage !== "landing"} />
          <MobileNavToggle isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={mobileMenuOpen}>
          {currentPage === "landing" ? (
            <LaunchAppButton onClick={() => { setPage("faucet"); setMobileMenuOpen(false); }} className="w-full justify-center" />
          ) : (
            <>
              {navItems.map((item) => (
                <button
                  key={item.link}
                  onClick={() => handleNavClick(item.link)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    currentPage === item.link
                      ? "bg-primary/20 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              {isConnected && (
                <div className="w-full px-4 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground mb-2 block">Account:</span>
                  <Select
                    value={accountIndex.toString()}
                    onValueChange={(v) => switchAccount(parseInt(v))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs font-mono bg-muted/50 border-border">
                      <SelectValue>
                        {address?.slice(0, 4)}...{address?.slice(-3)}
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
            </>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

const footerLinks = [
  { name: "GitHub", href: "https://github.com/ancientsh", icon: Github, showLabel: false },
  { name: "Twitter", href: "https://x.com/ancientsh", icon: Twitter, showLabel: false },
];

function AppContent() {
  const [currentPage, setPage] = useState<Page>("landing");

  if (currentPage === "landing") {
    return (
      <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8">
        <Navigation currentPage={currentPage} setPage={setPage} />
        <Landing onNavigateToMVP={() => setPage("faucet")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8">
      <Navigation currentPage={currentPage} setPage={setPage} />

      {/* Main content with top padding to account for fixed navbar */}
      <main className="flex-1 pt-16">
        <div className="container mx-auto py-8">
          {currentPage === "faucet" && <Faucet />}
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "payments" && <Payments />}
        </div>
      </main>

      <Footer
        links={footerLinks}
        builtByText="Built by"
        builtByBrand="Ancient"
        showLogo={true}
      />
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
