"use client";

import { useState } from "react";
import { Bot, History, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAiChat, useAiHistory } from "@/hooks/use-ai";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { AiHistoryEntry, ChatMessage } from "@/types/api";

const SUGGESTED_QUESTIONS = [
  "Quais obras devo visitar essa semana?",
  "Quais leads têm maior potencial?",
  "Monte uma estratégia para essa construtora.",
];

const AI_INTERACTION_TYPE_LABELS: Record<string, string> = {
  DEVELOPMENT_SCORE: "Análise de empreendimento",
  COMPANY_ANALYSIS: "Análise de construtora",
  LEAD_CLASSIFICATION: "Classificação de lead",
  APPROACH_WHATSAPP: "Abordagem (WhatsApp)",
  APPROACH_EMAIL: "Abordagem (e-mail)",
  APPROACH_CALL: "Abordagem (ligação)",
  CHAT: "Conversa com o assistente",
};

const HISTORY_SUMMARY_FIELD: Record<string, string> = {
  DEVELOPMENT_SCORE: "summary",
  COMPANY_ANALYSIS: "resumoComercial",
  LEAD_CLASSIFICATION: "reasoning",
  APPROACH_WHATSAPP: "content",
  APPROACH_EMAIL: "content",
  APPROACH_CALL: "content",
  CHAT: "reply",
};

function summarizeHistoryEntry(entry: AiHistoryEntry): string {
  const field = HISTORY_SUMMARY_FIELD[entry.type];
  const text = (field ? entry.response[field] : undefined) as
    | string
    | undefined;
  const fallback = text ?? entry.prompt ?? "";
  return fallback.length > 160 ? `${fallback.slice(0, 160)}…` : fallback;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const chat = useAiChat();
  const { data: history, isLoading: historyLoading } = useAiHistory({
    pageSize: 10,
  });

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

    chat.mutate(
      { message: trimmed, history: messages },
      {
        onSuccess: (result) => {
          setMessages([
            ...nextMessages,
            { role: "assistant", content: result.reply },
          ]);
        },
        onError: (error) => {
          const msg =
            error instanceof ApiError
              ? error.message
              : "Não foi possível falar com o assistente agora.";
          toast.error(msg);
          setMessages(messages);
        },
      },
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Assistente comercial"
        description="Converse com a IA sobre seus leads, obras e estratégias de abordagem."
      />

      <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row">
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pt-6">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <EmptyState
                    icon={Bot}
                    title="Pergunte algo ao assistente"
                    description="Ele conhece os leads da sua equipe e os empreendimentos com melhor nota de IA na plataforma."
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-2",
                    message.role === "user" && "flex-row-reverse",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="size-4" />
                    ) : (
                      <Bot className="size-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {chat.isPending && (
                <div className="flex items-start gap-2">
                  <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full">
                    <Bot className="size-4" />
                  </div>
                  <div className="bg-muted/50 text-muted-foreground rounded-lg border px-3 py-2 text-sm">
                    Pensando...
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-end gap-2 border-t pt-3">
              <Textarea
                placeholder="Pergunte sobre seus leads e obras..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                className="min-h-10 resize-none"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={chat.isPending || !input.trim()}
              >
                <Send />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-y-auto lg:h-full lg:w-80 lg:shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Histórico de análises
            </CardTitle>
            <CardDescription>
              Últimas análises, classificações e conversas com a IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyLoading && <LoadingState label="Carregando histórico..." />}
            {!historyLoading && (history?.data.length ?? 0) === 0 && (
              <EmptyState
                icon={Sparkles}
                title="Nenhuma análise registrada ainda"
              />
            )}
            {history?.data.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge variant="outline">
                    {AI_INTERACTION_TYPE_LABELS[entry.type] ?? entry.type}
                  </Badge>
                </div>
                {(entry.company?.name ?? entry.development?.name) && (
                  <div className="text-muted-foreground mb-1 text-xs">
                    {entry.company?.name ?? entry.development?.name}
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  {summarizeHistoryEntry(entry)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
