import dotenv from "dotenv";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { registerUserEvents } from "./userEvent";
import { registerChatEvents } from "./chatEvents";
import ConversationModal from "../modals/Conversation.modal";
import User from "../modals/User.modals"; // ✅ import User model

dotenv.config();

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // --- Middleware for JWT Authentication ---
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: no token provided"));
      }

      jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) {
          return next(new Error("Authentication error: invalid token"));
        }

        const userData = decoded?.user;
        if (!userData || typeof userData !== "object" || !userData.id) {
          return next(new Error("Authentication error: invalid token payload"));
        }

        // Attach user info safely to socket
        socket.data.user = userData;
        socket.data.userId = userData.id;
        socket.data.name = userData.name || "Unknown";

        next();
      });
    } catch (error) {
      next(new Error("Internal server error during authentication"));
    }
  });

  // --- Connection event ---
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;
    const userName = socket.data.name;
    console.log(`✅ User connected: ${userId} (${userName})`);

    try {
      // ✅ 1️⃣ Mark user online and update lastSeen
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      // ✅ 2️⃣ Broadcast online status to all connected users
      socket.broadcast.emit("userStatusUpdate", {
        userId,
        isOnline: true,
        lastSeen: new Date(),
      });

      // ✅ 3️⃣ Join all conversation rooms for this user
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const conversations = await ConversationModal.find({ participants: userObjectId }).select("_id");

      conversations.forEach((c) => socket.join(c._id.toString()));

      // ✅ 4️⃣ Register chat/user events
      registerUserEvents(io, socket);
      registerChatEvents(io, socket);

      // --- Handle disconnection ---
      socket.on("disconnect", async (reason) => {
        console.log(`❌ User disconnected: ${userId} (${userName}) - Reason: ${reason}`);

        // 🔻 Mark user offline & update lastSeen
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        // Broadcast offline status
        socket.broadcast.emit("userStatusUpdate", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      });

      // Optional: handle general socket errors
      socket.on("error", (err) => {
        console.error(`⚠️ Socket error from ${userId}:`, err);
      });
    } catch (error: any) {
      console.error("Error initializing socket for user:", error);
    }
  });

  return io;
}
