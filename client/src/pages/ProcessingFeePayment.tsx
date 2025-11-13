import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Bitcoin, CheckCircle2, AlertCircle, ArrowLeft, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
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

export default function ProcessingFeePayment() {
  const [, params] = useRoute("/processing-fee/:id");
  const [, setLocation] = useLocation();
  const loanId = params?.id ? parseInt(params.id) : null;

  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH" | "USDT" | "USDC">("USDT");
  const [processing, setProcessing] = useState(false);
  const [cryptoPaymentDetails, setCryptoPaymentDetails] = useState<{
    paymentAddress: string;
    cryptoAmount: string;
    cryptoCurrency: string;
    qrCodeDataUrl?: string;
  } | null>(null);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  // Get loan application details
  const { data: application, isLoading } = trpc.loans.getById.useQuery(
    { id: loanId! },
    { enabled: !!loanId }
  );

  // Get crypto options
  const { data: cryptoOptions } = trpc.payments.getSupportedCryptos.useQuery();

  // Get Authorize.Net config
  const { data: authorizeNetConfig } = trpc.payments.getAuthorizeNetConfig.useQuery();

  // Load Accept.js script
  useEffect(() => {
    if (!document.querySelector('script[src*="accept.js"]')) {
      const script = document.createElement("script");
      script.src = "https://jstest.authorize.net/v1/Accept.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Payment mutations
  const cardPaymentMutation = trpc.payments.processCardPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment successful!", {
        description: "Your processing fee has been paid. Loan disbursement is being processed.",
      });
      setTimeout(() => setLocation("/dashboard"), 2000);
    },
    onError: (error) => {
      toast.error("Payment failed", {
        description: error.message || "Please try again or use a different payment method.",
      });
      setProcessing(false);
    },
  });

  const cryptoPaymentMutation = trpc.payments.processCryptoPayment.useMutation({
    onSuccess: (data) => {
      if (data.paymentAddress && data.cryptoAmount && data.cryptoCurrency) {
        setCryptoPaymentDetails({
          paymentAddress: data.paymentAddress,
          cryptoAmount: data.cryptoAmount,
          cryptoCurrency: data.cryptoCurrency,
          qrCodeDataUrl: data.qrCodeDataUrl,
        });
        toast.success("Crypto payment initiated", {
          description: `Send ${data.cryptoAmount} ${data.cryptoCurrency} to the provided address.`,
        });
      }
      setProcessing(false);
    },
    onError: (error) => {
      toast.error("Payment initiation failed", {
        description: error.message,
      });
      setProcessing(false);
    },
  });

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorizeNetConfig || !window.Accept) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    if (!loanId || !application) {
      toast.error("Invalid loan application");
      return;
    }

    // Validate card details
    if (cardData.cardNumber.replace(/\s/g, "").length !== 16) {
      toast.error("Invalid card number");
      return;
    }

    if (!cardData.expiryMonth || !cardData.expiryYear) {
      toast.error("Invalid expiry date");
      return;
    }

    if (cardData.cvv.length !== 3 && cardData.cvv.length !== 4) {
      toast.error("Invalid CVV");
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
        cardPaymentMutation.mutate({
          loanApplicationId: loanId,
          opaqueData: {
            dataDescriptor: response.opaqueData.dataDescriptor,
            dataValue: response.opaqueData.dataValue,
          },
          cardholderName: cardData.cardholderName,
        });
      }
    });
  };

  const handleCryptoPayment = () => {
    if (!loanId || !application) {
      toast.error("Invalid loan application");
      return;
    }

    setProcessing(true);
    cryptoPaymentMutation.mutate({
      loanApplicationId: loanId,
      cryptoCurrency: selectedCrypto,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0033A0]" />
      </div>
    );
  }

  if (!application || !application.processingFeeAmount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Application</h2>
            <p className="text-gray-600 mb-4">
              This loan application is not ready for payment or does not exist.
            </p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (application.processingFeePaid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Already Completed</h2>
            <p className="text-gray-600 mb-4">
              The processing fee for this loan has already been paid.
            </p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feeAmount = application.processingFeeAmount / 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[#0033A0]">Processing Fee Payment</h1>
          <p className="text-gray-600 mt-2">
            Complete your payment to proceed with loan disbursement
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Loan Amount</p>
                  <p className="text-lg font-semibold">
                    ${(application.approvedAmount! / 100).toFixed(2)}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Processing Fee</p>
                  <p className="text-2xl font-bold text-[#0033A0]">
                    ${feeAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-700">
                    <strong>Note:</strong> This one-time processing fee is required before your loan can be disbursed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
                <CardDescription>
                  Choose how you'd like to pay your processing fee
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as "card" | "crypto")}
                  className="mb-6"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 text-[#0033A0]" />
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-gray-500">Instant processing via Authorize.Net</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="crypto" id="crypto" />
                    <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Bitcoin className="w-5 h-5 text-[#FFA500]" />
                      <div>
                        <p className="font-medium">Cryptocurrency</p>
                        <p className="text-sm text-gray-500">Pay with Bitcoin, USDT, or other crypto</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Card Payment Form */}
                {paymentMethod === "card" && (
                  <form onSubmit={handleCardPayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
                          const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                          setCardData({ ...cardData, cardNumber: formatted });
                        }}
                        maxLength={19}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardholderName">Cardholder Name</Label>
                      <Input
                        id="cardholderName"
                        placeholder="John Doe"
                        value={cardData.cardholderName}
                        onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryMonth">Month</Label>
                        <Input
                          id="expiryMonth"
                          placeholder="MM"
                          value={cardData.expiryMonth}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                            setCardData({ ...cardData, expiryMonth: value });
                          }}
                          maxLength={2}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiryYear">Year</Label>
                        <Input
                          id="expiryYear"
                          placeholder="YY"
                          value={cardData.expiryYear}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                            setCardData({ ...cardData, expiryYear: value });
                          }}
                          maxLength={2}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          value={cardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardData({ ...cardData, cvv: value });
                          }}
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#0033A0] hover:bg-[#0033A0]/90 h-12"
                      disabled={processing || cardPaymentMutation.isPending}
                    >
                      {processing || cardPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        `Pay $${feeAmount.toFixed(2)}`
                      )}
                    </Button>
                  </form>
                )}

                {/* Crypto Payment Form */}
                {paymentMethod === "crypto" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Cryptocurrency</Label>
                      <RadioGroup 
                        value={selectedCrypto} 
                        onValueChange={(value) => setSelectedCrypto(value as "BTC" | "ETH" | "USDT" | "USDC")}
                        disabled={!!cryptoPaymentDetails}
                      >
                        {cryptoOptions?.map((crypto) => (
                          <div key={crypto.symbol} className="flex items-center space-x-2 border rounded p-3">
                            <RadioGroupItem value={crypto.symbol} id={crypto.symbol} />
                            <Label htmlFor={crypto.symbol} className="flex-1 cursor-pointer">
                              <span className="font-medium">{crypto.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({crypto.symbol})</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {cryptoPaymentDetails && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <p className="font-medium text-lg">Send Payment To:</p>
                        <div className="bg-white p-3 rounded border break-all text-sm font-mono flex items-center justify-between gap-2">
                          <span className="flex-1">{cryptoPaymentDetails.paymentAddress}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(cryptoPaymentDetails.paymentAddress)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm">
                            <strong>Amount:</strong> {cryptoPaymentDetails.cryptoAmount} {cryptoPaymentDetails.cryptoCurrency}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(cryptoPaymentDetails.cryptoAmount)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {cryptoPaymentDetails.qrCodeDataUrl && (
                          <div className="flex justify-center py-4 border-t border-blue-200">
                            <div className="text-center">
                              <p className="text-sm font-medium mb-2">Scan with Wallet App</p>
                              <img 
                                src={cryptoPaymentDetails.qrCodeDataUrl} 
                                alt="Payment QR Code" 
                                className="w-48 h-48 mx-auto border-2 border-blue-300 rounded"
                              />
                              <p className="text-xs text-gray-600 mt-2">
                                Scan this QR code with your {cryptoPaymentDetails.cryptoCurrency} wallet
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-xs text-gray-700">
                            <strong>Important:</strong> Send exactly {cryptoPaymentDetails.cryptoAmount} {cryptoPaymentDetails.cryptoCurrency} to the address above. 
                            Your loan will be processed once the payment is confirmed on the blockchain (typically 10-30 minutes).
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleCryptoPayment}
                      className="w-full bg-[#FFA500] hover:bg-[#FF8C00] h-12"
                      disabled={processing || !!cryptoPaymentDetails}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Payment Address...
                        </>
                      ) : cryptoPaymentDetails ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Waiting for Payment Confirmation...
                        </>
                      ) : (
                        `Generate ${selectedCrypto} Payment Address`
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
