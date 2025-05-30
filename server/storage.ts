import { excuses, notes, chatMessages, users, rooms, roomMessages, type Excuse, type InsertExcuse, type Note, type InsertNote, type ChatMessage, type InsertChatMessage, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Excuse methods
  createExcuse(excuse: InsertExcuse): Promise<Excuse>;
  getRecentExcuses(limit?: number): Promise<Excuse[]>;

  // Notes methods
  createNote(note: InsertNote): Promise<Note>;
  getRecentNotes(limit?: number): Promise<Note[]>;

  // Chat methods
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  getRecentChatMessages(limit?: number): Promise<ChatMessage[]>;

  // User methods
  createOrUpdateUser(ipAddress: string, username: string): Promise<User>;
  getUserByIp(ipAddress: string): Promise<User | undefined>;
  incrementUserExcuses(ipAddress: string): Promise<void>;
  incrementUserNotes(ipAddress: string): Promise<void>;
  getLeaderboard(type: "excuses" | "notes"): Promise<User[]>;

  // Room methods
  getRooms(): Promise<any>; // Assuming 'any' type for now, replace with actual type
  createRoom(name: string): Promise<any>; // Assuming 'any' type for now, replace with actual type
  getRoomMessages(roomId: number): Promise<any>; // Assuming 'any' type for now, replace with actual type
  createRoomMessage(roomId: number, username: string, message: string): Promise<any>; // Assuming 'any' type for now, replace with actual type
}

export class DatabaseStorage implements IStorage {
  async getExcuse(id: number): Promise<Excuse | undefined> {
    const [excuse] = await db.select().from(excuses).where(eq(excuses.id, id));
    return excuse || undefined;
  }

  async createExcuse(insertExcuse: InsertExcuse): Promise<Excuse> {
    const [excuse] = await db
      .insert(excuses)
      .values(insertExcuse)
      .returning();
    return excuse;
  }

  async getRecentExcuses(limit = 5): Promise<Excuse[]> {
    return await db
      .select()
      .from(excuses)
      .orderBy(desc(excuses.createdAt))
      .limit(limit);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values({
        ...insertNote,
        subject: insertNote.subject || null,
      })
      .returning();
    return note;
  }

  async getRecentNotes(limit = 5): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(limit);
  }

  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(insertChatMessage)
      .returning();
    return chatMessage;
  }

  async getRecentChatMessages(limit = 10): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createOrUpdateUser(ipAddress: string, username: string): Promise<User> {
    const existingUser = await this.getUserByIp(ipAddress);

    if (existingUser) {
      // Update username and last active
      const [updatedUser] = await db
        .update(users)
        .set({
          username,
          lastActive: new Date(),
        })
        .where(eq(users.ipAddress, ipAddress))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          ipAddress,
          excusesGenerated: 0,
          notesCreated: 0,
        })
        .returning();
      return newUser;
    }
  }

  async getUserByIp(ipAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.ipAddress, ipAddress));
    return user || undefined;
  }

  async incrementUserExcuses(ipAddress: string): Promise<void> {
    await db
      .update(users)
      .set({
        excusesGenerated: sql`${users.excusesGenerated} + 1`,
        lastActive: new Date(),
      })
      .where(eq(users.ipAddress, ipAddress));
  }

  async incrementUserNotes(ipAddress: string): Promise<void> {
    await db
      .update(users)
      .set({
        notesCreated: sql`${users.notesCreated} + 1`,
        lastActive: new Date(),
      })
      .where(eq(users.ipAddress, ipAddress));
  }

  async getLeaderboard(type: "excuses" | "notes"): Promise<User[]> {
    const orderBy = type === "excuses" ? desc(users.excusesGenerated) : desc(users.notesCreated);

    return await db
      .select()
      .from(users)
      .orderBy(orderBy)
      .limit(20);
  }

  async getRooms() {
    return await db
      .select()
      .from(rooms)
      .orderBy(desc(rooms.createdAt));
  }

  async createRoom(name: string) {
    const [room] = await db
      .insert(rooms)
      .values({ name })
      .returning();
    return room;
  }

  async getRoomMessages(roomId: number) {
    return await db
      .select()
      .from(roomMessages)
      .where(eq(roomMessages.roomId, roomId))
      .orderBy(desc(roomMessages.createdAt))
      .limit(50);
  }

  async createRoomMessage(roomId: number, username: string, message: string) {
    const [roomMessage] = await db
      .insert(roomMessages)
      .values({ roomId, username, message })
      .returning();
    return roomMessage;
  }
}

export const storage = new DatabaseStorage();