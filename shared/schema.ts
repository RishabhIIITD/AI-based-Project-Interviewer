
import { z } from "zod";

// Shared Types
export type FeedbackData = {
  rating: number; // 0-10
  explanation: string;
  sample_answer: string;
  common_mistakes: string;
};

export type SummaryData = {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  revision_topics: string[];
  project_improvements: string[];
  response_count?: number;
};

// Users
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password: z.string(),
  fullName: z.string(),
  role: z.string().default("student"),
  createdAt: z.date().or(z.string()).optional(), // In-memory storage might use Date or string
});

export const insertUserSchema = userSchema.omit({
  id: true,
  role: true,
  createdAt: true
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Interviews
export const interviewSchema = z.object({
  id: z.number(),
  userId: z.number().optional(), // Made optional to match existing loose types if any
  subjectId: z.number().optional().nullable(),
  title: z.string(),
  description: z.string(),
  link: z.string().optional().nullable(),
  provider: z.enum(["gemini", "ollama"]).default("gemini"),
  status: z.string().default("in_progress"),
  overallScore: z.number().optional().nullable(),
  summary: z.any().optional().nullable(), // using any for jsonb compatibility
  createdAt: z.date().or(z.string()).optional(),
  completedAt: z.date().or(z.string()).optional().nullable(),
});

export const insertInterviewSchema = interviewSchema.omit({ 
  id: true, 
  userId: true,
  status: true, 
  overallScore: true, 
  summary: true, 
  createdAt: true,
  completedAt: true
});

export const createInterviewRequestSchema = insertInterviewSchema.extend({
  apiKey: z.string().optional()
});

export const processMessageRequestSchema = z.object({
  content: z.string(),
  apiKey: z.string().optional()
});

export const completeInterviewRequestSchema = z.object({
  apiKey: z.string().optional()
});

export type Interview = z.infer<typeof interviewSchema>;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type CreateInterviewRequest = z.infer<typeof createInterviewRequestSchema>;

// Messages
export const messageSchema = z.object({
  id: z.number(),
  interviewId: z.number(),
  role: z.string(),
  content: z.string(),
  feedback: z.any().optional().nullable(),
  createdAt: z.date().or(z.string()).optional(),
});

export const insertMessageSchema = messageSchema.omit({ 
  id: true, 
  createdAt: true,
  feedback: true 
});

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// App Settings
export const appSettingsSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string(),
});

// Subjects
export const subjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  isPreset: z.boolean().default(false),
  createdAt: z.date().or(z.string()).optional(),
});

export const insertSubjectSchema = subjectSchema.omit({
  id: true,
  createdAt: true
});

export type Subject = z.infer<typeof subjectSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

// User Subjects
export const userSubjectSchema = z.object({
  id: z.number(),
  userId: z.number(),
  subjectId: z.number(),
  createdAt: z.date().or(z.string()).optional(),
});

export type UserSubject = z.infer<typeof userSubjectSchema>;

// Study Materials
export const studyMaterialSchema = z.object({
  id: z.number(),
  userId: z.number(),
  subjectId: z.number(),
  fileName: z.string(),
  fileType: z.string(),
  content: z.string().optional().nullable(),
  createdAt: z.date().or(z.string()).optional(),
});

export const insertStudyMaterialSchema = studyMaterialSchema.omit({
  id: true,
  createdAt: true
});

export type StudyMaterial = z.infer<typeof studyMaterialSchema>;
export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
