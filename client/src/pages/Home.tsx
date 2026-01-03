import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Terminal, Code2, Briefcase, ArrowRight } from "lucide-react";
import { insertInterviewSchema, type InsertInterview } from "@shared/schema";
import { useCreateInterview } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Stock image for Hero section background (abstract tech)
// https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createInterview = useCreateInterview();
  
  const form = useForm<InsertInterview>({
    resolver: zodResolver(insertInterviewSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
    },
  });

  const onSubmit = (data: InsertInterview) => {
    createInterview.mutate(data, {
      onSuccess: (interview) => {
        toast({
          title: "Session Initialized",
          description: "Connecting you with the AI interviewer...",
        });
        setLocation(`/interview/${interview.id}`);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Terminal className="w-4 h-4" />
              <span>AI-Powered Technical Assessment</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              Master Your <br />
              <span className="text-gradient">Technical Interview</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
              Simulate a real-world system design or coding interview based on your actual projects. Get instant, granular feedback from an AI Senior Engineer.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Context Aware</h3>
                  <p className="text-sm text-muted-foreground">Questions tailored to your specific project stack.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-time Feedback</h3>
                  <p className="text-sm text-muted-foreground">Instant analysis of your answers with improvements.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-panel p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6 font-display">Start New Simulation</h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. E-commerce Microservices API" className="bg-background/50" {...field} />
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
                          <FormLabel>Project Description & Tech Stack</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your architecture, challenges, and technologies used (e.g. React, Node.js, AWS)..." 
                              className="bg-background/50 min-h-[120px] resize-none" 
                              {...field} 
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
                          <FormLabel>Project Link (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://github.com/..." className="bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                      disabled={createInterview.isPending}
                    >
                      {createInterview.isPending ? (
                        "Initializing Environment..."
                      ) : (
                        <>
                          Begin Interview <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
