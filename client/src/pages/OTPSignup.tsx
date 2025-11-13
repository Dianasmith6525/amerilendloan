import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, KeyRound, User, Phone, ArrowLeft, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function OTPSignup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"details" | "code">("details");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const requestCodeMutation = trpc.otp.requestCode.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent to your email");
      setStep("code");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send code");
    },
  });

  const verifyCodeMutation = trpc.otp.verifyCode.useMutation({
    onSuccess: async () => {
      toast.success("Email verified! Creating your account...");
      // Now create the account
      signupMutation.mutate({
        email,
        firstName,
        lastName,
        phoneNumber,
        password,
        referralCode: referralCode || undefined,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Invalid code");
    },
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Signup failed");
    },
  });

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName || !lastName || !phoneNumber || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate password
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error("Password must contain at least one special character");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    requestCodeMutation.mutate({
      email,
      purpose: "signup",
    });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    verifyCodeMutation.mutate({
      email,
      code,
      purpose: "signup",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header Navigation */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between h-28">
            <Link href="/">
              <a className="flex items-center gap-2 cursor-pointer">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
                <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto" />
              </a>
            </Link>
            <div className="flex items-center gap-3">
              <a
                href="tel:1-945-212-1609"
                className="hidden md:flex items-center gap-2 text-gray-700 hover:text-[#0033A0]"
              >
                <Phone className="w-4 h-4" />
                1-945-212-1609
              </a>
              <Link href="/login">
                <Button variant="outline" className="border-[#0033A0] text-[#0033A0]">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto mb-4" />
            <p className="text-muted-foreground mt-2">Create Your Account</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {step === "details" ? "Sign Up" : "Verify Your Email"}
              </CardTitle>
              <CardDescription>
                {step === "details"
                  ? "Enter your details to get started"
                  : `We sent a 6-digit code to ${email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "details" ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be 8+ characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="referralCode"
                        type="text"
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Have a referral code? Enter it to earn rewards!
                    </p>
                  </div>

                  {/* Legal Acceptance Checkboxes */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                        required
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="/terms-of-service">
                          <a className="text-[#0033A0] hover:underline" target="_blank">
                            Terms of Service
                          </a>
                        </Link>
                        {" "}*
                      </label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="privacy"
                        checked={acceptedPrivacy}
                        onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                        required
                      />
                      <label
                        htmlFor="privacy"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="/privacy-policy">
                          <a className="text-[#0033A0] hover:underline" target="_blank">
                            Privacy Policy
                          </a>
                        </Link>
                        {" "}*
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#0033A0] hover:bg-[#002080] text-white"
                    disabled={requestCodeMutation.isPending || !acceptedTerms || !acceptedPrivacy}
                  >
                    {requestCodeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Verification Code
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <Link href="/login">
                      <a className="text-[#0033A0] hover:underline font-semibold">
                        Sign In
                      </a>
                    </Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="pl-10 text-center text-2xl tracking-widest"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code we sent to {email}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#0033A0] hover:bg-[#002080] text-white"
                    disabled={verifyCodeMutation.isPending || signupMutation.isPending}
                  >
                    {verifyCodeMutation.isPending || signupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {verifyCodeMutation.isPending ? "Verifying..." : "Creating Account..."}
                      </>
                    ) : (
                      "Verify & Create Account"
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("details");
                        setCode("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ← Back to details
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        requestCodeMutation.mutate({
                          email,
                          purpose: "signup",
                        });
                      }}
                      disabled={requestCodeMutation.isPending}
                      className="text-sm text-[#0033A0] hover:underline"
                    >
                      {requestCodeMutation.isPending ? "Sending..." : "Resend Code"}
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Footer Legal Links */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              By signing up, you agree to our{" "}
              <Link href="/terms-of-service">
                <a className="text-[#0033A0] hover:underline">Terms of Service</a>
              </Link>
              {" "}and{" "}
              <Link href="/privacy-policy">
                <a className="text-[#0033A0] hover:underline">Privacy Policy</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
