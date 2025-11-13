import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Heart, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";

export default function Careers() {
  const openPositions = [
    {
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Customer Support Specialist",
      department: "Customer Service",
      location: "New York, NY",
      type: "Full-time",
    },
    {
      title: "Loan Officer",
      department: "Lending",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Hybrid",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0033A0] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Build your career at AmeriLend and help shape the future of personal lending.
          </p>
        </div>
      </div>

      {/* Why Work Here */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why AmeriLend?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-[#0033A0]" />
                </div>
                <h3 className="font-bold text-xl mb-2">Great Benefits</h3>
                <p className="text-gray-600">
                  Comprehensive health, dental, vision, 401(k) matching, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-[#FFA500]" />
                </div>
                <h3 className="font-bold text-xl mb-2">Career Growth</h3>
                <p className="text-gray-600">
                  Clear advancement paths and continuous learning opportunities.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Inclusive Culture</h3>
                <p className="text-gray-600">
                  Diverse, collaborative environment where everyone belongs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Work-Life Balance</h3>
                <p className="text-gray-600">
                  Flexible schedules, remote options, and generous PTO.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{position.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {position.department}
                        </span>
                        <span>📍 {position.location}</span>
                        <span>⏰ {position.type}</span>
                      </div>
                    </div>
                    <Link href={`/careers/apply/${position.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white">
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't See Your Role?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Link href="/careers/apply/general">
            <Button className="bg-[#0033A0] hover:bg-[#002080] text-white font-semibold px-8 py-6 text-lg">
              Send Resume
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
