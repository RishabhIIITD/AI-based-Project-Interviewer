
import { 
  type Interview, type InsertInterview, 
  type Message, type InsertMessage, 
  type User, type InsertUser,
  type FeedbackData, type SummaryData,
  type Subject, type InsertSubject,
  type StudyMaterial, type InsertStudyMaterial,
  type UserSubject
} from "@shared/schema";

const getTime = (d: Date | string | undefined | null) => d ? new Date(d).getTime() : 0;

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

export class MemStorage implements IStorage {
  private users: User[];
  private interviews: Interview[];
  private messages: Message[];
  private subjects: Subject[];
  private userSubjects: UserSubject[];
  private studyMaterials: StudyMaterial[];
  private settings: Map<string, string>;

  private currentUserId: number;
  private currentInterviewId: number;
  private currentMessageId: number;
  private currentSubjectId: number;
  private currentUserSubjectId: number;
  private currentStudyMaterialId: number;

  constructor() {
    this.users = [];
    this.interviews = [];
    this.messages = [];
    this.subjects = [];
    this.userSubjects = [];
    this.studyMaterials = [];
    this.settings = new Map();

    this.currentUserId = 1;
    this.currentInterviewId = 1;
    this.currentMessageId = 1;
    this.currentSubjectId = 1;
    this.currentUserSubjectId = 1;
    this.currentStudyMaterialId = 1;

    // Seed default user
    this.createUser({
      email: "demo@example.com",
      password: "password", // Not hashed in this simplified version or hashed if we keep bcrypt
      fullName: "Demo User"
    });

    // Seed preset subjects
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

    PRESET_SUBJECTS.forEach(s => {
      this.createSubject({ ...s, isPreset: true });
    });
  }

  // Users
  async createUser(user: InsertUser & { password: string }): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { 
      ...user, 
      id, 
      role: "student",
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }

  // Interviews
  async createInterview(interview: InsertInterview, userId: number): Promise<Interview> {
    const id = this.currentInterviewId++;
    const newInterview: Interview = {
      ...interview,
      id,
      userId,
      status: "in_progress",
      overallScore: null,
      summary: null,
      createdAt: new Date(),
      completedAt: null,
      link: interview.link || null,
      subjectId: interview.subjectId || null,
    };
    this.interviews.push(newInterview);
    return newInterview;
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    return this.interviews.find(i => i.id === id);
  }

  async getInterviewsByUser(userId: number): Promise<Interview[]> {
    return this.interviews
      .filter(i => i.userId === userId)
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }

  async getAllInterviews(): Promise<Interview[]> {
    return [...this.interviews].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }

  async updateInterviewStatus(id: number, status: string, summary?: SummaryData, score?: number): Promise<Interview> {
    const interview = this.interviews.find(i => i.id === id);
    if (!interview) throw new Error("Interview not found");

    interview.status = status;
    if (summary) interview.summary = summary;
    if (score !== undefined) interview.overallScore = score;
    if (status === "completed") interview.completedAt = new Date();

    return interview;
  }

  // Messages
  async createMessage(message: InsertMessage & { feedback?: FeedbackData }): Promise<Message> {
    const id = this.currentMessageId++;
    const newMessage: Message = {
      ...message,
      id,
      feedback: message.feedback || null,
      createdAt: new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async getMessages(interviewId: number): Promise<Message[]> {
    return this.messages
      .filter(m => m.interviewId === interviewId)
      .sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt));
  }

  // App Settings
  async getSetting(key: string): Promise<string | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }

  // Subjects
  async getAllSubjects(): Promise<Subject[]> {
    return [...this.subjects].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getPresetSubjects(): Promise<Subject[]> {
    return this.subjects
      .filter(s => s.isPreset)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const id = this.currentSubjectId++;
    const newSubject: Subject = {
      ...subject,
      id,
      icon: subject.icon || null,
      isPreset: subject.isPreset || false,
      createdAt: new Date()
    };
    this.subjects.push(newSubject);
    return newSubject;
  }

  async getUserSubjects(userId: number): Promise<Subject[]> {
    const userSubjectIds = this.userSubjects
      .filter(us => us.userId === userId)
      .map(us => us.subjectId);
    
    return this.subjects.filter(s => userSubjectIds.includes(s.id));
  }

  async addUserSubject(userId: number, subjectId: number): Promise<UserSubject> {
    const id = this.currentUserSubjectId++;
    const newUserSubject: UserSubject = {
      id,
      userId,
      subjectId,
      createdAt: new Date()
    };
    this.userSubjects.push(newUserSubject);
    return newUserSubject;
  }

  async removeUserSubject(userId: number, subjectId: number): Promise<void> {
    this.userSubjects = this.userSubjects.filter(
      us => !(us.userId === userId && us.subjectId === subjectId)
    );
  }

  // Study Materials
  async createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial> {
    const id = this.currentStudyMaterialId++;
    const newMaterial: StudyMaterial = {
      ...material,
      id,
      content: material.content || null,
      createdAt: new Date()
    };
    this.studyMaterials.push(newMaterial);
    return newMaterial;
  }

  async getStudyMaterialsBySubject(userId: number, subjectId: number): Promise<StudyMaterial[]> {
    return this.studyMaterials
      .filter(sm => sm.userId === userId && sm.subjectId === subjectId)
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }

  async getStudyMaterialsByUser(userId: number): Promise<StudyMaterial[]> {
    return this.studyMaterials
      .filter(sm => sm.userId === userId)
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }

  async deleteStudyMaterial(id: number): Promise<void> {
    this.studyMaterials = this.studyMaterials.filter(sm => sm.id !== id);
  }

  // Analytics
  async getInterviewsBySubject(userId: number, subjectId: number): Promise<Interview[]> {
    return this.interviews
      .filter(i => i.userId === userId && i.subjectId === subjectId)
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }
}

export const storage = new MemStorage();
