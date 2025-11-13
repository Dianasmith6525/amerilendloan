import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, CreditCard, Shield, Bitcoin, Copy, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

// Declare Accept.js types
declare global {
  interface Window {
    Accept: {
      dispatchData: (
        secureData: {
          authData: { clientKey: string; apiLoginID: string };
          cardData: { cardNumber: string; month: string; year: string; cardCode: string };
        },
        callback: (response: any) => void
      ) => void;
    };
  }
}

export default function PaymentPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/payment/:id");
  const applicationId = params?.id ? parseInt(params.id) : null;
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH" | "USDT" | "USDC">("USDT");
  const [cryptoPaymentData, setCryptoPaymentData] = useState<{
    address: string;
    amount: string;
    currency: string;
    qrCodeDataUrl: string;
  } | null>(null);
  
  // Card form data
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
  });

  const { data: application, isLoading } = trpc.loans.getById.useQuery(
    { id: applicationId! },
    { 
      enabled: !!applicationId && isAuthenticated,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0
    }
  );

  const { data: authorizeNetConfig } = trpc.payments.getAuthorizeNetConfig.useQuery();
  const { data: cryptos } = trpc.payments.getSupportedCryptos.useQuery();

  // Load Accept.js script
  useEffect(() => {
    if (!document.querySelector('script[src*="accept.js"]')) {
      const script = document.createElement("script");
      script.src = "https://jstest.authorize.net/v1/Accept.js";
      script.async = true;
      script.charset = "utf-8";
      document.head.appendChild(script);
    }
  }, []);

  const processCardPaymentMutation = trpc.payments.processCardPayment.useMutation({
    onSuccess: () => {
      setPaymentComplete(true);
      toast.success("Payment processed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Payment failed");
      setProcessing(false);
    },
  });

  const createCryptoPaymentMutation = trpc.payments.createIntent.useMutation({
    onSuccess: (data) => {
      if (data.cryptoAddress && data.cryptoAmount && data.qrCodeDataUrl) {
        setCryptoPaymentData({
          address: data.cryptoAddress,
          amount: data.cryptoAmount,
          currency: selectedCrypto,
          qrCodeDataUrl: data.qrCodeDataUrl,
        });
        toast.success("Crypto payment address generated. Send payment to the address shown.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate payment address");
      setProcessing(false);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleCryptoPayment = () => {
    if (!applicationId) {
      toast.error("Invalid application");
      return;
    }

    setProcessing(true);
    createCryptoPaymentMutation.mutate({
      loanApplicationId: applicationId,
      paymentMethod: "crypto",
      paymentProvider: "crypto",
      cryptoCurrency: selectedCrypto,
    });
  };

  const handleCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authorizeNetConfig || !window.Accept) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    if (!applicationId) {
      toast.error("Invalid application");
      return;
    }

    setProcessing(true);

    const secureData = {
      authData: {
        clientKey: authorizeNetConfig.clientKey,
        apiLoginID: authorizeNetConfig.apiLoginId,
      },
      cardData: {
        cardNumber: cardData.cardNumber.replace(/\s/g, ""),
        month: cardData.expiryMonth,
        year: cardData.expiryYear,
        cardCode: cardData.cvv,
      },
    };

    window.Accept.dispatchData(secureData, (response) => {
      if (response.messages.resultCode === "Error") {
        let errorMessage = "Payment processing error";
        if (response.messages.message && response.messages.message.length > 0) {
          errorMessage = response.messages.message[0].text;
        }
        toast.error(errorMessage);
        setProcessing(false);
      } else {
        // Process payment with opaque data
        processCardPaymentMutation.mutate({
          loanApplicationId: applicationId,
          opaqueData: {
            dataDescriptor: response.opaqueData.dataDescriptor,
            dataValue: response.opaqueData.dataValue,
          },
          cardholderName: cardData.cardholderName,
        });
      }
    });
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
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to continue</CardDescription>
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

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Application Not Found</CardTitle>
            <CardDescription>The requested application could not be found</CardDescription>
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

  if (application.status !== "approved" && application.status !== "fee_pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Payment Not Available</CardTitle>
            <CardDescription>
              This loan application is not ready for payment. Current status: <strong>{application.status}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can only make payments for loans with status "approved" or "fee_pending".
            </p>
            <Button className="w-full" onClick={() => setLocation("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto" />
              </div>
            </Link>
          </div>
        </header>

        <div className="container py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-accent">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-accent" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Payment Confirmed!</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Your processing fee has been successfully paid. Your loan is now being processed for disbursement.
                </p>
                <div className="bg-muted/50 rounded-lg p-6 mb-8">
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-muted-foreground">Loan Amount</p>
                      <p className="text-xl font-semibold">
                        ${((application.approvedAmount || 0) / 100).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processing Fee Paid</p>
                      <p className="text-xl font-semibold">
                        ${((application.processingFeeAmount || 0) / 100).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  You will receive a notification once the funds have been disbursed to your account.
                </p>
                <Button size="lg" onClick={() => setLocation("/dashboard")}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto" />
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Payment Content */}
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Processing Fee Payment</h2>
            <p className="text-muted-foreground">
              Complete your payment to proceed with loan disbursement
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground">Loan Type</span>
                <span className="font-semibold">
                  {application.loanType === "installment" ? "Installment Loan" : "Short-Term Loan"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground">Approved Amount</span>
                <span className="font-semibold text-lg">
                  ${((application.approvedAmount || 0) / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground">Processing Fee</span>
                <span className="font-semibold text-lg text-primary">
                  ${((application.processingFeeAmount || 0) / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Important:</strong> This processing fee must be paid before your loan can be disbursed. 
                  The fee covers administrative costs and loan processing.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose Payment Method</CardTitle>
              <CardDescription>
                Select how you'd like to pay the processing fee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "crypto")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="card">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Credit/Debit Card
                  </TabsTrigger>
                  <TabsTrigger value="crypto">
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Cryptocurrency
                  </TabsTrigger>
                </TabsList>

                {/* Card Payment Tab */}
                <TabsContent value="card">
                  <div className="mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900">
                        Secured by Authorize.Net - Your card information is encrypted and never stored on our servers.
                      </p>
                    </div>
                  </div>

                  {/* Authorize.Net Seal */}
                  <div className="mb-4 flex justify-center">
                    <div className="AuthorizeNetSeal">
                      {/* Authorize.Net is a registered trademark of CyberSource Corporation */}
                      <script
                        type="text/javascript"
                        dangerouslySetInnerHTML={{
                          __html: 'var ANS_customer_id="2be1fcff-517b-4ceb-aa13-06e36deec1ff";'
                        }}
                      />
                      <script
                        type="text/javascript"
                        src="https://verify.authorize.net/anetseal/seal.js"
                      />
                    </div>
                  </div>

                  <form onSubmit={handleCardPayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardholderName">Cardholder Name *</Label>
                      <Input
                        id="cardholderName"
                        value={cardData.cardholderName}
                        onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        value={cardData.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, "");
                          const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                          setCardData({ ...cardData, cardNumber: formatted });
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryMonth">Month *</Label>
                        <Input
                          id="expiryMonth"
                          value={cardData.expiryMonth}
                          onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                          placeholder="MM"
                          maxLength={2}
                          pattern="[0-9]{2}"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryYear">Year *</Label>
                        <Input
                          id="expiryYear"
                          value={cardData.expiryYear}
                          onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                          placeholder="YYYY"
                          maxLength={4}
                          pattern="[0-9]{4}"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          placeholder="123"
                          maxLength={4}
                          pattern="[0-9]{3,4}"
                          type="password"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={processing || !authorizeNetConfig}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay ${((application.processingFeeAmount || 0) / 100).toFixed(2)}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={() => setLocation("/dashboard")}
                        disabled={processing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* Crypto Payment Tab */}
                <TabsContent value="crypto">
                  {!cryptoPaymentData ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Cryptocurrency</Label>
                        <Select value={selectedCrypto} onValueChange={(v) => setSelectedCrypto(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptos?.map((crypto) => (
                              <SelectItem key={crypto.currency} value={crypto.currency}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{crypto.symbol} {crypto.name}</span>
                                  <span className="text-xs text-muted-foreground ml-4">
                                    ${crypto.rate.toLocaleString()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-900">
                          <strong>Please Note:</strong> After clicking "Generate Payment Address", send the exact crypto amount to the provided address. 
                          Your payment will be manually verified by our team within 1 hour.
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          className="flex-1"
                          size="lg"
                          onClick={handleCryptoPayment}
                          disabled={processing || createCryptoPaymentMutation.isPending}
                        >
                          {createCryptoPaymentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Bitcoin className="mr-2 h-4 w-4" />
                              Generate Payment Address
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          onClick={() => setLocation("/dashboard")}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <p className="font-semibold text-green-900">Payment Address Generated</p>
                        </div>
                        <p className="text-sm text-green-800">
                          Send exactly <strong>{cryptoPaymentData.amount} {cryptoPaymentData.currency}</strong> to the address below
                        </p>
                      </div>

                      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Payment Address</Label>
                          <div className="flex items-center gap-2 mt-1">
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

                        <div>
                          <Label className="text-xs text-muted-foreground">Amount</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-semibold">
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

                        <div className="flex justify-center pt-4 border-t">
                          <div className="text-center">
                            <Label className="text-xs text-muted-foreground block mb-2">Scan QR Code</Label>
                            <img 
                              src={cryptoPaymentData.qrCodeDataUrl} 
                              alt="Payment QR Code" 
                              className="w-48 h-48 border rounded"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Scan with your crypto wallet app
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                          <strong>Next Steps:</strong>
                        </p>
                        <ol className="text-sm text-blue-800 mt-2 ml-4 list-decimal space-y-1">
                          <li>Send the exact amount shown to the address above</li>
                          <li>Wait for transaction confirmation on the blockchain</li>
                          <li>Our team will verify your payment within 1 hour</li>
                          <li>You'll receive an email once verified</li>
                        </ol>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => setLocation("/dashboard")}
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
