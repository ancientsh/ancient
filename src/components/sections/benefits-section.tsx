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
    <Section className="flex h-max-content flex-col items-center justify-center px-4 sm:px-6 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Early Access Benefits
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="border-2 border-primary/20 transition-all hover:border-primary"
            >
              <CardContent className="flex flex-col items-center pt-6 sm:pt-8 text-center pb-6">
                <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="mb-1 sm:mb-2 text-xl sm:text-2xl font-bold">{benefit.title}</h3>
                <p className="mb-1 text-sm sm:text-base font-semibold text-muted-foreground">
                  {benefit.subtitle}
                </p>
                {benefit.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
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
