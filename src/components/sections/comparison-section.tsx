import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "liquidcn";
import { TrendingDown, TrendingUp } from "lucide-react";

/**
 * @description Mathematics of Modern Nomadism comparison section
 */
export function ComparisonSection() {
  return (
    <Section className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            The Mathematics of Modern Nomadism
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg md:text-xl">
            A decade comparison
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Traditional Path */}
          <Card className="border-2 border-destructive/20">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                Traditional Path
              </CardTitle>
              <p className="text-lg sm:text-xl font-semibold text-muted-foreground">
                Renting
              </p>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-2xl sm:text-3xl font-bold">$1,800</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Decade Total</p>
                <p className="text-2xl sm:text-3xl font-bold text-destructive">-$216,000</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Equity Built</p>
                <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">$0</p>
              </div>
              <div className="rounded-lg bg-destructive/10 px-3 sm:px-4 py-2 sm:py-3 text-center">
                <p className="text-sm sm:text-base font-semibold text-destructive">Build Nothing</p>
              </div>
            </CardContent>
          </Card>

          {/* Ancient Path */}
          <Card className="border-2 border-primary">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Ancient Path
              </CardTitle>
              <p className="text-lg sm:text-xl font-semibold text-muted-foreground">
                Owning
              </p>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl sm:text-3xl font-bold">$1,456</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Decade Total</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">$174,720</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Property Value</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-500">+$285,750</p>
              </div>
              <div className="rounded-lg bg-primary/10 px-3 sm:px-4 py-2 sm:py-3 text-center">
                <p className="text-sm sm:text-base font-semibold text-primary">Build Wealth</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  );
}
