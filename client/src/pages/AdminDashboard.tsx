import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Settings, DollarSign, CheckCircle, XCircle, Send, Download, Maximize2, TrendingUp, Users, FileText, CreditCard, Calendar, Bell, Search, Mail, Edit, Clock, MessageSquare, Zap, Bot, Shield, Plus, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// Admin Statistics Component
function AdminStats() {
  const { data: stats, isLoading } = trpc.loans.getAdminStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Unable to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalApplications}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pendingApplications} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Approved Loans</p>
            <p className="text-3xl font-bold text-green-600">{stats.approvedLoans}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.approvalRate.toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Disbursed</p>
            <p className="text-3xl font-bold text-purple-600">
              ${(stats.totalDisbursed / 100).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.disbursedLoans} loans disbursed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Fees Collected</p>
            <p className="text-3xl font-bold text-orange-600">
              ${(stats.totalFeesPaid / 100).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ${(stats.totalFeesProcessing / 100).toLocaleString()} processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Statistics</CardTitle>
            <CardDescription>Overview of loan application activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Requested</span>
              <span className="font-semibold">${(stats.totalRequested / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Approved</span>
              <span className="font-semibold text-green-600">${(stats.totalApproved / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Average Loan Amount</span>
              <span className="font-semibold">${(stats.averageLoanAmount / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Approval Rate</span>
              <span className="font-semibold text-blue-600">{stats.approvalRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Current state of all applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Pending Review</span>
              <Badge className="bg-yellow-100 text-yellow-800">{stats.pendingApplications}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Approved (Active)</span>
              <Badge className="bg-green-100 text-green-800">{stats.approvedLoans}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Rejected</span>
              <Badge className="bg-red-100 text-red-800">{stats.rejectedLoans}</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Pending ID Verification</span>
              <Badge className="bg-blue-100 text-blue-800">{stats.pendingIdVerification}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Live Activity Feed Component
function LiveActivityFeed() {
  const { data: applications, isLoading } = trpc.loans.adminList.useQuery();

  // Get recent submissions (last 10)
  const recentSubmissions = applications
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10) || [];

  // Calculate totals from recent submissions
  const totalRequested = recentSubmissions.reduce((sum, app) => sum + (app.requestedAmount || 0), 0);
  const totalUsers = new Set(recentSubmissions.map(app => app.userId)).size;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "fee_paid":
      case "disbursed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "fee_paid":
      case "disbursed":
        return "text-green-600";
      case "rejected":
      case "cancelled":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Live Activity Feed
          </CardTitle>
          <CardDescription>Real-time loan application activity</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Recent loan applications and submissions</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Recent Total</p>
              <p className="text-xl font-bold text-green-600">
                ${(totalRequested / 100).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Unique Applicants</p>
              <p className="text-xl font-bold text-blue-600">{totalUsers}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {recentSubmissions.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Icon */}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(app.status)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{app.fullName}</p>
                      <Badge variant="outline" className="text-xs font-mono">
                        {app.referenceNumber}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{app.email}</span>
                      <span>•</span>
                      <span className="capitalize">{app.loanType?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Loan Amount */}
                  <div className="text-right px-4">
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-primary">
                      ${((app.requestedAmount || 0) / 100).toLocaleString()}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="text-right px-4 min-w-[120px]">
                    <p className={`text-sm font-semibold capitalize ${getStatusColor(app.status)}`}>
                      {app.status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(new Date(app.createdAt).toISOString())}
                    </p>
                  </div>

                  {/* Payment Status */}
                  {app.processingFeePaid === 1 && (
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-green-600 font-medium">Paid</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No recent loan applications</p>
          </div>
        )}

        {recentSubmissions.length >= 10 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Showing latest 10 submissions • View all in Applications tab
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// AI & Automation Component
function AIAutomationTab() {
  const { data: aiStats, isLoading } = trpc.loans.getAIAutomationStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!aiStats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Unable to load AI & Automation statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">AI & Automation</h2>
        <p className="text-gray-600 mt-2">Real-time AI features and automated workflows performance</p>
      </div>

      {/* Support/Chat Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Support & Chat System
          </CardTitle>
          <CardDescription>Customer support and communication metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{aiStats.totalConversations}</p>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{aiStats.resolutionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {aiStats.avgResponseTimeMinutes > 0 
                    ? `${aiStats.avgResponseTimeMinutes}m` 
                    : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Support System Status</h4>
                <p className="text-sm text-muted-foreground">
                  {aiStats.totalConversations > 0 
                    ? 'Active and processing customer inquiries' 
                    : 'No support conversations yet'}
                </p>
              </div>
              <Badge className={aiStats.totalConversations > 0 ? "bg-green-500" : "bg-gray-400"}>
                {aiStats.totalConversations > 0 ? 'Active' : 'Idle'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automated Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Automated Workflows
          </CardTitle>
          <CardDescription>Real-time status of automated business processes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Auto-Approve Loans</h4>
                <p className="text-xs text-muted-foreground">Automatically approve loans meeting criteria</p>
              </div>
              <Badge variant={aiStats.workflows.autoApproval ? "default" : "secondary"}>
                {aiStats.workflows.autoApproval ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Payment Reminders</h4>
                <p className="text-xs text-muted-foreground">Send reminders 3 days before due date</p>
              </div>
              <Badge variant={aiStats.workflows.paymentReminders ? "default" : "secondary"}>
                {aiStats.workflows.paymentReminders ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Credit Score Check</h4>
                <p className="text-xs text-muted-foreground">Automatically check credit on application</p>
              </div>
              <Badge variant={aiStats.workflows.creditCheck ? "default" : "secondary"}>
                {aiStats.workflows.creditCheck ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Document Verification</h4>
                <p className="text-xs text-muted-foreground">AI-powered document verification</p>
              </div>
              <Badge variant={aiStats.workflows.documentVerification ? "default" : "secondary"}>
                {aiStats.workflows.documentVerification ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Fraud Detection</h4>
                <p className="text-xs text-muted-foreground">Real-time fraud pattern detection</p>
              </div>
              <Badge variant={aiStats.workflows.fraudDetection ? "default" : "secondary"}>
                {aiStats.workflows.fraudDetection ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI Model Performance
          </CardTitle>
          <CardDescription>Real-time accuracy metrics from your system data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credit Risk Model Accuracy</span>
                <span className="font-medium">{aiStats.creditRiskAccuracy.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${aiStats.creditRiskAccuracy}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fraud Detection Rate</span>
                <span className="font-medium">{aiStats.fraudDetectionRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${aiStats.fraudDetectionRate}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Document Verification Accuracy</span>
                <span className="font-medium">{aiStats.idVerificationAccuracy.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: `${aiStats.idVerificationAccuracy}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Payment Processing Success Rate</span>
                <span className="font-medium">{aiStats.paymentSuccessRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600" style={{ width: `${aiStats.paymentSuccessRate}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              ID Verification Details
            </CardTitle>
            <CardDescription>Document verification breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Verifications</span>
              <span className="font-semibold">{aiStats.totalIDVerifications}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{aiStats.approvedIDs}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">{aiStats.rejectedIDs}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Pending Review</span>
              <Badge className="bg-yellow-100 text-yellow-800">{aiStats.pendingIDs}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Processing
            </CardTitle>
            <CardDescription>Payment transaction statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Payments</span>
              <span className="font-semibold">{aiStats.totalPayments}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Successful</span>
              <span className="font-semibold text-green-600">{aiStats.successfulPayments}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="font-semibold text-red-600">{aiStats.failedPayments}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Users Management Component
function UsersManagement() {
  const utils = trpc.useUtils();
  const [editDialog, setEditDialog] = useState<{ open: boolean; userId: number | null }>({
    open: false,
    userId: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: number | null }>({
    open: false,
    userId: null,
  });
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "user" as "user" | "admin",
  });

  const { data: users, isLoading } = trpc.users.adminList.useQuery();

  const updateUserMutation = trpc.users.adminUpdate.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      utils.users.adminList.invalidate();
      setEditDialog({ open: false, userId: null });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const deleteUserMutation = trpc.users.adminDelete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      utils.users.adminList.invalidate();
      setDeleteDialog({ open: false, userId: null });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const handleEditUser = (user: any) => {
    setEditUserData({
      name: user.name || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      role: user.role || "user",
    });
    setEditDialog({ open: true, userId: user.id });
  };

  const handleUpdateUser = () => {
    if (!editDialog.userId) return;
    updateUserMutation.mutate({
      id: editDialog.userId,
      ...editUserData,
    });
  };

  const handleDeleteUser = () => {
    if (!deleteDialog.userId) return;
    deleteUserMutation.mutate({ id: deleteDialog.userId });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            View and manage all registered users ({users?.length || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{user.name || "Unnamed User"}</h3>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p>📧 {user.email}</p>
                        <p>📱 {user.phoneNumber || "No phone"}</p>
                        <p>🆔 User ID: {user.id}</p>
                        <p>📅 Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                        <p>🔐 Login: {user.loginMethod || "N/A"}</p>
                        <p>🕐 Last Login: {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "Never"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                        disabled={user.role === "admin"}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editUserData.phoneNumber}
                onChange={(e) => setEditUserData({ ...editUserData, phoneNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editUserData.role} onValueChange={(v) => setEditUserData({ ...editUserData, role: v as "user" | "admin" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, userId: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, userId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleteUserMutation.isPending}>
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Payments Management Component
function PaymentsManagement() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "succeeded" | "failed" | "refunded" | "all">("all");
  const [methodFilter, setMethodFilter] = useState<"credit_card" | "debit_card" | "bank_transfer" | "ach" | "crypto" | "cash" | "check" | "other" | "all">("all");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Fetch payments
  const { data: payments, isLoading, refetch } = trpc.payments.adminGetAll.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    paymentMethod: methodFilter === "all" ? undefined : methodFilter,
    limit: 50,
    offset: 0,
  });

  // Fetch statistics
  const { data: stats } = trpc.payments.adminGetStats.useQuery();

  // Verify crypto payment mutation
  const verifyCryptoMutation = trpc.payments.verifyCryptoPayment.useMutation({
    onSuccess: (data) => {
      if (data.verified) {
        toast.success("✓ Payment Verified!", {
          description: `Transaction confirmed on blockchain. Payment updated to succeeded.`,
        });
        refetch();
        setShowDetails(false);
      } else {
        toast.info("Payment Not Yet Confirmed", {
          description: data.message || "Payment not found on blockchain. Please wait and try again.",
        });
      }
      setVerifying(false);
    },
    onError: (error) => {
      toast.error("Verification Failed", {
        description: error.message,
      });
      setVerifying(false);
    },
  });

  const handleVerifyCrypto = () => {
    if (!selectedPayment) return;
    
    setVerifying(true);
    verifyCryptoMutation.mutate({
      paymentId: selectedPayment.id,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card":
      case "debit_card":
        return "💳";
      case "bank_transfer":
      case "ach":
        return "🏦";
      case "crypto":
        return "₿";
      case "cash":
        return "💵";
      case "check":
        return "📝";
      default:
        return "💰";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Payments</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.succeeded} succeeded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                ${(stats.totalAmount / 100).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Succeeded: ${(stats.succeededAmount / 100).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.pending}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Failed</p>
              <p className="text-3xl font-bold text-orange-600">
                {stats.failed}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>View and manage all payment transactions</CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={(value: any) => setMethodFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments && payments.payments && payments.payments.length > 0 ? (
            <div className="space-y-3">
              {payments.payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowDetails(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getMethodIcon(payment.paymentMethod)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">Transaction #{payment.transactionId}</p>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Loan ID: {payment.loanId} • User ID: {payment.userId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString()} {new Date(payment.paymentDate).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${(payment.amount / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {payment.paymentMethod.replace(/_/g, ' ')}
                      </p>
                      {payment.reference && (
                        <p className="text-xs text-gray-400">Ref: {payment.reference}</p>
                      )}
                    </div>
                  </div>

                  {/* Payment breakdown */}
                  {(payment.principalAmount || payment.interestAmount || payment.feesAmount) && (
                    <div className="mt-3 pt-3 border-t flex gap-6 text-sm">
                      {payment.principalAmount && (
                        <div>
                          <span className="text-gray-600">Principal: </span>
                          <span className="font-semibold">${(payment.principalAmount / 100).toLocaleString()}</span>
                        </div>
                      )}
                      {payment.interestAmount && (
                        <div>
                          <span className="text-gray-600">Interest: </span>
                          <span className="font-semibold">${(payment.interestAmount / 100).toLocaleString()}</span>
                        </div>
                      )}
                      {payment.feesAmount && (
                        <div>
                          <span className="text-gray-600">Fees: </span>
                          <span className="font-semibold">${(payment.feesAmount / 100).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {payment.description && (
                    <p className="mt-2 text-sm text-gray-600 italic">{payment.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No payments found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedPayment.status)}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <p className="text-lg font-bold text-green-600">
                    ${(selectedPayment.amount / 100).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Payment Method</Label>
                  <p className="capitalize">{selectedPayment.paymentMethod.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Payment Date</Label>
                  <p>{new Date(selectedPayment.paymentDate).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Loan ID</Label>
                  <p>{selectedPayment.loanId}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">User ID</Label>
                  <p>{selectedPayment.userId}</p>
                </div>
                {selectedPayment.reference && (
                  <div>
                    <Label className="text-xs text-gray-500">Reference</Label>
                    <p className="font-mono text-sm">{selectedPayment.reference}</p>
                  </div>
                )}
                {selectedPayment.processor && (
                  <div>
                    <Label className="text-xs text-gray-500">Processor</Label>
                    <p className="capitalize">{selectedPayment.processor}</p>
                  </div>
                )}
                {selectedPayment.processorTransactionId && (
                  <div>
                    <Label className="text-xs text-gray-500">Processor Transaction ID</Label>
                    <p className="font-mono text-xs">{selectedPayment.processorTransactionId}</p>
                  </div>
                )}
              </div>

              {/* Crypto Payment Details */}
              {selectedPayment.paymentMethod === 'crypto' && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-3 block">💰 Cryptocurrency Payment Details</Label>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                    {selectedPayment.cryptoCurrency && (
                      <div>
                        <Label className="text-xs text-gray-600">Cryptocurrency</Label>
                        <p className="font-semibold text-orange-700">{selectedPayment.cryptoCurrency}</p>
                      </div>
                    )}
                    {selectedPayment.cryptoAmount && (
                      <div>
                        <Label className="text-xs text-gray-600">Crypto Amount</Label>
                        <p className="font-mono font-semibold">{selectedPayment.cryptoAmount} {selectedPayment.cryptoCurrency}</p>
                      </div>
                    )}
                    {selectedPayment.cryptoAddress && (
                      <div>
                        <Label className="text-xs text-gray-600">Payment Address</Label>
                        <p className="font-mono text-xs break-all bg-white p-2 rounded border">
                          {selectedPayment.cryptoAddress}
                        </p>
                      </div>
                    )}
                    {selectedPayment.transactionId && selectedPayment.status === 'succeeded' && (
                      <div>
                        <Label className="text-xs text-gray-600">Blockchain Transaction</Label>
                        <p className="font-mono text-xs break-all bg-white p-2 rounded border">
                          {selectedPayment.transactionId}
                        </p>
                        {selectedPayment.cryptoCurrency === 'BTC' && (
                          <a 
                            href={`https://blockstream.info/tx/${selectedPayment.transactionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View on Blockchain Explorer →
                          </a>
                        )}
                        {['ETH', 'USDT', 'USDC'].includes(selectedPayment.cryptoCurrency) && (
                          <a 
                            href={`https://etherscan.io/tx/${selectedPayment.transactionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View on Etherscan →
                          </a>
                        )}
                      </div>
                    )}
                    {selectedPayment.status === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-2">
                        <p className="text-xs text-yellow-800">
                          ⏳ <strong>Awaiting blockchain confirmation...</strong><br />
                          Payment will be automatically verified and confirmed within 2-10 minutes.
                        </p>
                        <Button
                          onClick={handleVerifyCrypto}
                          disabled={verifying}
                          size="sm"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {verifying ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Verifying on Blockchain...
                            </>
                          ) : (
                            <>
                              🔍 Verify Now
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              {(selectedPayment.principalAmount || selectedPayment.interestAmount || selectedPayment.feesAmount) && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-3 block">Payment Breakdown</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedPayment.principalAmount && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Principal</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${(selectedPayment.principalAmount / 100).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedPayment.interestAmount && (
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Interest</p>
                        <p className="text-lg font-bold text-purple-600">
                          ${(selectedPayment.interestAmount / 100).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedPayment.feesAmount && (
                      <div className="bg-orange-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Fees</p>
                        <p className="text-lg font-bold text-orange-600">
                          ${(selectedPayment.feesAmount / 100).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPayment.description && (
                <div>
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="mt-1 text-sm">{selectedPayment.description}</p>
                </div>
              )}

              <div className="border-t pt-4 text-xs text-gray-500">
                <p>Created: {new Date(selectedPayment.createdAt).toLocaleString()}</p>
                <p>Last Updated: {new Date(selectedPayment.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Crypto Wallet Settings Component
function CryptoWalletSettings() {
  const [wallets, setWallets] = useState({
    btc: "",
    eth: "",
    usdt: "",
    usdc: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const { data: currentWallets, isLoading } = trpc.settings.getCryptoWallets.useQuery();

  const updateMutation = trpc.settings.updateCryptoWallets.useMutation({
    onSuccess: () => {
      toast.success("Crypto wallet addresses updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update wallet addresses");
    },
  });

  // Initialize wallets when data loads
  useEffect(() => {
    if (currentWallets) {
      setWallets(currentWallets);
    }
  }, [currentWallets]);

  const handleSave = () => {
    updateMutation.mutate(wallets);
  };

  const handleCancel = () => {
    if (currentWallets) {
      setWallets(currentWallets);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Loading wallet settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#0033A0]" />
              Cryptocurrency Wallet Addresses
            </CardTitle>
            <CardDescription className="mt-2">
              <span className="font-semibold text-orange-600">⚡ For Processing Fee Collection Only</span>
              <br />
              These wallet addresses are shown to customers who choose to pay their loan processing fees with cryptocurrency.
            </CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Edit Wallets
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-lg">ℹ️</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-2">How This Works</h4>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Customers apply for loans and get approved by you</li>
                <li>They must pay a processing fee (1.5-2.5% of loan amount)</li>
                <li>If they choose crypto payment, these wallet addresses are displayed</li>
                <li>You receive the processing fee in your crypto wallet</li>
                <li><strong>Note:</strong> Loan disbursements to customers are separate (via bank transfer)</li>
              </ul>
            </div>
          </div>
        </div>
        {/* Bitcoin */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">₿</span>
            </div>
            <Label htmlFor="btc" className="text-base font-semibold">
              Bitcoin (BTC) - Processing Fee Collection
            </Label>
          </div>
          <Input
            id="btc"
            type="text"
            value={wallets.btc}
            onChange={(e) => setWallets({ ...wallets, btc: e.target.value })}
            disabled={!isEditing}
            placeholder="bc1q... (Your BTC wallet for receiving processing fees)"
            className={isEditing ? "border-orange-300 focus:border-orange-500" : "bg-gray-50"}
          />
          <p className="text-xs text-gray-500">
            Your Bitcoin wallet address - customers send processing fees here when paying with BTC
          </p>
        </div>

        {/* Ethereum */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">Ξ</span>
            </div>
            <Label htmlFor="eth" className="text-base font-semibold">
              Ethereum (ETH) - Processing Fee Collection
            </Label>
          </div>
          <Input
            id="eth"
            type="text"
            value={wallets.eth}
            onChange={(e) => setWallets({ ...wallets, eth: e.target.value })}
            disabled={!isEditing}
            placeholder="0x... (Your ETH wallet for receiving processing fees)"
            className={isEditing ? "border-blue-300 focus:border-blue-500" : "bg-gray-50"}
          />
          <p className="text-xs text-gray-500">
            Your Ethereum wallet address - customers send processing fees here when paying with ETH
          </p>
        </div>

        {/* USDT */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">₮</span>
            </div>
            <Label htmlFor="usdt" className="text-base font-semibold">
              Tether (USDT ERC-20) - Processing Fee Collection
            </Label>
          </div>
          <Input
            id="usdt"
            type="text"
            value={wallets.usdt}
            onChange={(e) => setWallets({ ...wallets, usdt: e.target.value })}
            disabled={!isEditing}
            placeholder="0x... (Your USDT wallet for receiving processing fees)"
            className={isEditing ? "border-green-300 focus:border-green-500" : "bg-gray-50"}
          />
          <p className="text-xs text-gray-500">
            Your ERC-20 USDT wallet address - customers send processing fees here when paying with USDT
          </p>
        </div>

        {/* USDC */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">$</span>
            </div>
            <Label htmlFor="usdc" className="text-base font-semibold">
              USD Coin (USDC ERC-20) - Processing Fee Collection
            </Label>
          </div>
          <Input
            id="usdc"
            type="text"
            value={wallets.usdc}
            onChange={(e) => setWallets({ ...wallets, usdc: e.target.value })}
            disabled={!isEditing}
            placeholder="0x... (Your USDC wallet for receiving processing fees)"
            className={isEditing ? "border-purple-300 focus:border-purple-500" : "bg-gray-50"}
          />
          <p className="text-xs text-gray-500">
            Your ERC-20 USDC wallet address - customers send processing fees here when paying with USDC
          </p>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-yellow-900 mb-2">🔐 Important Security Notice</h4>
              <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                <li><strong>Purpose:</strong> These wallets receive processing fees from customers (NOT for disbursing loans)</li>
                <li><strong>Visibility:</strong> Wallet addresses will be displayed to customers when they choose crypto payment</li>
                <li><strong>Security:</strong> Ensure you have exclusive access to the private keys</li>
                <li><strong>Verification:</strong> Double-check addresses before saving - mistakes cannot be undone</li>
                <li><strong>Privacy:</strong> NEVER share your private keys with anyone, including staff</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Support Messages Management Component
function SupportMessagesManagement() {
  const [statusFilter, setStatusFilter] = useState<"new" | "in_progress" | "resolved" | "closed" | "all">("all");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [responseText, setResponseText] = useState("");
  const [respondDialog, setRespondDialog] = useState(false);

  const { data, isLoading, refetch } = trpc.support.adminList.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
    offset: 0,
  });

  const updateStatusMutation = trpc.support.adminUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const respondMutation = trpc.support.adminRespond.useMutation({
    onSuccess: () => {
      toast.success("Response sent successfully");
      setRespondDialog(false);
      setResponseText("");
      setSelectedMessage(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send response");
    },
  });

  const deleteMutation = trpc.support.adminDelete.useMutation({
    onSuccess: () => {
      toast.success("Message deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete message");
    },
  });

  const handleRespond = () => {
    if (!selectedMessage || !responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    respondMutation.mutate({
      id: selectedMessage.id,
      response: responseText,
      sendEmail: true,
    });
  };

  const handleUpdateStatus = (id: number, status: "new" | "in_progress" | "resolved" | "closed") => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Support Messages</h2>
          <p className="text-muted-foreground">View and respond to customer inquiries</p>
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data && data.messages.length > 0 ? (
        <div className="space-y-4">
          {data.messages.map((message: any) => (
            <Card key={message.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getStatusColor(message.status)} border`}>
                        {message.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`${getPriorityColor(message.priority)} border`}>
                        {message.priority}
                      </Badge>
                      <Badge variant="outline" className="border-purple-200 text-purple-800">
                        {message.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{message.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      From: <strong>{message.senderName}</strong> ({message.senderEmail})
                      {message.senderPhone && ` • ${message.senderPhone}`}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMessage(message);
                        setResponseText(message.adminResponse || "");
                        setRespondDialog(true);
                      }}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Respond
                    </Button>
                    <Select
                      value={message.status}
                      onValueChange={(value: any) => handleUpdateStatus(message.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(message.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold mb-2">Message:</p>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                </div>
                {message.adminResponse && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-2 text-blue-900">Your Response:</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{message.adminResponse}</p>
                    {message.respondedAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        Responded on {new Date(message.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No support messages found</p>
          </CardContent>
        </Card>
      )}

      {/* Respond Dialog */}
      <Dialog open={respondDialog} onOpenChange={setRespondDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Support Message</DialogTitle>
            <DialogDescription>
              Send a response to {selectedMessage?.senderName} ({selectedMessage?.senderEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Original Message:</p>
              <p className="text-sm text-muted-foreground mb-1"><strong>Subject:</strong> {selectedMessage?.subject}</p>
              <p className="text-sm whitespace-pre-wrap">{selectedMessage?.message}</p>
            </div>
            <div>
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                rows={8}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                This response will be sent to the customer's email address and saved in the system.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={respondMutation.isPending}>
              {respondMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Response
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper component to display ID verification images/PDFs
function IDImageViewer({ s3Key, alt }: { s3Key: string; alt: string }) {
  const [showFullSize, setShowFullSize] = useState(false);
  
  // If s3Key is already a base64 data URL, use it directly
  const isDataUrl = s3Key.startsWith('data:');
  
  // Only fetch from server if it's not a data URL
  const { data, isLoading } = trpc.files.getDownloadUrl.useQuery(
    { s3Key }, 
    { enabled: !isDataUrl }
  );
  
  // Determine the URL to use
  const imageUrl = isDataUrl ? s3Key : data?.url;
  
  if (!isDataUrl && isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (!imageUrl) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-400">
        Failed to load document
      </div>
    );
  }

  const isPDF = s3Key.toLowerCase().endsWith('.pdf') || imageUrl.includes('application/pdf');
  
  return (
    <>
      <div className="relative group">
        {isPDF ? (
          <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-3 bg-gray-50">
            <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z"/>
              <text x="6" y="14" fontSize="6" fill="currentColor">PDF</text>
            </svg>
            <p className="text-sm font-medium text-gray-700">PDF Document</p>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Open PDF
            </a>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt={alt} 
            className="w-full h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowFullSize(true)}
          />
        )}
        
        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          {!isPDF && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              onClick={() => setShowFullSize(true)}
              title="View full size"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={() => window.open(imageUrl, '_blank')}
            title="Download original"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Full-size image dialog */}
      {!isPDF && (
        <Dialog open={showFullSize} onOpenChange={setShowFullSize}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{alt} - Original Quality</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={imageUrl} 
                alt={alt} 
                className="max-w-full h-auto"
                style={{ maxHeight: '80vh' }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => window.open(imageUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Original
              </Button>
              <Button onClick={() => setShowFullSize(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Analytics Overview Component
function AnalyticsOverview() {
  const { data: overview, isLoading: loadingOverview } = trpc.analytics.getOverview.useQuery();
  const { data: loanTrend, isLoading: loadingTrend } = trpc.analytics.getLoanTrend.useQuery();
  const { data: revenueBreakdown, isLoading: loadingRevenue } = trpc.analytics.getRevenueBreakdown.useQuery();
  const { data: statusDist, isLoading: loadingStatus } = trpc.analytics.getLoanStatusDistribution.useQuery();
  const { data: userGrowth, isLoading: loadingGrowth } = trpc.analytics.getUserGrowth.useQuery();

  if (loadingOverview || loadingTrend || loadingRevenue || loadingStatus || loadingGrowth) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const maxTrendValue = Math.max(...(loanTrend?.map(d => d.value) || [1]));
  const maxGrowthValue = Math.max(...(userGrowth || [1]));

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600 mt-2">Comprehensive business intelligence and reporting</p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${((overview?.totalRevenue || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              All time earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overview?.activeLoans || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{overview?.approvalRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Applications approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Default Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overview?.defaultRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <XCircle className="w-3 h-3 inline mr-1" />
              Rejection ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Applications Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Loan Applications Trend
          </CardTitle>
          <CardDescription>Monthly loan applications over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2 border-b border-l pl-8 pb-8">
            {loanTrend?.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-sm font-medium text-muted-foreground">{item.value}</div>
                <div 
                  className={`w-full ${idx === loanTrend.length - 1 ? 'bg-blue-600' : 'bg-blue-500'} rounded-t-lg transition-all hover:opacity-80`}
                  style={{ height: `${item.value > 0 ? (item.value / maxTrendValue) * 100 : 2}%` }}
                />
                <div className="text-xs font-medium">{item.month}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Breakdown
          </CardTitle>
          <CardDescription>Revenue by source (all time)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Interest Income</span>
                <span className="font-medium">
                  ${((revenueBreakdown?.interestIncome?.amount || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({revenueBreakdown?.interestIncome?.percentage || 0}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${revenueBreakdown?.interestIncome?.percentage || 0}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Origination Fees</span>
                <span className="font-medium">
                  ${((revenueBreakdown?.originationFees?.amount || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({revenueBreakdown?.originationFees?.percentage || 0}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${revenueBreakdown?.originationFees?.percentage || 0}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Principal Payments</span>
                <span className="font-medium">
                  ${((revenueBreakdown?.principalPayments?.amount || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({revenueBreakdown?.principalPayments?.percentage || 0}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: `${revenueBreakdown?.principalPayments?.percentage || 0}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Loan Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="text-sm font-medium">
                  {statusDist?.pending?.count || 0} ({statusDist?.pending?.percentage || 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm">Under Review</span>
                </div>
                <span className="text-sm font-medium">
                  {statusDist?.underReview?.count || 0} ({statusDist?.underReview?.percentage || 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Approved</span>
                </div>
                <span className="text-sm font-medium">
                  {statusDist?.approved?.count || 0} ({statusDist?.approved?.percentage || 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-sm">Disbursed</span>
                </div>
                <span className="text-sm font-medium">
                  {statusDist?.disbursed?.count || 0} ({statusDist?.disbursed?.percentage || 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm">Rejected</span>
                </div>
                <span className="text-sm font-medium">
                  {statusDist?.rejected?.count || 0} ({statusDist?.rejected?.percentage || 0}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-1">
              {userGrowth?.map((value, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                    style={{ height: `${value > 0 ? (value / maxGrowthValue) * 100 : 2}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">New users per month (last 12 months)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  under_review: "bg-blue-100 text-blue-800 border-blue-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  fee_pending: "bg-orange-100 text-orange-800 border-orange-300",
  fee_paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  disbursed: "bg-purple-100 text-purple-800 border-purple-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Search and UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real notifications - admin sees ALL notifications
  const { data: notificationsData, refetch: refetchNotifications } = trpc.notifications.adminGetAll.useQuery({
    limit: 100,
  });
  
  // For current user's personal notifications
  const { data: myNotifications, refetch: refetchMyNotifications } = trpc.notifications.getMyNotifications.useQuery({
    limit: 20,
    unreadOnly: false,
  });
  
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery();
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchMyNotifications();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchMyNotifications();
    },
  });

  // Audit Logs Query
  const { data: auditLogsData = [], refetch: refetchAuditLogs } = trpc.auditLogs.getAll.useQuery({
    limit: 50,
    offset: 0,
  });

  const handleNotificationClick = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; applicationId: number | null }>({
    open: false,
    applicationId: null,
  });
  const [approvalAmount, setApprovalAmount] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  // Rejection dialog state
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; applicationId: number | null }>({
    open: false,
    applicationId: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");

  // Disbursement dialog state
  const [disbursementDialog, setDisbursementDialog] = useState<{ open: boolean; applicationId: number | null }>({
    open: false,
    applicationId: null,
  });
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [disbursementNotes, setDisbursementNotes] = useState("");

  // Fee config state
  const [feeMode, setFeeMode] = useState<"percentage" | "fixed">("percentage");
  const [percentageRate, setPercentageRate] = useState("2.00");
  const [fixedFeeAmount, setFixedFeeAmount] = useState("2.00");

  // AI Settings state
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);

  // Company Settings state
  const [companyName, setCompanyName] = useState("AmeriLend Financial Services");
  const [supportEmail, setSupportEmail] = useState("dianasmith6525@gmail.com");
  const [supportPhone, setSupportPhone] = useState(""); // Empty - admin should set real phone
  const [websiteUrl, setWebsiteUrl] = useState("https://amerilendloan.com");
  const [companyAddress, setCompanyAddress] = useState(""); // Empty - admin should set real address

  // Loan Parameters state
  const [minLoanAmount, setMinLoanAmount] = useState("500");
  const [maxLoanAmount, setMaxLoanAmount] = useState("10000");
  const [baseInterestRate, setBaseInterestRate] = useState("12.5");
  const [loanProcessingFee, setLoanProcessingFee] = useState("3.0");
  const [maxLoanTerm, setMaxLoanTerm] = useState("24");
  const [latePaymentFee, setLatePaymentFee] = useState("25");

  // Email Settings state
  const [emailProvider, setEmailProvider] = useState("sendgrid");
  const [fromEmail, setFromEmail] = useState("noreply@amerilend.com");

  // Security Settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [ipWhitelistAddresses, setIpWhitelistAddresses] = useState<string[]>([]);
  const [ipWhitelistDialog, setIpWhitelistDialog] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState("");

  // Backup & Restore state
  const [backupDialog, setBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  // ID Verification state
  const [idVerifyDialog, setIdVerifyDialog] = useState<{ 
    open: boolean; 
    applicationId: number | null; 
    action: "approve" | "reject" | null;
  }>({
    open: false,
    applicationId: null,
    action: null,
  });
  const [idVerifyNotes, setIdVerifyNotes] = useState("");

  // Payment Verification state
  const [paymentVerifyDialog, setPaymentVerifyDialog] = useState<{
    open: boolean;
    applicationId: number | null;
    action: "verify" | "reject" | null;
  }>({
    open: false,
    applicationId: null,
    action: null,
  });
  const [paymentVerifyNotes, setPaymentVerifyNotes] = useState("");

  const { data: applications, isLoading } = trpc.loans.adminList.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Load system settings from database
  const { data: systemSettings } = trpc.settings.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Populate state from loaded settings
  useEffect(() => {
    if (systemSettings && systemSettings.length > 0) {
      systemSettings.forEach((setting: any) => {
        switch (setting.key) {
          case "company_name":
            setCompanyName(setting.value);
            break;
          case "support_email":
            setSupportEmail(setting.value);
            break;
          case "support_phone":
            setSupportPhone(setting.value);
            break;
          case "website_url":
            setWebsiteUrl(setting.value);
            break;
          case "company_address":
            setCompanyAddress(setting.value);
            break;
          case "min_loan_amount":
            setMinLoanAmount(setting.value);
            break;
          case "max_loan_amount":
            setMaxLoanAmount(setting.value);
            break;
          case "base_interest_rate":
            setBaseInterestRate(setting.value);
            break;
          case "loan_processing_fee":
            setLoanProcessingFee(setting.value);
            break;
          case "max_loan_term":
            setMaxLoanTerm(setting.value);
            break;
          case "late_payment_fee":
            setLatePaymentFee(setting.value);
            break;
          case "ai_provider":
            setAiProvider(setting.value);
            break;
          case "ai_model":
            setAiModel(setting.value);
            break;
          case "ai_enabled":
            setAiEnabled(setting.value === "true");
            break;
          case "email_provider":
            setEmailProvider(setting.value);
            break;
          case "from_email":
            setFromEmail(setting.value);
            break;
          case "two_factor_enabled":
            setTwoFactorEnabled(setting.value === "true");
            break;
          case "session_timeout":
            setSessionTimeout(setting.value);
            break;
          case "ip_whitelist_enabled":
            setIpWhitelistEnabled(setting.value === "true");
            break;
          case "ip_whitelist":
            try {
              const parsed = JSON.parse(setting.value);
              if (Array.isArray(parsed)) {
                setIpWhitelistAddresses(parsed);
              }
            } catch (e) {
              console.error("Error parsing IP whitelist:", e);
            }
            break;
        }
      });
    }
  }, [systemSettings]);

  const { data: feeConfig } = trpc.feeConfig.getActive.useQuery();

  const approveMutation = trpc.loans.adminApprove.useMutation({
    onSuccess: (data) => {
      if (data.warning) {
        // Show warning if email failed but loan was approved
        toast.success("✓ Loan approved in database", {
          description: "⚠️ Warning: Notification email failed to send. Please contact the applicant directly.",
          duration: 8000,
        });
      } else {
        toast.success("✓ Loan approved successfully", {
          description: "Approval email sent to applicant",
        });
      }
      utils.loans.adminList.invalidate();
      setApprovalDialog({ open: false, applicationId: null });
      setApprovalAmount("");
      setApprovalNotes("");
    },
    onError: (error) => {
      // More descriptive error messages for admins
      const errorMessage = error.message || "Failed to approve loan";
      if (errorMessage.includes("FORBIDDEN") || errorMessage.includes("Admin access")) {
        toast.error("Access Denied", {
          description: "You need admin privileges to approve loans",
        });
      } else if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("not found")) {
        toast.error("Loan Not Found", {
          description: "The loan application could not be found in the database",
        });
      } else {
        toast.error("Loan Approval Failed", {
          description: errorMessage,
        });
      }
    },
  });

  const rejectMutation = trpc.loans.adminReject.useMutation({
    onSuccess: () => {
      toast.success("✓ Loan Rejected", {
        description: "Rejection notice sent to applicant via email",
      });
      utils.loans.adminList.invalidate();
      setRejectionDialog({ open: false, applicationId: null });
      setRejectionReason("");
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to reject loan";
      toast.error("Loan Rejection Failed", {
        description: errorMessage.includes("FORBIDDEN") 
          ? "Admin access required"
          : errorMessage.includes("NOT_FOUND")
          ? "Application not found in database"
          : errorMessage,
      });
    },
  });

  const disburseMutation = trpc.disbursements.adminInitiate.useMutation({
    onSuccess: () => {
      toast.success("✓ Disbursement Initiated", {
        description: "Funds will be transferred to applicant's bank account",
      });
      utils.loans.adminList.invalidate();
      setDisbursementDialog({ open: false, applicationId: null });
      setAccountHolderName("");
      setAccountNumber("");
      setRoutingNumber("");
      setDisbursementNotes("");
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to initiate disbursement";
      toast.error("Disbursement Failed", {
        description: errorMessage.includes("FORBIDDEN")
          ? "Admin access required"
          : errorMessage.includes("NOT_FOUND")
          ? "Application not found in database"
          : errorMessage.includes("not approved")
          ? "Loan must be approved before disbursement"
          : errorMessage,
      });
    },
  });

  const updateFeeConfigMutation = trpc.feeConfig.adminUpdate.useMutation({
    onSuccess: () => {
      toast.success("Fee configuration updated");
      utils.feeConfig.getActive.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update fee configuration");
    },
  });

  const approveIdVerificationMutation = trpc.loans.adminApproveIdVerification.useMutation({
    onSuccess: (data) => {
      if (data.warning) {
        toast.success("✓ ID Verification Approved", {
          description: "⚠️ Saved to database but email notification failed. Contact applicant directly.",
          duration: 8000,
        });
      } else {
        toast.success("✓ ID Verification Approved", {
          description: "Applicant has been notified via email",
        });
      }
      utils.loans.adminList.invalidate();
      setIdVerifyDialog({ open: false, applicationId: null, action: null });
      setIdVerifyNotes("");
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to approve ID verification";
      toast.error("ID Approval Failed", {
        description: errorMessage.includes("NOT_FOUND") 
          ? "Application not found in database" 
          : errorMessage,
      });
    },
  });

  const rejectIdVerificationMutation = trpc.loans.adminRejectIdVerification.useMutation({
    onSuccess: (data) => {
      if (data.warning) {
        toast.success("✓ ID Verification Rejected", {
          description: "⚠️ Saved to database but email notification failed. Contact applicant directly.",
          duration: 8000,
        });
      } else {
        toast.success("✓ ID Verification Rejected", {
          description: "Applicant notified and given instructions to resubmit",
        });
      }
      utils.loans.adminList.invalidate();
      setIdVerifyDialog({ open: false, applicationId: null, action: null });
      setIdVerifyNotes("");
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to reject ID verification";
      toast.error("ID Rejection Failed", {
        description: errorMessage.includes("NOT_FOUND") 
          ? "Application not found in database" 
          : errorMessage,
      });
    },
  });

  const verifyPaymentMutation = trpc.loans.adminVerifyPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment verified successfully");
      utils.loans.adminList.invalidate();
      setPaymentVerifyDialog({ open: false, applicationId: null, action: null });
      setPaymentVerifyNotes("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify payment");
    },
  });

  const rejectPaymentVerificationMutation = trpc.loans.adminRejectPaymentVerification.useMutation({
    onSuccess: () => {
      toast.success("Payment verification rejected");
      utils.loans.adminList.invalidate();
      setPaymentVerifyDialog({ open: false, applicationId: null, action: null });
      setPaymentVerifyNotes("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject payment");
    },
  });

  const handleApprove = () => {
    if (!approvalDialog.applicationId) return;
    const amount = parseFloat(approvalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid approval amount");
      return;
    }
    approveMutation.mutate({
      id: approvalDialog.applicationId,
      approvedAmount: Math.round(amount * 100),
      adminNotes: approvalNotes || undefined,
    });
  };

  const handleReject = () => {
    if (!rejectionDialog.applicationId || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({
      id: rejectionDialog.applicationId,
      rejectionReason,
    });
  };

  const handleDisburse = () => {
    if (!disbursementDialog.applicationId) return;
    if (!accountHolderName || !accountNumber || !routingNumber) {
      toast.error("Please fill in all bank account details");
      return;
    }
    disburseMutation.mutate({
      loanApplicationId: disbursementDialog.applicationId,
      accountHolderName,
      accountNumber,
      routingNumber,
      adminNotes: disbursementNotes || undefined,
    });
  };

  const handleUpdateFeeConfig = () => {
    if (feeMode === "percentage") {
      const rate = parseFloat(percentageRate);
      if (isNaN(rate) || rate < 1.5 || rate > 2.5) {
        toast.error("Percentage rate must be between 1.5% and 2.5%");
        return;
      }
      updateFeeConfigMutation.mutate({
        calculationMode: "percentage",
        percentageRate: Math.round(rate * 100), // Convert to basis points
      });
    } else {
      const amount = parseFloat(fixedFeeAmount);
      if (isNaN(amount) || amount < 1.5 || amount > 2.5) {
        toast.error("Fixed fee must be between $1.50 and $2.50");
        return;
      }
      updateFeeConfigMutation.mutate({
        calculationMode: "fixed",
        fixedFeeAmount: Math.round(amount * 100), // Convert to cents
      });
    }
  };

  // Mutations for system settings
  const upsertSettingMutation = trpc.settings.upsert.useMutation({
    onSuccess: () => {
      utils.settings.getAll.invalidate();
    },
  });

  const handleSaveCompanyInfo = async () => {
    console.log('[handleSaveCompanyInfo] Starting save...', {
      companyName,
      supportEmail,
      supportPhone,
      websiteUrl,
      companyAddress
    });
    
    try {
      await Promise.all([
        upsertSettingMutation.mutateAsync({
          key: "company_name",
          value: companyName,
          category: "company",
          description: "Company name displayed across the platform"
        }),
        upsertSettingMutation.mutateAsync({
          key: "support_email",
          value: supportEmail,
          category: "company",
          description: "Primary support email address"
        }),
        upsertSettingMutation.mutateAsync({
          key: "support_phone",
          value: supportPhone,
          category: "company",
          description: "Support phone number"
        }),
        upsertSettingMutation.mutateAsync({
          key: "website_url",
          value: websiteUrl,
          category: "company",
          description: "Company website URL"
        }),
        upsertSettingMutation.mutateAsync({
          key: "company_address",
          value: companyAddress,
          category: "company",
          description: "Physical company address"
        }),
      ]);
      console.log('[handleSaveCompanyInfo] Save successful!');
      toast.success("Company information updated successfully");
    } catch (error) {
      console.error('[handleSaveCompanyInfo] Save failed:', error);
      toast.error("Failed to save company information");
      console.error("Error saving company info:", error);
    }
  };

  const handleSaveLoanParameters = async () => {
    try {
      await Promise.all([
        upsertSettingMutation.mutateAsync({
          key: "min_loan_amount",
          value: minLoanAmount,
          category: "loan",
          description: "Minimum loan amount in dollars"
        }),
        upsertSettingMutation.mutateAsync({
          key: "max_loan_amount",
          value: maxLoanAmount,
          category: "loan",
          description: "Maximum loan amount in dollars"
        }),
        upsertSettingMutation.mutateAsync({
          key: "base_interest_rate",
          value: baseInterestRate,
          category: "loan",
          description: "Base interest rate percentage"
        }),
        upsertSettingMutation.mutateAsync({
          key: "loan_processing_fee",
          value: loanProcessingFee,
          category: "loan",
          description: "Loan processing fee percentage"
        }),
        upsertSettingMutation.mutateAsync({
          key: "max_loan_term",
          value: maxLoanTerm,
          category: "loan",
          description: "Maximum loan term in months"
        }),
        upsertSettingMutation.mutateAsync({
          key: "late_payment_fee",
          value: latePaymentFee,
          category: "loan",
          description: "Late payment fee in dollars"
        }),
      ]);
      toast.success("Loan parameters updated successfully");
    } catch (error) {
      toast.error("Failed to save loan parameters");
      console.error("Error saving loan parameters:", error);
    }
  };

  const handleSaveAIConfig = async () => {
    if (!aiApiKey && aiEnabled) {
      toast.error("Please enter an API key to enable AI");
      return;
    }
    
    try {
      await Promise.all([
        upsertSettingMutation.mutateAsync({
          key: "ai_provider",
          value: aiProvider,
          category: "ai",
          description: "AI service provider"
        }),
        upsertSettingMutation.mutateAsync({
          key: "ai_model",
          value: aiModel,
          category: "ai",
          description: "AI model to use"
        }),
        upsertSettingMutation.mutateAsync({
          key: "ai_enabled",
          value: aiEnabled.toString(),
          category: "ai",
          description: "Whether AI chat is enabled"
        }),
        ...(aiApiKey ? [upsertSettingMutation.mutateAsync({
          key: "ai_api_key",
          value: aiApiKey,
          category: "ai",
          description: "API key for AI service (encrypted)"
        })] : []),
      ]);
      toast.success("AI configuration saved successfully");
      setAiApiKey(""); // Clear the key input for security
    } catch (error) {
      toast.error("Failed to save AI configuration");
      console.error("Error saving AI config:", error);
    }
  };

  const handleSaveEmailConfig = async () => {
    try {
      await Promise.all([
        upsertSettingMutation.mutateAsync({
          key: "email_provider",
          value: emailProvider,
          category: "email",
          description: "Email service provider"
        }),
        upsertSettingMutation.mutateAsync({
          key: "from_email",
          value: fromEmail,
          category: "email",
          description: "From email address for system emails"
        }),
      ]);
      toast.success("Email configuration updated successfully");
    } catch (error) {
      toast.error("Failed to save email configuration");
      console.error("Error saving email config:", error);
    }
  };

  const sendTestEmailMutation = trpc.adminUtils.sendTestEmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send test email");
    },
  });

  const handleTestEmailConnection = async () => {
    try {
      if (!supportEmail) {
        toast.error("Please enter a support email address first");
        return;
      }
      
      toast.info("Sending test email...");
      await sendTestEmailMutation.mutateAsync({
        recipient: supportEmail,
        subject: "Test Email - AmeriLend System",
      });
    } catch (error) {
      // Error already handled by mutation
      console.error("Error testing email:", error);
    }
  };

  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    
    try {
      await upsertSettingMutation.mutateAsync({
        key: "two_factor_enabled",
        value: newValue.toString(),
        category: "security",
        description: "Require 2FA for admin accounts"
      });
      toast.success(newValue ? "2FA enabled for admin accounts" : "2FA disabled for admin accounts");
    } catch (error) {
      setTwoFactorEnabled(!newValue); // Revert on error
      toast.error("Failed to update 2FA setting");
      console.error("Error updating 2FA:", error);
    }
  };

  const handleSessionTimeoutChange = async (value: string) => {
    setSessionTimeout(value);
    
    try {
      await upsertSettingMutation.mutateAsync({
        key: "session_timeout",
        value: value,
        category: "security",
        description: "Session timeout in minutes"
      });
      toast.success(`Session timeout set to ${value} minutes`);
    } catch (error) {
      toast.error("Failed to update session timeout");
      console.error("Error updating session timeout:", error);
    }
  };

  const handleAddIPAddress = async () => {
    if (!newIpAddress.trim()) {
      toast.error("Please enter an IP address");
      return;
    }
    
    // Basic IP validation regex
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIpAddress.trim())) {
      toast.error("Invalid IP address format. Use format: 192.168.1.1 or 192.168.1.0/24");
      return;
    }

    const updatedList = [...ipWhitelistAddresses, newIpAddress.trim()];
    setIpWhitelistAddresses(updatedList);
    setNewIpAddress("");
    
    try {
      await upsertSettingMutation.mutateAsync({
        key: "ip_whitelist",
        value: JSON.stringify(updatedList),
        category: "security",
        description: "Whitelisted IP addresses for admin access"
      });
      toast.success("IP address added to whitelist");
    } catch (error) {
      setIpWhitelistAddresses(ipWhitelistAddresses); // Revert on error
      toast.error("Failed to save IP whitelist");
      console.error("Error updating IP whitelist:", error);
    }
  };

  const handleRemoveIPAddress = async (ip: string) => {
    const updatedList = ipWhitelistAddresses.filter(addr => addr !== ip);
    setIpWhitelistAddresses(updatedList);
    
    try {
      await upsertSettingMutation.mutateAsync({
        key: "ip_whitelist",
        value: JSON.stringify(updatedList),
        category: "security",
        description: "Whitelisted IP addresses for admin access"
      });
      toast.success("IP address removed from whitelist");
    } catch (error) {
      setIpWhitelistAddresses(ipWhitelistAddresses); // Revert on error
      toast.error("Failed to save IP whitelist");
      console.error("Error updating IP whitelist:", error);
    }
  };

  const handleToggleIPWhitelist = async () => {
    if (!ipWhitelistEnabled && ipWhitelistAddresses.length === 0) {
      toast.error("Please add at least one IP address before enabling IP whitelist");
      return;
    }
    
    const newValue = !ipWhitelistEnabled;
    setIpWhitelistEnabled(newValue);
    
    try {
      await upsertSettingMutation.mutateAsync({
        key: "ip_whitelist_enabled",
        value: newValue.toString(),
        category: "security",
        description: "Whether IP whitelist is enabled"
      });
      toast.success(newValue ? "IP whitelist enabled" : "IP whitelist disabled");
    } catch (error) {
      setIpWhitelistEnabled(!newValue); // Revert on error
      toast.error("Failed to update IP whitelist status");
      console.error("Error updating IP whitelist status:", error);
    }
  };

  const createBackupMutation = trpc.adminUtils.createBackup.useMutation({
    onSuccess: (data) => {
      // Download the backup file
      const blob = new Blob([data.backup], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Backup created! ${Object.values(data.statistics).reduce((a: number, b: number) => a + b, 0)} records exported.`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create backup");
    },
  });

  const handleDownloadBackup = async () => {
    setBackupInProgress(true);
    toast.info("Creating database backup...");
    
    try {
      await createBackupMutation.mutateAsync();
    } catch (error) {
      // Error already handled by mutation
      console.error("Backup error:", error);
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestoreBackup = () => {
    setRestoreDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        toast.error("Please select a valid JSON backup file");
        return;
      }
      setSelectedBackupFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const restoreBackupMutation = trpc.adminUtils.restoreBackup.useMutation({
    onSuccess: (data) => {
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success(data.message);
      }
      setRestoreDialog(false);
      setSelectedBackupFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to restore backup");
    },
  });

  const handleConfirmRestore = async () => {
    if (!selectedBackupFile) {
      toast.error("Please select a backup file first");
      return;
    }

    if (!user?.email) {
      toast.error("Unable to verify admin email");
      return;
    }

    setRestoreInProgress(true);
    toast.info("Validating backup file...");
    
    try {
      // Read backup file
      const fileContent = await selectedBackupFile.text();
      
      // Validate JSON structure
      try {
        JSON.parse(fileContent);
      } catch (parseError) {
        toast.error("Invalid backup file format - not valid JSON");
        setRestoreInProgress(false);
        return;
      }
      
      // Call restore endpoint with email confirmation
      await restoreBackupMutation.mutateAsync({
        backupData: fileContent,
        confirmEmail: user.email,
      });
    } catch (error) {
      // Error already handled by mutation
      console.error("Restore error:", error);
    } finally {
      setRestoreInProgress(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You must be an administrator to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              <Button className="w-full" asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setLocation("/dashboard")}>
                Return to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 flex flex-col">
        {/* Brand */}
        <Link href="/">
          <div className="flex items-center gap-3 mb-8 cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg">
              {APP_LOGO ? <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8" /> : "L"}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-blue-400">Ameri</span>
                <span className="text-yellow-400">Lend</span>
              </h1>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "overview" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">🏠</span>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "users" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">👥</span>
            <span>Users Management</span>
          </button>
          
          <button
            onClick={() => setActiveTab("loans")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "loans" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">💳</span>
            <span>Loan Management</span>
          </button>
          
          <button
            onClick={() => setActiveTab("payments")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "payments" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">💵</span>
            <span>Payments</span>
          </button>
          
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "analytics" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">📈</span>
            <span>Reports & Analytics</span>
          </button>
          
          <button
            onClick={() => setActiveTab("verification")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "verification" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">📁</span>
            <span>ID Verification</span>
          </button>
          
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "notifications" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">🔔</span>
            <span>Notifications</span>
          </button>
          
          <button
            onClick={() => setActiveTab("ai")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "ai" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">🤖</span>
            <span>AI & Automation</span>
          </button>
          
          <button
            onClick={() => setActiveTab("support")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "support" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">🎫</span>
            <span>Support Center</span>
          </button>
          
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "settings" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">⚙️</span>
            <span>System Settings</span>
          </button>
          
          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "audit" ? "bg-gray-700/80 text-white" : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <span className="text-xl">🧾</span>
            <span>Audit Logs</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-white/10 text-xs text-gray-400">
          Logged in as <strong className="text-white">{user?.email}</strong>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users, loans, transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Top Actions */}
            <nav className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount && unreadCount.count > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Button>
                
                {showNotifications && (
                  <Card className="absolute right-0 mt-2 w-80 shadow-lg z-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Notifications</CardTitle>
                        {unreadCount && unreadCount.count > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={handleMarkAllAsRead}
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                      {!myNotifications || myNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myNotifications.slice(0, 5).map((notification: any) => {
                            const isUnread = notification.read === 0;
                            const notifTypeColor = notification.type === 'payment_received' || notification.type === 'disbursement' ? 'bg-green-500' :
                              notification.type === 'payment_reminder' ? 'bg-yellow-500' :
                              notification.type === 'system' ? 'bg-red-500' : 'bg-blue-500';
                            
                            return (
                              <div 
                                key={notification.id}
                                className={`flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer ${isUnread ? 'bg-blue-50/50' : ''}`}
                                onClick={() => handleNotificationClick(notification.id)}
                              >
                                <div className={`w-2 h-2 ${notifTypeColor} rounded-full mt-2`}></div>
                                <div className="flex-1">
                                  <p className={`text-sm ${isUnread ? 'font-semibold' : ''}`}>
                                    {notification.title || notification.message}
                                  </p>
                                  {notification.title && notification.message && (
                                    <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {myNotifications.length > 5 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => {
                                setActiveTab("notifications");
                                setShowNotifications(false);
                              }}
                            >
                              View all {myNotifications.length} notifications
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Admin Profile */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{user?.name || "Admin"}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </div>

              <Link href="/dashboard">
                <Button variant="ghost" size="sm">User View</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Sign Out
              </Button>
            </nav>
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              <AdminStats />
              <div className="mt-6">
                <LiveActivityFeed />
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <UsersManagement />
          )}

          {/* Loan Management Tab */}
          {activeTab === "loans" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : applications && applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="flex items-center gap-2">
                              {app.fullName} - {app.loanType === "installment" ? "Installment" : "Short-Term"}
                            </CardTitle>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant="outline" className="font-mono text-blue-600 border-blue-300 bg-blue-50">
                                📋 {app.referenceNumber}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Applied {new Date(app.createdAt).toLocaleDateString()}
                              </span>
                              {app.ipCity && app.ipCountry && (
                                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-300">
                                  📍 {app.ipCity}, {app.ipCountry}
                                </Badge>
                              )}
                              {app.ipAddress && (
                                <Badge variant="outline" className="text-xs font-mono bg-gray-50 border-gray-300">
                                  🌐 {app.ipAddress}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className={statusColors[app.status]}>{app.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Tracking ID Banner */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                                Application Tracking ID
                              </p>
                              <p className="text-2xl font-bold text-blue-900 font-mono tracking-wider">
                                {app.referenceNumber}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg px-4 py-2 border border-blue-300">
                              <p className="text-xs text-blue-600 font-medium">Internal ID</p>
                              <p className="text-lg font-bold text-blue-900">#{app.id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Requested</p>
                            <p className="font-semibold">
                              ${(app.requestedAmount / 100).toLocaleString()}
                            </p>
                          </div>
                          {app.approvedAmount && (
                            <div>
                              <p className="text-sm text-muted-foreground">Approved</p>
                              <p className="font-semibold text-accent">
                                ${(app.approvedAmount / 100).toLocaleString()}
                              </p>
                            </div>
                          )}
                          {app.processingFeeAmount && (
                            <div>
                              <p className="text-sm text-muted-foreground">Processing Fee</p>
                              <p className="font-semibold">
                                ${(app.processingFeeAmount / 100).toFixed(2)}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Income</p>
                            <p className="font-semibold">
                              ${(app.monthlyIncome / 100).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Personal Information */}
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Personal Information
                          </h4>
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground font-medium">Full Name</p>
                              <p>{app.fullName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">Email</p>
                              <p>{app.email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">Phone</p>
                              <p>{app.phone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">Date of Birth</p>
                              <p>{app.dateOfBirth}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">SSN</p>
                              <p>{app.ssn}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">Reference #</p>
                              <p className="font-mono text-blue-600">{app.referenceNumber}</p>
                            </div>
                          </div>
                        </div>

                        {/* Address Information */}
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Address
                          </h4>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground font-medium">Street Address</p>
                              <p>{app.street}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">City</p>
                              <p>{app.city}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">State</p>
                              <p>{app.state}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">ZIP Code</p>
                              <p>{app.zipCode}</p>
                            </div>
                          </div>
                        </div>

                        {/* Employment Information */}
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Employment & Income
                          </h4>
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground font-medium">Employment Status</p>
                              <p className="capitalize">{app.employmentStatus.replace('_', ' ')}</p>
                            </div>
                            {app.employer && (
                              <div>
                                <p className="text-muted-foreground font-medium">Employer</p>
                                <p>{app.employer}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground font-medium">Monthly Income</p>
                              <p className="font-semibold text-green-600">
                                ${(app.monthlyIncome / 100).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Loan Details */}
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Loan Details
                          </h4>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground font-medium">Loan Type</p>
                              <p className="capitalize">{app.loanType === "installment" ? "Installment Loan" : "Short-Term Loan"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium">Requested Amount</p>
                              <p className="font-semibold">${(app.requestedAmount / 100).toLocaleString()}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-muted-foreground font-medium">Loan Purpose</p>
                              <p>{app.loanPurpose}</p>
                            </div>
                          </div>
                        </div>

                        {/* Payment Status */}
                        {(app.processingFeeAmount || app.processingFeePaid) && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Payment Status
                            </h4>
                            <div className="grid md:grid-cols-3 gap-3 text-sm mb-3">
                              {app.processingFeeAmount && (
                                <div>
                                  <p className="text-muted-foreground font-medium">Processing Fee</p>
                                  <p className="font-semibold">${(app.processingFeeAmount / 100).toFixed(2)}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-muted-foreground font-medium">Fee Payment Status</p>
                                <Badge variant={app.processingFeePaid ? "default" : "secondary"}>
                                  {app.processingFeePaid ? "Paid" : "Pending"}
                                </Badge>
                              </div>
                              {app.processingFeePaymentId && (
                                <div>
                                  <p className="text-muted-foreground font-medium">Payment ID</p>
                                  <p className="font-mono text-xs">{app.processingFeePaymentId}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Payment Verification Section */}
                            {app.processingFeePaid === 1 && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium">Admin Payment Verification</p>
                                  {app.paymentVerified === 1 ? (
                                    <Badge variant="default" className="bg-green-600">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Awaiting Verification
                                    </Badge>
                                  )}
                                </div>
                                
                                {app.paymentVerified === 1 ? (
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {app.paymentVerifiedAt && (
                                      <p>Verified: {new Date(app.paymentVerifiedAt).toLocaleString()}</p>
                                    )}
                                    {app.paymentVerificationNotes && (
                                      <p className="text-sm mt-2">Notes: {app.paymentVerificationNotes}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setPaymentVerifyDialog({
                                          open: true,
                                          applicationId: app.id,
                                          action: "verify",
                                        });
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Verify Payment
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setPaymentVerifyDialog({
                                          open: true,
                                          applicationId: app.id,
                                          action: "reject",
                                        });
                                      }}
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Reject Payment
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Timeline
                          </h4>
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground font-medium">Applied</p>
                              <p>{new Date(app.createdAt).toLocaleString()}</p>
                            </div>
                            {app.approvedAt && (
                              <div>
                                <p className="text-muted-foreground font-medium">Approved</p>
                                <p>{new Date(app.approvedAt).toLocaleString()}</p>
                              </div>
                            )}
                            {app.disbursedAt && (
                              <div>
                                <p className="text-muted-foreground font-medium">Disbursed</p>
                                <p>{new Date(app.disbursedAt).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Admin Notes */}
                        {app.adminNotes && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-sm font-medium text-blue-900">Admin Notes:</p>
                            <p className="text-sm text-blue-800">{app.adminNotes}</p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {app.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                            <p className="text-sm text-red-800">{app.rejectionReason}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {(app.status === "pending" || app.status === "under_review") && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setApprovalDialog({ open: true, applicationId: app.id });
                                  setApprovalAmount((app.requestedAmount / 100).toString());
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setRejectionDialog({ open: true, applicationId: app.id })
                                }
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {app.status === "fee_paid" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setDisbursementDialog({ open: true, applicationId: app.id })
                              }
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Initiate Disbursement
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No loan applications found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Support Tab */}
          {activeTab === "support" && (
            <SupportMessagesManagement />
          )}

          {/* ID Verification Tab */}
          {activeTab === "verification" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : applications && applications.filter(app => app.idFrontUrl).length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.idFrontUrl).map((app) => (
                    <Card key={app.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle>{app.fullName}</CardTitle>
                            <CardDescription>
                              Application ID: {app.id} | Reference: {app.referenceNumber}
                            </CardDescription>
                          </div>
                          <Badge 
                            className={
                              app.idVerificationStatus === "verified" 
                                ? "bg-green-100 text-green-800 border-green-300"
                                : app.idVerificationStatus === "rejected"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-yellow-100 text-yellow-800 border-yellow-300"
                            }
                          >
                            {app.idVerificationStatus || "pending"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* ID Front */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">ID Front</Label>
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                              {app.idFrontUrl ? (
                                <IDImageViewer s3Key={app.idFrontUrl} alt="ID Front" />
                              ) : (
                                <div className="w-full h-48 flex items-center justify-center text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* ID Back */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">ID Back</Label>
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                              {app.idBackUrl ? (
                                <IDImageViewer s3Key={app.idBackUrl} alt="ID Back" />
                              ) : (
                                <div className="w-full h-48 flex items-center justify-center text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Selfie */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Selfie with ID</Label>
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                              {app.selfieUrl ? (
                                <IDImageViewer s3Key={app.selfieUrl} alt="Selfie" />
                              ) : (
                                <div className="w-full h-48 flex items-center justify-center text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {app.idVerificationNotes && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <Label className="text-sm font-medium">Admin Notes</Label>
                            <p className="text-sm text-gray-700 mt-1">{app.idVerificationNotes}</p>
                          </div>
                        )}

                        {app.idVerificationStatus === "pending" && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={() => {
                                setIdVerifyDialog({ 
                                  open: true, 
                                  applicationId: app.id,
                                  action: "approve"
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve ID
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setIdVerifyDialog({ 
                                  open: true, 
                                  applicationId: app.id,
                                  action: "reject"
                                });
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject ID
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No ID verification documents to review</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Processing Fee Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure how processing fees are calculated for approved loans
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {feeConfig && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">Current Configuration</p>
                      <p className="text-sm text-blue-800">
                        Mode: <strong>{feeConfig.calculationMode}</strong>
                        {feeConfig.calculationMode === "percentage"
                          ? ` | Rate: ${(feeConfig.percentageRate / 100).toFixed(2)}%`
                          : ` | Fee: $${(feeConfig.fixedFeeAmount / 100).toFixed(2)}`}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Calculation Mode</Label>
                      <Select value={feeMode} onValueChange={(v) => setFeeMode(v as "percentage" | "fixed")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage of Loan Amount</SelectItem>
                          <SelectItem value="fixed">Fixed Fee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {feeMode === "percentage" ? (
                      <div className="space-y-2">
                        <Label htmlFor="percentageRate">
                          Percentage Rate (1.5% - 2.5%)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="percentageRate"
                            type="number"
                            step="0.01"
                            min="1.5"
                            max="2.5"
                            value={percentageRate}
                            onChange={(e) => setPercentageRate(e.target.value)}
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Example: 2.00% of $10,000 = $200 processing fee
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="fixedFeeAmount">
                          Fixed Fee Amount ($1.50 - $2.50)
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            id="fixedFeeAmount"
                            type="number"
                            step="0.01"
                            min="1.5"
                            max="2.5"
                            value={fixedFeeAmount}
                            onChange={(e) => setFixedFeeAmount(e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This fee will be charged regardless of loan amount
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleUpdateFeeConfig}
                      disabled={updateFeeConfigMutation.isPending}
                    >
                      {updateFeeConfigMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Update Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === "support" && (
            <SupportMessagesManagement />
          )}

          {/* Verification Tab */}
          {activeTab === "verification" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Document Verification</h2>
                <p className="text-gray-600 mt-2">Review and verify user-submitted documents</p>
              </div>

              {/* Verification Queue Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {applications?.filter(app => app.idFrontUrl && app.idVerificationStatus === "pending").length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Documents waiting</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {applications?.filter(app => 
                        app.idVerificationStatus === "verified" && 
                        app.updatedAt && 
                        new Date(app.updatedAt).toDateString() === new Date().toDateString()
                      ).length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Successfully verified</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {applications?.filter(app => 
                        app.idVerificationStatus === "rejected" && 
                        app.updatedAt && 
                        new Date(app.updatedAt).toDateString() === new Date().toDateString()
                      ).length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Failed verification</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Verified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {applications?.filter(app => app.idVerificationStatus === "verified").length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>
              </div>

              {/* Document Queue */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Verification Queue</CardTitle>
                      <CardDescription>Documents pending review</CardDescription>
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Documents</SelectItem>
                        <SelectItem value="pending">Pending Only</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : applications && applications.filter(app => app.idFrontUrl).length > 0 ? (
                    <div className="space-y-4">
                      {applications
                        .filter(app => app.idFrontUrl)
                        .slice(0, 10)
                        .map((app) => {
                          const uploadedDate = app.createdAt ? new Date(app.createdAt) : new Date();
                          const now = new Date();
                          const diffHours = Math.floor((now.getTime() - uploadedDate.getTime()) / (1000 * 60 * 60));
                          const diffDays = Math.floor(diffHours / 24);
                          
                          const timeAgo = diffDays > 0 
                            ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
                            : diffHours > 0 
                            ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
                            : 'Just now';

                          return (
                            <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center gap-4 flex-1">
                                <div className={`w-12 h-12 rounded flex items-center justify-center ${
                                  app.idVerificationStatus === 'verified' ? 'bg-green-100' :
                                  app.idVerificationStatus === 'rejected' ? 'bg-red-100' :
                                  'bg-blue-100'
                                }`}>
                                  <FileText className={`w-6 h-6 ${
                                    app.idVerificationStatus === 'verified' ? 'text-green-600' :
                                    app.idVerificationStatus === 'rejected' ? 'text-red-600' :
                                    'text-blue-600'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{app.fullName}</h4>
                                    <Badge variant="outline">ID Documents</Badge>
                                    {app.idVerificationStatus === 'verified' && (
                                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
                                    )}
                                    {app.idVerificationStatus === 'rejected' && (
                                      <Badge variant="destructive">Rejected</Badge>
                                    )}
                                    {app.idVerificationStatus === 'pending' && (
                                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Uploaded {timeAgo} • Ref: {app.referenceNumber}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setActiveTab("verification")}
                                >
                                  <Maximize2 className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                                {app.idVerificationStatus === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => {
                                        setIdVerifyDialog({ 
                                          open: true, 
                                          applicationId: app.id,
                                          action: "approve"
                                        });
                                      }}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => {
                                        setIdVerifyDialog({ 
                                          open: true, 
                                          applicationId: app.id,
                                          action: "reject"
                                        });
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-base font-medium">No documents to review</p>
                      <p className="text-sm mt-1">ID verification documents will appear here when uploaded</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI-Powered Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Document Verification Statistics
                  </CardTitle>
                  <CardDescription>Overview of verification activity and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div>
                        <h4 className="font-medium">Manual Review Process</h4>
                        <p className="text-sm text-muted-foreground">Admin-verified identity documents</p>
                      </div>
                      <Badge className="bg-blue-600">Active</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {applications?.filter(app => app.idVerificationStatus === "verified").length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Verified</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {applications?.filter(app => app.idFrontUrl && app.idVerificationStatus === "pending").length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {applications?.filter(app => app.idVerificationStatus === "rejected").length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Rejected</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Notifications & Communication</h2>
                <p className="text-gray-600 mt-2">Manage system notifications and email communications</p>
              </div>

              {/* Email Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>Configure automated email templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: 'loan_approval', name: 'Loan Approval', desc: 'Sent when loan is approved' },
                      { id: 'loan_rejection', name: 'Loan Rejection', desc: 'Sent when loan is rejected' },
                      { id: 'payment_reminder', name: 'Payment Reminder', desc: 'Sent before payment due' },
                      { id: 'payment_confirmation', name: 'Payment Confirmation', desc: 'Sent after successful payment' },
                      { id: 'welcome', name: 'Welcome Email', desc: 'Sent to new users' }
                    ].map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.desc}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notification History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    All System Notifications
                  </CardTitle>
                  <CardDescription>Complete notification history across all users</CardDescription>
                </CardHeader>
                <CardContent>
                  {!notificationsData || notificationsData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-base font-medium">No notifications yet</p>
                      <p className="text-sm mt-1">System notifications will appear here when users receive them</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {notificationsData.map((notification: any) => {
                          const isUnread = notification.read === 0;
                          const iconClass = notification.type === 'payment_received' || notification.type === 'disbursement' ? 'text-green-600' :
                            notification.type === 'payment_reminder' ? 'text-yellow-600' :
                            notification.type === 'system' ? 'text-red-600' : 'text-blue-600';
                          const bgClass = notification.type === 'payment_received' || notification.type === 'disbursement' ? 'bg-green-50 border-green-200' :
                            notification.type === 'payment_reminder' ? 'bg-yellow-50 border-yellow-200' :
                            notification.type === 'system' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
                          
                          return (
                            <div 
                              key={notification.id}
                              className={`flex items-start gap-3 p-3 ${bgClass} border rounded-lg ${isUnread ? 'ring-2 ring-blue-300' : ''}`}
                            >
                              {notification.type === 'payment_received' || notification.type === 'disbursement' ? (
                                <CheckCircle className={`w-5 h-5 ${iconClass} mt-0.5`} />
                              ) : notification.type === 'payment_reminder' ? (
                                <Clock className={`w-5 h-5 ${iconClass} mt-0.5`} />
                              ) : notification.type === 'system' ? (
                                <AlertTriangle className={`w-5 h-5 ${iconClass} mt-0.5`} />
                              ) : (
                                <Bell className={`w-5 h-5 ${iconClass} mt-0.5`} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className={`font-medium text-sm ${isUnread ? 'font-bold' : ''}`}>
                                    {notification.title}
                                  </p>
                                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                                    {notification.type.replace(/_/g, ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {notification.userName || 'Unknown User'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {notification.userEmail || 'No email'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </span>
                                  {isUnread && (
                                    <Badge variant="default" className="text-xs bg-blue-600">Unread</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Showing {notificationsData.length} notifications
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Communication Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Communication Settings
                  </CardTitle>
                  <CardDescription>Configure notification preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">Send automated emails to users</p>
                      </div>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">SMS Notifications</h4>
                        <p className="text-sm text-muted-foreground">Send SMS for critical updates</p>
                      </div>
                      <Button variant="outline" size="sm">Disabled</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Admin Alerts</h4>
                        <p className="text-sm text-muted-foreground">Receive alerts for important events</p>
                      </div>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI & Automation Tab */}
          {activeTab === "ai" && <AIAutomationTab />}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <PaymentsManagement />
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <AnalyticsOverview />
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
                <p className="text-gray-600 mt-2">Configure system settings and preferences</p>
              </div>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Basic company details and branding</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Support Phone</Label>
                        <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Address</Label>
                      <Textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} rows={2} />
                    </div>
                    <Button onClick={handleSaveCompanyInfo}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Company Info
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Loan Parameters
                  </CardTitle>
                  <CardDescription>Configure loan amount limits and interest rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Loan Amount ($)</Label>
                        <Input type="number" value={minLoanAmount} onChange={(e) => setMinLoanAmount(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Loan Amount ($)</Label>
                        <Input type="number" value={maxLoanAmount} onChange={(e) => setMaxLoanAmount(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Base Interest Rate (%)</Label>
                        <Input type="number" step="0.1" value={baseInterestRate} onChange={(e) => setBaseInterestRate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Processing Fee (%)</Label>
                        <Input type="number" step="0.1" value={loanProcessingFee} onChange={(e) => setLoanProcessingFee(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Loan Term (months)</Label>
                        <Input type="number" value={maxLoanTerm} onChange={(e) => setMaxLoanTerm(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Late Payment Fee ($)</Label>
                        <Input type="number" value={latePaymentFee} onChange={(e) => setLatePaymentFee(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={handleSaveLoanParameters}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Loan Parameters
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Crypto Wallet Settings */}
              <CryptoWalletSettings />

              {/* AI Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    AI Configuration
                  </CardTitle>
                  <CardDescription>Configure AI chatbot and assistance settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* AI Status Toggle */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div>
                        <h4 className="font-medium">AI Chat Status</h4>
                        <p className="text-sm text-muted-foreground">
                          {aiEnabled ? "AI is currently active and responding to users" : "AI is disabled"}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiEnabled}
                          onChange={(e) => setAiEnabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">{aiEnabled ? "Enabled" : "Disabled"}</span>
                      </label>
                    </div>

                    {/* AI Provider Selection */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>AI Provider</Label>
                        <Select value={aiProvider} onValueChange={setAiProvider}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                            <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                            <SelectItem value="google">Google (Gemini)</SelectItem>
                            <SelectItem value="azure">Azure OpenAI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>AI Model</Label>
                        <Select value={aiModel} onValueChange={setAiModel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {aiProvider === "openai" && (
                              <>
                                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Current)</SelectItem>
                                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                              </>
                            )}
                            {aiProvider === "anthropic" && (
                              <>
                                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                              </>
                            )}
                            {aiProvider === "google" && (
                              <>
                                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                                <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                              </>
                            )}
                            {aiProvider === "azure" && (
                              <>
                                <SelectItem value="gpt-4">GPT-4 (Azure)</SelectItem>
                                <SelectItem value="gpt-35-turbo">GPT-3.5 Turbo (Azure)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="Enter your API key"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your API key is encrypted and stored securely
                      </p>
                    </div>

                    {/* Features Configuration */}
                    <div className="space-y-3">
                      <Label>AI Features</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4" />
                          <span className="text-sm">Loan application assistance</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4" />
                          <span className="text-sm">Payment support</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4" />
                          <span className="text-sm">General inquiries</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm">Document analysis</span>
                        </label>
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleSaveAIConfig}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save AI Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Configuration
                  </CardTitle>
                  <CardDescription>Configure email service settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Provider</Label>
                        <Select value={emailProvider} onValueChange={setEmailProvider}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sendgrid">SendGrid</SelectItem>
                            <SelectItem value="mailgun">Mailgun</SelectItem>
                            <SelectItem value="ses">Amazon SES</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>From Email Address</Label>
                        <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Email service connected</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleTestEmailConnection}>
                        Test Connection
                      </Button>
                    </div>
                    <Button onClick={handleSaveEmailConfig}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Email Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Gateway Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Gateway Integration
                  </CardTitle>
                  <CardDescription>Configure payment processing services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Authorize.Net</h4>
                          <p className="text-sm text-muted-foreground">Credit card processing</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Cryptocurrency Payments</h4>
                          <p className="text-sm text-muted-foreground">Bitcoin, Ethereum, USDT</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">ACH Direct Debit</h4>
                          <p className="text-sm text-muted-foreground">Bank account payments</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info("ACH configuration coming soon")}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Security & Compliance
                  </CardTitle>
                  <CardDescription>Security settings and compliance options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                      </div>
                      <Button 
                        variant={twoFactorEnabled ? "default" : "outline"} 
                        size="sm"
                        onClick={handleToggle2FA}
                      >
                        {twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Session Timeout</h4>
                        <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                      </div>
                      <Select value={sessionTimeout} onValueChange={handleSessionTimeoutChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">IP Whitelist</h4>
                        <p className="text-sm text-muted-foreground">Restrict admin access by IP</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant={ipWhitelistEnabled ? "default" : "outline"} 
                          size="sm"
                          onClick={handleToggleIPWhitelist}
                          disabled={ipWhitelistAddresses.length === 0 && !ipWhitelistEnabled}
                        >
                          {ipWhitelistEnabled ? "Enabled" : "Disabled"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIpWhitelistDialog(true)}
                        >
                          Configure ({ipWhitelistAddresses.length})
                        </Button>
                      </div>
                    </div>
                    
                    {/* IP Whitelist Status */}
                    {ipWhitelistAddresses.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Whitelisted IP Addresses:</h4>
                        <div className="space-y-1">
                          {ipWhitelistAddresses.slice(0, 3).map((ip, index) => (
                            <div key={index} className="text-xs text-muted-foreground font-mono">
                              • {ip}
                            </div>
                          ))}
                          {ipWhitelistAddresses.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              + {ipWhitelistAddresses.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Backup & Restore */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Backup & Restore
                  </CardTitle>
                  <CardDescription>Database backup and recovery options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div>
                        <h4 className="font-medium">Automatic Backups</h4>
                        <p className="text-sm text-muted-foreground">Last backup: Today at 3:00 AM</p>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    
                    {/* Info Notice */}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-900">⚠️ Important</p>
                          <p className="text-yellow-800 text-xs mt-1">
                            Restoring a backup will overwrite all current data. Make sure to download a current backup before restoring.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleDownloadBackup}
                        disabled={backupInProgress}
                      >
                        {backupInProgress ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Backup
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleRestoreBackup}
                        disabled={restoreInProgress}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Restore from Backup
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
                <p className="text-gray-600 mt-2">Track all administrative actions and system events</p>
              </div>

              {/* Audit Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{auditLogsData.length.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Today's Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {auditLogsData.filter(log => {
                        const today = new Date();
                        const logDate = new Date(log.createdAt);
                        return logDate.toDateString() === today.toDateString();
                      }).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Actions today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Unique Admins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {new Set(auditLogsData.filter(log => log.userId).map(log => log.userId)).size}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Active admins</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Recent Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {auditLogsData.filter(log => {
                        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                        const logDate = new Date(log.createdAt);
                        return logDate >= oneHourAgo;
                      }).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last hour</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Audit Log Filters</CardTitle>
                  <CardDescription>Filter and search audit records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search logs..."
                        className="pl-10"
                      />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Action Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="loan_approval">Loan Approval</SelectItem>
                        <SelectItem value="loan_rejection">Loan Rejection</SelectItem>
                        <SelectItem value="user_update">User Update</SelectItem>
                        <SelectItem value="settings_change">Settings Change</SelectItem>
                        <SelectItem value="payment_process">Payment Process</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Admin User" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Admins</SelectItem>
                        <SelectItem value="admin1">Admin User 1</SelectItem>
                        <SelectItem value="admin2">Admin User 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="today">
                      <SelectTrigger>
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Log Entries */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Activity Log</CardTitle>
                      <CardDescription>Detailed record of all administrative actions</CardDescription>
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogsData.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No audit logs found</p>
                      </div>
                    ) : (
                      auditLogsData.slice(0, 20).map((log) => {
                        // Determine severity based on action
                        let severity: 'info' | 'success' | 'warning' | 'critical' = 'info';
                        if (log.action.includes('approved') || log.action.includes('success')) {
                          severity = 'success';
                        } else if (log.action.includes('rejected') || log.action.includes('failed')) {
                          severity = 'warning';
                        } else if (log.action.includes('deleted') || log.action.includes('suspended') || log.action.includes('critical')) {
                          severity = 'critical';
                        }

                        const severityColors = {
                          info: 'bg-blue-50 border-blue-200',
                          success: 'bg-green-50 border-green-200',
                          warning: 'bg-yellow-50 border-yellow-200',
                          critical: 'bg-red-50 border-red-200'
                        };
                        const severityIcons = {
                          info: <FileText className="w-5 h-5 text-blue-600" />,
                          success: <CheckCircle className="w-5 h-5 text-green-600" />,
                          warning: <Bell className="w-5 h-5 text-yellow-600" />,
                          critical: <XCircle className="w-5 h-5 text-red-600" />
                        };

                        // Format time ago
                        const timeAgo = (() => {
                          const now = new Date();
                          const logTime = new Date(log.createdAt);
                          const diffMs = now.getTime() - logTime.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMins / 60);
                          const diffDays = Math.floor(diffHours / 24);

                          if (diffMins < 1) return 'Just now';
                          if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                          if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                          return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                        })();

                        // Parse metadata for details
                        let details = '';
                        try {
                          if (log.metadata) {
                            const meta = JSON.parse(log.metadata);
                            details = meta.description || meta.details || '';
                          }
                        } catch (e) {
                          // Ignore JSON parse errors
                        }

                        return (
                          <div key={log.id} className={`flex items-start gap-4 p-4 border rounded-lg ${severityColors[severity]}`}>
                            <div className="mt-0.5">
                              {severityIcons[severity]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Admin:</strong> {log.userName || 'System'}
                                  </p>
                                  {log.entityType && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Target:</strong> {log.entityType} #{log.entityId}
                                    </p>
                                  )}
                                  {details && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {details}
                                    </p>
                                  )}
                                  {log.ipAddress && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      IP: {log.ipAddress}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                                  <Button variant="ghost" size="sm" className="mt-1">
                                    <Maximize2 className="w-3 h-3 mr-1" />
                                    Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {Math.min(20, auditLogsData.length)} of {auditLogsData.length} entries
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" disabled={auditLogsData.length <= 20}>Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Action Distribution (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      // Calculate action distribution
                      const actionCounts = new Map<string, number>();
                      auditLogsData.forEach(log => {
                        const action = log.action;
                        actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
                      });

                      const total = auditLogsData.length || 1;
                      const topActions = Array.from(actionCounts.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);

                      const actionColors = [
                        'bg-green-600',
                        'bg-blue-600',
                        'bg-purple-600',
                        'bg-orange-600',
                        'bg-pink-600'
                      ];

                      return topActions.length > 0 ? topActions.map(([action, count], idx) => {
                        const percentage = ((count / total) * 100).toFixed(0);
                        return (
                          <div key={action} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{action.replace(/_/g, ' ')}</span>
                              <span className="font-medium">{count} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${actionColors[idx]}`} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No action data available</p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">System Logs</h2>
                <p className="text-gray-600 mt-2">View system errors and diagnostic information</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Coming soon - System logs and error tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">System logging feature will be implemented here.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AmeriLend — Admin Panel
        </footer>
      </main>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Loan Application</DialogTitle>
            <DialogDescription>
              Enter the approved loan amount and any notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approvalAmount">Approved Amount ($)</Label>
              <Input
                id="approvalAmount"
                type="number"
                step="0.01"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approvalNotes">Admin Notes (optional)</Label>
              <Textarea
                id="approvalNotes"
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog({ open: false, applicationId: null })}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Loan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog.open} onOpenChange={(open) => setRejectionDialog({ ...rejectionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialog({ open: false, applicationId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disbursement Dialog */}
      <Dialog open={disbursementDialog.open} onOpenChange={(open) => setDisbursementDialog({ ...disbursementDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Loan Disbursement</DialogTitle>
            <DialogDescription>
              Enter bank account details for disbursement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disbursementNotes">Notes (optional)</Label>
              <Textarea
                id="disbursementNotes"
                rows={2}
                value={disbursementNotes}
                onChange={(e) => setDisbursementNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisbursementDialog({ open: false, applicationId: null })}>
              Cancel
            </Button>
            <Button onClick={handleDisburse} disabled={disburseMutation.isPending}>
              {disburseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Initiate Disbursement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ID Verification Dialog */}
      <Dialog open={idVerifyDialog.open} onOpenChange={(open) => setIdVerifyDialog({ ...idVerifyDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {idVerifyDialog.action === "approve" ? "Approve ID Verification" : "Reject ID Verification"}
            </DialogTitle>
            <DialogDescription>
              {idVerifyDialog.action === "approve" 
                ? "Add optional notes about the verification"
                : "Provide a reason for rejecting the ID verification"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="idVerifyNotes">
                {idVerifyDialog.action === "approve" ? "Notes (optional)" : "Rejection Reason"}
              </Label>
              <Textarea
                id="idVerifyNotes"
                rows={4}
                value={idVerifyNotes}
                onChange={(e) => setIdVerifyNotes(e.target.value)}
                placeholder={
                  idVerifyDialog.action === "approve"
                    ? "Add any notes about the verification..."
                    : "Explain why the ID verification is being rejected..."
                }
                required={idVerifyDialog.action === "reject"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIdVerifyDialog({ open: false, applicationId: null, action: null });
                setIdVerifyNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={idVerifyDialog.action === "approve" ? "default" : "destructive"}
              onClick={() => {
                if (!idVerifyDialog.applicationId) return;
                
                if (idVerifyDialog.action === "approve") {
                  approveIdVerificationMutation.mutate({
                    id: idVerifyDialog.applicationId,
                    notes: idVerifyNotes || undefined,
                  });
                } else {
                  if (!idVerifyNotes.trim()) {
                    toast.error("Please provide a rejection reason");
                    return;
                  }
                  rejectIdVerificationMutation.mutate({
                    id: idVerifyDialog.applicationId,
                    reason: idVerifyNotes,
                  });
                }
              }}
              disabled={
                approveIdVerificationMutation.isPending || 
                rejectIdVerificationMutation.isPending ||
                (idVerifyDialog.action === "reject" && !idVerifyNotes.trim())
              }
            >
              {(approveIdVerificationMutation.isPending || rejectIdVerificationMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                idVerifyDialog.action === "approve" ? "Approve Verification" : "Reject Verification"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Verification Dialog */}
      <Dialog open={paymentVerifyDialog.open} onOpenChange={(open) => {
        if (!open) {
          setPaymentVerifyDialog({ open: false, applicationId: null, action: null });
          setPaymentVerifyNotes("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentVerifyDialog.action === "verify" ? "Verify Payment" : "Reject Payment"}
            </DialogTitle>
            <DialogDescription>
              {paymentVerifyDialog.action === "verify"
                ? "Confirm that you have verified the processing fee payment"
                : "Provide a reason for rejecting the payment verification"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-verify-notes">
                {paymentVerifyDialog.action === "verify" ? "Notes (Optional)" : "Rejection Reason *"}
              </Label>
              <Textarea
                id="payment-verify-notes"
                value={paymentVerifyNotes}
                onChange={(e) => setPaymentVerifyNotes(e.target.value)}
                placeholder={
                  paymentVerifyDialog.action === "verify"
                    ? "Add any notes about the payment verification..."
                    : "Explain why the payment verification is being rejected..."
                }
                required={paymentVerifyDialog.action === "reject"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPaymentVerifyDialog({ open: false, applicationId: null, action: null });
                setPaymentVerifyNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={paymentVerifyDialog.action === "verify" ? "default" : "destructive"}
              onClick={() => {
                if (!paymentVerifyDialog.applicationId) return;
                
                if (paymentVerifyDialog.action === "verify") {
                  verifyPaymentMutation.mutate({
                    id: paymentVerifyDialog.applicationId,
                    notes: paymentVerifyNotes || undefined,
                  });
                } else {
                  if (!paymentVerifyNotes.trim()) {
                    toast.error("Please provide a rejection reason");
                    return;
                  }
                  rejectPaymentVerificationMutation.mutate({
                    id: paymentVerifyDialog.applicationId,
                    reason: paymentVerifyNotes,
                  });
                }
              }}
              disabled={
                verifyPaymentMutation.isPending || 
                rejectPaymentVerificationMutation.isPending ||
                (paymentVerifyDialog.action === "reject" && !paymentVerifyNotes.trim())
              }
            >
              {(verifyPaymentMutation.isPending || rejectPaymentVerificationMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                paymentVerifyDialog.action === "verify" ? "Verify Payment" : "Reject Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IP Whitelist Configuration Dialog */}
      <Dialog open={ipWhitelistDialog} onOpenChange={setIpWhitelistDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>IP Whitelist Configuration</DialogTitle>
            <DialogDescription>
              Add IP addresses or CIDR ranges to restrict admin access. Only requests from these IPs will be allowed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add IP Address */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1 or 192.168.1.0/24)"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIPAddress();
                  }
                }}
              />
              <Button onClick={handleAddIPAddress}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {/* IP List */}
            {ipWhitelistAddresses.length > 0 ? (
              <div className="border rounded-lg">
                <div className="p-3 bg-muted font-medium text-sm">
                  Whitelisted IP Addresses ({ipWhitelistAddresses.length})
                </div>
                <div className="divide-y max-h-64 overflow-y-auto">
                  {ipWhitelistAddresses.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-mono text-sm">{ip}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIPAddress(ip)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No IP addresses configured. Add at least one IP to enable whitelist.
                </p>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900 mb-1">⚠️ Important Security Notice</p>
                  <ul className="text-yellow-800 space-y-1 text-xs">
                    <li>• Make sure to add your current IP address before enabling whitelist</li>
                    <li>• You may be locked out if you enable without adding your IP</li>
                    <li>• Use CIDR notation (e.g., 192.168.1.0/24) for IP ranges</li>
                    <li>• Changes take effect immediately upon enabling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIpWhitelistDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIpWhitelistDialog(false);
                toast.success("IP whitelist configuration saved");
              }}
              disabled={ipWhitelistAddresses.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Restore Database from Backup</DialogTitle>
            <DialogDescription>
              Upload a backup file to restore your database. This action will overwrite all current data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-6">
              <div className="text-center">
                <Download className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h4 className="font-medium mb-2">Select Backup File</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a JSON backup file previously downloaded from this system
                </p>
                <Input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="max-w-md mx-auto"
                />
                {selectedBackupFile && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg inline-block">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        {selectedBackupFile.name}
                      </span>
                      <span className="text-xs text-green-700">
                        ({(selectedBackupFile.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Critical Warning */}
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-900 mb-2">⚠️ CRITICAL WARNING</p>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• This will permanently delete all current data</li>
                    <li>• All users, loans, payments, and settings will be replaced</li>
                    <li>• This action CANNOT be undone</li>
                    <li>• Make sure you have downloaded a current backup first</li>
                    <li>• Verify the backup file is correct before proceeding</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Restore Process Info */}
            {restoreInProgress && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Restoring database...</p>
                    <p className="text-sm text-blue-700">This may take several minutes. Please do not close this window.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialog(false);
                setSelectedBackupFile(null);
              }}
              disabled={restoreInProgress}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRestore}
              disabled={!selectedBackupFile || restoreInProgress}
            >
              {restoreInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Restore Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
