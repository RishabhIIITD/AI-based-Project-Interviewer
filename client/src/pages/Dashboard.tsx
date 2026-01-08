import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, LogOut, Trophy, Clock, CheckCircle2, 
  GraduationCap, Users, BarChart3, Loader2 
} from "lucide-react";
import { format } from "date-fns";

type Interview = {
  id: number;
  title: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
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

  const handleLogout = async () => {
    await logout.mutateAsync();
    setLocation("/login");
  };

  const completedInterviews = interviews.filter(i => i.status === "completed");
  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completedInterviews.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{isAdmin ? "Admin Dashboard" : "My Interviews"}</h1>
              <p className="text-xs text-muted-foreground">Welcome, {user?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <Button onClick={() => setLocation("/")} data-testid="button-new-interview">
                <Plus className="w-4 h-4 mr-2" />
                New Interview
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{interviews.length}</p>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedInterviews.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview List */}
        <Card>
          <CardHeader>
            <CardTitle>{isAdmin ? "All Student Interviews" : "Interview History"}</CardTitle>
            <CardDescription>
              {isAdmin ? "View and manage all student interview results" : "Your past interview sessions and results"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : interviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No interviews yet</p>
                {!isAdmin && (
                  <Button className="mt-4" onClick={() => setLocation("/")}>
                    Start Your First Interview
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover-elevate cursor-pointer"
                      onClick={() => interview.status === "completed" && setLocation(`/summary/${interview.id}`)}
                      data-testid={`interview-row-${interview.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{interview.title}</h3>
                          <Badge 
                            variant={interview.status === "completed" ? "default" : "secondary"}
                            className="shrink-0"
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
                          }`}>
                            {interview.overallScore}%
                          </div>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
