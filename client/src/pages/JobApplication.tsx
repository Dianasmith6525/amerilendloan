import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";

export default function JobApplication() {
  const [, params] = useRoute("/careers/apply/:position");
  const position = params?.position?.replace(/-/g, " ") || "Position";
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    experience: "",
    education: "",
    whyJoin: "",
    resume: null as File | null,
    coverLetter: null as File | null,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement job application submission
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for applying! We've received your application and will review it shortly. 
              You should hear from us within 5-7 business days.
            </p>
            <div className="space-y-3">
              <Link href="/careers">
                <Button variant="outline" className="w-full">
                  Back to Careers
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full bg-[#0033A0] hover:bg-[#002080]">
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0033A0] text-white py-12">
        <div className="container mx-auto px-4">
          <Link href="/careers">
            <a className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Careers
            </a>
          </Link>
          <h1 className="text-4xl font-bold mb-2 capitalize">{position}</h1>
          <p className="text-xl text-blue-100">
            Join our team and help shape the future of lending
          </p>
        </div>
      </div>

      {/* Application Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Application Form</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">First Name *</label>
                        <Input
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name *</label>
                        <Input
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address *</label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <Input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">LinkedIn Profile</label>
                      <Input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Portfolio/Website</label>
                      <Input
                        type="url"
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>

                  {/* Experience & Education */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Background</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Relevant Experience *</label>
                        <Textarea
                          required
                          rows={4}
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          placeholder="Describe your relevant work experience..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Education *</label>
                        <Textarea
                          required
                          rows={3}
                          value={formData.education}
                          onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                          placeholder="List your educational background..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Why do you want to join AmeriLend? *</label>
                        <Textarea
                          required
                          rows={4}
                          value={formData.whyJoin}
                          onChange={(e) => setFormData({ ...formData, whyJoin: e.target.value })}
                          placeholder="Tell us what excites you about this opportunity..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Uploads */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Documents</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Resume/CV * (PDF, DOC, DOCX - Max 5MB)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0033A0] transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <input
                            type="file"
                            required
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                            className="hidden"
                            id="resume"
                          />
                          <label htmlFor="resume" className="cursor-pointer">
                            <span className="text-[#0033A0] hover:underline">Click to upload</span> or drag and drop
                            <p className="text-sm text-gray-500 mt-1">
                              {formData.resume ? formData.resume.name : "No file selected"}
                            </p>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Cover Letter (Optional - PDF, DOC, DOCX - Max 5MB)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0033A0] transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.files?.[0] || null })}
                            className="hidden"
                            id="coverLetter"
                          />
                          <label htmlFor="coverLetter" className="cursor-pointer">
                            <span className="text-[#0033A0] hover:underline">Click to upload</span> or drag and drop
                            <p className="text-sm text-gray-500 mt-1">
                              {formData.coverLetter ? formData.coverLetter.name : "No file selected"}
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4 pt-4">
                    <Link href="/careers">
                      <Button type="button" variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" className="flex-1 bg-[#FFA500] hover:bg-[#FF8C00] text-white">
                      Submit Application
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
