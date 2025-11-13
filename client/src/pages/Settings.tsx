import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Lock, User, Mail, Phone, Shield, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-[#0033A0] mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access settings.</p>
            <Button className="w-full bg-[#FFA500] hover:bg-[#FF8C00] text-white" asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between h-28">
            <Link href="/">
              <a className="flex items-center">
                <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto" />
              </a>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-[#0033A0] text-[#0033A0]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-[#0033A0] text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-white/90">Manage your profile and security preferences</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0033A0]">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {!isEditing ? (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="bg-[#0033A0] hover:bg-[#002080] text-white"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-[#FFA500] hover:bg-[#FF8C00] text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            ...formData,
                            name: user?.name || "",
                            email: user?.email || "",
                            phoneNumber: user?.phoneNumber || "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          {user?.loginMethod === "password" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0033A0]">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="mt-1"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="bg-[#FFA500] hover:bg-[#FF8C00] text-white"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0033A0]">
                <Shield className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Account ID</span>
                <span className="font-semibold">#{user?.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Login Method</span>
                <span className="font-semibold capitalize">{user?.loginMethod || "Email"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Account Role</span>
                <span className="font-semibold capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Member Since</span>
                <span className="font-semibold">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Referral Code */}
          {user && 'referralCode' in user && (user as any).referralCode && (
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
                    <code className="text-2xl font-bold text-green-700 font-mono">
                      {(user as any).referralCode}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-700"
                    onClick={() => {
                      navigator.clipboard.writeText((user as any).referralCode!);
                      toast.success("Referral code copied!");
                    }}
                  >
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0033A0]">
                <Shield className="w-5 h-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("2FA setup coming soon!")}
                >
                  Enable
                </Button>
              </div>

              {/* Login History */}
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h4 className="font-semibold text-gray-900">Login History</h4>
                  <p className="text-sm text-gray-600">View your recent login activity</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Login history coming soon!")}
                >
                  View History
                </Button>
              </div>

              {/* Active Sessions */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-semibold text-gray-900">Active Sessions</h4>
                  <p className="text-sm text-gray-600">Manage devices with access to your account</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Session management coming soon!")}
                >
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0033A0]">
                <SettingsIcon className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-600">Receive updates about your loans via email</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-xs text-gray-600">Get important alerts via text message</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Marketing Communications</p>
                  <p className="text-xs text-gray-600">Receive offers and promotions</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
