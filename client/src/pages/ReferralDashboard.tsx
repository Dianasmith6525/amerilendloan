import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Copy, Share2, Mail, MessageCircle, DollarSign, Users, Award, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ReferralDashboard() {
  const [copiedCode, setCopiedCode] = useState(false);
  const { data: codeData, isLoading: codeLoading } = trpc.referrals.getMyReferralCode.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.referrals.getMyStats.useQuery();
  const { data: referrals, isLoading: referralsLoading } = trpc.referrals.getMyReferrals.useQuery();

  const referralCode = codeData?.referralCode || '';
  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type === 'code');
    toast.success(type === 'code' 
      ? "Referral code copied to clipboard" 
      : "Referral link copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Get a loan with AmeriLend");
    const body = encodeURIComponent(
      `I've been using AmeriLend for my loans and thought you might be interested!\n\n` +
      `Use my referral code: ${referralCode}\n` +
      `Or click here to sign up: ${referralUrl}\n\n` +
      `You'll get quick approval and competitive rates!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Check out AmeriLend for fast loans! Use my code ${referralCode} or sign up here: ${referralUrl}`
    );
    window.location.href = `sms:?body=${message}`;
  };

  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const text = `Get a loan with AmeriLend! Use my referral code: ${referralCode}`;
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralUrl)}`,
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      qualified: { variant: "default", label: "Qualified" },
      rewarded: { variant: "secondary", label: "Rewarded" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (codeLoading || statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0033A0]">Referral Program</h1>
        <p className="text-gray-600 mt-2">
          Earn rewards by referring friends to AmeriLend! Get $50 for each successful referral.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0033A0]">{stats?.total || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Qualified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats?.qualified || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0033A0]">
              {formatCurrency(stats?.totalEarnings || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      <Card className="border-2 border-[#0033A0]">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>
            Share this code with friends or use the link below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Display */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <p className="text-4xl font-bold tracking-widest text-[#0033A0] font-mono">
                {referralCode}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(referralCode, 'code')}
              variant="outline"
              size="lg"
              className="h-full"
            >
              <Copy className="h-5 w-5" />
            </Button>
          </div>

          {/* Referral Link */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="referral-link">
              Referral Link
            </label>
            <div className="flex items-center gap-2">
              <input
                id="referral-link"
                type="text"
                value={referralUrl}
                readOnly
                title="Referral link"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <Button
                onClick={() => copyToClipboard(referralUrl, 'link')}
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Share via:</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={shareViaEmail} variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button onClick={shareViaSMS} variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                SMS
              </Button>
              <Button onClick={() => shareOnSocial('whatsapp')} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={() => shareOnSocial('facebook')} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button onClick={() => shareOnSocial('twitter')} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Twitter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>How it works:</strong> Share your referral code with friends. When they sign up 
          and get approved for a loan, their referral status becomes "Qualified". Once they complete 
          their first payment, you'll earn $50 and the status changes to "Rewarded". Payments are 
          processed within 5-7 business days.
        </AlertDescription>
      </Alert>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            Track your referrals and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referralsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#0033A0] text-white rounded-full flex items-center justify-center font-semibold">
                      {referral.referredUserInitials}
                    </div>
                    <div>
                      <p className="font-medium">{referral.referredUserName}</p>
                      <p className="text-sm text-gray-500">
                        Joined {formatDate(referral.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {referral.status === 'rewarded' && referral.rewardAmount && (
                      <p className="text-green-600 font-semibold">
                        {formatCurrency(referral.rewardAmount)}
                      </p>
                    )}
                    {getStatusBadge(referral.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No referrals yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start sharing your referral code to earn rewards!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
