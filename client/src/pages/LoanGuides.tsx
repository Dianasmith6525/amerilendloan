import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calculator, Shield, TrendingUp, FileText, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function LoanGuides() {
  const guides = [
    {
      icon: BookOpen,
      title: "Personal Loan Basics",
      description: "Everything you need to know about personal loans, from application to repayment.",
      topics: [
        "What is a personal loan?",
        "Types of personal loans",
        "How to qualify",
        "Application process"
      ]
    },
    {
      icon: Calculator,
      title: "Understanding APR & Fees",
      description: "Learn how interest rates, APR, and fees affect your loan cost.",
      topics: [
        "APR vs interest rate",
        "Calculating total cost",
        "Fee structures",
        "How to compare offers"
      ]
    },
    {
      icon: Shield,
      title: "Credit Score Guide",
      description: "How your credit score impacts your loan and tips to improve it.",
      topics: [
        "Credit score ranges",
        "Factors affecting your score",
        "How to check your credit",
        "Improving your credit"
      ]
    },
    {
      icon: TrendingUp,
      title: "Debt Consolidation",
      description: "Use personal loans to consolidate and pay off high-interest debt.",
      topics: [
        "What is debt consolidation?",
        "Benefits and risks",
        "When to consolidate",
        "Choosing the right loan"
      ]
    },
    {
      icon: FileText,
      title: "Loan Application Tips",
      description: "Best practices for a successful loan application and faster approval.",
      topics: [
        "Documents you'll need",
        "How to apply online",
        "Approval timeline",
        "Common mistakes to avoid"
      ]
    },
    {
      icon: CreditCard,
      title: "Managing Your Loan",
      description: "Tips for successful loan repayment and avoiding late fees.",
      topics: [
        "Setting up autopay",
        "Making extra payments",
        "Dealing with financial hardship",
        "Refinancing options"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0033A0] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Loan Guides</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Expert advice and comprehensive guides to help you make informed borrowing decisions.
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#0033A0]" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{guide.title}</h3>
                    <p className="text-gray-600 mb-4">{guide.description}</p>
                    <ul className="space-y-2 mb-6">
                      {guide.topics.map((topic, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-[#FFA500] mt-1">•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0] hover:text-white">
                      Read Guide
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Apply?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Now that you're informed, take the next step and apply for a loan today.
          </p>
          <Link href="/apply">
            <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold px-8 py-6 text-lg">
              Start Your Application
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
