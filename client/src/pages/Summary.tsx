import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { useInterview } from "@/hooks/use-interviews";
import { Loader2, ArrowRight, CheckCircle2, AlertTriangle, BookOpen, RefreshCw, Home, Clock, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SummaryData } from "@shared/schema";
import { format } from "date-fns";

// Helper for staggered animations
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Summary() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: interview, isLoading } = useInterview(parseInt(id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview || !interview.summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Generating Summary...</h2>
        <p className="text-muted-foreground mb-8">This might take a moment if the interview just finished.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>
    );
  }

  const summary = interview.summary as SummaryData;
  const score = summary.overall_score || 0;
  
  // Determine score color
  const scoreColor = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const scoreGradient = score >= 80 ? "from-green-400 to-emerald-600" : score >= 60 ? "from-yellow-400 to-orange-500" : "from-red-500 to-pink-600";

  // Calculate duration
  const startTime = interview.createdAt ? new Date(interview.createdAt) : null;
  const endTime = interview.completedAt ? new Date(interview.completedAt) : null;
  const durationMs = startTime && endTime ? endTime.getTime() - startTime.getTime() : 0;
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-secondary border border-white/5 text-sm font-mono text-muted-foreground mb-4">
            Interview Report: {interview.title}
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold">Performance Summary</h1>
        </motion.div>

        {/* Score Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-30" />
          <Card className="glass-panel p-8 md:p-12 text-center relative z-10 border-white/10">
            <div className="flex flex-col items-center justify-center">
              <span className="text-lg text-muted-foreground font-medium uppercase tracking-widest mb-4">Overall Score</span>
              <div className={`text-8xl md:text-9xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b ${scoreGradient}`}>
                {score}
              </div>
              <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full bg-gradient-to-r ${scoreGradient}`}
                />
              </div>
              <p className="text-xl md:text-2xl text-foreground font-display">
                {score >= 80 ? "Outstanding Performance 🚀" : score >= 60 ? "Solid Effort, Room to Grow 🌱" : "Needs Improvement 🔧"}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Interview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="p-4 bg-secondary/30 border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold" data-testid="text-duration">
                  {durationMinutes}m {durationSeconds}s
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-secondary/30 border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-semibold text-sm" data-testid="text-start-time">
                  {startTime ? format(startTime, "MMM d, yyyy h:mm a") : "N/A"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-secondary/30 border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-semibold text-sm" data-testid="text-end-time">
                  {endTime ? format(endTime, "MMM d, yyyy h:mm a") : "N/A"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-secondary/30 border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responses</p>
                <p className="font-semibold" data-testid="text-response-count">
                  {summary.response_count || "N/A"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detailed Breakdown Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Strengths */}
          <motion.div variants={item}>
            <Card className="p-6 h-full bg-card border-white/5 hover:border-green-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold font-display">Key Strengths</h3>
              </div>
              <ul className="space-y-3">
                {(summary.strengths || []).map((point, i) => (
                  <li key={i} className="flex gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* Weaknesses */}
          <motion.div variants={item}>
            <Card className="p-6 h-full bg-card border-white/5 hover:border-red-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold font-display">Areas for Improvement</h3>
              </div>
              <ul className="space-y-3">
                {(summary.weaknesses || []).map((point, i) => (
                  <li key={i} className="flex gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* Revision Topics */}
          <motion.div variants={item} className="md:col-span-2">
            <Card className="p-6 bg-secondary/30 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display">Recommended Study Topics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(summary.revision_topics || []).map((topic, i) => (
                  <div key={i} className="bg-background p-4 rounded-lg border border-white/5 text-center hover:bg-white/5 transition-colors cursor-default">
                    <span className="font-mono text-sm text-primary-foreground">{topic}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Action Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4 pb-12"
        >
          <Button 
            size="lg" 
            className="h-14 px-8 text-lg shadow-xl shadow-primary/20"
            onClick={() => setLocation("/")}
            data-testid="button-new-interview"
          >
            Start New Simulation
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
