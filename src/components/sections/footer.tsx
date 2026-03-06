import { Footer as LiquidFooter } from "liquidcn";
import { Github, Twitter } from "lucide-react";
import avalancheLogo from "../../../public/avalanche.svg";

const footerLinks = [
  { name: "GitHub", href: "https://github.com/ancientsh", icon: Github, showLabel: false },
  { name: "Twitter", href: "https://x.com/ancientsh", icon: Twitter, showLabel: false },
];

export function Footer() {
  return (
    <LiquidFooter
      links={footerLinks}
      right={
        <img src={avalancheLogo} alt="Avalanche" className="h-10 w-auto" />
      }
    />
  );
}
