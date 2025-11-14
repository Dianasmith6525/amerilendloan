import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  Headphones,
  TrendingUp,
  ChevronDown,
  Menu,
  Phone,
  ChevronLeft,
  ChevronRight,
  Building2,
  GraduationCap,
  Car,
  Briefcase,
  MessageCircle,
  MessageSquare,
  Search,
  XCircle,
  Calendar,
  DollarSign,
  Star,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  Users,
  Target,
  Heart,
  Check,
  Lock,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, APP_LOGO } from "@/const";
import { PROCESSING_FEE_PERCENTAGE } from "@shared/const";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchClicked, setSearchClicked] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  // Animated counter effect
  const [counters, setCounters] = useState({
    loansProcessed: 0,
    happyCustomers: 0,
    avgApprovalTime: 0,
    customerSatisfaction: 0,
  });

  useEffect(() => {
    const targetValues = {
      loansProcessed: 12547,
      happyCustomers: 9842,
      avgApprovalTime: 24,
      customerSatisfaction: 98,
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCounters({
        loansProcessed: Math.floor(targetValues.loansProcessed * progress),
        happyCustomers: Math.floor(targetValues.happyCustomers * progress),
        avgApprovalTime: Math.floor(targetValues.avgApprovalTime * progress),
        customerSatisfaction: Math.floor(targetValues.customerSatisfaction * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounters(targetValues);
      }
    }, increment);

    return () => clearInterval(timer);
  }, []);

  // Track application query
  const trackQuery = trpc.loans.trackByReference.useQuery(
    { referenceNumber: trackingNumber.trim().toUpperCase() },
    { 
      enabled: searchClicked && trackingNumber.trim().length > 0,
      retry: false 
    }
  );

  const handleTrackSearch = () => {
    if (trackingNumber.trim().length > 0) {
      setSearchClicked(true);
    }
  };

  const resetTracking = () => {
    setTrackingNumber("");
    setSearchClicked(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      case "disbursed":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Loan products data
  const loanProducts = [
    {
      id: 1,
      title: "Emergency Loan",
      description: "Quick cash for urgent expenses",
      minAmount: 500,
      maxAmount: 2500,
      term: "3-12 months",
      apr: "29.99-35.99%",
      icon: TrendingUp,
      iconBg: "bg-red-500",
      badge: null,
    },
    {
      id: 2,
      title: "Personal Loan",
      description: "Flexible loans for any purpose",
      minAmount: 2500,
      maxAmount: 10000,
      term: "12-36 months",
      apr: "24.99-29.99%",
      icon: CheckCircle2,
      iconBg: "bg-blue-500",
      badge: "POPULAR",
    },
    {
      id: 3,
      title: "Debt Consolidation",
      description: "Combine debts into one payment",
      minAmount: 5000,
      maxAmount: 25000,
      term: "24-60 months",
      apr: "19.99-24.99%",
      icon: Shield,
      iconBg: "bg-green-500",
      badge: null,
    },
    {
      id: 4,
      title: "Home Improvement",
      description: "Invest in your property",
      minAmount: 10000,
      maxAmount: 35000,
      term: "24-60 months",
      apr: "19.99-24.99%",
      icon: FileText,
      iconBg: "bg-orange-500",
      badge: null,
    },
    {
      id: 5,
      title: "Business Loan",
      description: "Grow your business ventures",
      minAmount: 5000,
      maxAmount: 50000,
      term: "12-60 months",
      apr: "18.99-24.99%",
      icon: Briefcase,
      iconBg: "bg-purple-500",
      badge: null,
    },
    {
      id: 6,
      title: "Auto Loan",
      description: "Finance your dream vehicle",
      minAmount: 5000,
      maxAmount: 40000,
      term: "24-72 months",
      apr: "16.99-22.99%",
      icon: Car,
      iconBg: "bg-indigo-500",
      badge: null,
    },
    {
      id: 7,
      title: "Student Loan",
      description: "Invest in your education",
      minAmount: 1000,
      maxAmount: 20000,
      term: "12-84 months",
      apr: "14.99-19.99%",
      icon: GraduationCap,
      iconBg: "bg-cyan-500",
      badge: null,
    },
    {
      id: 8,
      title: "Medical Loan",
      description: "Cover healthcare expenses",
      minAmount: 1000,
      maxAmount: 15000,
      term: "6-36 months",
      apr: "19.99-26.99%",
      icon: Headphones,
      iconBg: "bg-pink-500",
      badge: null,
    },
  ];

  const scrollToSlide = (direction: 'prev' | 'next') => {
    if (!carouselRef.current) return;
    
    const cardWidth = carouselRef.current.offsetWidth / 4; // 4 cards visible on desktop
    const scrollAmount = direction === 'next' ? cardWidth : -cardWidth;
    
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-28 py-2">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-2">
                <img
                  src={APP_LOGO}
                  alt="AmeriLend Logo"
                  className="h-24 w-auto"
                />
              </a>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/apply">
                <a className="text-gray-700 hover:text-[#0033A0] transition-colors">
                  Loans
                </a>
              </Link>
              <a href="#about" className="text-gray-700 hover:text-[#0033A0] transition-colors">
                About Us
              </a>
              <a href="#faq" className="text-gray-700 hover:text-[#0033A0] transition-colors">
                Help
              </a>
              <a
                href="tel:1-945-212-1609"
                className="flex items-center gap-2 text-gray-700 hover:text-[#0033A0] transition-colors"
              >
                <Phone className="w-4 h-4" />
                1-945-212-1609
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/apply">
                    <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold px-6">
                      Apply Now
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0] hover:text-white">
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/apply">
                    <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold px-6">
                      Apply Now
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0] hover:text-white"
                    asChild
                  >
                    <Link href="/login">Log In</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              title="Toggle mobile menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-4">
                <Link href="/apply">
                  <a className="text-gray-700 hover:text-[#0033A0]">Loans</a>
                </Link>
                <a href="#about" className="text-gray-700 hover:text-[#0033A0]">
                  About Us
                </a>
                <a href="#faq" className="text-gray-700 hover:text-[#0033A0]">
                  Help
                </a>
                <Link href="/apply">
                  <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white w-full">
                    Apply Now
                  </Button>
                </Link>
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full border-[#0033A0] text-[#0033A0]">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-[#0033A0] text-[#0033A0]"
                    asChild
                  >
                    <Link href="/login">Log In</Link>
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Enhanced with modern design */}
      <section className="relative bg-gradient-to-br from-[#0033A0] via-[#002080] to-[#001060] py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`}}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <Sparkles className="w-8 h-8 text-yellow-400 opacity-60" />
        </div>
        <div className="absolute top-40 right-20 animate-pulse">
          <Zap className="w-6 h-6 text-blue-300 opacity-40" />
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce" style={{ animationDelay: '1s' }}>
          <Heart className="w-7 h-7 text-pink-400 opacity-50" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-white">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
                  #1 Online Lending Platform
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Fast, Secure
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Personal Loans
                </span>
              </h1>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Get approved in minutes, funded the same day. No credit score impact.
                Join thousands of satisfied customers who trust AmeriLend.
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Clock className="w-8 h-8 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-white">Same-Day</div>
                    <div className="text-blue-200 text-sm">Funding</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-white">Bank-Level</div>
                    <div className="text-blue-200 text-sm">Security</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <TrendingUp className="w-8 h-8 text-purple-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-white">Low</div>
                    <div className="text-blue-200 text-sm">APR Rates</div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link href="/apply">
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-4 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Apply Now - Get Funded Today
                  </Button>
                </Link>

                <Link href="/prequalify">
                  <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#0033A0] px-8 py-4 text-lg rounded-full font-semibold w-full sm:w-auto transition-all duration-200">
                    <Target className="w-5 h-5 mr-2" />
                    Check Pre-Qualification
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-sm text-blue-200">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>No Credit Impact</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Transparent Fees</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>24/7 Support</span>
                </div>
              </div>

              {/* Trust Seals Section */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex items-center justify-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium">SSL Secured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium">Bank-Level Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium">BBB Accredited</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#0033A0] to-[#002080] rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0033A0] mb-2">$5,000 Loan Approved</h3>
                  <p className="text-gray-600">in just 24 minutes!</p>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Application Submitted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Credit Check Complete</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Loan Approved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[#0033A0] font-bold">Funds Transferring...</span>
                  </div>
                </div>
              </div>

              {/* Floating Success Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                ✅ Approved!
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-xl p-4 transform -rotate-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0033A0]">{counters.customerSatisfaction}%</div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Animated Counters */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0033A0] mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-gray-600 text-lg">
              Join our growing community of satisfied customers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0033A0] mb-2">
                {counters.loansProcessed.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Loans Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0033A0] mb-2">
                {counters.happyCustomers.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0033A0] mb-2">
                {counters.avgApprovalTime}h
              </div>
              <div className="text-gray-600 font-medium">Avg Approval Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0033A0] mb-2">
                {counters.customerSatisfaction}%
              </div>
              <div className="text-gray-600 font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Track Application Section */}
      <section className="py-16 bg-gradient-to-r from-[#0033A0] to-[#002080]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Track Your Application
            </h2>
            <p className="text-blue-100 text-lg">
              Enter your tracking ID to check your loan application status
            </p>
          </div>

          {/* Search Input */}
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter tracking ID (e.g., AL-20240101-A1B2)"
                    value={trackingNumber}
                    onChange={(e) => {
                      setTrackingNumber(e.target.value.toUpperCase());
                      setSearchClicked(false);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTrackSearch();
                      }
                    }}
                    className="h-12 text-lg"
                  />
                </div>
                <Button
                  onClick={handleTrackSearch}
                  disabled={trackingNumber.trim().length === 0}
                  className="bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold px-8 h-12"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Track
                </Button>
              </div>

              {/* Results */}
              {searchClicked && (
                <div className="mt-6">
                  {trackQuery.isLoading && (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0033A0] border-r-transparent"></div>
                      <p className="mt-4 text-gray-600">Searching for your application...</p>
                    </div>
                  )}

                  {trackQuery.isError && (
                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Application not found.</strong> Please check your tracking ID and try again.
                        Make sure you entered the correct format (e.g., AL-20240101-A1B2).
                      </AlertDescription>
                    </Alert>
                  )}

                  {trackQuery.isSuccess && trackQuery.data && (
                    <div className="space-y-4">
                      {/* Success Header */}
                      <div className="flex items-center justify-between pb-4 border-b">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                          <h3 className="text-xl font-bold text-gray-900">Application Found</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetTracking}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Search Again
                        </Button>
                      </div>

                      {/* Tracking ID Banner */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Application Tracking ID</p>
                        <p className="text-2xl font-bold text-[#0033A0] font-mono">
                          {trackQuery.data.referenceNumber}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700 font-semibold">Status:</span>
                        <span className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusColor(trackQuery.data.status)}`}>
                          {getStatusText(trackQuery.data.status)}
                        </span>
                      </div>

                      {/* Application Details Grid */}
                      <div className="grid md:grid-cols-2 gap-4 pt-4">
                        {/* Loan Amount */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-[#0033A0]" />
                            <span className="text-sm text-gray-600">Loan Amount</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            ${trackQuery.data.requestedAmount?.toLocaleString() || 'N/A'}
                          </p>
                        </div>

                        {/* Application Date */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-[#0033A0]" />
                            <span className="text-sm text-gray-600">Applied On</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {trackQuery.data.createdAt 
                              ? new Date(trackQuery.data.createdAt).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'N/A'}
                          </p>
                        </div>

                        {/* Loan Type */}
                        {trackQuery.data.loanType && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-[#0033A0]" />
                              <span className="text-sm text-gray-600">Loan Type</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                              {trackQuery.data.loanType}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Next Steps / Messages */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
                        {trackQuery.data.status === 'pending' && (
                          <p className="text-gray-700">
                            Your application is currently under review. We'll notify you via email once a decision has been made. 
                            This typically takes 1-2 business days.
                          </p>
                        )}
                        {trackQuery.data.status === 'approved' && (
                          <p className="text-gray-700">
                            Congratulations! Your loan has been approved. Please log in to your account to complete the final steps 
                            and receive your funds.
                          </p>
                        )}
                        {trackQuery.data.status === 'rejected' && (
                          <p className="text-gray-700">
                            Unfortunately, your application was not approved at this time. Please contact support for more information.
                          </p>
                        )}
                        {trackQuery.data.status === 'disbursed' && (
                          <p className="text-gray-700">
                            Your loan has been disbursed! The funds should appear in your account within 1-2 business days.
                          </p>
                        )}
                      </div>

                      {/* Login CTA */}
                      <div className="text-center pt-4">
                        <p className="text-gray-600 mb-3">
                          For more details and to manage your loan, please log in to your account.
                        </p>
                        <Link href="/login">
                          <Button className="bg-[#0033A0] hover:bg-[#002080] text-white">
                            Log In to Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Prequalify Quick Check Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0033A0] mb-4">
              Find Your Perfect Loan
            </h2>
            <p className="text-gray-700 text-lg">
              Check if you prequalify in 2 minutes. Won't affect your credit score!
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative max-w-7xl mx-auto">
            {/* Previous Button */}
            <button
              onClick={() => scrollToSlide('prev')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Previous loans"
            >
              <ChevronLeft className="w-6 h-6 text-[#0033A0]" />
            </button>

            {/* Carousel */}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
            >
              {loanProducts.map((loan) => {
                const Icon = loan.icon;
                return (
                  <Card
                    key={loan.id}
                    className={`min-w-[280px] md:min-w-[calc(25%-18px)] hover:shadow-xl transition-shadow border-2 snap-start ${
                      loan.badge === 'POPULAR' ? 'border-[#FFA500]' : 'hover:border-[#0033A0]'
                    } cursor-pointer relative`}
                  >
                    {loan.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-[#FFA500] text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {loan.badge}
                        </span>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${loan.iconBg} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{loan.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{loan.description}</p>
                      <div className="text-2xl font-bold text-[#0033A0] mb-2">
                        {formatCurrency(loan.minAmount)} - {formatCurrency(loan.maxAmount)}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {loan.term} • {loan.apr} APR
                      </p>
                      <p className="text-xs text-orange-600 font-semibold mb-4">
                        {PROCESSING_FEE_PERCENTAGE}% processing fee applies
                      </p>
                      <Link href="/prequalify">
                        <Button
                          className={`w-full ${
                            loan.badge === 'POPULAR'
                              ? 'bg-[#FFA500] hover:bg-[#FF8C00] text-white'
                              : ''
                          }`}
                          variant={loan.badge === 'POPULAR' ? 'default' : 'outline'}
                        >
                          Check Eligibility
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => scrollToSlide('next')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Next loans"
            >
              <ChevronRight className="w-6 h-6 text-[#0033A0]" />
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              ✓ Soft credit check only • ✓ No impact to credit score • ✓ Get results in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Trust Badge */}
      <section className="bg-gray-50 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            Testimonials reflect the individual's opinion and may not be illustrative of all individual experiences with AmeriLend.
          </p>
        </div>
      </section>

      {/* Process Section - Blue Background */}
      <section className="bg-[#0033A0] text-white py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Process Steps */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Simple Loan Application Process
              </h2>
              <p className="text-white/90 mb-8">
                Working with trusted financial partners, the AmeriLend platform offers personal loans designed to fit your needs. The process is simple and built around you:
              </p>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white text-[#0033A0] flex items-center justify-center text-xl font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Apply Online</h3>
                    <p className="text-white/90">
                      The application process is quick and easy, with decisions often made in minutes.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white text-[#0033A0] flex items-center justify-center text-xl font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Approval Process</h3>
                    <p className="text-white/90">
                      We consider more than just your credit score, so even if you've been turned down by others, you may still qualify.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white text-[#0033A0] flex items-center justify-center text-xl font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Same-Day Funding Available</h3>
                    <p className="text-white/90">
                      If approved, you may receive money in your account as soon as the same business day!<sup>1</sup>
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/apply">
                <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold px-8 py-6 text-lg mt-8">
                  Apply Now
                </Button>
              </Link>

              <p className="text-sm text-white/80 mt-4">
                Applying does NOT affect your FICO® credit score.<sup>2</sup>
              </p>
            </div>

            {/* Eligibility Requirements Card */}
            <div className="bg-white text-gray-800 rounded-lg p-8 shadow-xl">
              <h3 className="text-xl font-bold text-[#0033A0] mb-6">
                Before you get started, let's review our eligibility requirements.
              </h3>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#0033A0]" />
                  </div>
                  <span>Be at least 18 years old</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#0033A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span>Be a U.S. resident in any state</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#0033A0]" />
                  </div>
                  <span>Have a regular source of income</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#0033A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span>Have a checking or savings account</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#0033A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>Receive paychecks through direct deposit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Blue Background */}
      <section className="bg-[#0033A0] text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why AmeriLend Is Right For You
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Benefit 1 */}
            <Card className="bg-white text-gray-800 relative pt-8">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-[#0033A0] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <CardContent className="pt-8 pb-6 text-center">
                <h3 className="text-xl font-bold text-[#0033A0] mb-3">Easy to Apply</h3>
                <p className="text-gray-600">
                  Our online application process is convenient and only requires personal and employment information for quick and easy completion.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 2 */}
            <Card className="bg-white text-gray-800 relative pt-8">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-[#0033A0] flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <CardContent className="pt-8 pb-6 text-center">
                <h3 className="text-xl font-bold text-[#0033A0] mb-3">Same-Day Funding Available</h3>
                <p className="text-gray-600">
                  If approved, you may receive money in your account as soon as the same business day!<sup>1</sup>
                </p>
              </CardContent>
            </Card>

            {/* Benefit 3 */}
            <Card className="bg-white text-gray-800 relative pt-8">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-[#0033A0] flex items-center justify-center">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <CardContent className="pt-8 pb-6 text-center">
                <h3 className="text-xl font-bold text-[#0033A0] mb-3">Loan Support At Every Step</h3>
                <p className="text-gray-600">
                  Our top-rated Loan Advocates are available to provide support at every step of the application process. We succeed when you do!
                </p>
              </CardContent>
            </Card>

            {/* Benefit 4 */}
            <Card className="bg-white text-gray-800 relative pt-8">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-[#0033A0] flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardContent className="pt-8 pb-6 text-center">
                <h3 className="text-xl font-bold text-[#0033A0] mb-3">Safe and Secure</h3>
                <p className="text-gray-600">
                  We are dedicated to protecting your information and communications with advanced 256 bit encryption technology.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 5 */}
            <Card className="bg-white text-gray-800 relative pt-8">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-[#0033A0] flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <CardContent className="pt-8 pb-6 text-center">
                <h3 className="text-xl font-bold text-[#0033A0] mb-3">Transparent Process</h3>
                <p className="text-gray-600">
                  We supply you with an easy-to-read schedule with predictable payments and the ability to set up automatic payments.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 6 */}
            <Card className="bg-white text-gray-800 relative pt-8">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-[#0033A0] flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <CardContent className="pt-8 pb-6 text-center">
                <h3 className="text-xl font-bold text-[#0033A0] mb-3">Build Credit History</h3>
                <p className="text-gray-600">
                  We report your payment history to the three major credit bureaus, so every on-time payment you make may help boost your credit history.<sup>6</sup>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0033A0] text-center mb-12">
            FAQs
          </h2>

          <div className="space-y-4">
            {[
              {
                question: "What are the eligibility requirements to apply for a loan?",
                answer:
                  "To apply, you must be at least 18 years old, be a U.S. resident in any state, have a regular source of income, maintain a checking or savings account, and receive paychecks through direct deposit.",
                color: "border-l-orange-500",
              },
              {
                question: "How much money can I apply for?",
                answer:
                  "Loan amounts vary based on your state of residence, income, and creditworthiness. Typically, you can apply for loans ranging from $500 to $10,000.",
                color: "border-l-purple-500",
              },
              {
                question: "What is the processing fee and when do I pay it?",
                answer:
                  `All approved loans have a ${PROCESSING_FEE_PERCENTAGE}% processing fee that must be paid before funds are disbursed. For example, on a $5,000 loan, the processing fee would be $${(5000 * PROCESSING_FEE_PERCENTAGE / 100).toFixed(2)}. This one-time fee covers application processing, verification, and administrative costs. You can pay via credit/debit card or cryptocurrency.`,
                color: "border-l-green-500",
              },
              {
                question: "How are AmeriLend loans different?",
                answer:
                  "We consider more than just your credit score during the approval process. Our transparent fee structure, same-day funding options, and dedicated loan advocates set us apart from traditional lenders.",
                color: "border-l-teal-500",
              },
              {
                question: "What can you use a personal loan for?",
                answer:
                  "Personal loans can be used for various purposes including debt consolidation, emergency expenses, home improvements, medical bills, or unexpected costs. However, they cannot be used for illegal activities or speculative investments.",
                color: "border-l-pink-500",
              },
              {
                question: "How does repayment of a personal loan work?",
                answer:
                  "Repayment is structured with fixed installments over a predetermined period. You'll receive a clear repayment schedule showing all payment dates and amounts. We offer automatic payment options for your convenience.",
                color: "border-l-blue-500",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className={`bg-white border-l-4 ${faq.color} rounded-r-lg shadow-sm overflow-hidden`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-800">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Content Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0033A0] text-center mb-12">
            Making Personal Finance Approachable
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Article 1 */}
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-200 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-[#0033A0] mb-2">
                  The AmeriLend Money Guide: A Financial Management Tool
                </h3>
                <p className="text-gray-600 text-sm">
                  Pick up best practices for managing finances, from budgeting for all types of households to dealing with income challenges.
                </p>
              </CardContent>
            </Card>

            {/* Article 2 */}
            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 mx-auto mb-4 flex items-center justify-center">
                  <DollarSign className="w-16 h-16 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-[#0033A0] mb-2">
                  How to Survive and Budget When Money Is Tight
                </h3>
                <p className="text-gray-600 text-sm">
                  Finding extra money to put aside isn't easy when finances are tight, but that doesn't mean you can't do it.
                </p>
              </CardContent>
            </Card>

            {/* Article 3 */}
            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-100 to-red-200 mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-16 h-16 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-[#0033A0] mb-2">
                  'Should I Buy This?' A Financial Flowchart for Smart Spending
                </h3>
                <p className="text-gray-600 text-sm">
                  Are you a smart spender? These 5 questions will make you one.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about">
                    <a className="hover:text-white transition-colors">About Us</a>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <a className="hover:text-white transition-colors">Contact Us</a>
                  </Link>
                </li>
                <li>
                  <Link href="/careers">
                    <a className="hover:text-white transition-colors">Careers</a>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Loans */}
            <div>
              <h4 className="font-bold text-lg mb-4">Loans</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/apply">
                    <a className="hover:text-white transition-colors">Personal Loans</a>
                  </Link>
                </li>
                <li>
                  <Link href="/apply">
                    <a className="hover:text-white transition-colors">Installment Loans</a>
                  </Link>
                </li>
                <li>
                  <Link href="/track">
                    <a className="hover:text-white transition-colors">Track Application</a>
                  </Link>
                </li>
                <li>
                  <Link href="/rates-and-terms">
                    <a className="hover:text-white transition-colors">Rates and Terms</a>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQs
                  </a>
                </li>
                <li>
                  <Link href="/blog">
                    <a className="hover:text-white transition-colors">Financial Blog</a>
                  </Link>
                </li>
                <li>
                  <Link href="/guides">
                    <a className="hover:text-white transition-colors">Loan Guides</a>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/legal/terms-of-service.md" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <Link href="/privacy-policy">
                    <a className="hover:text-white transition-colors">
                      Privacy Policy
                    </a>
                  </Link>
                </li>
                <li>
                  <a href="/legal/esign-consent.md" className="hover:text-white transition-colors">
                    E-Sign Consent
                  </a>
                </li>
                <li>
                  <Link href="/do-not-sell">
                    <a className="hover:text-white transition-colors">
                      Do Not Sell My Info
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Us via WhatsApp and Telegram */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="text-center">
              <h4 className="font-bold text-lg mb-4">Contact Us</h4>
              <p className="text-gray-400 mb-4">Get in touch with our support team</p>
              <div className="flex gap-3 justify-center">
                <a
                  href="https://wa.me/19452121609?text=Hello, I need help with AmeriLend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-6 py-3 rounded-lg transition-colors text-sm font-semibold shadow-lg"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href="https://t.me/19452121609"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 py-3 rounded-lg transition-colors text-sm font-semibold shadow-lg"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-gray-400 text-sm">
            {/* Legal Links and Privacy */}
            <div className="text-center mb-6">
              <p className="mb-2">
                <Link href="/privacy-policy">
                  <a className="hover:text-white transition-colors underline">
                    California Disclosures and Privacy Policy
                  </a>
                </Link>
                {" | "}
                California Consumers can opt-out of the sale of personal information by clicking{" "}
                <Link href="/do-not-sell">
                  <a className="hover:text-white transition-colors underline font-semibold">
                    Do Not Sell My Personal Information
                  </a>
                </Link>
              </p>
            </div>

            {/* Bank Partners Notice */}
            <div className="text-xs max-w-5xl mx-auto mb-6 text-center">
              <p className="mb-4">
                Applications submitted on the AmeriLend platform will be originated by one of our bank partners and serviced by AmeriLend. Please see the Rates and Terms for details regarding the availability of products in your state of residence.
              </p>
            </div>

            {/* Detailed Disclosures */}
            <div className="text-xs max-w-5xl mx-auto space-y-4 text-left">
              <p>
                <sup>1</sup>Subject to credit approval and verification. Actual approved loan amount and terms are dependent on our bank partners' standard underwriting guidelines and credit policies. Funds may be deposited for delivery to your bank via ACH as soon as the same business day if verification is completed and final approval occurs before 12:00 PM CT on a business day. If approval occurs after 12:00 PM CT on a business day or on a non-business day, funds may be delivered as soon as the next business day. Availability of the funds is dependent on how quickly your bank processes the transaction.
              </p>

              <p>
                <sup>2</sup>AmeriLend's Bank Partners may use credit report information provided by Clarity Services and Experian as part of the application process to determine your creditworthiness. Neither credit inquiry will appear as a hard credit inquiry on your Experian credit report and therefore they will not affect your FICO score.
              </p>

              <p>
                <sup>5</sup>According to the Consumer Federation of America, a non-profit consumer advocacy group, payday loans range in size from $100 to $1,000, depending on state legal maximums, and carry an average annual percentage rate (APR) of 400%. The maximum APR for a loan offered through and serviced by AmeriLend is 195% and loan sizes range from $500 to $100,000.{" "}
                <a href="https://paydayloaninfo.org/how-payday-loans-work/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">
                  https://paydayloaninfo.org/how-payday-loans-work/
                </a>
              </p>

              <p>
                <sup>6</sup>AmeriLend and its Bank Partners report customer payment history to the three major credit bureaus. On-time payments may improve credit score.
              </p>

              <div className="border-t border-gray-700 pt-4 mt-6">
                <p className="font-semibold mb-2">USA PATRIOT ACT NOTICE: IMPORTANT INFORMATION ABOUT PROCEDURES FOR OPENING A NEW ACCOUNT</p>
                <p className="mb-4">
                  To help the government fight the funding of terrorism and money laundering activities, Federal law requires all financial institutions to obtain, verify, and record information that identifies each person who opens an account. What this means for you: When you open an account, we will ask for your name, address, date of birth, and other information that will allow us to identify you. We may also ask to see your driver's license or other identifying documents.
                </p>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-4">
                <p className="font-semibold mb-2">Customer Support</p>
                <p>If you have questions or concerns, please contact the AmeriLend Customer Support Team:</p>
                <div className="mt-3 space-y-2">
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    <a href="tel:+19452121609" className="hover:text-white transition-colors underline">
                      (945) 212-1609
                    </a>
                  </p>
                  <p>Monday – Friday, 7 a.m. – 11:00 p.m. and Saturday and Sunday, 9 a.m. – 5:00 p.m. Central Time</p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    <a href="mailto:support@amerilendloan.com" className="hover:text-white transition-colors underline">
                      support@amerilendloan.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center mt-8 pt-6 border-t border-gray-700">
              {/* Authorize.Net Seal */}
              <div className="mb-4 flex justify-center">
                <div className="AuthorizeNetSeal">
                  {/* Authorize.Net is a registered trademark of CyberSource Corporation */}
                  <script 
                    type="text/javascript" 
                    dangerouslySetInnerHTML={{
                      __html: 'var ANS_customer_id="2be1fcff-517b-4ceb-aa13-06e36deec1ff";'
                    }}
                  />
                  <script 
                    type="text/javascript" 
                    src="https://verify.authorize.net/anetseal/seal.js"
                  />
                </div>
              </div>
              <p>© 2025 AmeriLend - U.S. Consumer Loan Platform. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
