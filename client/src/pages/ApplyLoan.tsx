import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, Phone, ArrowLeft, Upload, X, Image as ImageIcon, MapPin, Save, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

// Map of full state names to abbreviations
const STATE_NAME_TO_CODE: { [key: string]: string } = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY"
};

const STORAGE_KEY = "amerilend_loan_application_draft";

export default function ApplyLoan() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  
  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // ID Verification state
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    ssn: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    employmentStatus: "",
    employer: "",
    monthlyIncome: "",
    loanType: "",
    requestedAmount: "",
    loanPurpose: "",
    disbursementMethod: "",
    bankName: "",
    accountType: "",
    routingNumber: "",
    accountNumber: "",
  });

  // Legal acceptance tracking
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedLoanAgreement, setAcceptedLoanAgreement] = useState(false);
  const [acceptedEsign, setAcceptedEsign] = useState(false);

  // Load saved draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.idFrontPreview) setIdFrontPreview(parsed.idFrontPreview);
        if (parsed.idBackPreview) setIdBackPreview(parsed.idBackPreview);
        if (parsed.selfiePreview) setSelfiePreview(parsed.selfiePreview);
        
        toast.info("Draft Restored", {
          description: "Your previous application progress has been loaded."
        });
      } catch (error) {
        console.error("Failed to load saved draft:", error);
      }
    }
  }, []);

  // Save draft function
  const saveForLater = () => {
    const draftData = {
      formData,
      currentStep,
      idFrontPreview,
      idBackPreview,
      selfiePreview,
      savedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      toast.success("Progress Saved", {
        description: "Your application has been saved. You can continue later from where you left off."
      });
    } catch (error) {
      toast.error("Save Failed", {
        description: "Unable to save your progress. Please try again."
      });
    }
  };

  // Clear draft function
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Fetch real-time fee configuration
  const { data: feeConfig } = trpc.feeConfig.getActive.useQuery();

  // Calculate processing fee based on real configuration
  const calculateProcessingFee = (amountInDollars: number): number => {
    if (!feeConfig || amountInDollars <= 0) return 0;
    
    if (feeConfig.calculationMode === "percentage") {
      // percentageRate is in basis points (200 = 2.00%)
      return (amountInDollars * feeConfig.percentageRate) / 10000;
    } else {
      // fixedFeeAmount is in cents
      return feeConfig.fixedFeeAmount / 100;
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

  const requestCodeMutation = trpc.otp.requestCode.useMutation({
    onSuccess: () => {
      toast.success("Verification Code Sent", {
        description: "Please check your email for a 6-digit verification code."
      });
      setShowVerification(true);
    },
    onError: (error) => {
      let errorMessage = "We couldn't send the verification code. Please try again.";
      
      if (error.message.includes("rate limit") || error.message.includes("too many")) {
        errorMessage = "You've requested too many codes. Please wait a few minutes and try again.";
      } else if (error.message.includes("email")) {
        errorMessage = "There's an issue with this email address. Please check and try again.";
      }
      
      toast.error("Verification Code Failed", {
        description: errorMessage
      });
    },
  });

  const verifyCodeMutation = trpc.otp.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("Email Verified!", {
        description: "Your email has been successfully verified. You can now submit your application."
      });
      setEmailVerified(true);
      setShowVerification(false);
    },
    onError: (error) => {
      let errorMessage = "The code you entered is incorrect or has expired.";
      
      if (error.message.includes("expired")) {
        errorMessage = "This verification code has expired. Please request a new code.";
      } else if (error.message.includes("invalid") || error.message.includes("incorrect")) {
        errorMessage = "The code you entered is incorrect. Please check your email and try again.";
      }
      
      toast.error("Verification Failed", {
        description: errorMessage
      });
    },
  });

  const submitMutation = trpc.loans.submit.useMutation({
    onSuccess: (data) => {
      // Clear the saved draft on successful submission
      clearDraft();
      
      if (data.referenceNumber) {
        toast.success("Application submitted successfully!", {
          description: `Your reference number is: ${data.referenceNumber}. Save this to track your application.`,
          duration: 10000,
        });
      } else {
        toast.success("Application submitted successfully!");
      }
      setLocation("/dashboard");
    },
    onError: (error) => {
      // Show the actual error message from the server
      // This includes validation errors like "loan purpose too short"
      const errorMessage = error.message || "We couldn't submit your application at this time. Please try again.";
      
      // Provide user-friendly context for specific errors
      if (error.message.includes("email")) {
        toast.error("Email Issue", {
          description: errorMessage,
        });
      } else if (error.message.includes("database") || error.message.includes("not a function")) {
        toast.error("System Unavailable", {
          description: "Our system is temporarily unavailable. Please try again in a few moments.",
        });
      } else if (error.message.includes("duplicate") || error.message.includes("already exists")) {
        toast.error("Duplicate Application", {
          description: "An application with this information already exists. Please contact support if you need assistance.",
        });
      } else {
        // Show the actual validation error or any other error
        toast.error("Application Error", {
          description: errorMessage,
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email is verified
    if (!emailVerified) {
      toast.error("Email Verification Required", {
        description: "Please verify your email address using the code we sent you before submitting your application."
      });
      return;
    }
    
    // Validate legal acceptances
    if (!acceptedTerms || !acceptedPrivacy || !acceptedLoanAgreement || !acceptedEsign) {
      toast.error("Legal Agreements Required", {
        description: "Please review and accept all required legal agreements to continue with your application."
      });
      return;
    }

    // Validate SSN format
    if (!/^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)) {
      toast.error("Invalid Social Security Number", {
        description: "Please enter your SSN in the format XXX-XX-XXXX (numbers only, dashes will be added automatically)."
      });
      return;
    }

    // Validate date of birth format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
      toast.error("Invalid Date of Birth", {
        description: "Please enter your date of birth in the format YYYY-MM-DD (for example: 1990-05-15)."
      });
      return;
    }

    // Convert amounts to cents
    const monthlyIncome = Math.round(parseFloat(formData.monthlyIncome) * 100);
    const requestedAmount = Math.round(parseFloat(formData.requestedAmount) * 100);

    if (isNaN(monthlyIncome) || monthlyIncome <= 0) {
      toast.error("Invalid Monthly Income", {
        description: "Please enter your monthly income as a valid dollar amount (for example: 3500 or 3500.00)."
      });
      return;
    }

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      toast.error("Invalid Loan Amount", {
        description: "Please enter the loan amount you're requesting as a valid dollar amount (for example: 5000 or 5000.00)."
      });
      return;
    }

    submitMutation.mutate({
      ...formData,
      employmentStatus: formData.employmentStatus as "employed" | "self_employed" | "unemployed" | "retired",
      loanType: formData.loanType as "installment" | "short_term",
      monthlyIncome,
      requestedAmount,
      // ID verification images removed - users can upload in dashboard
      // Not sending these fields at all to avoid any issues
    });
  };

  const updateFormData = (field: string, value: string) => {
    // List of fields that should NOT be capitalized at all
    const excludeFromCapitalization = [
      'email', 
      'password', 
      'confirmPassword',
      'employmentStatus',
      'loanType',
      'disbursementMethod',
      'accountType',
      'state'
    ];
    
    // Fields that should only capitalize the first letter (not each word)
    const firstLetterOnly = ['loanPurpose'];
    
    let processedValue = value;
    
    if (firstLetterOnly.includes(field)) {
      // Only capitalize the first letter of the entire text
      if (value.length > 0) {
        processedValue = value.charAt(0).toUpperCase() + value.slice(1);
      }
    } else if (!excludeFromCapitalization.includes(field)) {
      // Capitalize first letter of each word for most fields
      processedValue = value
        .split(' ')
        .map(word => {
          if (word.length === 0) return word;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    }
    
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    
    // Reset email verification if email changes
    if (field === "email" && emailVerified) {
      setEmailVerified(false);
      setShowVerification(false);
    }
  };

  // Format SSN with dashes automatically
  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply formatting
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  const handleSSNChange = (value: string) => {
    const formatted = formatSSN(value);
    updateFormData("ssn", formatted);
  };

  // File upload handlers
  const handleFileUpload = (
    file: File | null,
    type: 'idFront' | 'idBack' | 'selfie'
  ) => {
    if (!file) return;

    // Validate file size (max 50MB - increased limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File Too Large", {
        description: "Please upload a file smaller than 50MB. Try compressing the image or taking a new photo."
      });
      return;
    }

    // Validate file type - allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid File Type", {
        description: "Please upload a photo in JPG, PNG, or GIF format, or a PDF document."
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      
      if (type === 'idFront') {
        setIdFrontFile(file);
        setIdFrontPreview(preview);
      } else if (type === 'idBack') {
        setIdBackFile(file);
        setIdBackPreview(preview);
      } else if (type === 'selfie') {
        setSelfieFile(file);
        setSelfiePreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'idFront' | 'idBack' | 'selfie') => {
    if (type === 'idFront') {
      setIdFrontFile(null);
      setIdFrontPreview(null);
    } else if (type === 'idBack') {
      setIdBackFile(null);
      setIdBackPreview(null);
    } else if (type === 'selfie') {
      setSelfieFile(null);
      setSelfiePreview(null);
    }
  };

  // Function to mask email address
  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    // Show first 3 characters of local part, mask the rest
    const visibleLocal = localPart.substring(0, Math.min(3, localPart.length));
    const maskedLocal = '*'.repeat(Math.max(5, localPart.length - 3));
    
    // Show first character of domain, mask the rest
    const [domainName, extension] = domain.split('.');
    const visibleDomain = domainName.charAt(0);
    const maskedDomain = '*'.repeat(Math.max(3, domainName.length - 1));
    
    return `${visibleLocal}${maskedLocal}@${visibleDomain}${maskedDomain}.${extension}`;
  };

  // Function to search for addresses using Nominatim (OpenStreetMap) - FREE!
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setLoadingAddresses(true);
    try {
      // Using Nominatim API (OpenStreetMap) - completely free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=us&` +
        `addressdetails=1&` +
        `limit=5`,
        {
          headers: {
            'User-Agent': 'LoanApplication/1.0' // Required by Nominatim
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAddressSuggestions(data);
        setShowAddressSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Debounced address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.street && formData.street.length >= 3) {
        searchAddresses(formData.street);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.street]);

  // Function to select an address from suggestions
  const selectAddress = (place: any) => {
    const address = place.address || {};
    
    // Extract address components
    const street = [
      address.house_number,
      address.road || address.street
    ].filter(Boolean).join(' ');
    
    const city = address.city || address.town || address.village || '';
    const stateFromAPI = address.state || '';
    const zipCode = address.postcode || '';

    // Convert full state name to abbreviation
    const stateCode = STATE_NAME_TO_CODE[stateFromAPI] || stateFromAPI;

    // Update form data
    setFormData(prev => ({
      ...prev,
      street: street || formData.street,
      city: city,
      state: stateCode,
      zipCode: zipCode
    }));

    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    
    toast.success("Address Selected", {
      description: "Your address has been filled automatically."
    });
  };

  const handleSendVerification = () => {
    if (!formData.email) {
      toast.error("Email Required", {
        description: "Please enter your email address to receive a verification code."
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid Email Address", {
        description: "Please enter a valid email address (for example: yourname@example.com)."
      });
      return;
    }

    requestCodeMutation.mutate({
      email: formData.email,
      purpose: "loan_application",
    });
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      toast.error("Verification Code Required", {
        description: "Please enter the complete 6-digit code we sent to your email."
      });
      return;
    }

    verifyCodeMutation.mutate({
      email: formData.email,
      code: verificationCode,
      purpose: "loan_application",
    });
  };

  // Mutation to check for existing application
  const checkExistingMutation = trpc.loans.checkExisting.useMutation({
    onSuccess: (data) => {
      if (data.exists && data.application) {
        setExistingApplication(data.application);
        
        // Also set the masked email if returned
        if (data.application?.email) {
          setExistingEmail(maskEmail(data.application.email));
        }
        
        toast.warning("Existing Application Found", {
          description: `You already have a ${data.application?.status || 'pending'} application (Ref: ${data.application?.referenceNumber || 'N/A'}). Please check your dashboard or track your application.`,
          duration: 10000,
        });
      } else {
        setExistingApplication(null);
        setExistingEmail(null);
      }
    },
    onError: (error) => {
      console.error("Error checking existing application:", error);
    },
  });

  // Check for existing application based on DOB and SSN
  const checkExistingApplication = () => {
    // Only check if both DOB and SSN are filled
    if (!formData.dateOfBirth || !formData.ssn || formData.ssn.length < 11) {
      setExistingApplication(null);
      return;
    }

    setCheckingExisting(true);
    checkExistingMutation.mutate({
      dateOfBirth: formData.dateOfBirth,
      ssn: formData.ssn,
    });
  };

  // Check for existing application when DOB or SSN changes
  useEffect(() => {
    const timer = setTimeout(() => {
      checkExistingApplication();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [formData.dateOfBirth, formData.ssn]);

  // Update checkingExisting state when mutation completes
  useEffect(() => {
    if (!checkExistingMutation.isPending) {
      setCheckingExisting(false);
    }
  }, [checkExistingMutation.isPending]);

  const nextStep = () => {
    // Validate Step 1 (Personal Information)
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.ssn) {
        toast.error("Missing Required Fields", {
          description: "Please fill in all required fields before continuing."
        });
        return;
      }
      
      if (!emailVerified) {
        toast.error("Email Not Verified", {
          description: "Please verify your email address before continuing."
        });
        return;
      }
      
      if (!formData.password || formData.password.length < 8) {
        toast.error("Invalid Password", {
          description: "Password must be at least 8 characters long."
        });
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords Don't Match", {
          description: "Please make sure both passwords are the same."
        });
        return;
      }
    }
    
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0033A0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between h-28">
            <Link href="/">
              <a className="flex items-center">
                <img src="/new-logo-final.png" alt="AmeriLend Logo" className="h-24 w-auto" />
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
              <Link href="/dashboard">
                <Button variant="outline" className="border-[#0033A0] text-[#0033A0]">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentStep >= step
                        ? "bg-[#0033A0] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      step
                    )}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 hidden sm:block">
                    {step === 1 && "Personal"}
                    {step === 2 && "Address"}
                    {step === 3 && "Employment"}
                    {step === 4 && "Loan Details"}
                    {step === 5 && "Review & Submit"}
                  </span>
                </div>
                {step < 5 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step ? "bg-[#0033A0]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0033A0] mb-2">
                        Personal Information
                      </h2>
                      <p className="text-gray-600">
                        Let's start with some basic information about you.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => updateFormData("fullName", e.target.value)}
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateFormData("email", e.target.value)}
                            placeholder="john@example.com"
                            required
                            disabled={emailVerified}
                            className={emailVerified ? "bg-green-50" : ""}
                          />
                          {!emailVerified && (
                            <Button
                              type="button"
                              onClick={handleSendVerification}
                              disabled={requestCodeMutation.isPending || !formData.email}
                              className="whitespace-nowrap"
                            >
                              {requestCodeMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                "Verify Email"
                              )}
                            </Button>
                          )}
                          {emailVerified && (
                            <div className="flex items-center gap-2 text-green-600 font-medium px-3">
                              <CheckCircle2 className="w-5 h-5" />
                              Verified
                            </div>
                          )}
                        </div>
                        {emailVerified && (
                          <p className="text-sm text-green-600">✓ Email verified successfully</p>
                        )}
                      </div>

                      {/* Email Verification Modal */}
                      {showVerification && (
                        <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Label htmlFor="verificationCode">Enter 6-Digit Verification Code</Label>
                          <p className="text-sm text-gray-600">
                            We sent a code to {formData.email}. Check your inbox and spam folder.
                          </p>
                          <div className="flex gap-2">
                            <Input
                              id="verificationCode"
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="000000"
                              maxLength={6}
                              className="text-center text-xl tracking-widest font-mono"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyCode}
                              disabled={verifyCodeMutation.isPending || verificationCode.length !== 6}
                            >
                              {verifyCodeMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleSendVerification}
                              disabled={requestCodeMutation.isPending}
                            >
                              Resend Code
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowVerification(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="password">Create Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => updateFormData("password", e.target.value)}
                            placeholder="Enter a secure password"
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Must be at least 8 characters long
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                            placeholder="Re-enter your password"
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <p className="text-xs text-red-600">Passwords do not match</p>
                        )}
                        {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                          <p className="text-xs text-green-600">✓ Passwords match</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData("phone", e.target.value)}
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                          required
                        />
                        <p className="text-xs text-gray-500">Format: YYYY-MM-DD</p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="ssn">Social Security Number *</Label>
                        <div className="relative">
                          <Input
                            id="ssn"
                            value={formData.ssn}
                            onChange={(e) => handleSSNChange(e.target.value)}
                            placeholder="XXX-XX-XXXX"
                            maxLength={11}
                            required
                            className={existingApplication ? "border-yellow-500 bg-yellow-50" : ""}
                          />
                          {checkingExisting && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Your SSN is encrypted and secure. Format: XXX-XX-XXXX
                        </p>
                        {checkingExisting && (
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Checking for existing applications...
                          </p>
                        )}
                      </div>

                      {/* Existing Application Alert */}
                      {existingApplication && (
                        <div className="md:col-span-2 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-yellow-900 font-bold text-lg">!</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-yellow-900 mb-1">
                                Existing Application Found
                              </h4>
                              <p className="text-sm text-yellow-800 mb-2">
                                You already have a <strong>{existingApplication.status}</strong> loan application on file.
                              </p>
                              <div className="text-xs text-yellow-700 space-y-1">
                                <p><strong>Reference Number:</strong> {existingApplication.referenceNumber}</p>
                                {existingEmail && (
                                  <p><strong>Account Email:</strong> {existingEmail}</p>
                                )}
                                <p><strong>Amount:</strong> ${(existingApplication.loanAmount / 100).toLocaleString()}</p>
                                <p><strong>Submitted:</strong> {new Date(existingApplication.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setLocation('/dashboard')}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                  View Dashboard
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setLocation(`/track?ref=${existingApplication.referenceNumber}`)}
                                  className="border-yellow-600 text-yellow-700"
                                >
                                  Track Application
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <Button
                        type="button"
                        onClick={saveForLater}
                        variant="outline"
                        className="border-gray-300 text-gray-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save for Later
                      </Button>
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-8"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Address Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0033A0] mb-2">
                        Address Information
                      </h2>
                      <p className="text-gray-600">
                        Where do you currently reside? Start typing your address for suggestions.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2 relative">
                        <Label htmlFor="street">
                          <MapPin className="inline w-4 h-4 mr-1" />
                          Street Address *
                        </Label>
                        <div className="relative">
                          <Input
                            id="street"
                            value={formData.street}
                            onChange={(e) => updateFormData("street", e.target.value)}
                            onFocus={() => {
                              if (addressSuggestions.length > 0) {
                                setShowAddressSuggestions(true);
                              }
                            }}
                            placeholder="Start typing your address..."
                            required
                            className="pr-10"
                          />
                          {loadingAddresses && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </div>
                        
                        {/* Address Suggestions Dropdown */}
                        {showAddressSuggestions && addressSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                            {addressSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectAddress(suggestion)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-1 text-[#FFA500] flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {suggestion.display_name}
                                    </p>
                                    {suggestion.address && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {[
                                          suggestion.address.house_number,
                                          suggestion.address.road,
                                          suggestion.address.city || suggestion.address.town,
                                          suggestion.address.state,
                                          suggestion.address.postcode
                                        ].filter(Boolean).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Type your address and select from suggestions, or enter manually
                        </p>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => updateFormData("city", e.target.value)}
                            placeholder="New York"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Select
                            value={formData.state}
                            onValueChange={(value) => updateFormData("state", value)}
                            required
                          >
                            <SelectTrigger id="state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            value={formData.zipCode}
                            onChange={(e) => updateFormData("zipCode", e.target.value)}
                            placeholder="10001"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="border-[#0033A0] text-[#0033A0]"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={saveForLater}
                          variant="outline"
                          className="border-gray-300 text-gray-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-8"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Employment Information */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0033A0] mb-2">
                        Employment Information
                      </h2>
                      <p className="text-gray-600">
                        Tell us about your employment and income.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="employmentStatus">Employment Status *</Label>
                        <Select
                          value={formData.employmentStatus}
                          onValueChange={(value) => updateFormData("employmentStatus", value)}
                          required
                        >
                          <SelectTrigger id="employmentStatus">
                            <SelectValue placeholder="Select employment status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self_employed">Self-Employed</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(formData.employmentStatus === "employed" ||
                        formData.employmentStatus === "self_employed") && (
                        <div className="space-y-2">
                          <Label htmlFor="employer">Employer Name *</Label>
                          <Input
                            id="employer"
                            value={formData.employer}
                            onChange={(e) => updateFormData("employer", e.target.value)}
                            placeholder="Company Name"
                            required
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="monthlyIncome">Monthly Income *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            id="monthlyIncome"
                            type="number"
                            step="0.01"
                            value={formData.monthlyIncome}
                            onChange={(e) => updateFormData("monthlyIncome", e.target.value)}
                            placeholder="3000.00"
                            className="pl-7"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Enter your gross monthly income before taxes
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="border-[#0033A0] text-[#0033A0]"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={saveForLater}
                          variant="outline"
                          className="border-gray-300 text-gray-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-8"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Loan Details */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0033A0] mb-2">
                        Loan Details
                      </h2>
                      <p className="text-gray-600">
                        Finally, tell us about the loan you're requesting.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="loanType">Loan Type *</Label>
                        <Select
                          value={formData.loanType}
                          onValueChange={(value) => updateFormData("loanType", value)}
                          required
                        >
                          <SelectTrigger id="loanType">
                            <SelectValue placeholder="Select loan type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="installment">Installment Loan</SelectItem>
                            <SelectItem value="short_term">Short-Term Loan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="requestedAmount">Requested Amount *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            id="requestedAmount"
                            type="number"
                            step="0.01"
                            value={formData.requestedAmount}
                            onChange={(e) => updateFormData("requestedAmount", e.target.value)}
                            placeholder="5000.00"
                            className="pl-7"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Typical range: $500 - $10,000
                        </p>
                        
                        {/* Processing Fee Breakdown */}
                        {formData.requestedAmount && parseFloat(formData.requestedAmount) > 0 && feeConfig && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Loan Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Loan Amount:</span>
                                <span className="font-semibold">${parseFloat(formData.requestedAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Processing Fee ({getFeePercentageDisplay()}):</span>
                                <span className="font-semibold text-orange-600">
                                  ${calculateProcessingFee(parseFloat(formData.requestedAmount)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-blue-300">
                                <span className="font-bold text-gray-900">Total Amount to Repay:</span>
                                <span className="font-bold text-[#0033A0]">
                                  ${(parseFloat(formData.requestedAmount) + calculateProcessingFee(parseFloat(formData.requestedAmount))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-3">
                              * Processing fee will be collected before loan disbursement
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="loanPurpose">Loan Purpose *</Label>
                        <Textarea
                          id="loanPurpose"
                          value={formData.loanPurpose}
                          onChange={(e) => updateFormData("loanPurpose", e.target.value)}
                          placeholder="Describe how you plan to use the loan funds..."
                          rows={4}
                          required
                        />
                      </div>

                      {/* Disbursement Method Section */}
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Loan Disbursement Method
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="disbursementMethod">How would you like to receive your funds? *</Label>
                            <Select
                              value={formData.disbursementMethod}
                              onValueChange={(value) => updateFormData("disbursementMethod", value)}
                              required
                            >
                              <SelectTrigger id="disbursementMethod">
                                <SelectValue placeholder="Select disbursement method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="direct_deposit">Direct Deposit (ACH)</SelectItem>
                                <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                                <SelectItem value="check">Paper Check</SelectItem>
                                <SelectItem value="prepaid_card">Prepaid Debit Card</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                              Direct deposit is the fastest option - funds available same day if approved before 12 PM CT
                            </p>
                          </div>

                          {/* Show bank details fields for direct deposit and wire transfer */}
                          {(formData.disbursementMethod === "direct_deposit" || formData.disbursementMethod === "wire_transfer") && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name *</Label>
                                <Input
                                  id="bankName"
                                  value={formData.bankName}
                                  onChange={(e) => updateFormData("bankName", e.target.value)}
                                  placeholder="e.g., Chase Bank"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="accountType">Account Type *</Label>
                                <Select
                                  value={formData.accountType}
                                  onValueChange={(value) => updateFormData("accountType", value)}
                                  required
                                >
                                  <SelectTrigger id="accountType">
                                    <SelectValue placeholder="Select account type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="checking">Checking Account</SelectItem>
                                    <SelectItem value="savings">Savings Account</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="routingNumber">Routing Number *</Label>
                                <Input
                                  id="routingNumber"
                                  value={formData.routingNumber}
                                  onChange={(e) => updateFormData("routingNumber", e.target.value)}
                                  placeholder="9 digits"
                                  maxLength={9}
                                  pattern="[0-9]{9}"
                                  required
                                />
                                <p className="text-xs text-gray-500">
                                  Found on the bottom left of your check
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number *</Label>
                                <Input
                                  id="accountNumber"
                                  value={formData.accountNumber}
                                  onChange={(e) => updateFormData("accountNumber", e.target.value)}
                                  placeholder="Account number"
                                  required
                                />
                                <p className="text-xs text-gray-500">
                                  Found on the bottom of your check, to the right of routing number
                                </p>
                              </div>
                            </>
                          )}

                          {formData.disbursementMethod === "check" && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700">
                                <strong>Note:</strong> Paper checks are mailed to your address on file and typically arrive within 5-7 business days. This is the slowest disbursement method.
                              </p>
                            </div>
                          )}

                          {formData.disbursementMethod === "prepaid_card" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Prepaid Debit Card:</strong> Your funds will be loaded onto a reloadable AmeriLend prepaid card.
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                                <li>Card shipped within 1-2 business days</li>
                                <li>Use anywhere Visa/Mastercard is accepted</li>
                                <li>ATM withdrawals available</li>
                                <li>No credit check required</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-[#0033A0] mb-2">Before You Submit</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Review all information for accuracy</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>You'll receive a decision within 24 hours</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Processing fee applies upon approval ({feeConfig ? getFeePercentageDisplay() : 'typically 2%'})</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-between pt-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="border-[#0033A0] text-[#0033A0]"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={saveForLater}
                          variant="outline"
                          className="border-gray-300 text-gray-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-8"
                      >
                        Continue to Review
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5: ID Verification */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0033A0] mb-2">
                        Review & Submit
                      </h2>
                      <p className="text-gray-600">
                        Please review your information and accept the legal agreements to complete your application.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-[#0033A0] mb-2">ID Verification</h4>
                      <p className="text-sm text-gray-700">
                        After submitting your application, you'll be able to upload your ID verification documents from your dashboard. 
                        Your application will be marked as "Pending ID Verification" until you complete this step.
                      </p>
                    </div>



                    {/* Legal Acceptance Checkboxes */}
                    <div className="mt-6 space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Legal Agreements</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        By submitting this application, you acknowledge that you have read and agree to the following:
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="terms"
                            checked={acceptedTerms}
                            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                            required
                            className="mt-1"
                          />
                          <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                            I have read and agree to the{" "}
                            <Link href="/terms-of-service">
                              <a className="text-[#0033A0] hover:underline font-semibold" target="_blank">
                                Terms of Service
                              </a>
                            </Link>
                            {" "}*
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="privacy"
                            checked={acceptedPrivacy}
                            onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                            required
                            className="mt-1"
                          />
                          <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                            I have read and agree to the{" "}
                            <Link href="/privacy-policy">
                              <a className="text-[#0033A0] hover:underline font-semibold" target="_blank">
                                Privacy Policy
                              </a>
                            </Link>
                            {" "}*
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="loanAgreement"
                            checked={acceptedLoanAgreement}
                            onCheckedChange={(checked) => setAcceptedLoanAgreement(checked as boolean)}
                            required
                            className="mt-1"
                          />
                          <label htmlFor="loanAgreement" className="text-sm leading-relaxed cursor-pointer">
                            I have read and agree to the{" "}
                            <a href="/legal/loan-agreement.md" className="text-[#0033A0] hover:underline font-semibold" target="_blank">
                              Loan Agreement
                            </a>
                            {" "}*
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="esign"
                            checked={acceptedEsign}
                            onCheckedChange={(checked) => setAcceptedEsign(checked as boolean)}
                            required
                            className="mt-1"
                          />
                          <label htmlFor="esign" className="text-sm leading-relaxed cursor-pointer">
                            I consent to receive and sign documents electronically as described in the{" "}
                            <a href="/legal/esign-consent.md" className="text-[#0033A0] hover:underline font-semibold" target="_blank">
                              E-Sign Consent
                            </a>
                            {" "}*
                          </label>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-3">
                        * Required to submit application. Your acceptance will be recorded with a timestamp and IP address for legal compliance.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="border-[#0033A0] text-[#0033A0]"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={saveForLater}
                          variant="outline"
                          className="border-gray-300 text-gray-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>

                      {/* Validation errors display */}
                      {(!acceptedTerms || !acceptedPrivacy || !acceptedLoanAgreement || !acceptedEsign) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-red-800 mb-2">Please complete the following:</h4>
                          <ul className="space-y-1">
                            {!acceptedTerms && (
                              <li className="text-sm text-red-700 flex items-center">
                                <span className="mr-2">⚠️</span>
                                Accept Terms of Service
                              </li>
                            )}
                            {!acceptedPrivacy && (
                              <li className="text-sm text-red-700 flex items-center">
                                <span className="mr-2">⚠️</span>
                                Accept Privacy Policy
                              </li>
                            )}
                            {!acceptedLoanAgreement && (
                              <li className="text-sm text-red-700 flex items-center">
                                <span className="mr-2">⚠️</span>
                                Accept Loan Agreement
                              </li>
                            )}
                            {!acceptedEsign && (
                              <li className="text-sm text-red-700 flex items-center">
                                <span className="mr-2">⚠️</span>
                                Accept E-Sign Consent
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={
                          submitMutation.isPending || 
                          !acceptedTerms ||
                          !acceptedPrivacy ||
                          !acceptedLoanAgreement ||
                          !acceptedEsign
                        }
                        className="bg-[#FFA500] hover:bg-[#FF8C00] text-white px-8"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">Need help with your application?</p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="tel:1-945-212-1609"
                className="flex items-center gap-2 text-[#0033A0] hover:underline"
              >
                <Phone className="w-4 h-4" />
                1-945-212-1609
              </a>
              <span className="text-gray-400">|</span>
              <a href="#faq" className="text-[#0033A0] hover:underline">
                View FAQs
              </a>
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
          <p className="text-xs text-gray-500 mt-2">
            Loans subject to approval. Processing fees apply.
          </p>
        </div>
      </footer>
    </div>
  );
}
