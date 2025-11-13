import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Home, Users, CreditCard, DollarSign, TrendingUp, FileText, 
  Bell, MessageSquare, Bot, HelpCircle, Settings, ScrollText,
  Search, User, LogOut, ChevronRight, AlertCircle, CheckCircle,
  XCircle, Clock, BarChart3, Download, Send, Eye, Edit, Trash2,
  Plus, Filter, Calendar, Mail, Phone, Shield, Database, Lock
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch admin stats
  const { data: stats } = trpc.loans.getAdminStats.useQuery();
  const { data: payments } = trpc.payments.adminGetStats.useQuery();

  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8" />}
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-blue-400">Ameri</span>
                <span className="text-yellow-400">Lend</span>
              </h1>
              <p className="text-xs text-gray-400">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem
            icon={<Home className="w-5 h-5" />}
            label="Dashboard"
            active={activeSection === "dashboard"}
            onClick={() => setActiveSection("dashboard")}
          />
          <NavItem
            icon={<Users className="w-5 h-5" />}
            label="Users Management"
            active={activeSection === "users"}
            onClick={() => setActiveSection("users")}
          />
          <NavItem
            icon={<CreditCard className="w-5 h-5" />}
            label="Loan Management"
            active={activeSection === "loans"}
            onClick={() => setActiveSection("loans")}
          />
          <NavItem
            icon={<DollarSign className="w-5 h-5" />}
            label="Payments"
            active={activeSection === "payments"}
            onClick={() => setActiveSection("payments")}
          />
          <NavItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Reports & Analytics"
            active={activeSection === "reports"}
            onClick={() => setActiveSection("reports")}
          />
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="Documents & Verification"
            active={activeSection === "documents"}
            onClick={() => setActiveSection("documents")}
          />
          <NavItem
            icon={<Bell className="w-5 h-5" />}
            label="Notifications"
            active={activeSection === "notifications"}
            onClick={() => setActiveSection("notifications")}
          />
          <NavItem
            icon={<Bot className="w-5 h-5" />}
            label="AI & Automation"
            active={activeSection === "ai"}
            onClick={() => setActiveSection("ai")}
          />
          <NavItem
            icon={<HelpCircle className="w-5 h-5" />}
            label="Support Center"
            active={activeSection === "support"}
            onClick={() => setActiveSection("support")}
          />
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="System Settings"
            active={activeSection === "settings"}
            onClick={() => setActiveSection("settings")}
          />
          <NavItem
            icon={<ScrollText className="w-5 h-5" />}
            label="Audit Logs"
            active={activeSection === "audit"}
            onClick={() => setActiveSection("audit")}
          />
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">Logged in as</div>
          <div className="font-semibold text-sm truncate">{user.email}</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users, loans, transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 ml-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
              </div>

              {/* Profile */}
              <div className="flex items-center gap-2 pl-3 border-l">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {user.name?.charAt(0) || "A"}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold">{user.name || "Admin"}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "dashboard" && <DashboardOverview stats={stats} payments={payments} />}
          {activeSection === "users" && <UsersManagement />}
          {activeSection === "loans" && <LoanManagement />}
          {activeSection === "payments" && <PaymentsSection />}
          {activeSection === "reports" && <ReportsAnalytics />}
          {activeSection === "documents" && <DocumentsVerification />}
          {activeSection === "notifications" && <NotificationCenter />}
          {activeSection === "ai" && <AIAutomation />}
          {activeSection === "support" && <SupportCenter />}
          {activeSection === "settings" && <SystemSettings />}
          {activeSection === "audit" && <AuditLogs />}
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

// 1. Dashboard Overview
function DashboardOverview({ stats, payments }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.activeUsers || 0} active`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Total Loans"
          value={stats?.totalApplications || 0}
          subtitle={`${stats?.pendingApplications || 0} pending`}
          icon={<CreditCard className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Disbursed Amount"
          value={`$${((stats?.totalDisbursed || 0) / 100).toLocaleString()}`}
          subtitle={`${stats?.disbursedLoans || 0} loans`}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Repayments"
          value={`$${((payments?.totalRevenue || 0) / 100).toLocaleString()}`}
          subtitle={`${payments?.completedPayments || 0} payments`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col gap-2">
              <CheckCircle className="w-6 h-6" />
              Approve Loans
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="w-6 h-6" />
              Review KYC
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign className="w-6 h-6" />
              Process Payments
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AlertItem
              type="warning"
              message="5 new loan applications awaiting review"
              time="Just now"
            />
            <AlertItem
              type="info"
              message="3 KYC documents pending verification"
              time="2 hours ago"
            />
            <AlertItem
              type="success"
              message="$25,000 in repayments received today"
              time="5 hours ago"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${colors[color as keyof typeof colors]} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-1">{title}</div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function AlertItem({ type, message, time }: any) {
  const types = {
    warning: { bg: "bg-orange-50", text: "text-orange-600", icon: AlertCircle },
    info: { bg: "bg-blue-50", text: "text-blue-600", icon: Bell },
    success: { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle },
  };
  const config = types[type as keyof typeof types];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bg}`}>
      <Icon className={`w-5 h-5 ${config.text} mt-0.5`} />
      <div className="flex-1">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

// Placeholder sections (to be implemented)
function UsersManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Users Management</h2>
        <p className="text-gray-600">Manage all registered customers</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Users management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoanManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Loan Management</h2>
        <p className="text-gray-600">Handle all loan applications and disbursements</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Loan management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payments</h2>
        <p className="text-gray-600">Track all transactions and disbursements</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Payments interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-gray-600">Financial and operational insights</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Reports & analytics coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsVerification() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documents & Verification</h2>
        <p className="text-gray-600">Manage user-uploaded documents securely</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Document verification interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notifications & Communication</h2>
        <p className="text-gray-600">Manage messages to users</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Notification center coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AIAutomation() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI & Automation</h2>
        <p className="text-gray-600">Smart features for automation</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>AI & automation features coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SupportCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Support Center</h2>
        <p className="text-gray-600">Handle customer inquiries and issues</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Support center coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-gray-600">Control everything from one place</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>System settings coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-gray-600">For transparency and compliance</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <ScrollText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Audit logs coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
