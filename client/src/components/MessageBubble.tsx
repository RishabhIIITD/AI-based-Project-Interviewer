import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import type { Message, FeedbackData } from "@shared/schema";
import { FeedbackCard } from "./FeedbackCard";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role === "candidate";
  
  // Parse feedback if it exists
  const feedback = message.feedback as FeedbackData | null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex gap-4 mb-8", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
        isUser ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-white/10 text-white"
      )}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      <div className={cn("flex flex-col gap-4 max-w-[85%]", isUser && "items-end")}>
        <div className={cn(
          "p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-muted border border-white/5 text-foreground rounded-tl-none"
        )}>
          {message.content}
        </div>

        {/* If this message has feedback attached (meaning the user answered this question, or this is feedback on a user answer) 
            Wait, schema says feedback is on the message. 
            If role is candidate, feedback is on THIS message. 
        */}
        {isUser && feedback && (
          <div className="w-full">
            <FeedbackCard feedback={feedback} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
