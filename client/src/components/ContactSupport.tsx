import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Loader2, CheckCircle2, HelpCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export function ContactSupportDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    subject: "",
    message: "",
    category: "general" as "general" | "loan_inquiry" | "payment_issue" | "technical_support" | "complaint" | "other",
  });

  const { user, isAuthenticated } = useAuth();

  // Pre-fill with user data if authenticated
  const initializeForm = () => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        senderName: user.name || "",
        senderEmail: user.email || "",
        senderPhone: user.phoneNumber || "",
      }));
    }
  };

  const sendMessageMutation = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully!", {
        description: "We'll get back to you as soon as possible.",
      });
      setOpen(false);
      // Reset form
      setFormData({
        senderName: "",
        senderEmail: "",
        senderPhone: "",
        subject: "",
        message: "",
        category: "general",
      });
    },
    onError: (error) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.senderName || !formData.senderEmail || !formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    sendMessageMutation.mutate(formData);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      initializeForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Contact Support
          </DialogTitle>
          <DialogDescription>
            Need help? Send us a message and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.senderEmail}
                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.senderPhone}
              onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="loan_inquiry">Loan Question</SelectItem>
                <SelectItem value="payment_issue">Payment Issue</SelectItem>
                <SelectItem value="technical_support">Technical Support</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your inquiry"
              maxLength={500}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please provide details about your inquiry..."
              rows={6}
              maxLength={5000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length} / 5000 characters
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">We're here to help!</p>
                <p>Our support team typically responds within 24 hours. You'll receive a confirmation email once your message is sent.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Standalone Contact Support Card (can be used on a page)
export function ContactSupportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Need Help?
        </CardTitle>
        <CardDescription>
          Our support team is here to assist you with any questions or concerns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Quick Response</p>
              <p className="text-muted-foreground">We typically respond within 24 hours</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Expert Support</p>
              <p className="text-muted-foreground">Get help from our experienced team</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Secure & Confidential</p>
              <p className="text-muted-foreground">Your information is always protected</p>
            </div>
          </div>
          <div className="pt-4">
            <ContactSupportDialog />
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              You can also reach us by phone at{" "}
              <a href="tel:1-945-212-1609" className="text-primary hover:underline font-semibold">
                1-945-212-1609
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
