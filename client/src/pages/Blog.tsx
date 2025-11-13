import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Blog() {
  const posts = [
    {
      title: "5 Smart Ways to Use a Personal Loan",
      excerpt: "Discover how personal loans can help you consolidate debt, make home improvements, or handle unexpected expenses.",
      author: "Sarah Johnson",
      date: "November 5, 2025",
      category: "Loan Tips",
      image: "https://placehold.co/400x250/0033A0/white?text=Loan+Tips"
    },
    {
      title: "Understanding Your Credit Score: A Complete Guide",
      excerpt: "Learn what affects your credit score and practical steps you can take to improve it over time.",
      author: "Michael Chen",
      date: "November 3, 2025",
      category: "Credit Education",
      image: "https://placehold.co/400x250/FFA500/white?text=Credit+Score"
    },
    {
      title: "How to Budget for Loan Repayment",
      excerpt: "Create a realistic budget that includes your loan payments while still meeting your other financial goals.",
      author: "Emily Rodriguez",
      date: "October 28, 2025",
      category: "Financial Planning",
      image: "https://placehold.co/400x250/0033A0/white?text=Budgeting"
    },
    {
      title: "Debt Consolidation: Is It Right for You?",
      excerpt: "Explore the pros and cons of consolidating multiple debts into a single personal loan.",
      author: "David Thompson",
      date: "October 25, 2025",
      category: "Debt Management",
      image: "https://placehold.co/400x250/FFA500/white?text=Debt+Tips"
    },
    {
      title: "Building an Emergency Fund While Repaying Loans",
      excerpt: "Strategies to save for emergencies even when you have monthly loan payments.",
      author: "Lisa Anderson",
      date: "October 20, 2025",
      category: "Savings",
      image: "https://placehold.co/400x250/0033A0/white?text=Emergency+Fund"
    },
    {
      title: "What to Do If You Can't Make a Loan Payment",
      excerpt: "Learn about your options and how to communicate with lenders during financial hardship.",
      author: "James Wilson",
      date: "October 15, 2025",
      category: "Loan Management",
      image: "https://placehold.co/400x250/FFA500/white?text=Hardship+Help"
    }
  ];

  const categories = [
    "All Posts",
    "Loan Tips",
    "Credit Education",
    "Financial Planning",
    "Debt Management",
    "Savings"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0033A0] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Financial Blog</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Expert insights, tips, and guides to help you achieve your financial goals.
          </p>
        </div>
      </div>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                className={index === 0 ? "bg-[#FFA500] hover:bg-[#FF8C00]" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <div className="mb-3">
                    <span className="inline-block bg-blue-100 text-[#0033A0] px-3 py-1 rounded-full text-xs font-semibold">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </span>
                  </div>
                  <Link href={`/blog/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}>
                    <Button variant="ghost" className="w-full justify-between text-[#0033A0] hover:text-[#002080]">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Informed</h2>
            <p className="text-gray-600 mb-8">
              Subscribe to our newsletter for the latest financial tips and loan insights.
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
              />
              <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-6">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
