import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInterviewSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Briefcase, Link as LinkIcon, Sparkles } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const form = useForm({
    resolver: zodResolver(insertInterviewSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiRequest("POST", api.interviews.create.path, values);
      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/interview/${data.id}`);
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Master Your Next <span className="text-primary">Technical Interview</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Simulate a real-world project-based interview. Get adaptive questions, real-time ratings, and professional feedback.
        </p>
      </div>

      <Card className="w-full max-w-xl shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            Project Details
          </CardTitle>
          <CardDescription>
            Tell us about the project you want to be interviewed on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. E-commerce Microservices Platform" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Project Explanation</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain the tech stack, your role, and key features..." 
                        className="min-h-[120px] resize-none"
                        {...field} 
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      GitHub Repository URL (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username/project" {...field} data-testid="input-link" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold" 
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? "Analyzing Project..." : "Start Mock Interview"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
