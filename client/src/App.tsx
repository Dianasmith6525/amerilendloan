import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ApplyLoan from "./pages/ApplyLoan";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentPage from "./pages/PaymentPage";
import OTPLogin from "./pages/OTPLogin";
import EnhancedPaymentPage from "./pages/EnhancedPaymentPage";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Careers from "./pages/Careers";
import RatesAndTerms from "./pages/RatesAndTerms";
import TermsOfService from "./pages/TermsOfService";
import LoanGuides from "./pages/LoanGuides";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import JobApplication from "./pages/JobApplication";
import Prequalify from "./pages/Prequalify";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DoNotSell from "./pages/DoNotSell";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";
import OTPSignup from "./pages/OTPSignup";
import ProcessingFeePayment from "./pages/ProcessingFeePayment";
import TrackApplication from "./pages/TrackApplication";
import ReferralDashboard from "./pages/ReferralDashboard";
import Settings from "./pages/Settings";
import UploadID from "./pages/UploadID";
import ChatSupport from "./components/ChatSupport";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/apply"} component={ApplyLoan} />
      <Route path={"/prequalify"} component={Prequalify} />
      <Route path={"/track"} component={TrackApplication} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/upload-id/:id"} component={UploadID} />
      <Route path={"/referrals"} component={ReferralDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/payment/:id"} component={PaymentPage} />
      <Route path={"/otp-login"} component={OTPLogin} />
      <Route path={"/login"} component={OTPLogin} />
      <Route path={"/signin"} component={OTPLogin} />
      <Route path={"/signup"} component={Signup} />
      <Route path={"/otp-signup"} component={OTPSignup} />
      <Route path={"/register"} component={OTPSignup} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/payment-enhanced/:id"} component={EnhancedPaymentPage} />
      <Route path={"/processing-fee/:id"} component={ProcessingFeePayment} />
      
      {/* Company Routes */}
      <Route path={"/about"} component={AboutUs} />
      <Route path={"/contact"} component={ContactUs} />
      <Route path={"/careers"} component={Careers} />
      <Route path={"/careers/apply/:position"} component={JobApplication} />
      
      {/* Loan Routes */}
      <Route path={"/rates-and-terms"} component={RatesAndTerms} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/terms-of-service"} component={TermsOfService} />
      
      {/* Legal Routes */}
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/do-not-sell"} component={DoNotSell} />
      
      {/* Resource Routes */}
      <Route path={"/guides"} component={LoanGuides} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/:slug"} component={BlogPost} />
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatSupport />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
