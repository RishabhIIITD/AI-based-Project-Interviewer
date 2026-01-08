
import { db } from "./db";
import { 
  interviews, messages, users,
  type Interview, type InsertInterview, 
  type Message, type InsertMessage,
  type User, type InsertUser,
  type FeedbackData, type SummaryData
} from "@shared/schema";
import { eq, asc, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  createUser(user: InsertUser & { password: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Interviews
  createInterview(interview: InsertInterview, userId: number): Promise<Interview>;
  getInterview(id: number): Promise<Interview | undefined>;
  getInterviewsByUser(userId: number): Promise<Interview[]>;
  getAllInterviews(): Promise<Interview[]>;
  updateInterviewStatus(id: number, status: string, summary?: SummaryData, score?: number): Promise<Interview>;
  
  // Messages
  createMessage(message: InsertMessage & { feedback?: FeedbackData }): Promise<Message>;
  getMessages(interviewId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async createUser(user: InsertUser & { password: string }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Interviews
  async createInterview(interview: InsertInterview, userId: number): Promise<Interview> {
    const [newInterview] = await db.insert(interviews).values({ ...interview, userId }).returning();
    return newInterview;
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async getInterviewsByUser(userId: number): Promise<Interview[]> {
    return await db.select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.createdAt));
  }

  async getAllInterviews(): Promise<Interview[]> {
    return await db.select().from(interviews).orderBy(desc(interviews.createdAt));
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

  // Messages
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
