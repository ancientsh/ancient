import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

/**
 * @description Mathematics of Modern Nomadism comparison section
 */
export function ComparisonSection() {
  return (
    <Section className="flex h-max-content flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            The Mathematics of Modern Nomadism
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl">
            A decade comparison
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Traditional Path */}
          <Card className="border-2 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingDown className="h-6 w-6 text-destructive" />
                Traditional Path
              </CardTitle>
              <p className="text-xl font-semibold text-muted-foreground">
                Renting
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-3xl font-bold">$1,800</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Decade Total</p>
                <p className="text-3xl font-bold text-destructive">-$216,000</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Equity Built</p>
                <p className="text-3xl font-bold text-muted-foreground">$0</p>
              </div>
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-center">
                <p className="font-semibold text-destructive">Build Nothing</p>
              </div>
            </CardContent>
          </Card>

          {/* Ancient Path */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                Ancient Path
              </CardTitle>
              <p className="text-xl font-semibold text-muted-foreground">
                Owning
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-3xl font-bold">$1,456</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Decade Total</p>
                <p className="text-3xl font-bold text-primary">$174,720</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Property Value</p>
                <p className="text-3xl font-bold text-green-500">+$285,750</p>
              </div>
              <div className="rounded-lg bg-primary/10 px-4 py-3 text-center">
                <p className="font-semibold text-primary">Build Wealth</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  );
}
