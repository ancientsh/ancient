import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
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
    <Section className="flex h-max-content flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Your Journey to Ownership
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl">
            Four simple steps to building wealth
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card key={step.number} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute right-4 top-4 text-6xl font-bold text-primary/10">
                  {step.number}
                </div>
                <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
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
