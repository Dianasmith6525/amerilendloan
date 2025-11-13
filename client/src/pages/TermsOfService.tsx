import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-[#0033A0] hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Home</span>
            </a>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#DAA520]" />
            <span className="text-2xl font-bold">
              <span className="text-[#0033A0]">Ameri</span>
              <span className="text-[#DAA520]">Lend</span>
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-bold text-center text-[#0033A0]">
              Terms of Service
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Last Updated: November 10, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-blue max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using AmeriLend's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">2. Loan Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                AmeriLend provides personal loan services subject to the following conditions:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>All loan applications are subject to credit approval and verification</li>
                <li>Loan amounts range from $500 to $10,000</li>
                <li>Interest rates vary based on creditworthiness and loan type</li>
                <li>Repayment terms are specified in your loan agreement</li>
                <li>Early repayment is allowed without penalty</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">3. Eligibility Requirements</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To qualify for a loan, you must:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Be at least 18 years of age</li>
                <li>Be a U.S. citizen or permanent resident</li>
                <li>Have a valid Social Security Number</li>
                <li>Have a regular source of income</li>
                <li>Have an active checking account</li>
                <li>Provide valid government-issued identification</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">4. Processing Fees</h2>
              <p className="text-gray-700 leading-relaxed">
                A processing fee is charged upon loan approval. This fee is non-refundable and must be paid before loan disbursement. The fee amount will be clearly disclosed during the application process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">5. Payment Methods</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We accept the following payment methods:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Credit/Debit Cards (Visa, Mastercard, American Express, Discover)</li>
                <li>Cryptocurrency (Bitcoin, Ethereum, USDT, USDC)</li>
                <li>ACH Bank Transfer</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">6. Repayment Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                Loan repayment is due according to the schedule outlined in your loan agreement. Late payments may incur fees and negatively impact your credit score. If you anticipate difficulty making a payment, contact us immediately to discuss options.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">7. Privacy and Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We take your privacy seriously. All personal and financial information is encrypted and protected. Please review our <Link href="/privacy-policy"><a className="text-[#0033A0] underline hover:text-[#DAA520]">Privacy Policy</a></Link> for detailed information about how we collect, use, and protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">8. Electronic Signatures</h2>
              <p className="text-gray-700 leading-relaxed">
                By using our electronic signature feature, you consent to conduct business electronically and agree that electronic signatures have the same legal effect as handwritten signatures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">9. Prohibited Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide false or misleading information</li>
                <li>Use our services for illegal purposes</li>
                <li>Attempt to circumvent our security measures</li>
                <li>Apply for multiple loans simultaneously without disclosure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                AmeriLend is not liable for indirect, incidental, or consequential damages arising from the use of our services. Our total liability is limited to the amount of fees paid by you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of our services constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#0033A0] mt-8 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="font-semibold text-gray-900">AmeriLend Customer Service</p>
                <p className="text-gray-700">Phone: 1-945-212-1609</p>
                <p className="text-gray-700">Email: support@amerilendloan.com</p>
                <p className="text-gray-700">Hours: Monday-Friday, 8 AM - 8 PM EST</p>
              </div>
            </section>

            <div className="mt-12 pt-6 border-t">
              <p className="text-sm text-gray-500 text-center">
                By using AmeriLend's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/privacy-policy">
            <Button variant="outline">
              View Privacy Policy
            </Button>
          </Link>
          <Link href="/apply">
            <Button className="bg-[#0033A0] hover:bg-[#002080]">
              Apply for Loan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
