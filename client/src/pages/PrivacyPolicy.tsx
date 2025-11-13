import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the privacy policy markdown file
    fetch("/legal/privacy-policy.md")
      .then((response) => response.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading privacy policy:", error);
        setLoading(false);
      });
  }, []);

  // Simple markdown-to-HTML converter for basic formatting
  const formatMarkdown = (text: string) => {
    return text
      .split("\n")
      .map((line, index) => {
        // Headers
        if (line.startsWith("# ")) {
          return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith("#### ")) {
          return <h4 key={index} className="text-lg font-semibold mt-3 mb-2">{line.substring(5)}</h4>;
        }
        // Bold text
        if (line.includes("**")) {
          const parts = line.split("**");
          return (
            <p key={index} className="mb-2">
              {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
            </p>
          );
        }
        // Bullet points
        if (line.startsWith("- ")) {
          return <li key={index} className="ml-6 mb-1">{line.substring(2)}</li>;
        }
        // Empty lines
        if (line.trim() === "") {
          return <br key={index} />;
        }
        // Regular paragraphs
        return <p key={index} className="mb-2">{line}</p>;
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
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Card>
          <CardHeader className="bg-gradient-to-r from-[#0033A0] to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <CardTitle className="text-3xl">California Disclosures and Privacy Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033A0]"></div>
              </div>
            ) : (
              <div className="prose max-w-none">
                {/* California-specific disclosures */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-yellow-900">
                    California Consumer Privacy Act (CCPA) Disclosures
                  </h2>
                  <p className="mb-4 text-gray-800">
                    California residents have specific rights under the California Consumer Privacy Act (CCPA). 
                    This section provides additional information for California residents.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-4 mb-2 text-yellow-900">Your California Privacy Rights</h3>
                  <ul className="list-disc ml-6 mb-4 text-gray-800">
                    <li><strong>Right to Know:</strong> You have the right to request information about the personal information we collect, use, disclose, and sell.</li>
                    <li><strong>Right to Delete:</strong> You have the right to request that we delete your personal information.</li>
                    <li><strong>Right to Opt-Out:</strong> You have the right to opt-out of the sale of your personal information.</li>
                    <li><strong>Right to Non-Discrimination:</strong> You have the right not to be discriminated against for exercising your privacy rights.</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2 text-yellow-900">Categories of Personal Information</h3>
                  <p className="mb-4 text-gray-800">
                    We collect the following categories of personal information: identifiers, financial information, 
                    commercial information, internet/network activity, geolocation data, and inferences about preferences and characteristics.
                  </p>

                  <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-300">
                    <p className="font-semibold text-gray-900 mb-2">
                      To exercise your right to opt-out of the sale of personal information:
                    </p>
                    <Link href="/do-not-sell">
                      <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        Do Not Sell My Personal Information
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Full Privacy Policy Content */}
                <div className="text-gray-700">
                  {formatMarkdown(content)}
                </div>

                {/* Contact Information */}
                <div className="mt-12 p-6 bg-gray-50 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3">Questions About Privacy?</h3>
                  <p className="mb-4">
                    If you have questions about this Privacy Policy or your privacy rights, please contact us:
                  </p>
                  <div className="space-y-2">
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
                    <p className="text-sm text-gray-600">
                      Monday – Friday, 7 a.m. – 11:00 p.m. and Saturday and Sunday, 9 a.m. – 5:00 p.m. Central Time
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
