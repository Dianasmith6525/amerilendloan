import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, UserCircle, Phone, Bot, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// WhatsApp and Telegram Support Numbers
const SUPPORT_PHONE = "18005550100"; // Format: country code + number (no spaces, dashes, or +)
const SUPPORT_DISPLAY = "1-800-555-0100";

interface Message {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  timestamp: Date;
  senderName?: string;
}

type ChatMode = "ai" | "live" | "selection";

export default function LiveChatSupport() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("selection");
  const [liveChatId, setLiveChatId] = useState<number | null>(null);
  const [liveChatSessionId, setLiveChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { mutate: sendMessage } = trpc.chat.sendMessage.useMutation();
  const { mutate: startLiveChat } = trpc.liveChat.startConversation.useMutation();
  const { mutate: sendLiveChatMessage } = trpc.liveChat.sendMessage.useMutation();
  const { data: liveChatMessages, refetch: refetchMessages } = trpc.liveChat.getMessages.useQuery(
    { conversationId: liveChatId! },
    { enabled: !!liveChatId && chatMode === "live", refetchInterval: 3000 }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update messages when live chat messages arrive
  useEffect(() => {
    if (chatMode === "live" && liveChatMessages) {
      const formattedMessages: Message[] = liveChatMessages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.senderType === "agent" ? "agent" : msg.senderType === "system" ? "system" : "user",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        senderName: msg.senderName,
      }));
      setMessages(formattedMessages);
    }
  }, [liveChatMessages, chatMode]);

  const handleSelectAIChat = () => {
    setChatMode("ai");
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: isAuthenticated
          ? `Hello ${user?.name || "there"}! 👋 I'm your AmeriLend AI Assistant. I have access to your account information and can help you with your loans, applications, payments, and more. How can I assist you today?`
          : "Hello! 👋 I'm AmeriLend's AI Assistant. I can help you learn about our loan products, fees, application process, and answer any questions you have. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleSelectLiveAgent = () => {
    if (!isAuthenticated) {
      setShowGuestForm(true);
      return;
    }
    startLiveChatWithAgent();
  };

  const startLiveChatWithAgent = () => {
    setIsLoading(true);
    startLiveChat(
      {
        category: "general",
        guestName: guestName || undefined,
        guestEmail: guestEmail || undefined,
      },
      {
        onSuccess: (response) => {
          setChatMode("live");
          setLiveChatId(response.conversationId);
          setLiveChatSessionId(response.sessionId);
          setMessages([
            {
              id: "system-1",
              role: "system",
              content: "🔴 Live chat initiated. An agent will be with you shortly. Please wait...",
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          setShowGuestForm(false);
          setTimeout(() => refetchMessages(), 1000);
        },
        onError: () => {
          setIsLoading(false);
          alert("Sorry, we couldn't connect you to a live agent. Please try again or call 1-800-555-0100.");
        },
      }
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    if (chatMode === "live" && liveChatId) {
      // Send live chat message
      sendLiveChatMessage(
        {
          conversationId: liveChatId,
          content: currentInput,
        },
        {
          onSuccess: () => {
            setIsLoading(false);
            setTimeout(() => refetchMessages(), 500);
          },
          onError: () => {
            setIsLoading(false);
            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                role: "system",
                content: "Failed to send message. Please try again.",
                timestamp: new Date(),
              },
            ]);
          },
        }
      );
    } else {
      // Send AI message
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "agent" ? "assistant" : msg.role === "system" ? "assistant" : msg.role,
        content: msg.content,
      }));

      sendMessage(
        {
          message: currentInput,
          conversationHistory: conversationHistory,
          includeUserContext: isAuthenticated,
        },
        {
          onSuccess: (response: { reply: string }) => {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: response.reply,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
          },
          onError: () => {
            const errorMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "Sorry, I encountered an error. Please try again or contact our support team at 1-800-555-0100.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setIsLoading(false);
          },
        }
      );
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0033A0] hover:bg-[#0025A0] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Open chat support"
          aria-label="Open chat support"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] shadow-2xl border-2 border-[#0033A0]">
          <CardHeader className="bg-[#0033A0] text-white rounded-t-lg p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <CardTitle className="text-lg">
                {chatMode === "ai" && "AI Assistant"}
                {chatMode === "live" && "Live Agent Support"}
                {chatMode === "selection" && "AmeriLend Support"}
              </CardTitle>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setChatMode("selection");
                setMessages([]);
              }}
              className="hover:bg-white/20 p-1 rounded transition-colors"
              title="Close chat"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[500px]">
            {/* Selection Screen */}
            {chatMode === "selection" && !showGuestForm && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 text-center">
                  How would you like to get help?
                </h3>
                
                <Button
                  onClick={handleSelectAIChat}
                  className="w-full bg-[#0033A0] hover:bg-[#0025A0] text-white flex items-center gap-3 py-6"
                >
                  <Bot className="w-6 h-6" />
                  <div className="text-left flex-1">
                    <div className="font-semibold">AI Assistant</div>
                    <div className="text-xs opacity-90">Instant answers 24/7</div>
                  </div>
                </Button>

                <Button
                  onClick={handleSelectLiveAgent}
                  disabled={isLoading}
                  className="w-full bg-[#FFA500] hover:bg-[#FF8C00] text-white flex items-center gap-3 py-6"
                >
                  <UserCircle className="w-6 h-6" />
                  <div className="text-left flex-1">
                    <div className="font-semibold">Talk to Human Agent</div>
                    <div className="text-xs opacity-90">Connect with a live person</div>
                  </div>
                </Button>

                <div className="w-full space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-50 px-2 text-gray-500">Or contact us via</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/${SUPPORT_PHONE}?text=Hello, I need help with AmeriLend`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </a>

                    {/* Telegram Button */}
                    <a
                      href={`https://t.me/${SUPPORT_PHONE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Telegram
                    </a>
                  </div>
                </div>

                <div className="pt-2 w-full text-center">
                  <p className="text-sm text-gray-600 mb-2">Or call us directly:</p>
                  <a
                    href={`tel:${SUPPORT_DISPLAY}`}
                    className="flex items-center justify-center gap-2 text-[#0033A0] hover:underline font-semibold"
                  >
                    <Phone className="w-4 h-4" />
                    {SUPPORT_DISPLAY}
                  </a>
                </div>
              </div>
            )}

            {/* Guest Form */}
            {showGuestForm && (
              <div className="flex-1 flex flex-col p-6 space-y-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">
                  Please provide your information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowGuestForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={startLiveChatWithAgent}
                    disabled={!guestName.trim() || !guestEmail.trim() || isLoading}
                    className="flex-1 bg-[#FFA500] hover:bg-[#FF8C00] text-white"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Chat"}
                  </Button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {(chatMode === "ai" || chatMode === "live") && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-lg ${
                          msg.role === "user"
                            ? "bg-[#0033A0] text-white rounded-br-none"
                            : msg.role === "agent"
                            ? "bg-[#FFA500] text-white rounded-bl-none"
                            : msg.role === "system"
                            ? "bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-bl-none text-center w-full max-w-full"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {msg.senderName && msg.role === "agent" && (
                          <p className="text-xs font-semibold mb-1 opacity-90">{msg.senderName}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0033A0]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-3 bg-white">
                  {chatMode === "live" && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Connected to live agent
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !input.trim()}
                      size="sm"
                      className={`${
                        chatMode === "live"
                          ? "bg-[#FFA500] hover:bg-[#FF8C00]"
                          : "bg-[#0033A0] hover:bg-[#0025A0]"
                      } text-white`}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
