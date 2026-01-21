import { Section } from "@/components/ui/section";

/**
 * @description About Ancient section
 */
export function AboutSection() {
  return (
    <Section className="flex h-max-content flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
          About Ancient
        </h2>
        <p className="text-base text-muted-foreground sm:text-lg md:text-xl lg:text-2xl">
          Regenerative eco-villages for global citizens. Own, co-govern, and
          live in beautiful places with token-powered access and long-term
          yield.
        </p>
      </div>
    </Section>
  );
}
