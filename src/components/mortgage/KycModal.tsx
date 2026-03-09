import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "liquidcn";
import { Label } from "liquidcn/client";
import { Shield, CheckCircle, Loader2 } from "lucide-react";

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const STORAGE_KEY = "ancient_kyc_verified_session";

export function KycModal({ isOpen, onClose, onContinue }: KycModalProps) {
  const [step, setStep] = useState<"form" | "verifying" | "verified">("form");

  // Prefilled KYC data for demonstration
  const kycData = {
    fullName: "John Doe",
    country: "United States",
    idDocument: "passport.pdf",
  };

  // Check sessionStorage when modal opens
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setStep("verified");
    } else {
      setStep("form");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    setStep("verifying");

    // Simulate verification delay
    setTimeout(() => {
      // Persist verified state to sessionStorage
      sessionStorage.setItem(STORAGE_KEY, "true");
      setStep("verified");
    }, 1500);
  };

  const handleContinue = () => {
    onContinue();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Identity Verification</CardTitle>
              <CardDescription>Verify your identity to continue</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "form" && (
            <>
              {/* Demo notice */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Demonstration Mode</span>
                  <br />
                  KYC data is prefilled for testing purposes
                </p>
              </div>

              {/* Full Name (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Legal Name</Label>
                <div className="flex h-11 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  {kycData.fullName}
                </div>
              </div>

              {/* Country (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="country">Country of Residence</Label>
                <div className="flex h-11 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  {kycData.country}
                </div>
              </div>

              {/* ID Document (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="idDocument">Government ID</Label>
                <div className="flex h-11 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {kycData.idDocument}
                </div>
              </div>

              {/* Sumsub notice */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold text-primary">Identity verification powered by Sumsub</span>
                  <br />
                  <span className="text-xs">(in the full product)</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-11 font-semibold"
                >
                  Confirm & Verify
                </Button>
              </div>
            </>
          )}

          {step === "verifying" && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <div>
                <p className="font-semibold">Verifying your identity...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This usually takes a few seconds
                </p>
              </div>
            </div>
          )}

          {step === "verified" && (
            <div className="py-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-green-500">Identity Verified!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can now proceed with your mortgage application
                </p>
              </div>
              <Button
                onClick={handleContinue}
                className="w-full h-11 font-semibold"
              >
                Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KycModal;
