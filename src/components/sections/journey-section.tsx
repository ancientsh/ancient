import { Section } from "@/components/ui/section";
import { Card, CardContent } from "liquidcn";
import { Search, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

/**
 * @description Your Journey to Ownership section
 */
export function JourneySection() {
  const steps = [
    {
      number: "1",
      title: "Discover",
      description: "Browse curated properties worldwide",
      icon: Search,
    },
    {
      number: "2",
      title: "Reserve",
      description: "20% down with USDT, no banks required",
      icon: ShieldCheck,
    },
    {
      number: "3",
      title: "Relax",
      description: "We handle legal, taxes, and tenants",
      icon: Sparkles,
    },
    {
      number: "4",
      title: "Earn",
      description: "Rental yields and long-term appreciation",
      icon: TrendingUp,
    },
  ];

  return (
    <Section className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Your Journey to Ownership
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg md:text-xl">
            Four simple steps to building wealth
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card isGlass key={step.number} className="relative overflow-hidden">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="absolute right-2 sm:right-4 top-2 sm:top-4 text-4xl sm:text-6xl font-bold text-primary/10">
                  {step.number}
                </div>
                <h3 className="mb-1 sm:mb-2 text-lg sm:text-xl font-bold">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}
