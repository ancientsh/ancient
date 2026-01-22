import { Footer as LiquidFooter } from "liquidcn";
import { Github, Twitter } from "lucide-react";

const footerLinks = [
  { name: "GitHub", href: "https://github.com/ancientsh", icon: Github, showLabel: false },
  { name: "Twitter", href: "https://x.com/ancientsh", icon: Twitter, showLabel: false },
];

/**
 * @description Footer component using liquidcn
 */
export function Footer() {
  return (
    <LiquidFooter
      links={footerLinks}
      builtByText="Built by"
      builtByBrand="Ancient"
      showLogo={true}
    />
  );
}
