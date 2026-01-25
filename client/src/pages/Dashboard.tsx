import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Trophy, Clock, CheckCircle2, 
  GraduationCap, Users, BarChart3, Loader2, TrendingUp, AlertCircle,
  Binary, GitBranch, Database, Cpu, Network, Brain, Globe, Boxes, 
  Code, Wrench, HardDrive, Shield
} from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import type { Subject } from "@shared/schema";

const iconMap: Record<string, any> = {
  Binary, GitBranch, Database, Cpu, Network, Brain, Globe, Boxes, Code, Wrench, HardDrive, Shield
};

type Interview = {
  id: number;
  title: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  subjectId?: number | null;
  studentName?: string;
  studentEmail?: string;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();

  const { data: interviews = [], isLoading } = useQuery<Interview[]>({
    queryKey: [isAdmin ? "/api/admin/interviews" : "/api/interviews/my"],
    refetchOnMount: "always",
  });

  const completedInterviews = interviews.filter(i => i.status === "completed");
  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completedInterviews.length)
    : 0;

  // Calculate progress data for charts - sort by createdAt first
  const sortedCompletedInterviews = [...completedInterviews].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  const progressData = sortedCompletedInterviews
    .slice(-20) // Get last 20 sorted by date
    .map((i, index) => ({
      name: format(new Date(i.createdAt), "MMM d"),
      score: i.overallScore || 0,
      index: index + 1,
    }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold" data-testid="text-dashboard-title">{isAdmin ? "Admin Dashboard" : "My Progress"}</h1>
              <p className="text-xs text-muted-foreground" data-testid="text-welcome-message">Welcome, {user?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <Button onClick={() => setLocation("/")} data-testid="button-new-interview">
                <Plus className="w-4 h-4 mr-2" />
                New Practice
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="stats-grid">
          <Card data-testid="card-total-sessions">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-sessions">{interviews.length}</p>
                  <p className="text-sm text-muted-foreground" data-testid="label-total-sessions">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-completed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-completed">{completedInterviews.length}</p>
                  <p className="text-sm text-muted-foreground" data-testid="label-completed">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-avg-score">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-avg-score">{avgScore}%</p>
                  <p className="text-sm text-muted-foreground" data-testid="label-avg-score">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="w-full" data-testid="dashboard-tabs">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
            {!isAdmin && <TabsTrigger value="progress" data-testid="tab-progress">Progress Charts</TabsTrigger>}
            {!isAdmin && <TabsTrigger value="subjects" data-testid="tab-subjects">By Subject</TabsTrigger>}
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history">
            <Card data-testid="card-history">
              <CardHeader>
                <CardTitle data-testid="text-history-title">{isAdmin ? "All Student Interviews" : "Practice History"}</CardTitle>
                <CardDescription data-testid="text-history-description">
                  {isAdmin ? "View and manage all student results" : "Your past sessions and results"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : interviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground" data-testid="empty-state-history">
                    <p>No practice sessions yet</p>
                    {!isAdmin && (
                      <Button className="mt-4" onClick={() => setLocation("/")} data-testid="button-start-first-session">
                        Start Your First Session
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {interviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-card hover-elevate cursor-pointer"
                          onClick={() => interview.status === "completed" && setLocation(`/summary/${interview.id}`)}
                          data-testid={`interview-row-${interview.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium truncate" data-testid={`text-interview-title-${interview.id}`}>{interview.title}</h3>
                              <Badge 
                                variant={interview.status === "completed" ? "default" : "secondary"}
                                className="shrink-0"
                                data-testid={`badge-interview-status-${interview.id}`}
                              >
                                {interview.status === "completed" ? "Completed" : "In Progress"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              {isAdmin && interview.studentName && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {interview.studentName}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(interview.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          {interview.status === "completed" && interview.overallScore !== null && (
                            <div className="text-right ml-4">
                              <div className={`text-2xl font-bold ${
                                interview.overallScore >= 70 ? "text-emerald-500" : 
                                interview.overallScore >= 50 ? "text-amber-500" : "text-destructive"
                              }`} data-testid={`text-interview-score-${interview.id}`}>
                                {interview.overallScore}%
                              </div>
                              <p className="text-xs text-muted-foreground" data-testid={`label-interview-score-${interview.id}`}>Score</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Charts Tab */}
          {!isAdmin && (
            <TabsContent value="progress">
              <Card data-testid="card-progress-chart">
                <CardHeader>
                  <CardTitle data-testid="text-progress-chart-title">Score Progress Over Time</CardTitle>
                  <CardDescription data-testid="text-progress-description">Track your improvement across practice sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {progressData.length < 2 ? (
                    <div className="text-center py-12 text-muted-foreground" data-testid="empty-state-progress">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Complete at least 2 sessions to see progress charts</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300} data-testid="chart-progress-line">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* By Subject Tab Removed */}
        </Tabs>
      </main>
    </div>
  );
}
