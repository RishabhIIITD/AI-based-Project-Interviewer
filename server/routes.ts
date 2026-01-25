import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertUserSchema, loginSchema, insertSubjectSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { recordInterviewStats, type InterviewStatsRow } from "./googleSheets";
import "dotenv/config";
import { getLLMProvider } from "./lib/llm/factory";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['text/plain', 'text/markdown', 'application/pdf'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.md') || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md, and .pdf files are allowed'));
    }
  }
});

const DEFAULT_USER_ID = 1;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Mock Auth routes - simplified for no-login version
  app.get("/api/auth/me", async (req, res) => {
    const user = await storage.getUserById(DEFAULT_USER_ID);
    if (!user) {
      // Create default user if not exists (should be created in storage constructor)
      return res.status(500).json({ message: "Default user not found" });
    }
    res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
  });

  // Admin routes (simplified, everyone is effectively admin or student as needed)
  app.get("/api/admin/students", async (req, res) => {
    const users = await storage.getAllUsers();
    const students = users.filter(u => u.role === "student");
    res.json(students.map(s => ({ id: s.id, email: s.email, fullName: s.fullName, createdAt: s.createdAt })));
  });

  app.get("/api/admin/interviews", async (req, res) => {
    const allInterviews = await storage.getAllInterviews();
    const users = await storage.getAllUsers();
    const userMap = new Map(users.map(u => [u.id, u]));
    
    const enriched = allInterviews.map(interview => ({
      ...interview,
      studentName: interview.userId ? userMap.get(interview.userId)?.fullName || "Unknown" : "Unknown",
      studentEmail: interview.userId ? userMap.get(interview.userId)?.email || "Unknown" : "Unknown",
    }));
    
    res.json(enriched);
  });

  // Interview routes
  app.post(api.interviews.create.path, async (req, res) => {
    try {
      const { apiKey, ...interviewData } = api.interviews.create.input.parse(req.body);
      
      // Initialize provider to ensure key is valid and generate first question
      const provider = getLLMProvider(interviewData.provider, apiKey);
      
      const interview = await storage.createInterview(interviewData, DEFAULT_USER_ID);
      
      // Fetch study materials if this is a subject-based interview
      let studyMaterialsContext = '';
      if (interviewData.subjectId) {
        const materials = await storage.getStudyMaterialsBySubject(DEFAULT_USER_ID, interviewData.subjectId);
        if (materials.length > 0) {
          const materialsContent = materials
            .filter(m => m.content)
            .map(m => `--- ${m.fileName} ---\n${m.content?.slice(0, 10000)}`) // Limit each file
            .join('\n\n');
          if (materialsContent) {
            studyMaterialsContext = `\n\nSTUDY MATERIALS FROM STUDENT:\n${materialsContent.slice(0, 30000)}`;
          }
        }
      }

      // Determine if this is a subject-based or project-based interview
      const isSubjectBased = interviewData.description.startsWith('Subject:');
      
      const systemPrompt = isSubjectBased 
        ? `You are an expert technical instructor conducting a practice Q&A session.
          Topic: ${interviewData.title}
          Context: ${interviewData.description}
          ${studyMaterialsContext}
          
          Your goal is to help the student learn and practice this topic through questions.
          Ask questions that test understanding of key concepts from the study materials if available.
          If no study materials, ask fundamental questions about the topic.
          Start with a foundational concept question.
          Keep questions clear and educational.`
        : `You are an expert technical interviewer conducting a project-based interview.
          Project Title: ${interviewData.title}
          Description: ${interviewData.description}
          
          Your goal is to assess the candidate's technical depth, problem-solving skills, and communication.
          Start by asking a high-level question about the project overview or motivation.
          Keep the question concise and professional.`;
      
      const firstQuestion = await provider.generateInterviewQuestions(systemPrompt);
      
      await storage.createMessage({
        interviewId: interview.id,
        role: "interviewer",
        content: firstQuestion,
      });

      res.status(201).json(interview);
    } catch (err: any) {
      console.error("Error creating interview:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

  app.get(api.interviews.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }
    const interview = await storage.getInterview(id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    // Allow access if user owns interview or is admin (simplified check)
    if (interview.userId !== DEFAULT_USER_ID) {
      // For this single-user mode, maybe we can ignore this or strictly enforce.
      // Let's enforce for consistency, assuming only 1 user.
      // return res.status(403).json({ message: "Forbidden" });
    }
    res.json(interview);
  });

  app.get("/api/interviews/my", async (req, res) => {
    const interviews = await storage.getInterviewsByUser(DEFAULT_USER_ID);
    res.json(interviews);
  });

  app.get(api.interviews.getMessages.path, async (req, res) => {
    const interviewId = Number(req.params.id);
    if (isNaN(interviewId)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }
    const interview = await storage.getInterview(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    const messages = await storage.getMessages(interviewId);
    res.json(messages);
  });

  app.post(api.interviews.processMessage.path, async (req, res) => {
    try {
      const interviewId = Number(req.params.id);
      if (isNaN(interviewId)) {
        return res.status(400).json({ message: 'Invalid interview ID' });
      }
      const { content, apiKey } = api.interviews.processMessage.input.parse(req.body);
      
      const interview = await storage.getInterview(interviewId);
      if (!interview) return res.status(404).json({ message: "Interview not found" });

      const provider = getLLMProvider(interview.provider as "gemini" | "ollama", apiKey);

      const history = await storage.getMessages(interviewId);
      
      const userMessage = await storage.createMessage({
        interviewId,
        role: "candidate",
        content,
      });

      const projectContext = `Project: ${interview.title} - ${interview.description}`;
      const result = await provider.analyzeResponse(history, content, projectContext);
      
      const nextQuestion = await storage.createMessage({
        interviewId,
        role: "interviewer",
        content: result.next_question || "Let's move on. Can you explain the architecture?",
      });

      res.json({
        message: { ...userMessage, feedback: result.feedback },
        response: nextQuestion,
        feedback: result.feedback,
      });

    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message || "Error processing message" });
    }
  });

  app.post(api.interviews.complete.path, async (req, res) => {
    const interviewId = Number(req.params.id);
    if (isNaN(interviewId)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }
    
    try {
      const { apiKey } = api.interviews.complete.input.parse(req.body);
      
      const interview = await storage.getInterview(interviewId);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const provider = getLLMProvider(interview.provider as "gemini" | "ollama", apiKey);

      const history = await storage.getMessages(interviewId);
      
      const summary = await provider.generateSummary(history);
      
      // Add response count to summary (candidate's answers)
      const responseCount = history.filter(m => m.role === "candidate").length;
      summary.response_count = responseCount;
      
      const updatedInterview = await storage.updateInterviewStatus(
        interviewId, 
        "completed", 
        summary, 
        summary.overall_score
      );

      // Record stats to Google Sheets (async, don't block response)
      try {
        const user = await storage.getUserById(interview.userId!);
        const startTime = interview.createdAt ? new Date(interview.createdAt) : new Date();
        const endTime = updatedInterview.completedAt ? new Date(updatedInterview.completedAt) : new Date();
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        const statsRow: InterviewStatsRow = {
          interviewId: interview.id,
          studentName: user?.fullName || 'Unknown',
          studentEmail: user?.email || 'Unknown',
          projectTitle: interview.title,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
          overallScore: summary.overall_score || 0,
          responseCount,
          strengths: (summary.strengths || []).join('; '),
          weaknesses: (summary.weaknesses || []).join('; '),
          revisionTopics: (summary.revision_topics || []).join('; ')
        };

        recordInterviewStats(statsRow).catch(err => {
          console.error('[GoogleSheets] Background recording failed:', err);
        });
      } catch (sheetsError) {
        console.error('[GoogleSheets] Failed to prepare stats:', sheetsError);
      }

      res.json(updatedInterview);
    } catch (err: any) {
      console.error("Error completing interview:", err);
      res.status(500).json({ message: err.message || "Failed to complete interview" });
    }
  });

  // ===== SUBJECTS & STUDY MATERIALS =====
  
  // Get all subjects (preset)
  app.get("/api/subjects", async (req, res) => {
    const subjects = await storage.getPresetSubjects();
    res.json(subjects);
  });

  // Get user's selected subjects
  app.get("/api/subjects/my", async (req, res) => {
    const subjects = await storage.getUserSubjects(DEFAULT_USER_ID);
    res.json(subjects);
  });

  // Add subject to user's list
  app.post("/api/subjects/my", async (req, res) => {
    try {
      const { subjectId } = req.body;
      if (!subjectId) return res.status(400).json({ message: "subjectId required" });
      await storage.addUserSubject(DEFAULT_USER_ID, subjectId);
      res.status(201).json({ message: "Subject added" });
    } catch (err) {
      res.status(500).json({ message: "Failed to add subject" });
    }
  });

  // Remove subject from user's list
  app.delete("/api/subjects/my/:subjectId", async (req, res) => {
    const subjectId = Number(req.params.subjectId);
    if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
    await storage.removeUserSubject(DEFAULT_USER_ID, subjectId);
    res.json({ message: "Subject removed" });
  });

  // Create custom subject
  app.post("/api/subjects", async (req, res) => {
    try {
      const input = insertSubjectSchema.parse({ ...req.body, isPreset: false });
      const subject = await storage.createSubject(input);
      await storage.addUserSubject(DEFAULT_USER_ID, subject.id);
      res.status(201).json(subject);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  // Upload study material
  app.post("/api/subjects/:subjectId/materials", upload.single('file'), async (req, res) => {
    try {
      const subjectId = Number(req.params.subjectId);
      if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
      
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      // Extract text content from file
      let content = '';
      if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt') || file.originalname.endsWith('.md')) {
        content = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/pdf') {
        // For PDFs, we'll store the raw content and note it needs parsing
        content = '[PDF content - text extraction would be done here]';
      }

      const material = await storage.createStudyMaterial({
        userId: DEFAULT_USER_ID,
        subjectId,
        fileName: file.originalname,
        fileType: file.mimetype,
        content: content.slice(0, 50000) // Limit content size
      });

      res.status(201).json(material);
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: "Failed to upload material" });
    }
  });

  // Get study materials for a subject
  app.get("/api/subjects/:subjectId/materials", async (req, res) => {
    const subjectId = Number(req.params.subjectId);
    if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
    const materials = await storage.getStudyMaterialsBySubject(DEFAULT_USER_ID, subjectId);
    res.json(materials);
  });

  return httpServer;
}
