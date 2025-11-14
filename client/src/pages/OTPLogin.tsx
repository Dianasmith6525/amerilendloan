import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, KeyRound, Eye, EyeOff, Phone, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function OTPLogin() {
  const [, setLocation] = useLocation();
  const [loginMethod, setLoginMethod] = useState<"password" | "email-otp" | "phone-otp">("password");
  const [step, setStep] = useState<"input" | "code">("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Login successful!");
      // Redirect admin users to admin panel, regular users to dashboard
      if (data.user && data.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    loginMutation.mutate({ email, password });
  };

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
    onSuccess: (data) => {
      toast.success("Login successful!");
      // Redirect admin users to admin panel, regular users to dashboard
      if (data.user && data.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Invalid code");
    },
  });

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === "email-otp") {
      if (!email) {
        toast.error("Please enter your email");
        return;
      }
      requestCodeMutation.mutate({
        email,
        purpose: "login",
      });
    } else if (loginMethod === "phone-otp") {
      if (!phone) {
        toast.error("Please enter your phone number");
        return;
      }
      requestCodeMutation.mutate({
        email: phone, // Phone OTP uses email field in backend
        purpose: "login",
      });
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    const verifyEmail = loginMethod === "email-otp" ? email : phone;
    verifyCodeMutation.mutate({
      email: verifyEmail,
      code,
      purpose: "login",
      referralCode: referralCode.trim() || undefined,
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
              <Link href="/apply">
                <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-3xl font-bold text-[#0033A0] mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Secure OTP Login</p>
          </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {loginMethod === "password" ? "Sign In" : 
               step === "input" ? (loginMethod === "email-otp" ? "Enter Your Email" : "Enter Your Phone") : "Enter Verification Code"}
            </CardTitle>
            <CardDescription>
              {loginMethod === "password" 
                ? "Enter your email and password to continue"
                : step === "input"
                ? "We'll send you a 6-digit code to verify your identity"
                : `We sent a code to ${loginMethod === "email-otp" ? email : phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginMethod === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => { setLoginMethod("email-otp"); setStep("input"); }}
                    className="text-sm text-primary hover:underline block w-full"
                  >
                    Use Email OTP instead
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod("phone-otp"); setStep("input"); }}
                    className="text-sm text-primary hover:underline block w-full"
                  >
                    Use Phone OTP instead
                  </button>
                </div>
              </form>
            ) : step === "input" ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                {loginMethod === "email-otp" ? (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
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
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={requestCodeMutation.isPending}
                >
                  {requestCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      {loginMethod === "email-otp" ? (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email Code
                        </>
                      ) : (
                        <>
                          <Phone className="mr-2 h-4 w-4" />
                          Send SMS Code
                        </>
                      )}
                    </>
                  )}
                </Button>
                
                <button
                  type="button"
                  onClick={() => setLoginMethod("password")}
                  className="text-sm text-primary hover:underline w-full text-center"
                >
                  Back to Password Login
                </button>
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
                      className="pl-10 text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Check your email for the 6-digit code. It expires in 10 minutes.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="ABC123"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                    className="text-center uppercase tracking-wider"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a referral code if you were referred by someone
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("email")}
                >
                  Use Different Email
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => requestCodeMutation.mutate({ email, purpose: "login" })}
                  disabled={requestCodeMutation.isPending}
                >
                  Resend Code
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("password");
                      setStep("email");
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Use password instead
                  </button>
                </div>
              </form>
            )}

            {step === "email" && loginMethod === "password" && (
              <div className="mt-4 text-center">
                <Link href="/forgot-password">
                  <span className="text-sm text-[#0033A0] hover:underline cursor-pointer font-medium">
                    Forgot your password?
                  </span>
                </Link>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup">
                  <span className="text-primary hover:underline cursor-pointer font-medium">
                    Sign Up
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <Link href="/rates-and-terms">
            <a className="text-[#0033A0] hover:underline cursor-pointer">Terms of Service</a>
          </Link>
          {" "}and{" "}
          <Link href="/privacy-policy">
            <a className="text-[#0033A0] hover:underline cursor-pointer">Privacy Policy</a>
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
