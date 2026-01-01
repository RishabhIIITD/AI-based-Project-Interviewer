import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Star, AlertCircle, CheckCircle2, LogOut, Loader2, Info, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Interview() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [answer, setAnswer] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: interview } = useQuery({
    queryKey: [api.interviews.get.path, { id }],
    queryFn: async () => {
      const res = await apiRequest("GET", buildUrl(api.interviews.get.path, { id: Number(id) }));
      return res.json();
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: [api.interviews.getMessages.path, { id }],
    queryFn: async () => {
      const res = await apiRequest("GET", buildUrl(api.interviews.getMessages.path, { id: Number(id) }));
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", buildUrl(api.interviews.processMessage.path, { id: Number(id) }), { content });
      return res.json();
    },
    onSuccess: () => {
      setAnswer("");
      queryClient.invalidateQueries({ queryKey: [api.interviews.getMessages.path, { id }] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", buildUrl(api.interviews.complete.path, { id: Number(id) }));
      return res.json();
    },
    onSuccess: () => {
      // Use window.location.href for a hard navigation to ensure fresh data
      window.location.href = `/summary/${id}`;
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mutation.isPending]);

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">{interview?.title}</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-online animate-pulse" />
              <span className="text-xs text-muted-foreground">Live Interview Session</span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={completeMutation.isPending}
          onClick={() => completeMutation.mutate()} 
          className="text-destructive hover:bg-destructive/10"
        >
          {completeMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          {completeMutation.isPending ? "Generating Report..." : "End Interview"}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea ref={scrollRef} className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-8">
              <AnimatePresence initial={false}>
                {messages.map((msg: any) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === "candidate" ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className={`h-10 w-10 border-2 ${msg.role === "candidate" ? "border-primary/20" : "border-muted"}`}>
                      <AvatarFallback className={msg.role === "candidate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                        {msg.role === "candidate" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "candidate" ? "items-end" : "items-start"}`}>
                      <div className={`rounded-2xl p-4 shadow-sm ${
                        msg.role === "candidate" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-card border border-primary/10 text-card-foreground"
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      
                      {msg.role === "candidate" && msg.feedback && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full mt-2"
                        >
                          <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                            <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-primary">Interviewer Feedback</span>
                              <div className="flex items-center gap-1">
                                {[...Array(10)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1.5 h-3 rounded-full ${i < msg.feedback.rating ? "bg-primary" : "bg-primary/20"}`} 
                                  />
                                ))}
                                <span className="ml-2 font-bold text-primary">{msg.feedback.rating}/10</span>
                              </div>
                            </div>
                            <CardContent className="p-4 space-y-4">
                              <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold mb-1">Observation</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{msg.feedback.explanation}</p>
                                </div>
                              </div>
                              <div className="flex gap-3 p-3 bg-card rounded-lg border border-primary/10">
                                <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Sample Answer</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{msg.feedback.sample_answer}</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-destructive mb-1">Common Pitfalls</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{msg.feedback.common_mistakes}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {(mutation.isPending || completeMutation.isPending) && (
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 border-2 border-muted">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Bot className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-primary/10 rounded-2xl p-4 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    </div>
                    <span className="text-sm text-muted-foreground italic">
                      {completeMutation.isPending ? "Finalizing performance report..." : "Analyzing answer..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t bg-card/50 backdrop-blur z-10">
            <div className="max-w-3xl mx-auto flex gap-4">
              <div className="flex-1 relative">
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your response here..."
                  className="min-h-[100px] pr-12 py-3 resize-none border-primary/10 focus-visible:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (answer.trim() && !mutation.isPending && !completeMutation.isPending) mutation.mutate(answer);
                    }
                  }}
                  disabled={mutation.isPending || completeMutation.isPending}
                  data-testid="textarea-answer"
                />
                <Button
                  size="icon"
                  className="absolute bottom-3 right-3 rounded-xl shadow-lg"
                  disabled={!answer.trim() || mutation.isPending || completeMutation.isPending}
                  onClick={() => mutation.mutate(answer)}
                  data-testid="button-send"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="max-w-3xl mx-auto mt-3 flex justify-between items-center px-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-status-online" />
                Adaptive AI Active
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                Shift + Enter for new line
              </span>
            </div>
          </div>
        </div>

        <aside className="hidden lg:flex w-80 border-l bg-card/30 flex-col p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              Project Context
            </h3>
            <Card className="bg-muted/30 border-none shadow-none p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Title</p>
                <p className="text-sm font-medium">{interview?.title}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                <p className="text-xs text-muted-foreground line-clamp-6 leading-relaxed">
                  {interview?.description}
                </p>
              </div>
              {interview?.githubLink && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Resources</p>
                  <a 
                    href={interview.githubLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Github className="w-3 h-3" />
                    Source Code
                  </a>
                </div>
              )}
            </Card>
          </div>
          
          <div className="flex-1 overflow-auto space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Interviewer Note</h3>
            <p className="text-sm text-muted-foreground italic leading-relaxed border-l-2 border-primary/20 pl-4 py-1">
              "Focus on explaining the 'why' behind your decisions. Be ready for deep dives into failure scenarios and trade-offs."
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
