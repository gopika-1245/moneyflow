"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import {
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "Hello! I am your **MoneyFlow AI Financial Assistant**. I analyze your live transactions, accounts, and budgets deterministically to give you clear, instant answers about your financial health.\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | undefined>(undefined);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "How much did I spend this month?",
    "Which category consumed most of my money?",
    "Compare my spending with last month",
    "How much did I save this month?",
    "Am I exceeding my budget?",
    "What are my upcoming payments?",
    "Show my highest expenses",
    "Give me a summary of my financial activity",
  ];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (questionToSend?: string) => {
    const text = questionToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to get AI response");
      }

      if (json.data?.conversationId) {
        setConversationId(json.data.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: json.data?.answer || "No response received.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error contacting AI assistant";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an issue analyzing your financial data. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              AI Financial Assistant
            </h1>
            <Badge variant="default" className="bg-emerald-600 gap-1 text-[11px]">
              <Sparkles className="h-3 w-3" /> Live Data
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time, deterministic intelligence computed directly from your accounts & transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Zero hallucinations • 100% data isolated</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="h-[calc(100vh-250px)] min-h-[500px] flex flex-col border-border shadow-sm">
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs sm:text-sm ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 shadow-sm leading-relaxed ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-none font-medium"
                      : "bg-card border border-border text-foreground rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {m.content}
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 border border-border">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-xs sm:text-sm justify-start items-center">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl p-3 bg-card border border-border text-muted-foreground text-xs flex items-center gap-2">
                <span>Analyzing your financial accounts and ledger...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggested Queries Bar */}
        <div className="px-4 py-2 border-t border-border bg-muted/20 overflow-x-auto flex items-center gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase whitespace-nowrap flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-amber-500" /> Prompts:
          </span>
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-card border border-border hover:border-emerald-500 hover:text-emerald-600 text-muted-foreground transition-all whitespace-nowrap shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Ask anything about your money, budgets, or transactions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="h-10 text-xs sm:text-sm"
            />
            <Button type="submit" isLoading={loading} className="h-10 px-4 font-semibold">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
