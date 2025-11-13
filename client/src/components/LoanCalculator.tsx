import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";
import { PROCESSING_FEE_PERCENTAGE } from "@shared/const";

export function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState(5000);
  const [term, setTerm] = useState(12); // months
  const [interestRate] = useState(15.99); // Annual percentage rate

  const calculateMonthlyPayment = () => {
    const monthlyRate = interestRate / 100 / 12;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    return payment;
  };

  const calculateTotalPayment = () => {
    return calculateMonthlyPayment() * term;
  };

  const calculateProcessingFee = () => {
    const feePercentage = typeof PROCESSING_FEE_PERCENTAGE === 'string' 
      ? parseFloat(PROCESSING_FEE_PERCENTAGE) 
      : PROCESSING_FEE_PERCENTAGE;
    return loanAmount * (feePercentage / 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0033A0]">
          <Calculator className="w-5 h-5" />
          Loan Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Loan Amount */}
          <div>
            <Label htmlFor="loanAmount" className="text-sm font-semibold text-gray-700">
              Loan Amount
            </Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="loanAmount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="pl-9"
                min={500}
                max={35000}
                step={500}
              />
            </div>
            <input
              type="range"
              min={500}
              max={35000}
              step={500}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full mt-2 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$500</span>
              <span>$35,000</span>
            </div>
          </div>

          {/* Loan Term */}
          <div>
            <Label htmlFor="term" className="text-sm font-semibold text-gray-700">
              Loan Term (Months)
            </Label>
            <Input
              id="term"
              type="number"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="mt-1"
              min={6}
              max={60}
              step={1}
            />
            <input
              type="range"
              min={6}
              max={60}
              step={6}
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="w-full mt-2 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>6 months</span>
              <span>60 months</span>
            </div>
          </div>

          {/* Interest Rate (Fixed) */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Annual Interest Rate</span>
              <span className="text-lg font-bold text-[#0033A0]">{interestRate}%</span>
            </div>
          </div>
        </div>

        {/* Calculation Results */}
        <div className="space-y-2 pt-4 border-t-2 border-orange-200">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
            <span className="text-sm text-gray-700">Monthly Payment</span>
            <span className="text-xl font-bold text-[#0033A0]">
              {formatCurrency(calculateMonthlyPayment())}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
            <span className="text-sm text-gray-700">Processing Fee ({PROCESSING_FEE_PERCENTAGE})</span>
            <span className="text-lg font-semibold text-orange-600">
              {formatCurrency(calculateProcessingFee())}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-semibold text-gray-900">Total to Repay</span>
            <span className="text-xl font-bold text-green-700">
              {formatCurrency(calculateTotalPayment())}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Button
            className="w-full bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold"
            onClick={() => window.location.href = '/apply'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Apply for This Loan
          </Button>
          <p className="text-xs text-center text-gray-500 mt-2">
            * Estimated calculations. Final terms may vary based on approval.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
