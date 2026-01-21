import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Percent, Landmark, Award } from "lucide-react";

/**
 * @description Early Access Benefits section
 */
export function BenefitsSection() {
  const benefits = [
    {
      icon: Percent,
      title: "12%",
      subtitle: "Founder Discount",
      description: "First home purchase",
    },
    {
      icon: Landmark,
      title: "Early Governance",
      subtitle: "Rights & staking benefits",
      description: "",
    },
    {
      icon: Award,
      title: "Founder NFT",
      subtitle: "Exclusive collectible",
      description: "",
    },
  ];

  return (
    <Section className="flex h-max-content flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Early Access Benefits
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="border-2 border-primary/20 transition-all hover:border-primary"
            >
              <CardContent className="flex flex-col items-center pt-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-2xl font-bold">{benefit.title}</h3>
                <p className="mb-1 font-semibold text-muted-foreground">
                  {benefit.subtitle}
                </p>
                {benefit.description && (
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}
