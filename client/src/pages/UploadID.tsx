import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Camera,
  FileText,
  User,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

export default function UploadID() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/upload-id/:id");
  const loanId = params?.id ? parseInt(params.id) : null;

  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string>("");
  const [idBackPreview, setIdBackPreview] = useState<string>("");
  const [selfiePreview, setSelfiePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  // Get loan details
  const { data: loans } = trpc.loans.myApplications.useQuery();
  const loan = loans?.find((l: any) => l.id === loanId);

  const uploadIDMutation = trpc.loans.uploadIDDocuments.useMutation({
    onSuccess: () => {
      toast.success("ID documents uploaded successfully!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      // Better error message translation
      let errorMessage = "Failed to upload documents. Please try again.";
      
      if (error.message.includes("File too large") || error.message.includes("size")) {
        errorMessage = "One or more files are too large. Please ensure each file is under 5MB.";
      } else if (error.message.includes("Invalid file type") || error.message.includes("format")) {
        errorMessage = "Invalid file format. Please upload only JPG, PNG, or PDF files.";
      } else if (error.message.includes("Network") || error.message.includes("connection")) {
        errorMessage = "Connection error. Please check your internet and try again.";
      } else if (error.message.includes("not found") || error.message.includes("application")) {
        errorMessage = "Loan application not found. Please go back to your dashboard.";
      } else if (error.message.includes("unauthorized") || error.message.includes("permission")) {
        errorMessage = "You don't have permission to upload documents for this application.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        description: "If the problem persists, please contact our support team at 1-945-212-1609"
      });
      setIsUploading(false);
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`File is too large (${fileSizeMB}MB)`, {
        description: "Please select a file smaller than 5MB. You can compress the image or take a new photo."
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format", {
        description: "Please upload an image file (JPG, PNG, or HEIC). PDF files are not supported for photos."
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === "front") {
        setIdFrontFile(file);
        setIdFrontPreview(result);
      } else if (type === "back") {
        setIdBackFile(file);
        setIdBackPreview(result);
      } else {
        setSelfieFile(file);
        setSelfiePreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idFrontFile || !idBackFile || !selfieFile) {
      const missing = [];
      if (!idFrontFile) missing.push("ID Front");
      if (!idBackFile) missing.push("ID Back");
      if (!selfieFile) missing.push("Selfie");
      
      toast.error("Missing required documents", {
        description: `Please upload: ${missing.join(", ")}`
      });
      return;
    }

    if (!loanId) {
      toast.error("Application Error", {
        description: "Unable to find your loan application. Please return to your dashboard and try again."
      });
      return;
    }

    setIsUploading(true);

    // Convert files to base64
    const toBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const [idFrontImage, idBackImage, selfieImage] = await Promise.all([
        toBase64(idFrontFile),
        toBase64(idBackFile),
        toBase64(selfieFile),
      ]);

      uploadIDMutation.mutate({
        loanApplicationId: loanId,
        idFrontImage,
        idBackImage,
        selfieImage,
      });
    } catch (error) {
      console.error("Image processing error:", error);
      toast.error("Failed to process images", {
        description: "There was an error preparing your documents for upload. Please try selecting different images."
      });
      setIsUploading(false);
    }
  };

  if (!loan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loan Application Not Found</h1>
          <Link href="/dashboard">
            <Button className="bg-[#0033A0] hover:bg-[#002080] text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload ID Documents</h1>
          <p className="text-gray-600 text-lg">
            Loan Application: <span className="font-semibold">{loan.referenceNumber}</span>
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Important Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please upload clear, high-quality images</li>
                  <li>• All text on your ID must be readable</li>
                  <li>• Files must be less than 5MB each</li>
                  <li>• Accepted formats: JPG, PNG, HEIC</li>
                  <li>• Your selfie should clearly show your face</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-[#0033A0]" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ID Front */}
              <div>
                <label className="block mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-[#0033A0]" />
                    <span className="font-semibold text-gray-900">ID Front (Required)</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload the front of your driver's license, passport, or government-issued ID
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "front")}
                    className="hidden"
                    id="id-front"
                  />
                  <label
                    htmlFor="id-front"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0033A0] hover:bg-gray-50 transition-all"
                  >
                    {idFrontPreview ? (
                      <div className="relative w-full h-full p-2">
                        <img
                          src={idFrontPreview}
                          alt="ID Front Preview"
                          className="w-full h-full object-contain rounded"
                        />
                        <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700">Click to upload ID front</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, HEIC (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </label>
              </div>

              {/* ID Back */}
              <div>
                <label className="block mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-[#0033A0]" />
                    <span className="font-semibold text-gray-900">ID Back (Required)</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload the back of your ID document
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "back")}
                    className="hidden"
                    id="id-back"
                  />
                  <label
                    htmlFor="id-back"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0033A0] hover:bg-gray-50 transition-all"
                  >
                    {idBackPreview ? (
                      <div className="relative w-full h-full p-2">
                        <img
                          src={idBackPreview}
                          alt="ID Back Preview"
                          className="w-full h-full object-contain rounded"
                        />
                        <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700">Click to upload ID back</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, HEIC (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </label>
              </div>

              {/* Selfie */}
              <div>
                <label className="block mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-[#0033A0]" />
                    <span className="font-semibold text-gray-900">Selfie with ID (Required)</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Take a selfie holding your ID next to your face
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "selfie")}
                    className="hidden"
                    id="selfie"
                  />
                  <label
                    htmlFor="selfie"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0033A0] hover:bg-gray-50 transition-all"
                  >
                    {selfiePreview ? (
                      <div className="relative w-full h-full p-2">
                        <img
                          src={selfiePreview}
                          alt="Selfie Preview"
                          className="w-full h-full object-contain rounded"
                        />
                        <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700">Click to upload selfie</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, HEIC (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Link href="/dashboard" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-300"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 bg-[#FFA500] hover:bg-[#FF8C00] text-white"
                  disabled={isUploading || !idFrontFile || !idBackFile || !selfieFile}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card className="mt-6 border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Your information is secure</p>
                <p>
                  All documents are encrypted and stored securely. We use bank-level security to
                  protect your personal information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
