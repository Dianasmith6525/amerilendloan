import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Target, Award } from "lucide-react";
import { Link } from "wouter";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0033A0] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About AmeriLend</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Your trusted partner in personal lending, committed to financial accessibility and transparency.
          </p>
        </div>
      </div>

      {/* Mission Statement */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              At AmeriLend, we believe everyone deserves access to fair and transparent lending. 
              Our mission is to provide quick, easy, and affordable personal loans to help Americans 
              achieve their financial goals and overcome unexpected challenges.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-[#0033A0]" />
                </div>
                <h3 className="font-bold text-xl mb-2">Trust</h3>
                <p className="text-gray-600">
                  We build lasting relationships through transparency and integrity in every interaction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#FFA500]" />
                </div>
                <h3 className="font-bold text-xl mb-2">Customer First</h3>
                <p className="text-gray-600">
                  Your financial well-being is our priority. We're here to help, not just lend.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We leverage technology to make lending faster, easier, and more accessible.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h3 className="font-bold text-xl mb-2">Excellence</h3>
                <p className="text-gray-600">
                  We strive for excellence in service, security, and customer satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#0033A0] mb-2">500K+</div>
              <div className="text-gray-600">Customers Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0033A0] mb-2">$2B+</div>
              <div className="text-gray-600">Loans Funded</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0033A0] mb-2">4.8/5</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0033A0] mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust AmeriLend for their lending needs.
          </p>
          <Link href="/apply">
            <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold px-8 py-6 text-lg">
              Apply for a Loan Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
