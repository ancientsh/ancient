import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from "liquidcn";
import { Label } from "liquidcn/client";
import { Shield, Upload, CheckCircle, Loader2 } from "lucide-react";

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function KycModal({ isOpen, onClose, onContinue }: KycModalProps) {
  const [step, setStep] = useState<"form" | "verifying" | "verified">("form");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!fullName || !country) return;

    setStep("verifying");

    // Simulate verification delay
    setTimeout(() => {
      setStep("verified");
    }, 2000);
  };

  const handleContinue = () => {
    // Reset state for next time
    setStep("form");
    setFullName("");
    setCountry("");
    setIdDocument(null);
    onContinue();
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
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Legal Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 bg-muted/30 border-border"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country of Residence</Label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="PT">Portugal</option>
                  <option value="MX">Mexico</option>
                  <option value="BR">Brazil</option>
                  <option value="AR">Argentina</option>
                  <option value="CO">Colombia</option>
                  <option value="CR">Costa Rica</option>
                  <option value="PA">Panama</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="SG">Singapore</option>
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* ID Upload */}
              <div className="space-y-2">
                <Label htmlFor="idDocument">Government ID (Placeholder)</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                  onClick={() => {
                    // Placeholder - in production this would trigger file upload
                    setIdDocument({ name: "passport.pdf" } as File);
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {idDocument ? idDocument.name : "Click to upload passport or driver's license"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG (Max 5MB)
                  </p>
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
                  onClick={handleSubmit}
                  disabled={!fullName || !country}
                  className="flex-1 h-11 font-semibold"
                >
                  Verify Identity
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
                Continue to Purchase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KycModal;
