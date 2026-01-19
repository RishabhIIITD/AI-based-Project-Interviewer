
import { db } from "./db";
import { 
  interviews, messages, users, appSettings, subjects, userSubjects, studyMaterials,
  type Interview, type InsertInterview, 
  type Message, type InsertMessage,
  type User, type InsertUser,
  type FeedbackData, type SummaryData,
  type Subject, type InsertSubject,
  type StudyMaterial, type InsertStudyMaterial,
  type UserSubject
} from "@shared/schema";
import { eq, asc, desc, and } from "drizzle-orm";

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

  // App Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;

  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  getPresetSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  getUserSubjects(userId: number): Promise<Subject[]>;
  addUserSubject(userId: number, subjectId: number): Promise<UserSubject>;
  removeUserSubject(userId: number, subjectId: number): Promise<void>;

  // Study Materials
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;
  getStudyMaterialsBySubject(userId: number, subjectId: number): Promise<StudyMaterial[]>;
  getStudyMaterialsByUser(userId: number): Promise<StudyMaterial[]>;
  deleteStudyMaterial(id: number): Promise<void>;

  // Analytics
  getInterviewsBySubject(userId: number, subjectId: number): Promise<Interview[]>;
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
        overallScore: score,
        completedAt: status === "completed" ? new Date() : undefined
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

  // App Settings
  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value }
      });
  }

  // Subjects
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(asc(subjects.name));
  }

  async getPresetSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.isPreset, true)).orderBy(asc(subjects.name));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async getUserSubjects(userId: number): Promise<Subject[]> {
    const results = await db
      .select({ subject: subjects })
      .from(userSubjects)
      .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
      .where(eq(userSubjects.userId, userId));
    return results.map(r => r.subject);
  }

  async addUserSubject(userId: number, subjectId: number): Promise<UserSubject> {
    const [result] = await db.insert(userSubjects).values({ userId, subjectId }).returning();
    return result;
  }

  async removeUserSubject(userId: number, subjectId: number): Promise<void> {
    await db.delete(userSubjects).where(
      and(eq(userSubjects.userId, userId), eq(userSubjects.subjectId, subjectId))
    );
  }

  // Study Materials
  async createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial> {
    const [newMaterial] = await db.insert(studyMaterials).values(material).returning();
    return newMaterial;
  }

  async getStudyMaterialsBySubject(userId: number, subjectId: number): Promise<StudyMaterial[]> {
    return await db.select().from(studyMaterials)
      .where(and(eq(studyMaterials.userId, userId), eq(studyMaterials.subjectId, subjectId)))
      .orderBy(desc(studyMaterials.createdAt));
  }

  async getStudyMaterialsByUser(userId: number): Promise<StudyMaterial[]> {
    return await db.select().from(studyMaterials)
      .where(eq(studyMaterials.userId, userId))
      .orderBy(desc(studyMaterials.createdAt));
  }

  async deleteStudyMaterial(id: number): Promise<void> {
    await db.delete(studyMaterials).where(eq(studyMaterials.id, id));
  }

  // Analytics
  async getInterviewsBySubject(userId: number, subjectId: number): Promise<Interview[]> {
    return await db.select().from(interviews)
      .where(and(eq(interviews.userId, userId), eq(interviews.subjectId, subjectId)))
      .orderBy(desc(interviews.createdAt));
  }
}

export const storage = new DatabaseStorage();
