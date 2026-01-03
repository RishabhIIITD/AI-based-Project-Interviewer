import { motion } from "framer-motion";
import { Check, AlertCircle, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FeedbackData } from "@shared/schema";

interface FeedbackCardProps {
  feedback: FeedbackData;
  className?: string;
}

export function FeedbackCard({ feedback, className }: FeedbackCardProps) {
  const scoreColor = 
    feedback.rating >= 8 ? "text-green-400 border-green-400/20 bg-green-400/5" :
    feedback.rating >= 5 ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" :
    "text-red-400 border-red-400/20 bg-red-400/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className={cn("p-6 border bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border text-xl font-mono font-bold", scoreColor)}>
              {feedback.rating}
            </div>
            <div>
              <h4 className="font-display font-semibold text-lg text-foreground">Feedback Analysis</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Real-time Evaluation</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-semibold font-display">Evaluation</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feedback.explanation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/5 p-4 rounded-lg border border-green-500/10">
              <div className="flex items-center gap-2 mb-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold font-display">Sample Answer</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{feedback.sample_answer}"
              </p>
            </div>
            
            <div className="bg-orange-500/5 p-4 rounded-lg border border-orange-500/10">
              <div className="flex items-center gap-2 mb-2 text-orange-400">
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold font-display">Common Mistakes</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feedback.common_mistakes}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
