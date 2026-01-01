
import { db } from "./db";
import { 
  interviews, messages, 
  type Interview, type InsertInterview, 
  type Message, type InsertMessage,
  type FeedbackData, type SummaryData
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  createInterview(interview: InsertInterview): Promise<Interview>;
  getInterview(id: number): Promise<Interview | undefined>;
  updateInterviewStatus(id: number, status: string, summary?: SummaryData, score?: number): Promise<Interview>;
  
  createMessage(message: InsertMessage & { feedback?: FeedbackData }): Promise<Message>;
  getMessages(interviewId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db.insert(interviews).values(interview).returning();
    return newInterview;
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async updateInterviewStatus(id: number, status: string, summary?: SummaryData, score?: number): Promise<Interview> {
    const [updated] = await db.update(interviews)
      .set({ 
        status, 
        summary: summary as any, 
        overallScore: score 
      })
      .where(eq(interviews.id, id))
      .returning();
    return updated;
  }

  async createMessage(message: InsertMessage & { feedback?: FeedbackData }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values({
      ...message,
      feedback: message.feedback as any
    }).returning();
    return newMessage;
  }

  async getMessages(interviewId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.interviewId, interviewId))
      .orderBy(asc(messages.createdAt));
  }
}

export const storage = new DatabaseStorage();
