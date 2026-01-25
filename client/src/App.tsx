
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Interview from "@/pages/Interview";
import Summary from "@/pages/Summary";
import Dashboard from "@/pages/Dashboard";
import { Loader2 } from "lucide-react";

function Router() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/" component={Home} />
      <Route path="/interview/:id" component={Interview} />
      <Route path="/summary/:id" component={Summary} />
      {/* Redirect login to dashboard if someone tries to access it */}
      <Route path="/login">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

import { LLMProvider } from "@/context/llm-context";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LLMProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LLMProvider>
    </QueryClientProvider>
  );
}

export default App;
