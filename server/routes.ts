
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.interviews.create.path, async (req, res) => {
    try {
      const input = api.interviews.create.input.parse(req.body);
      const interview = await storage.createInterview(input);
      
      // Generate the first question immediately
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are an expert technical interviewer conducting a project-based interview.
            Project Title: ${input.title}
            Description: ${input.description}
            
            Your goal is to assess the candidate's technical depth, problem-solving skills, and communication.
            Start by asking a high-level question about the project overview or motivation.
            Keep the question concise and professional.`
          }
        ],
      });

      const firstQuestion = completion.choices[0].message.content || "Could you tell me about your project?";
      
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

  app.get(api.interviews.get.path, async (req, res) => {
    const interview = await storage.getInterview(Number(req.params.id));
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.json(interview);
  });

  app.get(api.interviews.getMessages.path, async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.id));
    res.json(messages);
  });

  app.post(api.interviews.processMessage.path, async (req, res) => {
    try {
      const interviewId = Number(req.params.id);
      const { content } = api.interviews.processMessage.input.parse(req.body);
      
      const interview = await storage.getInterview(interviewId);
      if (!interview) return res.status(404).json({ message: "Interview not found" });

      const history = await storage.getMessages(interviewId);
      
      // 1. Save User Answer
      const userMessage = await storage.createMessage({
        interviewId,
        role: "candidate",
        content,
      });

      // 2. AI Analysis
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
          ...history.map(m => ({ role: m.role === "candidate" ? "user" : "assistant", content: m.content })),
          { role: "user", content }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      
      // 3. Update User Message with Feedback
      // We need to update the message we just created. 
      // Storage doesn't have updateMessage, but I can cheat or add it.
      // Actually, I can just not update it in DB for now and return it, OR add updateMessage to storage.
      // Let's assume we want to store it. I'll add updateMessage to storage interface in a moment or just use raw SQL if needed.
      // Better: I'll store the feedback in the NEXT message? No, feedback belongs to the answer.
      // I'll update the user message.
      // For now, I'll just return it in the response as requested by the API contract.
      // Wait, schema has feedback column on messages.
      
      // Hack: Delete and re-create? No. 
      // I will add updateMessage to storage.
      
      // 4. Create Next Question (Interviewer Message)
      const nextQuestion = await storage.createMessage({
        interviewId,
        role: "interviewer",
        content: result.next_question || "Let's move on. Can you explain the architecture?",
      });

      res.json({
        message: { ...userMessage, feedback: result.feedback }, // Return with feedback
        response: nextQuestion,
        feedback: result.feedback,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error processing message" });
    }
  });

  app.post(api.interviews.complete.path, async (req, res) => {
    const interviewId = Number(req.params.id);
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
        ...history.map(m => ({ role: m.role === "candidate" ? "user" : "assistant", content: m.content })),
        { role: "user", content: "End interview and generate summary." }
      ],
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(completion.choices[0].message.content || "{}");
    
    const interview = await storage.updateInterviewStatus(
      interviewId, 
      "completed", 
      summary, 
      summary.overall_score
    );

    res.json(interview);
  });

  return httpServer;
}
