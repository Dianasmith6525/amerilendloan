import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, DollarSign, Calendar, Percent } from "lucide-react";
import { PROCESSING_FEE_PERCENTAGE, calculateProcessingFee } from "@shared/const";

interface LoanOption {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  apr: string;
  fee: string;
  description: string;
  color: string;
}

const loanOptions: LoanOption[] = [
  {
    id: "emergency",
    name: "Emergency Loan",
    minAmount: 500,
    maxAmount: 2500,
    minTerm: 3,
    maxTerm: 12,
    apr: "29.99% - 35.99%",
    fee: `${PROCESSING_FEE_PERCENTAGE}%`,
    description: "Quick cash for urgent expenses",
    color: "bg-red-500"
  },
  {
    id: "personal",
    name: "Personal Loan",
    minAmount: 2500,
    maxAmount: 10000,
    minTerm: 12,
    maxTerm: 36,
    apr: "24.99% - 29.99%",
    fee: `${PROCESSING_FEE_PERCENTAGE}%`,
    description: "Flexible loans for any purpose",
    color: "bg-blue-500"
  },
  {
    id: "debt-consolidation",
    name: "Debt Consolidation",
    minAmount: 5000,
    maxAmount: 25000,
    minTerm: 24,
    maxTerm: 60,
    apr: "19.99% - 24.99%",
    fee: `${PROCESSING_FEE_PERCENTAGE}%`,
    description: "Combine debts into one payment",
    color: "bg-green-500"
  },
  {
    id: "home-improvement",
    name: "Home Improvement",
    minAmount: 10000,
    maxAmount: 35000,
    minTerm: 24,
    maxTerm: 60,
    apr: "19.99% - 24.99%",
    fee: `${PROCESSING_FEE_PERCENTAGE}%`,
    description: "Invest in your property",
    color: "bg-orange-500"
  }
];

