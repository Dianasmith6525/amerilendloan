import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const resetMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      toast.error("Invalid Link", {
        description: "No reset token found in the URL.",
      });
    }
    
    setToken(tokenParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Invalid Link", {
        description: "No reset token found. Please request a new reset link.",
      });
      return;
    }

    if (!newPassword) {
      toast.error("Password Required", {
        description: "Please enter a new password.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords Don't Match", {
        description: "Please make sure both passwords match.",
      });
      return;
    }

    // Password validation
    if (newPassword.length < 8) {
      toast.error("Password Too Short", {
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Invalid Password", {
        description: "Password must contain at least one uppercase letter.",
      });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast.error("Invalid Password", {
        description: "Password must contain at least one lowercase letter.",
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error("Invalid Password", {
        description: "Password must contain at least one number.",
      });
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("Invalid Password", {
        description: "Password must contain at least one special character.",
      });
      return;
    }

    setLoading(true);
    
    try {
      await resetMutation.mutateAsync({
        token,
        newPassword,
      });
      
      setSuccess(true);
      toast.success("Password Reset Successful", {
        description: "You can now login with your new password.",
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error: any) {
      toast.error("Reset Failed", {
        description: error.message || "Failed to reset password. The link may have expired.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full" variant="default">
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <div className={`w-16 h-16 ${success ? 'bg-green-100' : 'bg-[#0033A0]'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {success ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl text-[#0033A0]">
              {success ? "Password Reset!" : "Set New Password"}
            </CardTitle>
            <CardDescription>
              {success
                ? "Your password has been successfully reset. Redirecting to login..."
                : "Choose a strong password for your account."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900 text-center">
                  You can now login with your new password.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0033A0] hover:bg-[#0033A0]/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/login">
                    <Button variant="link" className="text-[#0033A0]">
                      Cancel and return to login
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
