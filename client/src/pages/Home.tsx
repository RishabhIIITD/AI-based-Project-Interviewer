import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Terminal, Code2, Briefcase, ArrowRight, BookOpen, Upload, X,
  Binary, GitBranch, Database, Cpu, Network, Brain, Globe, Boxes, 
  Code, Wrench, HardDrive, Shield, Plus, FileText, Trash2
} from "lucide-react";
import { insertInterviewSchema, type InsertInterview, type Subject, type StudyMaterial } from "@shared/schema";
import { useCreateInterview } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

const iconMap: Record<string, any> = {
  Binary, GitBranch, Database, Cpu, Network, Brain, Globe, Boxes, Code, Wrench, HardDrive, Shield
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createInterview = useCreateInterview();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: materials = [], refetch: refetchMaterials } = useQuery<StudyMaterial[]>({
    queryKey: ['/api/subjects', selectedSubject?.id, 'materials'],
    enabled: !!selectedSubject,
  });

  const form = useForm<InsertInterview>({
    resolver: zodResolver(insertInterviewSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
    },
  });

  const topicForm = useForm({
    defaultValues: {
      topic: "",
      description: "",
    },
  });

  const onProjectSubmit = (data: InsertInterview) => {
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

  const onTopicSubmit = (data: { topic: string; description: string }) => {
    if (!selectedSubject) {
      toast({ title: "Please select a subject", variant: "destructive" });
      return;
    }
    
    // Create interview with subject context
    const materialContext = materials.length > 0 
      ? `\n\nStudy Materials Available:\n${materials.map(m => `- ${m.fileName}`).join('\n')}`
      : '';
    
    createInterview.mutate({
      title: `${selectedSubject.name}: ${data.topic || 'Practice Session'}`,
      description: `Subject: ${selectedSubject.name}\nTopic: ${data.topic}\n${data.description}${materialContext}`,
      link: "",
      subjectId: selectedSubject.id,
    }, {
      onSuccess: (interview) => {
        toast({
          title: "Practice Session Started",
          description: `Starting ${selectedSubject.name} practice...`,
        });
        setLocation(`/interview/${interview.id}`);
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/subjects/${selectedSubject.id}/materials`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      toast({ title: "Material Uploaded", description: file.name });
      refetchMaterials();
    } catch (err) {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const deleteMaterial = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/materials/${id}`);
      refetchMaterials();
      toast({ title: "Material Deleted" });
    } catch (err) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

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
              Master Any <br />
              <span className="text-gradient">Technical Subject</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
              Practice interviews for your projects or any CS subject. Upload your study materials and get AI-powered questions tailored to your learning needs.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Multi-Subject</h3>
                  <p className="text-sm text-muted-foreground">Practice across 12+ CS subjects.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Your Materials</h3>
                  <p className="text-sm text-muted-foreground">Upload notes for personalized questions.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Card with Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-panel p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <Tabs defaultValue="topic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="topic" data-testid="tab-topic">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Subject Practice
                    </TabsTrigger>
                    <TabsTrigger value="project" data-testid="tab-project">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Project Interview
                    </TabsTrigger>
                  </TabsList>

                  {/* Topic-based Practice */}
                  <TabsContent value="topic" className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-3 block">Select Subject</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {subjects.map((subject) => {
                          const IconComponent = iconMap[subject.icon || 'Code'] || Code;
                          const isSelected = selectedSubject?.id === subject.id;
                          return (
                            <button
                              key={subject.id}
                              type="button"
                              onClick={() => setSelectedSubject(isSelected ? null : subject)}
                              data-testid={`subject-${subject.id}`}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-xs
                                ${isSelected 
                                  ? 'border-primary bg-primary/10 text-primary' 
                                  : 'border-border hover-elevate'}`}
                            >
                              <IconComponent className="w-5 h-5" />
                              <span className="text-center line-clamp-2">{subject.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedSubject && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          {/* Study Materials Upload */}
                          <div className="border border-dashed border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">Study Materials (Optional)</span>
                              <label className="cursor-pointer">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept=".txt,.md,.pdf"
                                  onChange={handleFileUpload}
                                  disabled={uploadingFile}
                                  data-testid="input-file-upload"
                                />
                                <Badge variant="outline" className="cursor-pointer">
                                  <Upload className="w-3 h-3 mr-1" />
                                  {uploadingFile ? 'Uploading...' : 'Upload'}
                                </Badge>
                              </label>
                            </div>
                            
                            {materials.length > 0 ? (
                              <div className="space-y-2">
                                {materials.map((m) => (
                                  <div key={m.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-muted-foreground" />
                                      <span className="truncate max-w-[180px]">{m.fileName}</span>
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6"
                                      onClick={() => deleteMaterial(m.id)}
                                      data-testid={`delete-material-${m.id}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Upload .txt, .md, or .pdf files. The AI will use them to generate relevant questions.
                              </p>
                            )}
                          </div>

                          {/* Topic Input */}
                          <form onSubmit={topicForm.handleSubmit(onTopicSubmit)} className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Specific Topic (Optional)</label>
                              <Input 
                                placeholder={`e.g. Binary Search Trees, Recursion...`}
                                {...topicForm.register('topic')}
                                data-testid="input-topic"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Additional Context (Optional)</label>
                              <Textarea 
                                placeholder="Any specific areas you want to focus on..."
                                className="min-h-[80px] resize-none"
                                {...topicForm.register('description')}
                                data-testid="input-topic-description"
                              />
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/25"
                              disabled={createInterview.isPending}
                              data-testid="button-start-practice"
                            >
                              {createInterview.isPending ? (
                                "Starting Session..."
                              ) : (
                                <>
                                  Start {selectedSubject.name} Practice <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                              )}
                            </Button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!selectedSubject && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Select a subject above to begin practice
                      </p>
                    )}
                  </TabsContent>

                  {/* Project-based Interview */}
                  <TabsContent value="project">
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

                        <Button 
                          type="submit" 
                          className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/25"
                          disabled={createInterview.isPending}
                          data-testid="button-start-interview"
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
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
