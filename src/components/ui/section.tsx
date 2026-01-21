import { cn } from "@/lib/utils";
import { forwardRef, type ReactNode } from "react";

export interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  fullHeight?: boolean;
  variant?: "default" | "hero" | "fullscreen";
  background?: "default" | "muted" | "transparent";
}

/**
 * @description Standard section component with uniform spacing
 * @param fullHeight - Whether section should take full viewport height (minus navbar)
 * @param variant - Section variant: "default" (standard padding), "hero" (minimal padding), "fullscreen" (full viewport)
 * @param background - Background color variant
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      children,
      className,
      id,
      fullHeight = false,
      variant = "default",
      background = "default",
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          // Base styles
          "w-full",
          // Height variants
          fullHeight && "min-h-screen",
          !fullHeight && "min-h-fit",
          // Padding variants
          variant === "default" &&
            "px-4 py-12 sm:px-6 md:px-8 lg:px-12 lg:py-16",
          variant === "hero" && "px-4 py-8 sm:px-6 md:px-8 lg:px-12",
          variant === "fullscreen" && "px-0 py-0",
          // Background variants
          background === "default" && "bg-background",
          background === "muted" && "bg-muted",
          background === "transparent" && "bg-transparent",
          // Custom className
          className
        )}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = "Section";
