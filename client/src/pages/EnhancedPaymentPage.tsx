import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, CreditCard, Bitcoin, CheckCircle, Copy, QrCode } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function EnhancedPaymentPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, params] = useRoute("/payment/:id");
  const [, setLocation] = useLocation();
  const applicationId = params?.id ? parseInt(params.id) : null;

  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH" | "USDT" | "USDC">("USDT");
  const [cryptoPaymentData, setCryptoPaymentData] = useState<{
    address: string;
    amount: string;
    currency: string;
  } | null>(null);

  const { data: application, isLoading } = trpc.loans.getById.useQuery(
    { id: applicationId! },
    { enabled: !!applicationId && isAuthenticated }
  );

  const { data: cryptos } = trpc.payments.getSupportedCryptos.useQuery();

  const createPaymentMutation = trpc.payments.createIntent.useMutation({
    onSuccess: (data) => {
      if (paymentMethod === "crypto" && data.cryptoAddress) {
        setCryptoPaymentData({
          address: data.cryptoAddress!,
          amount: data.cryptoAmount!,
          currency: selectedCrypto,
        });
        toast.success("Crypto payment address generated");
      } else {
        toast.success("Payment initiated");
        // For card payments, would redirect to payment processor
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create payment");
    },
  });

  const confirmPaymentMutation = trpc.payments.confirmPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment confirmed!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm payment");
    },
  });

  const handleInitiatePayment = () => {
    if (!applicationId) return;

    createPaymentMutation.mutate({
      loanApplicationId: applicationId,
      paymentMethod,
      paymentProvider: paymentMethod === "crypto" ? "crypto" : "authorizenet",
      cryptoCurrency: paymentMethod === "crypto" ? selectedCrypto : undefined,
    });
  };

  const handleConfirmPayment = () => {
    // In production, this would be called by a webhook
    // For demo, we simulate payment confirmation
    confirmPaymentMutation.mutate({ paymentId: 1 }); // Mock payment ID
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to make a payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application || application.status !== "approved") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Payment Not Available</CardTitle>
            <CardDescription>
              This loan application is not ready for payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feeAmount = application.processingFeeAmount || 0;
  const selectedCryptoData = cryptos?.find((c) => c.currency === selectedCrypto);
  const cryptoAmount = selectedCryptoData
    ? (feeAmount / 100 / selectedCryptoData.rate).toFixed(8)
    : "0";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto" />
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Payment Content */}
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Pay Processing Fee</h2>
            <p className="text-muted-foreground">
              Complete payment to proceed with your loan disbursement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Payment Summary */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Loan Amount</p>
                    <p className="text-2xl font-bold text-accent">
                      ${(application.approvedAmount! / 100).toLocaleString()}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Processing Fee</p>
                    <p className="text-3xl font-bold">
                      ${(feeAmount / 100).toFixed(2)}
                    </p>
                  </div>
                  {paymentMethod === "crypto" && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm font-medium text-blue-900">
                        {selectedCrypto} Amount
                      </p>
                      <p className="text-lg font-bold text-blue-800">
                        {cryptoAmount} {selectedCrypto}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        ≈ ${(feeAmount / 100).toFixed(2)} USD
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Selection */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Payment Method</CardTitle>
                  <CardDescription>
                    Select how you'd like to pay the processing fee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "crypto")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="card">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Credit/Debit Card
                      </TabsTrigger>
                      <TabsTrigger value="crypto">
                        <Bitcoin className="mr-2 h-4 w-4" />
                        Cryptocurrency
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="card" className="space-y-4 mt-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 font-medium mb-2">
                          Secure Card Payment via Authorize.net
                        </p>
                        <p className="text-sm text-blue-800">
                          Your card information is encrypted and processed securely. We accept Visa,
                          Mastercard, American Express, and Discover.
                        </p>
                      </div>

                      {!cryptoPaymentData && (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleInitiatePayment}
                          disabled={createPaymentMutation.isPending}
                        >
                          {createPaymentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay ${(feeAmount / 100).toFixed(2)} with Card
                            </>
                          )}
                        </Button>
                      )}

                      <p className="text-xs text-center text-muted-foreground">
                        Demo mode: Payment will be simulated
                      </p>
                    </TabsContent>

                    <TabsContent value="crypto" className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Cryptocurrency</label>
                        <Select value={selectedCrypto} onValueChange={(v) => setSelectedCrypto(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptos?.map((crypto) => (
                              <SelectItem key={crypto.currency} value={crypto.currency}>
                                {crypto.symbol} {crypto.name} - ${crypto.rate.toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {cryptoPaymentData ? (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <p className="font-medium text-green-900">Payment Address Generated</p>
                            </div>
                            <p className="text-sm text-green-800">
                              Send exactly {cryptoPaymentData.amount} {cryptoPaymentData.currency} to the address below
                            </p>
                          </div>

                          <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-medium mb-2">Payment Address</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-white border rounded px-3 py-2 text-sm break-all">
                                {cryptoPaymentData.address}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(cryptoPaymentData.address)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-medium mb-2">Amount to Send</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-white border rounded px-3 py-2 text-sm">
                                {cryptoPaymentData.amount} {cryptoPaymentData.currency}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(cryptoPaymentData.amount)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-900 font-medium">Important</p>
                            <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                              <li>Send the exact amount shown above</li>
                              <li>Payment expires in 1 hour</li>
                              <li>Confirmations required: 1 for USDT/USDC, 3 for BTC/ETH</li>
                            </ul>
                          </div>

                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handleConfirmPayment}
                            disabled={confirmPaymentMutation.isPending}
                          >
                            {confirmPaymentMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Confirming...
                              </>
                            ) : (
                              "I've Sent the Payment (Demo)"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900 font-medium mb-2">
                              Pay with {selectedCrypto}
                            </p>
                            <p className="text-sm text-blue-800">
                              You'll receive a wallet address to send {cryptoAmount} {selectedCrypto}
                            </p>
                          </div>

                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handleInitiatePayment}
                            disabled={createPaymentMutation.isPending}
                          >
                            {createPaymentMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Address...
                              </>
                            ) : (
                              <>
                                <Bitcoin className="mr-2 h-4 w-4" />
                                Generate {selectedCrypto} Payment Address
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
