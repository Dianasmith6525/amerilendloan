import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, UserCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  timestamp: Date;
  senderName?: string;
}

type ChatMode = "ai" | "live";

export default function ChatSupport() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("ai");
  const [liveChatId, setLiveChatId] = useState<number | null>(null);
  const [liveChatSessionId, setLiveChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: isAuthenticated 
        ? `Hello ${user?.name || 'there'}! 👋 I'm your AmeriLend AI Assistant. I have access to your account information and can help you with your loans, applications, payments, and more. How can I assist you today?`
        : "Hello! 👋 I'm AmeriLend's AI Assistant. I can help you learn about our loan products, fees, application process, and answer any questions you have. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
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
    { enabled: !!liveChatId && chatMode === "live", refetchInterval: 3000 } // Poll every 3 seconds
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update greeting when auth status changes
  useEffect(() => {
    setMessages([{
      id: "1",
      role: "assistant",
      content: isAuthenticated 
        ? `Hello ${user?.name || 'there'}! 👋 I'm your AmeriLend AI Assistant. I have access to your account information and can help you with your loans, applications, payments, and more. How can I assist you today?`
        : "Hello! 👋 I'm AmeriLend's AI Assistant. I can help you learn about our loan products, fees, application process, and answer any questions you have. How can I help you today?",
      timestamp: new Date(),
    }]);
  }, [isAuthenticated, user?.name]);

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

    // Build conversation history for context (filter to only user/assistant roles)
    const conversationHistory = messages
      .filter(msg => msg.role === "user" || msg.role === "assistant")
      .map(msg => ({
        role: msg.role as "user" | "assistant",
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
            content: "Sorry, I encountered an error. Please try again or contact our support team at 1-945-212-1609.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0033A0] hover:bg-[#0025A0] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Open chat support"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 max-h-96 shadow-2xl border-2 border-[#0033A0]">
          <CardHeader className="bg-[#0033A0] text-white rounded-t-lg p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <CardTitle className="text-lg">AmeriLend Support</CardTitle>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-[#0033A0] text-white rounded-br-none"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
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
            <div className="border-t p-3 bg-white flex gap-2">
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
                className="bg-[#FFA500] hover:bg-[#FF8C00] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
