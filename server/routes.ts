
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertUserSchema, loginSchema, insertSubjectSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import { recordInterviewStats, initializeSpreadsheet, getSpreadsheetUrl, type InterviewStatsRow } from "./googleSheets";

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

const PRESET_SUBJECTS = [
  { name: "Data Structures", icon: "Binary" },
  { name: "Algorithms", icon: "GitBranch" },
  { name: "Database Systems", icon: "Database" },
  { name: "Operating Systems", icon: "Cpu" },
  { name: "Computer Networks", icon: "Network" },
  { name: "Machine Learning", icon: "Brain" },
  { name: "Web Development", icon: "Globe" },
  { name: "System Design", icon: "Boxes" },
  { name: "Object-Oriented Programming", icon: "Code" },
  { name: "Software Engineering", icon: "Wrench" },
  { name: "Computer Architecture", icon: "HardDrive" },
  { name: "Cybersecurity", icon: "Shield" },
];

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUserById(req.session.userId);
  if (user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Session middleware
  const MemStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemStore({ checkPeriod: 86400000 }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const input = insertUserSchema.parse(req.body);
      
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      res.status(201).json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
  });

  // Admin routes
  app.get("/api/admin/students", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    const students = users.filter(u => u.role === "student");
    res.json(students.map(s => ({ id: s.id, email: s.email, fullName: s.fullName, createdAt: s.createdAt })));
  });

  app.get("/api/admin/interviews", isAdmin, async (req, res) => {
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

  // Interview routes (protected)
  app.post(api.interviews.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.interviews.create.input.parse(req.body);
      const interview = await storage.createInterview(input, req.session.userId!);
      
      // Fetch study materials if this is a subject-based interview
      let studyMaterialsContext = '';
      if (input.subjectId) {
        const materials = await storage.getStudyMaterialsBySubject(req.session.userId!, input.subjectId);
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
      const isSubjectBased = input.description.startsWith('Subject:');
      
      const systemPrompt = isSubjectBased 
        ? `You are an expert technical instructor conducting a practice Q&A session.
          Topic: ${input.title}
          Context: ${input.description}
          ${studyMaterialsContext}
          
          Your goal is to help the student learn and practice this topic through questions.
          Ask questions that test understanding of key concepts from the study materials if available.
          If no study materials, ask fundamental questions about the topic.
          Start with a foundational concept question.
          Keep questions clear and educational.`
        : `You are an expert technical interviewer conducting a project-based interview.
          Project Title: ${input.title}
          Description: ${input.description}
          
          Your goal is to assess the candidate's technical depth, problem-solving skills, and communication.
          Start by asking a high-level question about the project overview or motivation.
          Keep the question concise and professional.`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "system", content: systemPrompt }],
      });

      const firstQuestion = completion.choices[0].message.content || "Let's begin. Can you explain the main concepts?";
      
      await storage.createMessage({
        interviewId: interview.id,
        role: "interviewer",
        content: firstQuestion,
      });

      res.status(201).json(interview);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.interviews.get.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }
    const interview = await storage.getInterview(id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    // Allow access if user owns interview or is admin
    const user = await storage.getUserById(req.session.userId!);
    if (interview.userId !== req.session.userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(interview);
  });

  app.get("/api/interviews/my", isAuthenticated, async (req, res) => {
    const interviews = await storage.getInterviewsByUser(req.session.userId!);
    res.json(interviews);
  });

  app.get(api.interviews.getMessages.path, isAuthenticated, async (req, res) => {
    const interviewId = Number(req.params.id);
    if (isNaN(interviewId)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }
    const interview = await storage.getInterview(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    // Check ownership or admin access
    const user = await storage.getUserById(req.session.userId!);
    if (interview.userId !== req.session.userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const messages = await storage.getMessages(interviewId);
    res.json(messages);
  });

  app.post(api.interviews.processMessage.path, isAuthenticated, async (req, res) => {
    try {
      const interviewId = Number(req.params.id);
      if (isNaN(interviewId)) {
        return res.status(400).json({ message: 'Invalid interview ID' });
      }
      const { content } = api.interviews.processMessage.input.parse(req.body);
      
      const interview = await storage.getInterview(interviewId);
      if (!interview) return res.status(404).json({ message: "Interview not found" });
      if (interview.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const history = await storage.getMessages(interviewId);
      
      const userMessage = await storage.createMessage({
        interviewId,
        role: "candidate",
        content,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are an expert technical interviewer.
            Project: ${interview.title} - ${interview.description}
            
            Analyze the candidate's last answer.
            Provide output in JSON format:
            {
              "feedback": {
                "rating": number (0-10),
                "explanation": "constructive feedback",
                "sample_answer": "better way to answer",
                "common_mistakes": "what to avoid"
              },
              "next_question": "the next question to ask"
            }
            
            Adapt difficulty based on the answer quality.
            If the answer is weak, ask probing questions.
            If strong, ask about trade-offs, scalability, or edge cases.
            Cover topics: Architecture, Database, Security, Testing, Performance.`
          },
          ...history.map(m => ({ 
            role: (m.role === "candidate" ? "user" : "assistant") as "user" | "assistant", 
            content: m.content 
          })),
          { role: "user", content }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      
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

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error processing message" });
    }
  });

  app.post(api.interviews.complete.path, isAuthenticated, async (req, res) => {
    const interviewId = Number(req.params.id);
    if (isNaN(interviewId)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }
    const interview = await storage.getInterview(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.userId !== req.session.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const history = await storage.getMessages(interviewId);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `Generate a final interview summary in JSON:
          {
            "overall_score": number (0-100),
            "strengths": ["list"],
            "weaknesses": ["list"],
            "revision_topics": ["list"],
            "project_improvements": ["list"]
          }`
        },
        ...history.map(m => ({ 
          role: (m.role === "candidate" ? "user" : "assistant") as "user" | "assistant", 
          content: m.content 
        })),
        { role: "user", content: "End interview and generate summary." }
      ],
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(completion.choices[0].message.content || "{}");
    
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
  });

  // ===== SUBJECTS & STUDY MATERIALS =====
  
  // Seed preset subjects on startup
  async function seedPresetSubjects() {
    const existing = await storage.getPresetSubjects();
    if (existing.length === 0) {
      console.log('[Subjects] Seeding preset subjects...');
      for (const subject of PRESET_SUBJECTS) {
        await storage.createSubject({ name: subject.name, icon: subject.icon, isPreset: true });
      }
      console.log('[Subjects] Preset subjects seeded.');
    }
  }
  seedPresetSubjects().catch(err => console.error('[Subjects] Seeding failed:', err));

  // Get all subjects (preset)
  app.get("/api/subjects", async (req, res) => {
    const subjects = await storage.getPresetSubjects();
    res.json(subjects);
  });

  // Get user's selected subjects
  app.get("/api/subjects/my", isAuthenticated, async (req, res) => {
    const subjects = await storage.getUserSubjects(req.session.userId!);
    res.json(subjects);
  });

  // Add subject to user's list
  app.post("/api/subjects/my", isAuthenticated, async (req, res) => {
    try {
      const { subjectId } = req.body;
      if (!subjectId) return res.status(400).json({ message: "subjectId required" });
      await storage.addUserSubject(req.session.userId!, subjectId);
      res.status(201).json({ message: "Subject added" });
    } catch (err) {
      res.status(500).json({ message: "Failed to add subject" });
    }
  });

  // Remove subject from user's list
  app.delete("/api/subjects/my/:subjectId", isAuthenticated, async (req, res) => {
    const subjectId = Number(req.params.subjectId);
    if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
    await storage.removeUserSubject(req.session.userId!, subjectId);
    res.json({ message: "Subject removed" });
  });

  // Create custom subject
  app.post("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const input = insertSubjectSchema.parse({ ...req.body, isPreset: false });
      const subject = await storage.createSubject(input);
      await storage.addUserSubject(req.session.userId!, subject.id);
      res.status(201).json(subject);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  // Upload study material
  app.post("/api/subjects/:subjectId/materials", isAuthenticated, upload.single('file'), async (req, res) => {
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
        // In a production app, you'd use a PDF parser library
        content = '[PDF content - text extraction would be done here]';
      }

      const material = await storage.createStudyMaterial({
        userId: req.session.userId!,
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
  app.get("/api/subjects/:subjectId/materials", isAuthenticated, async (req, res) => {
    const subjectId = Number(req.params.subjectId);
    if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
    const materials = await storage.getStudyMaterialsBySubject(req.session.userId!, subjectId);
    res.json(materials);
  });

  // Get all user's study materials
  app.get("/api/materials", isAuthenticated, async (req, res) => {
    const materials = await storage.getStudyMaterialsByUser(req.session.userId!);
    res.json(materials);
  });

  // Delete study material
  app.delete("/api/materials/:id", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid material ID" });
    await storage.deleteStudyMaterial(id);
    res.json({ message: "Material deleted" });
  });

  // Get interviews by subject (for progress tracking)
  app.get("/api/subjects/:subjectId/interviews", isAuthenticated, async (req, res) => {
    const subjectId = Number(req.params.subjectId);
    if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
    const interviews = await storage.getInterviewsBySubject(req.session.userId!, subjectId);
    res.json(interviews);
  });

  // Initialize Google Sheets spreadsheet on startup
  initializeSpreadsheet().catch(err => console.error('[GoogleSheets] Initialization failed:', err));

  // Endpoint to get the spreadsheet URL
  app.get("/api/admin/spreadsheet-url", isAdmin, (req, res) => {
    const url = getSpreadsheetUrl();
    if (url) {
      res.json({ url });
    } else {
      res.status(404).json({ message: "Spreadsheet not initialized yet" });
    }
  });

  return httpServer;
}
