import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExcuseSchema, insertNoteSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

// Groq API setup
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "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";

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function callGroqAPI(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not found. Please set GROQ_API_KEY environment variable.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data: GroqResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response generated from Groq API");
  }

  return data.choices[0].message.content.trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate excuse endpoint
  app.post("/api/excuses/generate", async (req, res) => {
    try {
      const body = z.object({
        situation: z.string().min(1).max(200),
        mood: z.enum(["creative", "funny", "savage", "sincere"]),
      }).parse(req.body);

      const { situation, mood } = body;

      // Create prompt for Groq API
      let prompt = "";
      switch (mood) {
        case "creative":
          prompt = `Generate a creative and imaginative excuse for this situation: "${situation}". Make it elaborate, unusual, and entertaining while keeping it believable enough. Be inventive with details and scenarios.`;
          break;
        case "funny":
          prompt = `Generate a humorous and witty excuse for this situation: "${situation}". Make it funny, light-hearted, and amusing. Use comedy and unexpected twists to make it entertaining.`;
          break;
        case "savage":
          prompt = `Generate a bold and confident excuse for this situation: "${situation}". Make it assertive, unapologetic, and slightly sassy. Show confidence without being too rude.`;
          break;
        case "sincere":
          prompt = `Generate a genuine and heartfelt excuse for this situation: "${situation}". Make it honest, respectful, and apologetic. Focus on taking responsibility while explaining the circumstances.`;
          break;
      }

      const generatedText = await callGroqAPI(prompt);

      // Save to storage
      const excuse = await storage.createExcuse({
        situation,
        mood,
        generatedText,
      });

      // Track user activity
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      try {
        await storage.incrementUserExcuses(ipAddress);
      } catch (error) {
        console.error("Error tracking user excuse:", error);
        // Don't fail the request if tracking fails
      }

      res.json(excuse);
    } catch (error) {
      console.error("Error generating excuse:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate excuse" });
      }
    }
  });

  // Generate notes endpoint
  app.post("/api/notes/generate", async (req, res) => {
    try {
      const body = z.object({
        topic: z.string().min(1).max(150),
        subject: z.string().optional(),
        complexity: z.enum(["basic", "intermediate", "advanced"]),
      }).parse(req.body);

      const { topic, subject, complexity } = body;

      // Create prompt for Groq API
      let prompt = "";
      const subjectContext = subject ? ` in ${subject}` : "";
      
      switch (complexity) {
        case "basic":
          prompt = `Create simplified, humorous study notes about "${topic}"${subjectContext}. Write in a sarcastic, witty tone like you're explaining to a lazy student who needs things dumbed down. Use casual language, bullet points, and funny analogies. Keep it entertaining but educational. Make it sound like it's written by a sassy backbencher who actually gets the material.`;
          break;
        case "intermediate":
          prompt = `Create study notes about "${topic}"${subjectContext} with moderate detail. Use a humorous, slightly sarcastic tone but include more substantial information. Structure it well with clear sections, include key concepts and some depth, but keep the witty, backbencher personality. Balance entertainment with learning.`;
          break;
        case "advanced":
          prompt = `Create comprehensive study notes about "${topic}"${subjectContext}. Use a clever, sophisticated humor while covering the topic thoroughly. Include detailed explanations, multiple perspectives, and advanced concepts. Maintain the sarcastic edge but show deeper understanding. Write like a smart slacker who actually knows their stuff.`;
          break;
      }

      const generatedText = await callGroqAPI(prompt);

      // Save to storage
      const note = await storage.createNote({
        topic,
        subject: subject || null,
        complexity,
        generatedText,
      });

      // Track user activity
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      try {
        await storage.incrementUserNotes(ipAddress);
      } catch (error) {
        console.error("Error tracking user note:", error);
        // Don't fail the request if tracking fails
      }

      res.json(note);
    } catch (error) {
      console.error("Error generating notes:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate notes" });
      }
    }
  });

  // Get recent excuses
  app.get("/api/excuses/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const excuses = await storage.getRecentExcuses(limit);
      res.json(excuses);
    } catch (error) {
      console.error("Error fetching recent excuses:", error);
      res.status(500).json({ message: "Failed to fetch recent excuses" });
    }
  });

  // Get recent notes
  app.get("/api/notes/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const notes = await storage.getRecentNotes(limit);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching recent notes:", error);
      res.status(500).json({ message: "Failed to fetch recent notes" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const body = z.object({
        message: z.string().min(1).max(500),
      }).parse(req.body);

      const { message } = body;

      // Create slangy, casual prompt
      const prompt = `You are a super chill AI study buddy for students. Talk like a cool friend who uses slang and casual language. Be helpful but keep it real and fun. Use words like "bruh", "fr", "nah", "lowkey", "highkey", "bet", "fam", "no cap", etc. Keep responses short and sweet, around 1-2 sentences max. Don't be too formal. User said: "${message}"`;

      const generatedResponse = await callGroqAPI(prompt);

      // Save to storage
      const chatMessage = await storage.createChatMessage({
        message,
        response: generatedResponse,
      });

      res.json({ response: generatedResponse });
    } catch (error) {
      console.error("Error generating chat response:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate response" });
      }
    }
  });

  // Get recent chat messages
  app.get("/api/chat/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const messages = await storage.getRecentChatMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching recent chat messages:", error);
      res.status(500).json({ message: "Failed to fetch recent chat messages" });
    }
  });

  // Community Chat Rooms API
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const body = z.object({
        roomName: z.string().min(1).max(50),
      }).parse(req.body);

      const room = await storage.createRoom(body.roomName);
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create room" });
      }
    }
  });

  app.get("/api/rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getRoomMessages(roomId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching room messages:", error);
      res.status(500).json({ message: "Failed to fetch room messages" });
    }
  });

  app.post("/api/rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const body = z.object({
        message: z.string().min(1).max(500),
        username: z.string().min(1).max(20),
      }).parse(req.body);

      const message = await storage.createRoomMessage(roomId, body.username, body.message);
      res.json(message);
    } catch (error) {
      console.error("Error creating room message:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create room message" });
      }
    }
  });

  // User profile endpoints
  app.post("/api/users/profile", async (req, res) => {
    try {
      const body = z.object({
        username: z.string().min(1).max(50),
      }).parse(req.body);

      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const user = await storage.createOrUpdateUser(ipAddress, body.username);
      res.json(user);
    } catch (error) {
      console.error("Error creating/updating user profile:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create/update user profile" });
      }
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard/:type", async (req, res) => {
    try {
      const type = req.params.type as "excuses" | "notes";
      if (!["excuses", "notes"].includes(type)) {
        return res.status(400).json({ message: "Invalid leaderboard type" });
      }
      
      const leaderboard = await storage.getLeaderboard(type);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
