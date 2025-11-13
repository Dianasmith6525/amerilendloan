import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ContactSupportDialog } from "@/components/ContactSupport";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  FileText,
  Phone,
  LogOut,
  AlertCircle,
  CreditCard,
  Bitcoin,
  Coins,
  Banknote,
  Users,
  Copy,
  Share2,
  Settings,
  TrendingUp,
  Wallet,
  Download,
  Eye,
  Calendar,
  Bell,
  Trash2,
  HelpCircle,
  BadgeCheck,
  ExternalLink,
  MessageCircle,
  Sparkles,
  X,
  Upload,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LoanCalculator } from "@/components/LoanCalculator";

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const utils = trpc.useContext();
  
  // Redirect admins to admin panel
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      setLocation("/admin");
    }
  }, [isAuthenticated, user?.role, setLocation]);
  
  const { data: loans, isLoading } = trpc.loans.myApplications.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== "admin",
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Fetch referral stats
  const { data: referralCode } = trpc.referrals.getMyReferralCode.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== "admin",
  });
  
  const { data: referralStats } = trpc.referrals.getMyStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== "admin",
  });

  // Fetch real-time fee configuration
  const { data: feeConfig } = trpc.feeConfig.getActive.useQuery();

  // Calculate processing fee based on real configuration
  const calculateProcessingFee = (amountInCents: number): number => {
    if (!feeConfig || amountInCents <= 0) return 0;
    
    const amountInDollars = amountInCents / 100;
    
    if (feeConfig.calculationMode === "percentage") {
      // percentageRate is in basis points (200 = 2.00%)
      return Math.round((amountInCents * feeConfig.percentageRate) / 10000);
    } else {
      // fixedFeeAmount is in cents
      return feeConfig.fixedFeeAmount;
    }
  };

  // Get fee percentage for display
  const getFeePercentageDisplay = (): string => {
    if (!feeConfig) return "2.0%"; // Default display
    
    if (feeConfig.calculationMode === "percentage") {
      return `${(feeConfig.percentageRate / 100).toFixed(2)}%`;
    } else {
      return `$${(feeConfig.fixedFeeAmount / 100).toFixed(2)} flat fee`;
    }
  };

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } = trpc.notifications.getMyNotifications.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  const { data: unreadCount, refetch: refetchUnreadCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
      toast.success("All notifications marked as read");
    },
  });

  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
      toast.success("Notification deleted");
    },
  });

  // AI Chat mutation
  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    },
    onError: (error) => {
      toast.error("Failed to get AI response");
      setChatMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm having trouble connecting right now. Please call us at 1-945-212-1609 for immediate assistance." 
        },
      ]);
    },
  });

  // Handle sending message to AI
  const handleSendAIMessage = (content: string) => {
    // Add user message to chat
    const userMessage: Message = { role: "user", content };
    setChatMessages((prev) => [...prev, userMessage]);

    // Filter out system messages for API (only send user and assistant messages)
    const conversationHistory: { role: "user" | "assistant"; content: string; }[] = chatMessages
      .filter((msg): msg is Message & { role: "user" | "assistant" } => msg.role !== "system")
      .slice(-10)
      .map(msg => ({ role: msg.role, content: msg.content }));

    // Send to AI
    chatMutation.mutate({
      message: content,
      conversationHistory,
      includeUserContext: true, // Include user's loan data for personalized help
    });
  };

  // Calculate dashboard stats
  const stats = {
    totalApplications: loans?.length || 0,
    activeLoans: loans?.filter(l => l.status === 'approved' || l.status === 'fee_paid' || l.status === 'disbursed').length || 0,
    totalBorrowed: loans?.filter(l => l.status === 'disbursed').reduce((sum, l) => sum + (l.approvedAmount || 0), 0) || 0,
    totalFeesPaid: loans?.filter((l: any) => l.payment?.status === 'succeeded').reduce((sum, l: any) => sum + (l.payment?.amount || 0), 0) || 0,
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-28 py-2">
              <Link href="/">
                <a className="flex items-center">
                  <img
                    src="/new-logo-final.png"
                    alt="AmeriLend Logo"
                    className="h-24 w-auto"
                  />
                </a>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center py-12">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#0033A0]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0033A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#0033A0] mb-2">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to view your dashboard and manage your loan applications.
              </p>
              <Button
                className="w-full bg-[#FFA500] hover:bg-[#FF8C00] text-white"
                asChild
              >
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        text: "Under Review",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-300",
      },
      approved: {
        icon: CheckCircle2,
        text: "Approved",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-300",
      },
      rejected: {
        icon: XCircle,
        text: "Not Approved",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-300",
      },
      fee_pending: {
        icon: AlertCircle,
        text: "Payment Required",
        bgColor: "bg-orange-100",
        textColor: "text-orange-800",
        borderColor: "border-orange-300",
      },
      fee_paid: {
        icon: CreditCard,
        text: "Payment Confirmed",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-300",
      },
      disbursed: {
        icon: CheckCircle2,
        text: "Funded",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-300",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{config.text}</span>
      </div>
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const getPaymentMethodDisplay = (payment: any) => {
    if (!payment) return null;

    const isCard = payment.paymentMethod === "card";
    const isCrypto = payment.paymentMethod === "crypto";

    if (isCard && payment.cardBrand && payment.cardLast4) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{payment.cardBrand}</span>
          <span className="text-gray-500">•••• {payment.cardLast4}</span>
        </div>
      );
    }

    if (isCrypto && payment.cryptoCurrency) {
      const cryptoIcons: Record<string, any> = {
        BTC: Bitcoin,
        ETH: Coins,
        USDT: Banknote,
        USDC: Banknote,
      };
      const Icon = cryptoIcons[payment.cryptoCurrency] || Coins;
      
      return (
        <div className="flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-orange-600" />
          <span className="font-medium">{payment.cryptoCurrency}</span>
          {payment.cryptoAmount && (
            <span className="text-gray-500">{payment.cryptoAmount}</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <CreditCard className="w-4 h-4" />
        <span>Payment pending</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-28 py-2">
            <Link href="/">
              <a className="flex items-center">
                <img
                  src="/new-logo-final.png"
                  alt="AmeriLend Logo"
                  className="h-24 w-auto"
                />
              </a>
            </Link>
            <div className="flex items-center gap-3">
              <a
                href="tel:1-945-212-1609"
                className="hidden md:flex items-center gap-2 text-gray-700 hover:text-[#0033A0]"
              >
                <Phone className="w-4 h-4" />
                1-945-212-1609
              </a>
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" className="border-[#0033A0] text-[#0033A0]">
                    Admin Panel
                  </Button>
                </Link>
              )}
              
              {/* Notifications Dropdown */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[#0033A0] text-[#0033A0] relative">
                    <Bell className="w-4 h-4" />
                    {unreadCount && unreadCount.count > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
                      >
                        {unreadCount.count}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
                  <div className="p-3 border-b sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#0033A0]">Notifications</h3>
                      {notifications && notifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAllAsReadMutation.mutate()}
                          className="text-xs"
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {!notifications || notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification: any) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer ${
                            notification.read === 0 ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (notification.read === 0) {
                              markAsReadMutation.mutate({ notificationId: notification.id });
                            }
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-gray-900">
                                  {notification.title}
                                </h4>
                                {notification.read === 0 && (
                                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate({ notificationId: notification.id });
                              }}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Link href="/settings">
                <Button
                  variant="outline"
                  className="border-[#0033A0] text-[#0033A0]"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden md:inline ml-2">Settings</span>
                </Button>
              </Link>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-[#0033A0] text-[#0033A0]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0033A0] to-[#0052D4] text-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Welcome back, {user?.name?.split(' ')[0] || "Valued Customer"}
              </h1>
              <p className="text-blue-100 text-lg">
                Here's what's happening with your loans today
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 font-medium">Applications</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 font-medium">Active Loans</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.activeLoans}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-sm">
                    <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 font-medium">Borrowed</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBorrowed)}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
                    <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 font-medium">Fees Paid</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalFeesPaid)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">New Loan</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get funds in as little as 24 hours
                    </p>
                    <Link href="/apply">
                      <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white w-full shadow-md">
                        Apply Now →
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">Need Help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Talk to a loan specialist now
                    </p>
                    <Button
                      variant="outline"
                      className="border-2 border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0] hover:text-white w-full transition-colors"
                      asChild
                    >
                      <a href="tel:1-945-212-1609">Call Support</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">Earn $50</h3>
                    
                    {referralCode && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-2">Your Code</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-3 py-2 rounded-lg font-mono text-sm font-bold text-[#0033A0] flex-1 text-center">
                            {referralCode.referralCode}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(referralCode.referralCode);
                              toast.success("Code copied!");
                            }}
                            className="h-10 w-10 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {referralStats && (
                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="bg-blue-50 p-2 rounded-lg text-center">
                          <p className="text-xs text-gray-600">Referrals</p>
                          <p className="font-bold text-[#0033A0] text-lg">{referralStats.total || 0}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg text-center">
                          <p className="text-xs text-gray-600">Earned</p>
                          <p className="font-bold text-green-600 text-lg">${referralStats.totalEarnings ? (referralStats.totalEarnings / 100).toFixed(0) : '0'}</p>
                        </div>
                      </div>
                    )}
                    
                    <Link href="/referrals">
                      <Button className="bg-green-600 hover:bg-green-700 text-white w-full shadow-md">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personalized Recommendations + Loan Calculator */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Personalized Recommendations */}
            <div className="md:col-span-2">
              <Card className="border-t-4 border-t-blue-500 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Personalized for You
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">{loans && loans.length === 0 ? (
                    <div className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-10 h-10 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">Ready to Get Started?</h4>
                      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                        Apply for your first loan today and unlock personalized offers designed just for you.
                      </p>
                      <Button
                        className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-8 shadow-lg"
                        onClick={() => window.location.href = '/apply'}
                      >
                        Start Your Application
                      </Button>
                    </div>
                  ) : (
                    <>
                      {stats.totalApplications > 0 && stats.activeLoans === 0 && stats.totalBorrowed > 0 && (
                        <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-green-900 mb-1.5 text-base">
                                You're Pre-Qualified!
                              </h4>
                              <p className="text-sm text-green-800 mb-3">
                                Based on your excellent payment history, you may qualify for up to{' '}
                                <strong className="text-lg">${Math.floor(stats.totalBorrowed / 100 * 1.5).toLocaleString()}</strong>
                              </p>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                                onClick={() => window.location.href = '/apply'}
                              >
                                Apply Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {stats.activeLoans > 0 && (
                        <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-blue-900 mb-1.5 text-base">
                                Active Loan in Progress
                              </h4>
                              <p className="text-sm text-blue-800">
                                Complete your current loan to unlock even better rates and higher borrowing limits.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {stats.totalFeesPaid > 0 && (
                        <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-purple-900 mb-1.5 text-base">
                                Loyalty Discount Available
                              </h4>
                              <p className="text-sm text-purple-800 mb-3">
                                As a valued customer, enjoy 0.5% off processing fees on your next loan!
                              </p>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                                onClick={() => window.location.href = '/apply'}
                              >
                                Claim Your Discount
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {referralStats && referralStats.total > 0 && (
                        <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-orange-900 mb-1.5 text-base">
                                Referral Bonus Unlocked!
                              </h4>
                              <p className="text-sm text-orange-800 mb-3">
                                You've referred {referralStats.total} {referralStats.total === 1 ? 'friend' : 'friends'}. 
                                Get an extra $25 bonus on your next approved loan!
                              </p>
                              <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                                onClick={() => window.location.href = '/referrals'}
                              >
                                View Referrals
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Loan Calculator */}
            <div className="md:col-span-1">
              <LoanCalculator />
            </div>
          </div>

          {/* Loan Applications */}
          <Card className="shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#0033A0]" />
                  My Loan Applications
                </CardTitle>
                {loans && loans.length > 0 && (
                  <Badge className="bg-[#0033A0] text-white px-3 py-1">
                    {loans.length} {loans.length === 1 ? 'Application' : 'Applications'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">{isLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block w-12 h-12 border-4 border-[#0033A0] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading your applications...</p>
                </div>
              ) : loans && loans.length > 0 ? (
                <div className="space-y-5">
                  {loans.map((loan) => (
                    <Card key={loan.id} className="border-l-4 border-l-[#0033A0] hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">
                                {loan.loanType === "installment" ? "Installment Loan" : "Short-Term Loan"}
                              </h3>
                              {getStatusBadge(loan.status)}
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Requested</p>
                                <p className="font-bold text-gray-900 text-lg">
                                  {formatCurrency(loan.requestedAmount)}
                                </p>
                              </div>
                              {loan.approvedAmount && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Approved</p>
                                  <p className="font-bold text-green-700 text-lg">
                                    {formatCurrency(loan.approvedAmount)}
                                  </p>
                                </div>
                              )}
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Submitted</p>
                                <p className="font-semibold text-gray-900">
                                  {formatDate(loan.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Payment Method */}
                            {(loan as any).payment && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                                {getPaymentMethodDisplay((loan as any).payment)}
                                {(loan as any).payment.cryptoTxHash && (
                                  <a
                                    href={`https://blockchain.com/btc/tx/${(loan as any).payment.cryptoTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                  >
                                    View Transaction ↗
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Disbursement Info */}
                            {(loan as any).disbursement && (
                              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-xs font-semibold text-green-800 mb-1">Disbursement Details</p>
                                <div className="text-sm space-y-1">
                                  {(loan as any).disbursement.amount && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">Amount:</span>
                                      <span className="font-semibold">{formatCurrency((loan as any).disbursement.amount)}</span>
                                    </div>
                                  )}
                                  {(loan as any).disbursement.disbursementDate && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">Date:</span>
                                      <span className="font-semibold">{formatDate((loan as any).disbursement.disbursementDate)}</span>
                                    </div>
                                  )}
                                  {(loan as any).disbursement.method && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">Method:</span>
                                      <span className="font-semibold capitalize">{(loan as any).disbursement.method}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ID Verification Rejected - More Info Needed */}
                            {loan.idVerificationStatus === 'rejected' && loan.idVerificationNotes && (
                              <div className="mt-3 p-4 bg-red-50 rounded-lg border-2 border-red-300">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-red-900 mb-2">⚠️ Additional Documents Required</p>
                                    <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded mb-3">
                                      <p className="text-sm font-semibold text-red-800 mb-1">Admin Message:</p>
                                      <p className="text-sm text-red-900">{loan.idVerificationNotes}</p>
                                    </div>
                                    <p className="text-sm text-red-800 mb-2">
                                      Please review the message above and upload new documents that meet the requirements.
                                    </p>
                                    <p className="text-xs text-red-700 font-medium">
                                      💡 Tip: Make sure all text is readable and avoid glare or shadows.
                                    </p>
                                  </div>
                                </div>
                                <Link href={`/upload-id/${loan.id}`}>
                                  <Button className="bg-red-500 hover:bg-red-600 text-white w-full shadow-md">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload New Documents
                                  </Button>
                                </Link>
                              </div>
                            )}

                            {/* ID Upload Section - First Time or Missing */}
                            {(!loan.idFrontUrl || !loan.idBackUrl || !loan.selfieUrl) && loan.status !== 'rejected' && loan.idVerificationStatus !== 'rejected' && (
                              <div className="mt-3 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-yellow-900 mb-1">ID Verification Required</p>
                                    <p className="text-sm text-yellow-800">Please upload your identification documents to complete your application.</p>
                                  </div>
                                </div>
                                <Link href={`/upload-id/${loan.id}`}>
                                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-white w-full shadow-md">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload ID Documents
                                  </Button>
                                </Link>
                              </div>
                            )}

                            {/* ID Verification Status */}
                            {loan.idFrontUrl && loan.idBackUrl && loan.selfieUrl && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 text-sm">
                                  <BadgeCheck className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold text-blue-900">ID Documents Uploaded</span>
                                  <Badge className="ml-auto" variant={
                                    loan.idVerificationStatus === 'verified' ? 'default' :
                                    loan.idVerificationStatus === 'pending' ? 'secondary' : 'destructive'
                                  }>
                                    {loan.idVerificationStatus === 'verified' ? 'Verified' :
                                     loan.idVerificationStatus === 'pending' ? 'Under Review' : 'Needs Attention'}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {/* Processing Fee Payment Section */}
                            {loan.status === 'approved' && !loan.processingFeePaid && (
                              <div className="mt-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-orange-900 mb-1">Processing Fee Required</p>
                                    <p className="text-sm text-orange-800 mb-2">
                                      Your loan has been approved! Pay the processing fee to receive your funds.
                                    </p>
                                    <p className="text-xs text-orange-700 font-semibold">
                                      Fee Amount: {formatCurrency(calculateProcessingFee(loan.approvedAmount || 0))}
                                    </p>
                                  </div>
                                </div>
                                <Link href={`/payment/${loan.id}`}>
                                  <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white w-full shadow-md">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Pay Processing Fee Now
                                  </Button>
                                </Link>
                              </div>
                            )}
                            
                            {/* Activity Timeline */}
                            <div className="mt-4 border-t pt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Application Timeline
                              </p>
                              <div className="space-y-2">
                                {/* Application Submitted */}
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-700">Application Submitted</p>
                                    <p className="text-xs text-gray-500">{formatDate(loan.createdAt)}</p>
                                  </div>
                                </div>
                                
                                {/* Under Review */}
                                {loan.status !== 'pending' && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-600 mt-1.5"></div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-700">Under Review</p>
                                      <p className="text-xs text-gray-500">{formatDate(loan.updatedAt || loan.createdAt)}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Approved */}
                                {(loan.status === 'approved' || loan.status === 'fee_paid' || loan.status === 'disbursed') && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5"></div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-700">Loan Approved</p>
                                      <p className="text-xs text-gray-500">{formatDate(loan.updatedAt || loan.createdAt)}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Fee Paid */}
                                {(loan.status === 'fee_paid' || loan.status === 'disbursed') && (loan as any).payment && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5"></div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-700">Processing Fee Paid</p>
                                      <p className="text-xs text-gray-500">{formatDate((loan as any).payment.createdAt)}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Disbursed */}
                                {loan.status === 'disbursed' && (loan as any).disbursement && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5"></div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-700">Funds Disbursed</p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate((loan as any).disbursement.disbursementDate || (loan as any).disbursement.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Rejected */}
                                {loan.status === 'rejected' && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5"></div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-700">Application Not Approved</p>
                                      <p className="text-xs text-gray-500">{formatDate(loan.updatedAt || loan.createdAt)}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Processing Fee Info */}
                            {loan.approvedAmount && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-700">Approved Amount:</span>
                                    <span className="font-semibold">{formatCurrency(loan.approvedAmount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-700">Processing Fee ({getFeePercentageDisplay()}):</span>
                                    <span className="font-semibold text-orange-600">
                                      {formatCurrency(calculateProcessingFee(loan.approvedAmount))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-blue-300">
                                    <span className="font-bold text-gray-900">Total to Repay:</span>
                                    <span className="font-bold text-[#0033A0]">
                                      {formatCurrency(loan.approvedAmount + calculateProcessingFee(loan.approvedAmount))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-3">
                            {(loan.status === "approved" || loan.status === "fee_pending") && (
                              <>
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 text-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-green-900 mb-1">Congratulations!</p>
                                      <p className="text-green-800">Your loan has been approved.</p>
                                    </div>
                                  </div>
                                </div>
                                <Link href={`/payment/${loan.id}`}>
                                  <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white w-full shadow-md hover:shadow-lg transition-all">
                                    Pay Processing Fee
                                  </Button>
                                </Link>
                              </>
                            )}
                            {loan.status === "fee_paid" && (
                              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4 text-sm">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-blue-900 mb-1">Payment Confirmed</p>
                                    <p className="text-blue-800">Your loan is being processed.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {loan.status === "disbursed" && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 text-sm">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <BadgeCheck className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-green-900 mb-1">Funds Disbursed</p>
                                    <p className="text-green-800">Check your bank account.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {loan.status === "rejected" && (
                              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-4 text-sm">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-red-900 mb-1">Not Approved</p>
                                    <p className="text-red-800">Contact us for details.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Applications Yet</h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    You haven't submitted any loan applications. Ready to get started?
                  </p>
                  <Link href="/apply">
                    <Button className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                      Apply for a Loan
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {loans && loans.some((loan: any) => loan.payment) && (
            <Card className="mt-6 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-[#0033A0]" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loans
                    .filter((loan: any) => loan.payment)
                    .map((loan: any) => (
                      <Card key={loan.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-base">
                                    Processing Fee Payment
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    Loan Application #{loan.id}
                                  </p>
                                </div>
                                {loan.payment.status === "succeeded" && (
                                  <Badge className="bg-green-500 text-white">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Paid
                                  </Badge>
                                )}
                                {loan.payment.status === "pending" && (
                                  <Badge className="bg-yellow-500 text-white">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                                {loan.payment.status === "failed" && (
                                  <Badge className="bg-red-500 text-white">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Amount</p>
                                  <p className="font-bold text-gray-900">
                                    {formatCurrency(loan.payment.amount)}
                                  </p>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Date</p>
                                  <p className="font-semibold text-gray-900">
                                    {formatDate(loan.payment.createdAt)}
                                  </p>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Payment Method</p>
                                  <div className="font-semibold text-gray-900">
                                    {getPaymentMethodDisplay(loan.payment)}
                                  </div>
                                </div>
                                
                                {loan.payment.cryptoTxHash && (
                                  <div className="bg-blue-50 p-3 rounded-lg md:col-span-2 border border-blue-200">
                                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Blockchain Transaction</p>
                                    <a
                                      href={`https://blockchain.com/btc/tx/${loan.payment.cryptoTxHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                                    >
                                      View on Blockchain <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                                
                                {loan.payment.transactionId && (
                                  <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Transaction ID</p>
                                    <code className="text-xs bg-white px-3 py-1.5 rounded border border-gray-300 font-mono">
                                      {loan.payment.transactionId}
                                    </code>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
                              {loan.payment.status === "succeeded" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0] hover:text-white shadow-md"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/trpc/receipts.generatePaymentReceipt?input=${encodeURIComponent(JSON.stringify({ loanId: loan.id }))}`);
                                      const data = await response.json();
                                      if (data.result?.data?.html) {
                                        const blob = new Blob([data.result.data.html], { type: 'text/html' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `payment-receipt-${loan.id}.html`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                        toast.success("Receipt downloaded!");
                                      } else {
                                        toast.error("Failed to generate receipt");
                                      }
                                    } catch (error) {
                                      toast.error("Failed to generate receipt");
                                    }
                                  }}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Download Receipt
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Center */}
          {loans && loans.length > 0 && (
            <Card className="mt-6 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#0033A0]" />
                  Document Center
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6">
                  Access all your loan-related documents in one place.
                </p>
                <div className="space-y-4">
                  {loans.map((loan: any) => (
                    <div key={loan.id} className="border-2 border-gray-200 hover:border-[#0033A0] rounded-xl p-5 transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0033A0] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">
                              Loan Application #{loan.id}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(loan.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        {/* ID Documents */}
                        {loan.idFrontUrl && (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">ID Front</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-700 hover:text-white"
                                onClick={() => window.open(loan.idFrontUrl, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-700 hover:text-white"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = loan.idFrontUrl;
                                  a.download = `ID_Front_${loan.id}.jpg`;
                                  a.click();
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {loan.idBackUrl && (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">ID Back</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-700 hover:text-white"
                                onClick={() => window.open(loan.idBackUrl, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-700 hover:text-white"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = loan.idBackUrl;
                                  a.download = `ID_Back_${loan.id}.jpg`;
                                  a.click();
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {loan.selfieUrl && (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">Selfie Verification</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-700 hover:text-white"
                                onClick={() => window.open(loan.selfieUrl, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-700 hover:text-white"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = loan.selfieUrl;
                                  a.download = `Selfie_${loan.id}.jpg`;
                                  a.click();
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Loan Agreement (if approved) */}
                        {(loan.status === 'approved' || loan.status === 'fee_paid' || loan.status === 'disbursed') && (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">Loan Agreement</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-700 hover:text-white"
                              onClick={() => {
                                toast.info("Loan agreement documents will be available after final approval.");
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {/* Disbursement Receipt (if disbursed) */}
                        {loan.status === 'disbursed' && (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-300">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">Disbursement Receipt</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-300 text-orange-700 hover:bg-orange-700 hover:text-white"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/trpc/receipts.generateDisbursementReceipt?input=${encodeURIComponent(JSON.stringify({ loanId: loan.id }))}`);
                                  const data = await response.json();
                                  if (data.result?.data?.html) {
                                    const blob = new Blob([data.result.data.html], { type: 'text/html' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `disbursement-receipt-${loan.id}.html`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                    toast.success("Disbursement receipt downloaded!");
                                  } else {
                                    toast.error("Failed to generate disbursement receipt");
                                  }
                                } catch (error) {
                                  toast.error("Failed to generate disbursement receipt");
                                }
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {/* Payment Receipt */}
                        {loan.payment?.status === 'succeeded' && (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-300">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">Payment Receipt</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-teal-300 text-teal-700 hover:bg-teal-700 hover:text-white"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/trpc/receipts.generatePaymentReceipt?input=${encodeURIComponent(JSON.stringify({ loanId: loan.id }))}`);
                                  const data = await response.json();
                                  if (data.result?.data?.html) {
                                    const blob = new Blob([data.result.data.html], { type: 'text/html' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `payment-receipt-${loan.id}.html`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                    toast.success("Payment receipt downloaded!");
                                  } else {
                                    toast.error("Failed to generate payment receipt");
                                  }
                                } catch (error) {
                                  toast.error("Failed to generate payment receipt");
                                }
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-8 shadow-md">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#0033A0] mb-3 flex items-center gap-2">
                  Need Help?
                  <HelpCircle className="w-5 h-5" />
                </h3>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  Our Loan Advocates are here to help you every step of the way. Call us Monday-Friday, 8am-8pm EST.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    className="bg-[#FFA500] hover:bg-[#FF8C00] text-white shadow-lg hover:shadow-xl transition-all text-lg px-6 py-6"
                    asChild
                  >
                    <a href="tel:1-945-212-1609">
                      <Phone className="w-5 h-5 mr-2" />
                      1-945-212-1609
                    </a>
                  </Button>
                  <ContactSupportDialog 
                    trigger={
                      <Button
                        variant="outline"
                        className="border-2 border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0] hover:text-white shadow-md text-lg px-6 py-6"
                      >
                        Send Message
                      </Button>
                    }
                  />
                  <Button
                    onClick={() => setShowAIChat(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all text-lg px-6 py-6"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Assistant
                  </Button>
                  <Link href="/#faq">
                    <Button
                      variant="outline"
                      className="border-2 border-gray-400 text-gray-700 hover:bg-gray-100 shadow-md text-lg px-6 py-6"
                    >
                      View FAQs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © 2025 AmeriLend - U.S. Consumer Loan Platform. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating AI Chat Button */}
      {!showAIChat && (
        <Button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl hover:shadow-3xl transition-all z-50 flex items-center justify-center group"
        >
          <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-xs flex items-center justify-center font-bold animate-pulse">
            AI
          </span>
        </Button>
      )}

      {/* AI Chat Dialog */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-2xl h-[600px] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">AI Loan Assistant</DialogTitle>
                  <p className="text-sm text-gray-500">Powered by AmeriLend AI • Get instant answers</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIChat(false)}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AIChatBox
              messages={chatMessages}
              onSendMessage={handleSendAIMessage}
              isLoading={chatMutation.isPending}
              placeholder="Ask about loans, applications, payments, or anything else..."
              height="100%"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
