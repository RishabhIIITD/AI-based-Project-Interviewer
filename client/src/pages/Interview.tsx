import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, Loader2, PlayCircle, StopCircle, Mic } from "lucide-react";
import { useInterview, useInterviewMessages, useProcessMessage, useCompleteInterview } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/MessageBubble";
import { useToast } from "@/hooks/use-toast";

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const interviewId = parseInt(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: interview, isLoading: loadingInterview } = useInterview(interviewId);
  const { data: messages, isLoading: loadingMessages } = useInterviewMessages(interviewId);
  const processMessage = useProcessMessage();
  const completeInterview = useCompleteInterview();
  
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Speech recognition error", err);
      }
    }
  };

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, processMessage.isPending]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || processMessage.isPending) return;

    const content = input;
    setInput(""); // Optimistic clear

    try {
      await processMessage.mutateAsync({ id: interviewId, content });
    } catch (error) {
      setInput(content); // Restore on error
      toast({
        title: "Failed to send",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle completing the interview
  const handleComplete = async () => {
    if (!confirm("Are you sure you want to end the interview?")) return;
    
    try {
      await completeInterview.mutateAsync(interviewId);
      setLocation(`/summary/${interviewId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not complete interview.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (loadingInterview || loadingMessages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Interview Not Found</h2>
          <Button onClick={() => setLocation("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Get the latest interviewer message to display prominently if needed
  const latestInterviewerMessage = [...(messages || [])].reverse().find(m => m.role === "interviewer");

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b bg-card/50 backdrop-blur px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          </div>
          <div>
            <h1 className="font-semibold text-sm md:text-base text-foreground leading-none">{interview.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">Technical Assessment in Progress</p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleComplete}
        >
          <LogOut className="w-4 h-4 mr-2" />
          End Session
        </Button>
      </header>

      {/* Main Content - Split view potential, but let's do a central chat flow for focus */}
      <main className="flex-1 relative container max-w-4xl mx-auto flex flex-col h-full overflow-hidden">
        
        <div 
          className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
          ref={scrollRef}
        >
          <div className="space-y-6 pb-4">
            {messages?.map((message, i) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isLatest={i === messages.length - 1}
                onSpeak={speak}
              />
            ))}
            
            {processMessage.isPending && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-secondary border border-white/10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground animate-pulse">Analyzing response...</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative group">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here... (Shift+Enter for new line)"
                className="min-h-[100px] md:min-h-[120px] w-full resize-none bg-secondary/50 border-white/10 rounded-xl p-4 pr-32 focus:ring-primary/20 focus:border-primary/50 transition-all text-base"
                disabled={processMessage.isPending}
              />
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button 
                  type="button" 
                  size="icon"
                  variant="ghost"
                  className={`${isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"} hover:text-primary transition-colors`}
                  onClick={toggleRecording}
                  title={isRecording ? "Stop recording" : "Record answer"}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                
                <Button 
                  type="submit" 
                  size="icon"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-50"
                  disabled={!input.trim() || processMessage.isPending}
                >
                  {processMessage.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Press Enter to send
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
