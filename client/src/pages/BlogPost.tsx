import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, User } from "lucide-react";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  
  // Mock blog post data (in production, fetch from API)
  const posts: Record<string, any> = {
    "smart-ways-to-use-personal-loan": {
      title: "5 Smart Ways to Use a Personal Loan",
      author: "Sarah Johnson",
      date: "November 5, 2025",
      category: "Loan Tips",
      image: "https://placehold.co/1200x600/0033A0/white?text=Loan+Tips",
      content: `
        <p>Personal loans are versatile financial tools that can help you achieve various goals. Here are five smart ways to leverage a personal loan:</p>
        
        <h2>1. Debt Consolidation</h2>
        <p>Combine multiple high-interest debts into a single loan with a lower interest rate. This simplifies your payments and can save you money on interest.</p>
        
        <h2>2. Home Improvements</h2>
        <p>Invest in your property's value by funding renovations or repairs. A personal loan can be faster and easier than a home equity loan.</p>
        
        <h2>3. Medical Expenses</h2>
        <p>Cover unexpected medical bills or elective procedures that insurance doesn't fully cover. Many medical providers accept payment plans from personal loans.</p>
        
        <h2>4. Major Purchases</h2>
        <p>Finance significant expenses like appliances, furniture, or electronics without depleting your savings or using high-interest credit cards.</p>
        
        <h2>5. Emergency Expenses</h2>
        <p>When unexpected costs arise—car repairs, urgent home fixes, or family emergencies—a personal loan provides quick access to funds.</p>
        
        <h2>Tips for Success</h2>
        <ul>
          <li>Only borrow what you need and can afford to repay</li>
          <li>Compare rates from multiple lenders</li>
          <li>Read the fine print on fees and terms</li>
          <li>Have a clear repayment plan before borrowing</li>
        </ul>
      `
    },
    "understanding-credit-score": {
      title: "Understanding Your Credit Score: A Complete Guide",
      author: "Michael Chen",
      date: "November 3, 2025",
      category: "Credit Education",
      image: "https://placehold.co/1200x600/FFA500/white?text=Credit+Score",
      content: `
        <p>Your credit score is a three-digit number that can significantly impact your financial life. Let's break down everything you need to know.</p>
        
        <h2>What is a Credit Score?</h2>
        <p>A credit score is a numerical representation of your creditworthiness, ranging from 300 to 850. Lenders use it to assess the risk of lending you money.</p>
        
        <h2>Credit Score Ranges</h2>
        <ul>
          <li><strong>Excellent (750-850):</strong> Best rates and terms</li>
          <li><strong>Good (700-749):</strong> Favorable rates</li>
          <li><strong>Fair (650-699):</strong> May qualify with higher rates</li>
          <li><strong>Poor (600-649):</strong> Limited options, higher rates</li>
          <li><strong>Bad (Below 600):</strong> Very limited options</li>
        </ul>
        
        <h2>Factors That Affect Your Score</h2>
        <ol>
          <li><strong>Payment History (35%):</strong> Pay bills on time</li>
          <li><strong>Credit Utilization (30%):</strong> Keep balances low</li>
          <li><strong>Credit History Length (15%):</strong> Maintain old accounts</li>
          <li><strong>Credit Mix (10%):</strong> Diverse types of credit</li>
          <li><strong>New Credit (10%):</strong> Limit new applications</li>
        </ol>
        
        <h2>How to Improve Your Credit Score</h2>
        <p>Improving your credit score takes time, but these strategies help:</p>
        <ul>
          <li>Pay all bills on time, every time</li>
          <li>Keep credit card balances below 30% of limits</li>
          <li>Don't close old credit accounts</li>
          <li>Dispute any errors on your credit report</li>
          <li>Limit new credit applications</li>
        </ul>
      `
    }
  };

  const post = posts[slug] || posts["smart-ways-to-use-personal-loan"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <Link href="/blog">
              <a className="inline-flex items-center gap-2 text-white hover:text-blue-200 mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </a>
            </Link>
            <span className="inline-block bg-[#FFA500] text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
              {post.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{post.title}</h1>
            <div className="flex items-center gap-6 text-white/90">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {post.date}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-8 md:p-12">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  style={{
                    fontSize: '1.125rem',
                    lineHeight: '1.75',
                  }}
                />

                {/* Share & CTA */}
                <div className="mt-12 pt-8 border-t">
                  <h3 className="text-xl font-bold mb-4">Ready to Apply for a Loan?</h3>
                  <p className="text-gray-600 mb-6">
                    Get started with your loan application today and receive a decision in minutes.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/apply">
                      <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white">
                        Apply Now
                      </Button>
                    </Link>
                    <Link href="/blog">
                      <Button variant="outline">
                        Read More Articles
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Posts */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <span className="inline-block bg-blue-100 text-[#0033A0] px-3 py-1 rounded-full text-xs font-semibold mb-3">
                      Debt Management
                    </span>
                    <h4 className="font-bold text-lg mb-2">Debt Consolidation: Is It Right for You?</h4>
                    <p className="text-gray-600 text-sm mb-4">Explore the pros and cons of consolidating multiple debts...</p>
                    <Link href="/blog/debt-consolidation">
                      <Button variant="ghost" className="text-[#0033A0] p-0">Read More →</Button>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <span className="inline-block bg-blue-100 text-[#0033A0] px-3 py-1 rounded-full text-xs font-semibold mb-3">
                      Financial Planning
                    </span>
                    <h4 className="font-bold text-lg mb-2">How to Budget for Loan Repayment</h4>
                    <p className="text-gray-600 text-sm mb-4">Create a realistic budget that includes your loan payments...</p>
                    <Link href="/blog/budget-loan-repayment">
                      <Button variant="ghost" className="text-[#0033A0] p-0">Read More →</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
