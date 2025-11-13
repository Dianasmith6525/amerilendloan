import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle2, Clock, XCircle, AlertCircle, FileText, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TrackApplication() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  const { data: application, isLoading, error, refetch } = trpc.loans.trackByReference.useQuery(
    { referenceNumber: referenceNumber.trim() },
    { 
      enabled: false, // Don't auto-fetch, only fetch when user searches
      retry: false,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referenceNumber.trim()) {
      toast.error("Please enter a reference number");
      return;
    }

    setSearchPerformed(true);
    refetch();
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      pending: {
        label: "Pending Review",
        icon: Clock,
        color: "text-yellow-700",
        bgColor: "bg-yellow-100",
      },
      under_review: {
        label: "Under Review",
        icon: FileText,
        color: "text-blue-700",
        bgColor: "bg-blue-100",
      },
      approved: {
        label: "Approved - Payment Pending",
        icon: CheckCircle2,
        color: "text-green-700",
        bgColor: "bg-green-100",
      },
      fee_pending: {
        label: "Processing Fee Pending",
        icon: Clock,
        color: "text-orange-700",
        bgColor: "bg-orange-100",
      },
      fee_paid: {
        label: "Fee Paid - Disbursement Processing",
        icon: CheckCircle2,
        color: "text-green-700",
        bgColor: "bg-green-100",
      },
      disbursed: {
        label: "Disbursed",
        icon: CheckCircle2,
        color: "text-green-700",
        bgColor: "bg-green-100",
      },
      rejected: {
        label: "Rejected",
        icon: XCircle,
        color: "text-red-700",
        bgColor: "bg-red-100",
      },
      cancelled: {
        label: "Cancelled",
        icon: AlertCircle,
        color: "text-gray-700",
        bgColor: "bg-gray-100",
      },
    };

    return statusMap[status] || {
      label: status,
      icon: FileText,
      color: "text-gray-700",
      bgColor: "bg-gray-100",
    };
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-[#0033A0] mb-2">Track Your Application</h1>
          <p className="text-gray-600">
            Enter your reference number to check the status of your loan application
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Reference Number</CardTitle>
            <CardDescription>
              You received this reference number when you submitted your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  placeholder="e.g., AL-20251110-A3B5"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  className="font-mono"
                  required
                />
                <p className="text-xs text-gray-500">
                  Format: AL-YYYYMMDD-XXXX
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#0033A0] hover:bg-[#0033A0]/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searchPerformed && (
          <>
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Application Not Found
                  </h3>
                  <p className="text-red-700 mb-4">
                    No application found with reference number: <strong>{referenceNumber}</strong>
                  </p>
                  <p className="text-sm text-red-600">
                    Please check your reference number and try again. If you believe this is an error, 
                    contact our support team.
                  </p>
                </CardContent>
              </Card>
            )}

            {application && (
              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-[#0033A0] to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white mb-1">Application Found</CardTitle>
                      <p className="text-sm text-blue-100 font-mono">
                        Ref: {application.referenceNumber}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-white opacity-80" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Status */}
                  <div>
                    <Label className="text-gray-600 mb-2 block">Current Status</Label>
                    {(() => {
                      const statusInfo = getStatusInfo(application.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge 
                          className={`${statusInfo.bgColor} ${statusInfo.color} px-4 py-2 text-base font-medium`}
                        >
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {statusInfo.label}
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Application Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Applicant</Label>
                      <p className="text-lg font-semibold">{application.applicantInitials}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Loan Type</Label>
                      <p className="text-lg font-semibold capitalize">
                        {application.loanType.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Requested Amount</Label>
                      <p className="text-lg font-semibold text-[#0033A0]">
                        {formatCurrency(application.requestedAmount)}
                      </p>
                    </div>
                    {application.approvedAmount && (
                      <div>
                        <Label className="text-gray-600">Approved Amount</Label>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(application.approvedAmount)}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-600">Submitted On</Label>
                      <p className="text-sm">{formatDate(application.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Last Updated</Label>
                      <p className="text-sm">{formatDate(application.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                    {application.status === "pending" && (
                      <p className="text-sm text-blue-800">
                        Your application is being reviewed by our team. You'll receive an email 
                        notification once the review is complete.
                      </p>
                    )}
                    {application.status === "under_review" && (
                      <p className="text-sm text-blue-800">
                        Our team is currently reviewing your application. This typically takes 1-2 business days.
                      </p>
                    )}
                    {application.status === "approved" && (
                      <p className="text-sm text-blue-800">
                        Congratulations! Your loan has been approved. Please check your email for 
                        payment instructions to complete the processing fee.
                      </p>
                    )}
                    {application.status === "fee_pending" && (
                      <p className="text-sm text-blue-800">
                        We're waiting for your processing fee payment to be confirmed. 
                        This may take a few minutes for card payments or up to 30 minutes for cryptocurrency.
                      </p>
                    )}
                    {application.status === "fee_paid" && (
                      <p className="text-sm text-blue-800">
                        Your processing fee has been received! We're preparing your loan disbursement. 
                        You'll receive the funds within 1-2 business days.
                      </p>
                    )}
                    {application.status === "disbursed" && (
                      <p className="text-sm text-green-800">
                        Your loan has been disbursed! The funds should be in your account.
                      </p>
                    )}
                    {application.status === "rejected" && (
                      <p className="text-sm text-red-800">
                        Unfortunately, your application was not approved at this time. 
                        Please check your email for more details.
                      </p>
                    )}
                  </div>

                  {/* Login Prompt */}
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">
                      Want to see more details or manage your application?
                    </p>
                    <Link href="/login">
                      <Button variant="outline" className="border-[#0033A0] text-[#0033A0]">
                        Login to Your Account
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Help Section */}
        {!application && (
          <Card className="mt-6 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Lost your reference number?</strong> Check your email inbox for the 
                confirmation message sent when you submitted your application.
              </p>
              <p>
                <strong>Still can't find it?</strong> Contact our support team at{' '}
                <a href="mailto:support@amerilend.com" className="text-[#0033A0] hover:underline">
                  support@amerilend.com
                </a>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
