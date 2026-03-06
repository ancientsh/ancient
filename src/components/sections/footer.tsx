import { Footer as LiquidFooter } from "liquidcn";
import { Heart, Github, Twitter } from "lucide-react";

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
      right={
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Built by <b className="text-primary">Ancient</b> team with{" "}
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
        </p>
      }
    />
  );
}
