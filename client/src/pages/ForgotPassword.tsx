import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email Required", {
        description: "Please enter your email address.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    setLoading(true);
    
    try {
      await requestResetMutation.mutateAsync({ email });
      setEmailSent(true);
      toast.success("Reset Link Sent", {
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Login Link */}
        <div className="mb-6">
          <Link href="/login">
            <Button variant="ghost" className="text-[#0033A0] hover:text-[#0033A0]/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#0033A0] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-[#0033A0]">
              {emailSent ? "Check Your Email" : "Forgot Password?"}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? "We've sent password reset instructions to your email address."
                : "Enter your email address and we'll send you instructions to reset your password."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Email sent to {email}</p>
                    <p className="text-xs text-green-700 mt-1">
                      Please check your inbox and spam folder. The link will expire in 24 hours.
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">Didn't receive the email?</p>
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  
                  <Link href="/login">
                    <Button className="w-full bg-[#0033A0] hover:bg-[#0033A0]/90 text-white">
                      Return to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0033A0] hover:bg-[#0033A0]/90 text-white h-12 text-base"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Remember your password?{" "}
                    <Link href="/login">
                      <span className="text-[#0033A0] hover:underline font-medium cursor-pointer">
                        Sign In
                      </span>
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <Link href="/contact">
              <span className="text-[#0033A0] hover:underline font-medium cursor-pointer">
                Contact Support
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
