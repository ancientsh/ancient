import { useState } from "react";
import {
  Web3Provider,
  useWeb3,
  useAnvilAccounts,
  formatUSD,
} from "./contracts";
import { Faucet } from "./pages/Faucet";
import { Dashboard } from "./pages/Dashboard";
import { Payments } from "./pages/Payments";
import { Landing } from "./pages/Landing";
import { Footer } from "@/components/sections";
import { Button, PrettyAmount } from "liquidcn";
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
  Toaster,
} from "liquidcn/client";
import { ArrowRight } from "lucide-react";
import logo from "../public/logo-64.png";
import "./index.css";

type Page = "landing" | "faucet" | "create" | "mortgages";

function AncientBrand({
  onClick,
  showBadge = false,
}: {
  onClick: () => void;
  showBadge?: boolean;
}) {
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
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-200 p-1">
        <img src={logo} alt="Ancient" className="w-full h-full invert" />
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

function LaunchAppButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-100 transition-all duration-200 ${className}`}
    >
      <span>Launch App</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function Navigation({
  currentPage,
  setPage,
}: {
  currentPage: Page;
  setPage: (p: Page) => void;
}) {
  const { address, accountIndex, switchAccount, isConnected, balances } =
    useWeb3();
  const accounts = useAnvilAccounts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems =
    currentPage === "landing"
      ? []
      : [
          { name: "Create", link: "create" },
          { name: "Mortgages", link: "mortgages" },
          { name: "Faucet", link: "faucet" },
        ];

  const handleNavClick = (link: string) => {
    setPage(link as Page);
    setMobileMenuOpen(false);
  };

  return (
    <Navbar className="px-4" menuOpen={mobileMenuOpen}>
      <NavBody>
        <AncientBrand
          onClick={() => setPage("landing")}
          showBadge={currentPage !== "landing"}
        />
        {currentPage !== "landing" && (
          <>
            <NavItems
              items={navItems}
              currentPath={currentPage}
              onItemClick={() => {}}
              LinkComponent={({ href, children, ...props }) => (
                <button
                  {...props}
                  onClick={() => handleNavClick(href as string)}
                >
                  {children}
                </button>
              )}
            />
            <div className="flex items-center gap-3">
              {isConnected && (
                <Select
                  value={accountIndex.toString()}
                  onValueChange={(v) => switchAccount(parseInt(v))}
                >
                  <SelectTrigger className="h-9 bg-muted/50 border-border hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src="/public/avax.svg"
                        alt="AVAX"
                        className="w-4 h-4 shrink-0"
                      />
                      <span className="text-xs font-mono truncate">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                      {address &&
                        balances[address.toLowerCase()] !== undefined && (
                          <span className="text-xs font-semibold text-primary shrink-0">
                            $
                            <PrettyAmount
                              amountFormatted={formatUSD(
                                balances[address.toLowerCase()],
                              )}
                              size="xs"
                            />
                          </span>
                        )}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border min-w-[280px]">
                    {accounts.map(({ address: addr, index }) => (
                      <SelectItem
                        key={index}
                        value={index.toString()}
                        className="text-xs font-mono py-2"
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 ring-1 ring-primary/30">
                            {index}
                          </span>
                          <span className="text-foreground">
                            {addr.slice(0, 6)}...{addr.slice(-4)}
                          </span>
                          {balances[addr.toLowerCase()] !== undefined && (
                            <span className="text-primary font-semibold ml-auto">
                              $
                              <PrettyAmount
                                amountFormatted={formatUSD(
                                  balances[addr.toLowerCase()],
                                )}
                                size="xs"
                              />
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </>
        )}
        {currentPage === "landing" && (
          <LaunchAppButton onClick={() => setPage("create")} />
        )}
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <AncientBrand
            onClick={() => setPage("landing")}
            showBadge={currentPage !== "landing"}
          />
          <MobileNavToggle
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </MobileNavHeader>
        <MobileNavMenu isOpen={mobileMenuOpen}>
          {currentPage === "landing" ? (
            <LaunchAppButton
              onClick={() => {
                setPage("create");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-center"
            />
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
                  <span className="text-xs text-muted-foreground mb-2 block">
                    Account:
                  </span>
                  <Select
                    value={accountIndex.toString()}
                    onValueChange={(v) => switchAccount(parseInt(v))}
                  >
                    <SelectTrigger className="w-full h-9 bg-muted/50 border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src="/public/avax.svg"
                          alt="AVAX"
                          className="w-4 h-4 shrink-0"
                        />
                        <span className="text-xs font-mono truncate">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                        {address &&
                          balances[address.toLowerCase()] !== undefined && (
                            <span className="text-xs font-semibold text-primary shrink-0">
                              $
                              <PrettyAmount
                                amountFormatted={formatUSD(
                                  balances[address.toLowerCase()],
                                )}
                                size="xs"
                              />
                            </span>
                          )}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border min-w-[280px]">
                      {accounts.map(({ address: addr, index }) => (
                        <SelectItem
                          key={index}
                          value={index.toString()}
                          className="text-xs font-mono py-2"
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 ring-1 ring-primary/30">
                              {index}
                            </span>
                            <span className="text-foreground">
                              {addr.slice(0, 6)}...{addr.slice(-4)}
                            </span>
                            {balances[addr.toLowerCase()] !== undefined && (
                              <span className="text-primary font-semibold ml-auto">
                                $
                                <PrettyAmount
                                  amountFormatted={formatUSD(
                                    balances[addr.toLowerCase()],
                                  )}
                                  size="xs"
                                />
                              </span>
                            )}
                          </div>
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

function AppContent() {
  const [currentPage, setPage] = useState<Page>("landing");

  if (currentPage === "landing") {
    return (
      <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8">
        <Navigation currentPage={currentPage} setPage={setPage} />
        <Landing onNavigateToMVP={() => setPage("create")} />
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
          {currentPage === "create" && (
            <Dashboard onMortgageCreated={() => setPage("mortgages")} />
          )}
          {currentPage === "mortgages" && <Payments />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <Web3Provider>
      <AppContent />
      <Toaster position="bottom-right" theme="dark" />
    </Web3Provider>
  );
}

export default App;