export default function Prequalify() {
  const [, setLocation] = useLocation();
  const [selectedLoan, setSelectedLoan] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    loanAmount: "",
    monthlyIncome: "",
    creditScore: "",
    employmentStatus: "",
    monthlyDebt: "",
  });
  const [qualification, setQualification] = useState<{
    qualified: boolean;
    reasons: string[];
    maxAmount?: number;
  } | null>(null);

  const selectedLoanOption = loanOptions.find(l => l.id === selectedLoan);

  const handleLoanSelect = (loanId: string) => {
    setSelectedLoan(loanId);
    setStep(2);
    setQualification(null);
  };

  const checkQualification = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.loanAmount);
    const income = parseFloat(formData.monthlyIncome);
    const credit = parseInt(formData.creditScore);
    const debt = parseFloat(formData.monthlyDebt);

    const reasons: string[] = [];
    let qualified = true;

    // Credit score check
    if (credit < 580) {
      qualified = false;
      reasons.push("Credit score below minimum requirement (580)");
    } else if (credit >= 580 && credit < 650) {
      reasons.push("Fair credit - may have higher rates");
    }

    // Debt-to-Income ratio check
    const dti = ((debt + (amount * 0.05)) / income) * 100; // Rough monthly payment estimate
    if (dti > 50) {
      qualified = false;
      reasons.push("Debt-to-income ratio too high (over 50%)");
    } else if (dti > 40) {
      reasons.push("Debt-to-income ratio is high - may affect approval");
    }

    // Income check
    const maxLoanByIncome = income * 6; // Max 6x monthly income
    if (amount > maxLoanByIncome) {
      qualified = false;
      reasons.push(`Loan amount exceeds income capacity (max: $${maxLoanByIncome.toLocaleString()})`);
    }

    // Loan range check
    if (selectedLoanOption) {
      if (amount < selectedLoanOption.minAmount) {
        qualified = false;
        reasons.push(`Amount below minimum for ${selectedLoanOption.name} ($${selectedLoanOption.minAmount.toLocaleString()})`);
      }
      if (amount > selectedLoanOption.maxAmount) {
        qualified = false;
        reasons.push(`Amount exceeds maximum for ${selectedLoanOption.name} ($${selectedLoanOption.maxAmount.toLocaleString()})`);
      }
    }

    // Employment check
    if (formData.employmentStatus === "unemployed") {
      qualified = false;
      reasons.push("Employment required for loan approval");
    }

    // Success criteria
    if (qualified) {
      reasons.push("Strong credit profile");
      reasons.push("Healthy debt-to-income ratio");
      reasons.push("Sufficient income verification");
    }

    setQualification({
      qualified,
      reasons,
      maxAmount: Math.min(maxLoanByIncome, selectedLoanOption?.maxAmount || 35000)
    });
    setStep(3);
  };

  const handleApply = () => {
    // Pass prequalification data to apply page via state or query params
    setLocation("/apply", { 
      state: {
        prequalified: true,
        loanType: selectedLoan,
        amount: formData.loanAmount,
        ...formData
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0033A0] to-[#0047D0] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Check Your Prequalification</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Find out if you qualify in just 2 minutes. No impact to your credit score!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#0033A0]' : 'bg-gray-300'} text-white font-bold`}>
                1
              </div>
              <span className="text-sm mt-2">Choose Loan</span>
            </div>
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-[#0033A0]' : 'bg-gray-300'}`} />
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#0033A0]' : 'bg-gray-300'} text-white font-bold`}>
                2
              </div>
              <span className="text-sm mt-2">Your Info</span>
            </div>
            <div className={`flex-1 h-1 ${step >= 3 ? 'bg-[#0033A0]' : 'bg-gray-300'}`} />
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#0033A0]' : 'bg-gray-300'} text-white font-bold`}>
                3
              </div>
              <span className="text-sm mt-2">Results</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Loan Type */}
        {step === 1 && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">What type of loan do you need?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {loanOptions.map((loan) => (
                <Card
                  key={loan.id}
                  className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-[#0033A0]"
                  onClick={() => handleLoanSelect(loan.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${loan.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{loan.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{loan.description}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>${loan.minAmount.toLocaleString()} - ${loan.maxAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>{loan.minTerm} - {loan.maxTerm} months</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Percent className="w-4 h-4 text-orange-600" />
                            <span>APR: {loan.apr}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Enter Information */}
        {step === 2 && selectedLoanOption && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Pre-Qualification for {selectedLoanOption.name}</h2>
                  <p className="text-gray-600">This won't affect your credit score</p>
                </div>

                <form onSubmit={checkQualification} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      How much do you need? *
                    </label>
                    <Input
                      type="number"
                      required
                      min={selectedLoanOption.minAmount}
                      max={selectedLoanOption.maxAmount}
                      value={formData.loanAmount}
                      onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                      placeholder={`$${selectedLoanOption.minAmount.toLocaleString()} - $${selectedLoanOption.maxAmount.toLocaleString()}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Range: ${selectedLoanOption.minAmount.toLocaleString()} - ${selectedLoanOption.maxAmount.toLocaleString()}
                    </p>
                    {formData.loanAmount && parseFloat(formData.loanAmount) > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Loan Amount:</span>
                            <span className="font-semibold">${parseFloat(formData.loanAmount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Processing Fee ({PROCESSING_FEE_PERCENTAGE}%):</span>
                            <span className="font-semibold text-orange-600">
                              ${calculateProcessingFee(parseFloat(formData.loanAmount)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-blue-300">
                            <span className="font-semibold text-gray-900">Total Amount:</span>
                            <span className="font-bold text-[#0033A0]">
                              ${(parseFloat(formData.loanAmount) + calculateProcessingFee(parseFloat(formData.loanAmount))).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Monthly Income (before taxes) *
                    </label>
                    <Input
                      type="number"
                      required
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                      placeholder="$3,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Credit Score Range *
                    </label>
                    <select
                      required
                      value={formData.creditScore}
                      onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
                    >
                      <option value="">Select your range</option>
                      <option value="800">Excellent (750+)</option>
                      <option value="720">Good (700-749)</option>
                      <option value="670">Fair (650-699)</option>
                      <option value="620">Poor (600-649)</option>
                      <option value="550">Bad (Below 600)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Employment Status *
                    </label>
                    <select
                      required
                      value={formData.employmentStatus}
                      onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
                    >
                      <option value="">Select status</option>
                      <option value="employed">Employed Full-Time</option>
                      <option value="self-employed">Self-Employed</option>
                      <option value="part-time">Employed Part-Time</option>
                      <option value="retired">Retired</option>
                      <option value="unemployed">Unemployed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Monthly Debt Payments *
                    </label>
                    <Input
                      type="number"
                      required
                      value={formData.monthlyDebt}
                      onChange={(e) => setFormData({ ...formData, monthlyDebt: e.target.value })}
                      placeholder="$500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include rent/mortgage, car payments, credit cards, student loans, etc.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#FFA500] hover:bg-[#FF8C00] text-white"
                    >
                      Check Qualification
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && qualification && (
          <div className="max-w-2xl mx-auto">
            <Card className={qualification.qualified ? "border-green-500 border-2" : "border-red-500 border-2"}>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    qualification.qualified ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {qualification.qualified ? (
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-red-600" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {qualification.qualified ? "You're Prequalified!" : "Not Qualified Yet"}
                  </h2>
                  <p className="text-gray-600">
                    {qualification.qualified
                      ? "Great news! You meet our initial requirements."
                      : "You don't currently meet all requirements, but we can help."}
                  </p>
                </div>

                {qualification.qualified && qualification.maxAmount && (
                  <div className="bg-blue-50 p-6 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Your Estimated Offer:</h3>
                    <div className="text-3xl font-bold text-[#0033A0]">
                      Up to ${qualification.maxAmount.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedLoanOption?.apr} APR • {PROCESSING_FEE_PERCENTAGE}% processing fee
                    </p>
                    {formData.loanAmount && (
                      <div className="mt-4 pt-4 border-t border-blue-200 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Loan Amount:</span>
                          <span className="font-semibold">${parseFloat(formData.loanAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Fee ({PROCESSING_FEE_PERCENTAGE}%):</span>
                          <span className="font-semibold text-orange-600">
                            ${calculateProcessingFee(parseFloat(formData.loanAmount)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="font-bold">Total to Repay:</span>
                          <span className="font-bold text-[#0033A0]">
                            ${(parseFloat(formData.loanAmount) + calculateProcessingFee(parseFloat(formData.loanAmount))).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {qualification.reasons.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        qualification.qualified ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {qualification.qualified ? (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <span className="text-xs">•</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{reason}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {qualification.qualified ? (
                    <>
                      <Button
                        onClick={handleApply}
                        className="w-full bg-[#FFA500] hover:bg-[#FF8C00] text-white py-6 text-lg"
                      >
                        Continue to Full Application
                      </Button>
                      <Button
                        onClick={() => {
                          setStep(1);
                          setSelectedLoan("");
                          setQualification(null);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Check Another Loan Type
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setStep(2)}
                        className="w-full bg-[#0033A0] hover:bg-[#002080] text-white"
                      >
                        Update Information
                      </Button>
                      <Button
                        onClick={() => {
                          setStep(1);
                          setSelectedLoan("");
                          setQualification(null);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Try Different Loan Type
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                  * This is a pre-qualification estimate only. Final approval is subject to full application review and verification.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
