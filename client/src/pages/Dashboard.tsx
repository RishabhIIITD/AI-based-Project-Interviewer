import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, LogOut, Trophy, Clock, CheckCircle2, 
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
  const logout = useLogout();

  const { data: interviews = [], isLoading } = useQuery<Interview[]>({
    queryKey: [isAdmin ? "/api/admin/interviews" : "/api/interviews/my"],
    refetchOnMount: "always",
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const handleLogout = async () => {
    await logout.mutateAsync();
    setLocation("/login");
  };

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

  // Calculate subject-based analytics - use subjectId only for accuracy
  const subjectStats = subjects.map(subject => {
    const subjectInterviews = completedInterviews.filter(i => 
      i.subjectId === subject.id
    );
    const avg = subjectInterviews.length > 0
      ? Math.round(subjectInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / subjectInterviews.length)
      : 0;
    return {
      id: subject.id,
      name: subject.name,
      icon: subject.icon,
      count: subjectInterviews.length,
      avgScore: avg,
      interviews: subjectInterviews,
    };
  }).filter(s => s.count > 0);

  // Identify weak subjects (below 60% avg)
  const weakSubjects = subjectStats.filter(s => s.avgScore > 0 && s.avgScore < 60);

  // Identify strong subjects (above 75% avg)
  const strongSubjects = subjectStats.filter(s => s.avgScore >= 75);

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
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="stats-grid">
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
          <Card data-testid="card-subjects-practiced">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-subjects-practiced">{subjectStats.length}</p>
                  <p className="text-sm text-muted-foreground" data-testid="label-subjects-practiced">Subjects Practiced</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {!isAdmin && (weakSubjects.length > 0 || strongSubjects.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakSubjects.length > 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5" data-testid="card-weak-subjects">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" data-testid="text-weak-subjects-title">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Needs More Practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {weakSubjects.map(s => {
                      const IconComponent = iconMap[s.icon || 'Code'] || Code;
                      return (
                        <Badge key={s.id} variant="outline" className="gap-1" data-testid={`badge-weak-subject-${s.id}`}>
                          <IconComponent className="w-3 h-3" />
                          {s.name} ({s.avgScore}%)
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            {strongSubjects.length > 0 && (
              <Card className="border-emerald-500/30 bg-emerald-500/5" data-testid="card-strong-subjects">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2" data-testid="text-strong-subjects-title">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    Strong Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {strongSubjects.map(s => {
                      const IconComponent = iconMap[s.icon || 'Code'] || Code;
                      return (
                        <Badge key={s.id} variant="outline" className="gap-1 border-emerald-500/30" data-testid={`badge-strong-subject-${s.id}`}>
                          <IconComponent className="w-3 h-3" />
                          {s.name} ({s.avgScore}%)
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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

          {/* By Subject Tab */}
          {!isAdmin && (
            <TabsContent value="subjects">
              <Card data-testid="card-subject-performance">
                <CardHeader>
                  <CardTitle data-testid="text-subject-chart-title">Performance by Subject</CardTitle>
                  <CardDescription data-testid="text-subjects-description">Average scores across different subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjectStats.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground" data-testid="empty-state-subjects">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No subject-based practice sessions yet</p>
                      <Button className="mt-4" onClick={() => setLocation("/")} data-testid="button-start-subject-practice">
                        Start Subject Practice
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={250} data-testid="chart-subject-bar">
                        <BarChart data={subjectStats} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={150} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`${value}%`, 'Average Score']}
                          />
                          <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                            {subjectStats.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.avgScore >= 70 ? 'hsl(var(--chart-2))' : entry.avgScore >= 50 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {subjectStats.map(s => {
                          const IconComponent = iconMap[s.icon || 'Code'] || Code;
                          return (
                            <div 
                              key={s.id} 
                              className="p-4 rounded-lg border bg-card/50"
                              data-testid={`card-subject-stat-${s.id}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <IconComponent className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-sm truncate" data-testid={`text-subject-name-${s.id}`}>{s.name}</span>
                              </div>
                              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                <span className={`text-2xl font-bold ${
                                  s.avgScore >= 70 ? 'text-emerald-500' : 
                                  s.avgScore >= 50 ? 'text-amber-500' : 'text-destructive'
                                }`} data-testid={`text-subject-score-${s.id}`}>
                                  {s.avgScore}%
                                </span>
                                <span className="text-xs text-muted-foreground" data-testid={`text-subject-count-${s.id}`}>{s.count} sessions</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
