import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { 
  Terminal, Briefcase, ArrowRight, Loader2, Cloud, Server, Key
} from "lucide-react";
import { insertInterviewSchema, type InsertInterview } from "@shared/schema";
import { useCreateInterview } from "@/hooks/use-interviews";
import { useLLM } from "@/context/llm-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createInterview = useCreateInterview();
  const { provider, setProvider, apiKey, setApiKey } = useLLM();
  
  const form = useForm<InsertInterview>({
    resolver: zodResolver(insertInterviewSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
    },
  });

  const onProjectSubmit = (data: InsertInterview) => {
    if (provider === "gemini" && !apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Google Gemini API key to proceed.",
        variant: "destructive",
      });
      return;
    }

    createInterview.mutate({
      ...data,
      provider,
      apiKey: provider === "gemini" ? apiKey : undefined,
    }, {
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

  const isLLMValid = provider === "ollama" || (provider === "gemini" && apiKey.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Terminal className="w-4 h-4" />
              <span>AI-Powered Learning & Assessment</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              Master Your <br />
              <span className="text-gradient">Project Interview</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
              Practice interviews for your projects. Get AI-powered questions tailored to your project's tech stack and architecture.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-panel p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Project Interview
                </h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onProjectSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. E-commerce Microservices API" 
                              className="bg-background/50" 
                              data-testid="input-project-title"
                              {...field} 
                            />
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
                              data-testid="input-project-description"
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
                            <Input 
                              placeholder="https://github.com/..." 
                              className="bg-background/50"
                              data-testid="input-project-link"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* LLM Selection */}
                    <div className="space-y-4 pt-2">
                      <Label>AI Model Provider</Label>
                      <RadioGroup 
                        defaultValue={provider} 
                        onValueChange={(v) => setProvider(v as "gemini" | "ollama")}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="gemini" id="gemini" className="peer sr-only" />
                          <Label
                            htmlFor="gemini"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Cloud className="mb-2 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-semibold">Cloud LLM</div>
                              <div className="text-xs text-muted-foreground">Google Gemini</div>
                            </div>
                          </Label>
                        </div>

                        <div>
                          <RadioGroupItem value="ollama" id="ollama" className="peer sr-only" />
                          <Label
                            htmlFor="ollama"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Server className="mb-2 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-semibold">Local LLM</div>
                              <div className="text-xs text-muted-foreground">Ollama</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>

                      {provider === "gemini" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <Label htmlFor="apiKey" className="flex items-center gap-2">
                            <Key className="w-4 h-4" /> 
                            Gemini API Key
                          </Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Enter your Gemini API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="bg-background/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Your key is only used for this session and not stored permanently.
                          </p>
                        </motion.div>
                      )}

                      {provider === "ollama" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground"
                        >
                          <p>
                            Ensure Ollama is running locally at <strong>http://localhost:11434</strong> with the <strong>gemma3:4b</strong> model pulled.
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/25"
                      disabled={createInterview.isPending || !isLLMValid}
                      data-testid="button-start-interview"
                    >
                      {createInterview.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          Start Interview <ArrowRight className="ml-2 w-5 h-5" />
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
