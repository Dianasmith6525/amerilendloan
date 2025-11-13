import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldOff, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DoNotSell() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    confirmIdentity: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.confirmIdentity) {
      toast.error("Confirmation Required", {
        description: "Please confirm your identity to proceed.",
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Request Submitted", {
        description: "Your opt-out request has been received and will be processed within 15 days.",
      });
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between h-28">
            <Link href="/">
              <a className="flex items-center">
                <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto" />
              </a>
            </Link>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
            <div className="flex items-center gap-3">
              <ShieldOff className="w-8 h-8" />
              <div>
                <CardTitle className="text-3xl mb-2">Do Not Sell My Personal Information</CardTitle>
                <CardDescription className="text-white/90">
                  California Consumer Privacy Act (CCPA) Opt-Out Request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {!submitted ? (
              <>
                {/* Information Section */}
                <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Your California Privacy Rights</h3>
                  <p className="mb-4 text-gray-700">
                    Under the California Consumer Privacy Act (CCPA), California residents have the right to 
                    opt-out of the "sale" of their personal information. While AmeriLend does not sell personal 
                    information in the traditional sense, we may share certain information with third parties 
                    in ways that could be considered a "sale" under CCPA's broad definition.
                  </p>
                  <p className="mb-4 text-gray-700">
                    By submitting this form, you are requesting that we stop sharing your personal information 
                    with third parties for purposes that could be considered a sale under the CCPA.
                  </p>
                  <div className="flex items-start gap-2 p-4 bg-white rounded border border-blue-300">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <strong>Important:</strong> Opting out may limit our ability to provide you with personalized 
                      services and offers. It will not affect our ability to share information necessary to process 
                      your loan application or service your account.
                    </p>
                  </div>
                </div>

                {/* Opt-Out Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send confirmation to this email address
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border">
                    <Checkbox
                      id="confirmIdentity"
                      checked={formData.confirmIdentity}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, confirmIdentity: checked as boolean })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="confirmIdentity"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        I confirm my identity *
                      </label>
                      <p className="text-xs text-gray-600">
                        I certify that I am a California resident and the information provided above is accurate. 
                        I understand that AmeriLend may need to verify my identity before processing this request.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-8"
                    >
                      {loading ? "Submitting..." : "Submit Opt-Out Request"}
                    </Button>
                    <Link href="/">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>

                {/* Additional Information */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold mb-3">What Happens Next?</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-[#0033A0] font-bold">1.</span>
                      <span>We'll verify your identity within 10 business days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0033A0] font-bold">2.</span>
                      <span>Your request will be processed within 15 business days after verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0033A0] font-bold">3.</span>
                      <span>You'll receive confirmation via email once your request is complete</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0033A0] font-bold">4.</span>
                      <span>Your opt-out preference will remain in effect for at least 12 months</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              /* Success Message */
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Request Received!</h3>
                <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                  Thank you for submitting your opt-out request. We've sent a confirmation email to{" "}
                  <strong>{formData.email}</strong>. We will process your request within 15 business days.
                </p>
                <p className="text-sm text-gray-600 mb-8">
                  If you have any questions, please contact our customer support team.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/">
                    <Button className="bg-[#0033A0] hover:bg-[#002080]">
                      Return to Home
                    </Button>
                  </Link>
                  <Link href="/privacy-policy">
                    <Button variant="outline">
                      View Privacy Policy
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Contact Information */}
            {!submitted && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold mb-3">Need Help?</h4>
                <p className="text-sm text-gray-700 mb-3">
                  If you have questions about this process or your privacy rights, contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Phone:</strong>{" "}
                    <a href="tel:+19452121609" className="text-[#0033A0] hover:underline">
                      (945) 212-1609
                    </a>
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:support@amerilendloan.com" className="text-[#0033A0] hover:underline">
                      support@amerilendloan.com
                    </a>
                  </p>
                  <p className="text-xs text-gray-600">
                    Monday – Friday, 7 a.m. – 11:00 p.m. and Saturday and Sunday, 9 a.m. – 5:00 p.m. Central Time
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
