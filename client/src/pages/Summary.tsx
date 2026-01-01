import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Target, BookOpen, Wrench, RefreshCw, Trophy, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export default function Summary() {
  const { id } = useParams();

  const { data: interview } = useQuery({
    queryKey: [api.interviews.get.path, { id }],
    queryFn: async () => {
      const res = await apiRequest("GET", buildUrl(api.interviews.get.path, { id: Number(id) }));
      return res.json();
    },
  });

  useEffect(() => {
    if (interview?.overallScore && interview.overallScore > 70) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#93c5fd"]
      });
    }
  }, [interview?.overallScore]);

  if (!interview || !interview.summary) return null;

  const summary = interview.summary as any;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero Score */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary/20 bg-primary/10 relative"
          >
            <div className="text-4xl font-black text-primary">{interview.overallScore}%</div>
            <Award className="absolute -top-2 -right-2 w-10 h-10 text-amber-500 bg-background rounded-full p-1 border-2 border-background" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Interview Performance Report</h1>
            <p className="text-xl text-muted-foreground">{interview.title}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Strengths */}
          <Card className="border-none bg-emerald-50/50 dark:bg-emerald-950/20 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Trophy className="w-5 h-5" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {summary.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="border-none bg-rose-50/50 dark:bg-rose-950/20 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                Areas for Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {summary.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            Recommended Revision
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summary.revision_topics.map((t: string, i: number) => (
              <Badge key={i} variant="secondary" className="h-10 text-sm justify-center font-medium bg-card border shadow-sm">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="border-primary/10 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Project Improvements
            </CardTitle>
            <CardDescription>Suggested enhancements for your actual project implementation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.project_improvements.map((imp: string, i: number) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed">{imp}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <Button asChild className="flex-1 h-14 text-lg font-bold rounded-2xl shadow-xl">
            <Link href="/" data-testid="link-home">
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Another Project
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 h-14 text-lg font-bold rounded-2xl border-2">
            Download PDF Report
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
