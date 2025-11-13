import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function RatesAndTerms() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0033A0] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rates & Terms</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Transparent pricing and flexible loan options tailored to your needs.
          </p>
        </div>
      </div>

      {/* Loan Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Loan Options</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Small Loan */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-[#0033A0]">Small Loan</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2">$500 - $2,500</div>
                  <div className="text-gray-600">Loan Amount</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">APR: 29.99% - 35.99%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Terms: 6 - 12 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Processing Fee: 5%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Same-day funding available</span>
                  </li>
                </ul>
                <Link href="/apply">
                  <Button className="w-full bg-[#FFA500] hover:bg-[#FF8C00]">Apply Now</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Medium Loan */}
            <Card className="border-2 border-[#0033A0] relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#FFA500] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MOST POPULAR
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-[#0033A0]">Medium Loan</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2">$2,500 - $10,000</div>
                  <div className="text-gray-600">Loan Amount</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">APR: 24.99% - 29.99%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Terms: 12 - 36 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Processing Fee: 4%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Same-day funding available</span>
                  </li>
                </ul>
                <Link href="/apply">
                  <Button className="w-full bg-[#0033A0] hover:bg-[#002080]">Apply Now</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Large Loan */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-[#0033A0]">Large Loan</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2">$10,000 - $35,000</div>
                  <div className="text-gray-600">Loan Amount</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">APR: 19.99% - 24.99%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Terms: 24 - 60 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Processing Fee: 3%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Same-day funding available</span>
                  </li>
                </ul>
                <Link href="/apply">
                  <Button className="w-full bg-[#FFA500] hover:bg-[#FF8C00]">Apply Now</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Important Terms */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Important Terms & Conditions</h2>
            
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-bold text-lg mb-2">Annual Percentage Rate (APR)</h3>
                <p>
                  Your actual APR will depend on factors such as credit score, income, loan amount, 
                  and term length. The APR ranges shown represent our lowest and highest available rates.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Processing Fees</h3>
                <p>
                  A one-time processing fee is deducted from your loan proceeds. This fee covers the 
                  cost of underwriting, credit checks, and administrative processing.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Repayment Terms</h3>
                <p>
                  All loans feature fixed monthly payments. You may prepay your loan at any time 
                  without penalty. Automatic payment options are available for your convenience.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Late Payment Policy</h3>
                <p>
                  Late payments may incur a fee of $25 or 5% of the payment amount, whichever is less. 
                  Late payments may also be reported to credit bureaus and could negatively impact your credit score.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Eligibility Requirements</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Must be 18 years or older</li>
                  <li>U.S. citizen or permanent resident</li>
                  <li>Valid Social Security Number</li>
                  <li>Regular source of income</li>
                  <li>Valid checking account</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Example Calculation</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2">
                    <strong>Loan Amount:</strong> $10,000<br />
                    <strong>APR:</strong> 24.99%<br />
                    <strong>Term:</strong> 36 months<br />
                    <strong>Processing Fee:</strong> $400 (4%)
                  </p>
                  <p className="border-t border-gray-300 pt-2">
                    <strong>Monthly Payment:</strong> $348.86<br />
                    <strong>Total Interest:</strong> $2,558.96<br />
                    <strong>Total Repayment:</strong> $12,558.96
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
