import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, MessageCircle, MessageSquare } from "lucide-react";
import { useState } from "react";

// Contact information
const SUPPORT_PHONE = "19452121609";
const SUPPORT_DISPLAY = "1-945-212-1609";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert("Thank you for contacting us! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0033A0] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            We're here to help! Reach out to us with any questions or concerns.
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-[#0033A0]" />
                </div>
                <h3 className="font-semibold mb-2">Phone</h3>
                <a href={`tel:${SUPPORT_DISPLAY}`} className="text-[#0033A0] hover:underline">
                  {SUPPORT_DISPLAY}
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-[#FFA500]" />
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <a href="mailto:support@amerilendloan.com" className="text-[#0033A0] hover:underline">
                  support@amerilendloan.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Address</h3>
                <p className="text-gray-600 text-sm">
                  123 Financial Blvd<br />New York, NY 10001
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Messaging Apps */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Business Hours</h3>
                <p className="text-gray-600 text-sm">
                  Mon-Fri: 8am-8pm ET<br />Sat-Sun: 9am-5pm ET
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#25D366] to-[#20BD5A] text-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3">WhatsApp</h3>
                <a
                  href={`https://wa.me/${SUPPORT_PHONE}?text=Hello, I need help with AmeriLend`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-[#25D366] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Chat Now
                </a>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#0088cc] to-[#0077b5] text-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3">Telegram</h3>
                <a
                  href={`https://t.me/${SUPPORT_PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-[#0088cc] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Chat Now
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#FFA500] hover:bg-[#FF8C00] text-white font-semibold py-6"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

